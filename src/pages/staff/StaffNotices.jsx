import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import ConfirmAction from "../../components/ConfirmAction";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../api/client";

const SEVERITIES = [
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "urgent", label: "Urgent" },
];

const emptyForm = { title: "", message: "", severity: "info" };

export default function StaffNotices() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "superadmin";

  const [notices, setNotices] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const data = await api.staffListNotices();
      setNotices(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load notices.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(notice) {
    setForm({ title: notice.title, message: notice.message, severity: notice.severity });
    setEditingId(notice.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      if (editingId) {
        await api.staffUpdateNotice(editingId, form);
        setSuccess("Notice updated.");
      } else {
        await api.staffCreateNotice(form);
        setSuccess("Notice created.");
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this notice.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(notice) {
    setError("");
    try {
      await api.staffUpdateNotice(notice.id, { is_active: !notice.is_active });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this notice.");
    }
  }

  async function remove(id) {
    setError("");
    try {
      await api.staffDeleteNotice(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this notice.");
    }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Notices</h1>
        {canManage && (
          <button
            className="btn-secondary"
            onClick={() => (showForm ? setShowForm(false) : startCreate())}
          >
            {showForm ? "Cancel" : "New notice"}
          </button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {showForm && (
        <form className="panel" style={{ marginBottom: 32 }} onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" required value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              required
              rows={3}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: "0.95rem",
                fontFamily: "var(--font-body)",
                background: "var(--ivory)",
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="severity">Severity</label>
            <select id="severity" value={form.severity} onChange={(e) => update("severity", e.target.value)}>
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-gold" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : editingId ? "Save changes" : "Create notice"}
          </button>
        </form>
      )}

      {notices === null ? (
        <p>Loading…</p>
      ) : notices.length === 0 ? (
        <div className="empty-state">No notices yet.</div>
      ) : (
        <div className="ledger">
          {notices.map((n) => (
            <div className="ledger-row" key={n.id}>
              <div>
                <div className="ledger-desc">
                  {n.title}
                  <span className={`status-pill severity-${n.severity}`}>{n.severity}</span>
                  <span className={`status-pill ${n.is_active ? "verified" : "unverified"}`}>
                    {n.is_active ? "active" : "inactive"}
                  </span>
                </div>
                <div className="ledger-meta">{n.message}</div>
              </div>
              {canManage && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-secondary" onClick={() => startEdit(n)}>
                    Edit
                  </button>
                  <button className="btn-secondary" onClick={() => toggleActive(n)}>
                    {n.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <ConfirmAction
                    label="Delete"
                    confirmLabel="Confirm delete"
                    prompt={`Delete "${n.title}"?`}
                    onConfirm={() => remove(n.id)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
