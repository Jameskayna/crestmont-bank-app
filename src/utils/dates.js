// A ledger entry's created_at is always the true "entered into the
// system" timestamp; transaction_date is only set when it differs
// (a backdated manual adjustment). Surface both whenever they diverge
// so a backdated entry is never mistaken for a same-day one.
export function transactionDateLabel(entry) {
  const entered = new Date(entry.created_at).toLocaleString();
  if (!entry.transaction_date) return entered;

  const enteredDateOnly = new Date(entry.created_at).toISOString().slice(0, 10);
  if (entry.transaction_date === enteredDateOnly) return entered;

  const txDate = new Date(`${entry.transaction_date}T00:00:00`).toLocaleDateString();
  return `Transaction date ${txDate} · recorded ${entered}`;
}
