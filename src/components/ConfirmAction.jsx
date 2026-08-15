import { useState } from "react";

export default function ConfirmAction({ onConfirm, label, confirmLabel = "Confirm", prompt }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!showConfirm) {
    return (
      <button className="btn-secondary" onClick={() => setShowConfirm(true)}>
        {label}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
      {prompt && <span style={{ fontSize: "0.85rem" }}>{prompt}</span>}
      <button
        className="btn-secondary"
        style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
        onClick={() => {
          onConfirm();
          setShowConfirm(false);
        }}
      >
        {confirmLabel}
      </button>
      <button className="btn-link" onClick={() => setShowConfirm(false)}>
        Cancel
      </button>
    </div>
  );
}
