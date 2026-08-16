export default function CardVisual({ card }) {
  if (card.status === "pending") {
    return (
      <div className="card-visual card-visual-pending">
        <div className="card-visual-pending-message">
          <div className="card-visual-pending-title">Your card is on the way</div>
          <div className="card-visual-pending-subtitle">We'll notify you once it arrives and is ready to activate.</div>
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
        {card.brand && !isBlocked && <span className="card-visual-brand">{card.brand}</span>}
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
