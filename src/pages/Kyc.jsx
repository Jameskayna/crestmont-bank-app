import { useEffect, useRef, useState } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../api/client";

const DOC_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID card" },
  { value: "drivers_license", label: "Driver's licence" },
  { value: "proof_of_address", label: "Proof of address" },
];

const STATUS_LABEL = {
  unverified: "Not started",
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

export default function Kyc() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState(null);
  const [docType, setDocType] = useState("passport");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function loadDocuments() {
    try {
      const data = await api.listKycDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load documents.");
    }
  }

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("file", file);

    setUploading(true);
    try {
      await api.uploadKycDocument(formData);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments();
      // The upload may have moved kyc_status to pending — refresh /auth/me
      // so the status banner and can-transact gate elsewhere stay in sync.
      const me = await api.me();
      setUser(me);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload the document.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Identity verification</h1>
      </div>

      <p style={{ marginBottom: 24 }}>
        Status:{" "}
        <span className={`status-pill ${user?.kyc_status}`}>
          {STATUS_LABEL[user?.kyc_status] || user?.kyc_status}
        </span>
      </p>

      {error && <div className="form-error">{error}</div>}

      <form className="panel" style={{ marginBottom: 32 }} onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="doc-type">Document type</label>
          <select id="doc-type" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="doc-file">File</label>
          <input
            id="doc-file"
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          <p className="field-hint">JPEG, PNG, or PDF. Up to 10MB.</p>
        </div>
        <button className="btn-gold" type="submit" disabled={uploading}>
          {uploading ? "Uploading…" : "Upload document"}
        </button>
      </form>

      <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Submitted documents</h2>
      {documents === null ? (
        <p>Loading…</p>
      ) : documents.length === 0 ? (
        <div className="empty-state">No documents uploaded yet.</div>
      ) : (
        <div className="ledger">
          {documents.map((doc) => (
            <div className="ledger-row" key={doc.id}>
              <div>
                <div className="ledger-desc">{DOC_TYPES.find((t) => t.value === doc.doc_type)?.label || doc.doc_type}</div>
                <div className="ledger-meta">
                  {new Date(doc.uploaded_at).toLocaleString()}
                  <span className={`status-pill ${doc.status}`}>{doc.status.replace("_", " ")}</span>
                </div>
                {doc.status === "rejected" && doc.rejection_reason && (
                  <div className="ledger-meta" style={{ color: "var(--danger)" }}>
                    {doc.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
