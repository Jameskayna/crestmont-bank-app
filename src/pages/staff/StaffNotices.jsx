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

const emptyForm = { title: "", message: "", severity: "info", audience: "all", targetUsers: [] };

function userLabel(u) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return name ? `${name} (${u.email})` : u.email;
}

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

  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState(null);
  const [searching, setSearching] = useState(false);

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
    setUserQuery("");
    setUserResults(null);
    setShowForm(true);
  }

  function startEdit(notice) {
    setForm({
      title: notice.title,
      message: notice.message,
      severity: notice.severity,
      audience: notice.audience,
      targetUsers: notice.target_users || [],
    });
    setEditingId(notice.id);
    setUserQuery("");
    setUserResults(null);
    setShowForm(true);
  }

  async function handleUserSearch(e) {
    e.preventDefault();
    setSearching(true);
    try {
      const data = await api.staffListUsers(userQuery);
      setUserResults(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not search users.");
    } finally {
      setSearching(false);
    }
  }

  function addTargetUser(u) {
    if (form.targetUsers.some((t) => t.id === u.id)) return;
    update("targetUsers", [...form.targetUsers, u]);
  }

  function removeTargetUser(id) {
    update(
      "targetUsers",
      form.targetUsers.filter((t) => t.id !== id)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.audience === "specific" && form.targetUsers.length === 0) {
      setError("Select at least one user for a specific-users notice.");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: form.title,
      message: form.message,
      severity: form.severity,
      audience: form.audience,
      target_user_ids: form.targetUsers.map((u) => u.id),
    };
    try {
      if (editingId) {
        await api.staffUpdateNotice(editingId, payload);
        setSuccess("Notice updated.");
      } else {
        await api.staffCreateNotice(payload);
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
        <form className="panel" style={{ marginBottom: 32, maxWidth: 560 }} onSubmit={handleSubmit}>
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

          <div className="field">
            <label>Audience</label>
            <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400 }}>
                <input
                  type="radio"
                  name="audience"
                  value="all"
                  checked={form.audience === "all"}
                  onChange={() => update("audience", "all")}
                />
                All customers
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400 }}>
                <input
                  type="radio"
                  name="audience"
                  value="specific"
                  checked={form.audience === "specific"}
                  onChange={() => update("audience", "specific")}
                />
                Specific users
              </label>
            </div>
          </div>

          {form.audience === "specific" && (
            <div className="field">
              <label>Target users</label>

              {form.targetUsers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {form.targetUsers.map((u) => (
                    <span
                      key={u.id}
                      className="status-pill verified"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 0 }}
                    >
                      {userLabel(u)}
                      <button
                        type="button"
                        className="btn-link"
                        style={{ color: "inherit" }}
                        onClick={() => removeTargetUser(u.id)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                />
                <button className="btn-secondary" type="button" onClick={handleUserSearch} disabled={searching}>
                  {searching ? "Searching…" : "Search"}
                </button>
              </div>

              {userResults !== null && (
                <div className="ledger" style={{ marginTop: 10, maxHeight: 220, overflowY: "auto" }}>
                  {userResults.length === 0 ? (
                    <div style={{ padding: 14, fontSize: "0.85rem", color: "var(--ink-muted)" }}>No users found.</div>
                  ) : (
                    userResults.map((u) => (
                      <div
                        className="ledger-row"
                        key={u.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => addTargetUser(u)}
                      >
                        <div>
                          <div className="ledger-desc">{userLabel(u)}</div>
                          <div className="ledger-meta">{u.role}</div>
                        </div>
                        <button type="button" className="btn-link">
                          {form.targetUsers.some((t) => t.id === u.id) ? "Added" : "Add"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

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
                <div className="ledger-meta">
                  {n.audience === "specific"
                    ? `${n.target_users.length} specific user${n.target_users.length === 1 ? "" : "s"}`
                    : "All customers"}
                </div>
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
