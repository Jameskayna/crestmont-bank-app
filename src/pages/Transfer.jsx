import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import OtpField from "../components/OtpField";
import { api, ApiError } from "../api/client";
import { formatCents } from "../utils/money";

// Not a full ISO-3166 list — just enough common destinations for a demo
// international-wire form. Values are the ISO 3166-1 alpha-2 codes the
// backend stores (apps/users/models.py's User.country uses the same
// convention).
const COUNTRIES = [
  ["GB", "United Kingdom"], ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"],
  ["IT", "Italy"], ["NL", "Netherlands"], ["BE", "Belgium"], ["CH", "Switzerland"],
  ["IE", "Ireland"], ["PT", "Portugal"], ["SE", "Sweden"], ["NO", "Norway"],
  ["DK", "Denmark"], ["FI", "Finland"], ["PL", "Poland"], ["AT", "Austria"],
  ["GR", "Greece"], ["CA", "Canada"], ["MX", "Mexico"], ["BR", "Brazil"],
  ["AR", "Argentina"], ["JP", "Japan"], ["CN", "China"], ["IN", "India"],
  ["SG", "Singapore"], ["HK", "Hong Kong"], ["AE", "United Arab Emirates"],
  ["SA", "Saudi Arabia"], ["ZA", "South Africa"], ["NG", "Nigeria"],
  ["KE", "Kenya"], ["AU", "Australia"], ["NZ", "New Zealand"], ["KR", "South Korea"],
  ["IL", "Israel"],
];

const emptyInternational = { recipientName: "", destinationCountry: "", bankName: "", swiftBic: "", iban: "" };

