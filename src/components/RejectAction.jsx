import { useState } from "react";

export default function RejectAction({ onReject, label = "Reject" }) {
  const [showInput, setShowInput] = useState(false);
  const [reason, setReason] = useState("");

  if (!showInput) {
    return (
      <button className="btn-secondary" onClick={() => setShowInput(true)}>
        {label}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
      <input
        type="text"
        placeholder="Reason (required)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.85rem" }}
      />
      <button
        className="btn-secondary"
        style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
        disabled={!reason.trim()}
        onClick={() => {
          onReject(reason.trim());
          setShowInput(false);
          setReason("");
        }}
      >
        Confirm
      </button>
      <button className="btn-link" onClick={() => setShowInput(false)}>
        Cancel
      </button>
    </div>
  );
}
