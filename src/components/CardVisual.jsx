export default function CardVisual({ card, onRequestAgain }) {
  if (card.status === "pending") {
    return (
      <div className="card-visual card-visual-pending">
        <div className="card-visual-pending-message">
          <div className="card-visual-pending-title">Your card request is under review</div>
          <div className="card-visual-pending-subtitle">
            {card.brand_display} {card.card_type} — we'll notify you once it's approved.
          </div>
        </div>
      </div>
    );
  }

  if (card.status === "rejected") {
    return (
      <div className="card-visual card-visual-pending card-visual-rejected">
        <div className="card-visual-pending-message">
          <div className="card-visual-pending-title">Card request declined</div>
          <div className="card-visual-pending-subtitle">{card.rejection_reason}</div>
          {onRequestAgain && (
            <button className="btn-secondary" style={{ marginTop: 14 }} onClick={onRequestAgain}>
              Request again
            </button>
          )}
        </div>
      </div>
    );
  }

  const isBlocked = card.status === "blocked" || card.status === "expired";

  return (
    <div className={`card-visual ${isBlocked ? "card-visual-inactive" : "card-visual-active"}`}>
      {isBlocked && (
        <div className="card-visual-ribbon">{card.status === "blocked" ? "Blocked" : "Expired"}</div>
      )}
      <div className="card-visual-top">
        <span className="card-visual-issuer">Crestmont Reserve</span>
        {card.brand_display && !isBlocked && <span className="card-visual-brand">{card.brand_display}</span>}
      </div>
      <div className="card-visual-number money">{card.masked_number}</div>
      <div className="card-visual-bottom">
        <div>
          <div className="card-visual-label">Cardholder</div>
          <div className="card-visual-value">{card.cardholder_name}</div>
        </div>
        {!isBlocked && (
          <div>
            <div className="card-visual-label">Expires</div>
            <div className="card-visual-value money">{card.expiry_display}</div>
          </div>
        )}
      </div>
    </div>
  );
}
