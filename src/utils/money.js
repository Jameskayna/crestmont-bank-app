export function formatCents(cents, currency = "USD") {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatSignedCents(cents, currency = "USD") {
  const formatted = formatCents(Math.abs(cents), currency);
  return cents < 0 ? `-${formatted}` : `+${formatted}`;
}