export default function Transfer() {
  const [accounts, setAccounts] = useState(null);
  const [transferType, setTransferType] = useState("domestic");

  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [domesticBankName, setDomesticBankName] = useState("");
  const [intl, setIntl] = useState(emptyInternational);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // "form" -> "otp" once the transfer is initiated and a code has been
  // emailed. No money moves and nothing is posted to the ledger until the
  // code is confirmed — pendingTransfer only remembers what to show while
  // that confirmation is in flight.
  const [step, setStep] = useState("form");
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    api
      .listAccounts()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) setFromAccount(data[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load accounts."));
  }, []);

  function resetFormFields() {
    setToAccount("");
    setDomesticBankName("");
    setIntl(emptyInternational);
    setAmount("");
    setNote("");
  }

  async function handleInitiate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    const payload =
      transferType === "domestic"
        ? {
            transfer_type: "domestic",
            from_account: fromAccount,
            to_account: toAccount.trim(),
            bank_name: domesticBankName.trim(),
            amount_cents: amountCents,
            note,
          }
        : {
            transfer_type: "international",
            from_account: fromAccount,
            recipient_name: intl.recipientName.trim(),
            destination_country: intl.destinationCountry,
            bank_name: intl.bankName.trim(),
            swift_bic: intl.swiftBic.trim(),
            iban: intl.iban.trim(),
            amount_cents: amountCents,
            note,
          };

    setSubmitting(true);
    try {
      const result = await api.initiateTransfer(payload);
      setPendingTransfer({
        id: result.transfer_intent_id,
        transferType,
        amountCents,
        toAccount: toAccount.trim(),
        recipientName: intl.recipientName.trim(),
        bankName: transferType === "domestic" ? domesticBankName.trim() : intl.bankName.trim(),
      });
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.confirmTransfer(pendingTransfer.id, code);
      setSuccess("Transfer sent.");
      setStep("form");
      setPendingTransfer(null);
      setCode("");
      resetFormFields();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not confirm the transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelOtp() {
    setStep("form");
    setPendingTransfer(null);
    setCode("");
    setError("");
  }

  function handleToggleType(type) {
    if (type === transferType) return;
    setTransferType(type);
    setError("");
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Transfer funds</h1>
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {accounts === null ? (
        <p>Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="empty-state">Open an account first before transferring funds.</div>
      ) : step === "form" ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className={transferType === "domestic" ? "btn-gold" : "btn-secondary"}
              onClick={() => handleToggleType("domestic")}
            >
              Domestic Transfer
            </button>
            <button
              type="button"
              className={transferType === "international" ? "btn-gold" : "btn-secondary"}
              onClick={() => handleToggleType("international")}
            >
              International Transfer
            </button>
          </div>

          <form className="panel" onSubmit={handleInitiate}>
            <div className="field">
              <label htmlFor="from">From account</label>
              <select id="from" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — •••• {a.account_number.slice(-4)}
                  </option>
                ))}
              </select>
            </div>

            {transferType === "domestic" ? (
              <>
                <div className="field">
                  <label htmlFor="to">To account number</label>
                  <input
                    id="to"
                    type="text"
                    placeholder="Destination account number"
                    required
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                  />
                  <p className="field-hint">The recipient's account number, e.g. 4932.</p>
                </div>
                <div className="field">
                  <label htmlFor="domestic-bank-name">Bank name</label>
                  <input
                    id="domestic-bank-name"
                    type="text"
                    maxLength={120}
                    required
                    value={domesticBankName}
                    onChange={(e) => setDomesticBankName(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="recipient-name">Recipient name</label>
                  <input
                    id="recipient-name"
                    type="text"
                    maxLength={120}
                    required
                    value={intl.recipientName}
                    onChange={(e) => setIntl({ ...intl, recipientName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="destination-country">Destination country</label>
                  <select
                    id="destination-country"
                    required
                    value={intl.destinationCountry}
                    onChange={(e) => setIntl({ ...intl, destinationCountry: e.target.value })}
                  >
                    <option value="" disabled>
                      Select a country…
                    </option>
                    {COUNTRIES.map(([code2, name]) => (
                      <option key={code2} value={code2}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="intl-bank-name">Bank name</label>
                  <input
                    id="intl-bank-name"
                    type="text"
                    maxLength={120}
                    required
                    value={intl.bankName}
                    onChange={(e) => setIntl({ ...intl, bankName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="swift-bic">SWIFT/BIC code</label>
                  <input
                    id="swift-bic"
                    type="text"
                    maxLength={11}
                    required
                    value={intl.swiftBic}
                    onChange={(e) => setIntl({ ...intl, swiftBic: e.target.value.toUpperCase() })}
                  />
                  <p className="field-hint">8 or 11 characters, e.g. DEUTDEFF or DEUTDEFF500.</p>
                </div>
                <div className="field">
                  <label htmlFor="iban">IBAN</label>
                  <input
                    id="iban"
                    type="text"
                    maxLength={34}
                    required
                    value={intl.iban}
                    onChange={(e) => setIntl({ ...intl, iban: e.target.value.toUpperCase() })}
                  />
                  <p className="field-hint">Starts with a 2-letter country code and 2 digits, e.g. GB29NWBK60161331926819.</p>
                </div>
              </>
            )}

            <div className="field">
              <label htmlFor="amount">Amount (USD)</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="note">Note (optional)</label>
              <input id="note" type="text" maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button className="btn-gold" type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send transfer"}
            </button>
          </form>
        </>
      ) : (
        <form className="panel" onSubmit={handleConfirm}>
          <p className="field-hint">
            We sent a 6-digit code to your email to confirm sending{" "}
            <span className="money">{formatCents(pendingTransfer.amountCents)}</span>{" "}
            {pendingTransfer.transferType === "domestic"
              ? `to account •••• ${pendingTransfer.toAccount.slice(-4)}`
              : `to ${pendingTransfer.recipientName} at ${pendingTransfer.bankName}`}
            . Nothing has been sent yet.
          </p>
          <OtpField id="transfer-otp" value={code} onChange={setCode} onResend={() => api.resendTransferOtp(pendingTransfer.id)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-gold" type="submit" disabled={submitting}>
              {submitting ? "Confirming…" : "Confirm transfer"}
            </button>
            <button className="btn-link" type="button" onClick={handleCancelOtp}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </AppLayout>
  );
}
