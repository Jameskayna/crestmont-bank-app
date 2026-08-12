# Crestmont Reserve Bank — App (frontend)

## What this repo is

The real, API-connected banking app: user dashboard, login/register/2FA,
KYC upload, loans, transfers, notifications — and, as a protected
section, the staff admin console. This is **separate** from:

- `crestmont-reserve` — the public marketing homepage (static HTML, done, deployed)
- `crestmont-bank-backend` — the Django API this app talks to

## Current state

Empty placeholder. Do not build UI here until `crestmont-bank-backend`
has working endpoints for accounts, transfers, and manual adjustments
(its Stage 3). Building this frontend against a backend that doesn't
exist yet just means rebuilding it later.

## Design reference

The visual design and UX were already fully worked out as static HTML
mockups before this repo existed. Rebuild these in React, wired to the
real API instead of local mock state — do not redesign from scratch:

- **User dashboard**: sidebar nav (Overview, Transfers, Cards, Loans,
  Notifications, Profile & KYC), account cards, a ledger-style
  transaction list, a card widget with freeze/limit controls, a loan
  progress tracker, a notification feed
- **Login/register**: email + password, optional 2FA step (the backend's
  `/auth/login` returns `{"requires_2fa": true}` first if enabled — the
  frontend needs a second screen for the TOTP code)
- **Profile & settings**: personal details, a Security tab (2FA
  setup/disable), KYC document upload, and a Country field that shows a
  warning banner on change rather than silently updating anything
- **Admin console**: tabs for Users & Accounts, Transactions (an
  authorize/decline queue), Loans, Settings (fee/rate configuration),
  Audit Log. Every money-touching action (the "Fund/Debit" flow) is a
  reason-required, audit-logged `ManualAdjustment` request — never a
  free-form balance edit. "Freeze account" (blocks money movement) and
  "Block login" (revokes sessions) are two distinct actions, not one.

Ask for the actual HTML mockup files if you need the exact markup/CSS to
reference — they exist, just weren't committed to this repo yet.

## Brand system

- Colors: deep navy `#0B1B36` / midnight `#0F2748`, gold accent
  `#B4923F` / `#D4AF5C`, ivory/white backgrounds
- Type: Playfair Display (headlines), Inter (body), IBM Plex Mono
  (all monetary figures — never format money in a proportional font)
- Money is always cents-as-integers end to end, converted to
  dollars-and-cents only at display time

## API conventions (backend already built, Stage 1-2)

- Auth: JWT access token (short-lived, keep in memory not localStorage)
  + refresh token (localStorage is fine for this one)
- `POST /auth/register`, `/auth/login`, `/auth/verify-email`,
  `/auth/password-reset/request` + `/confirm`, `/auth/2fa/setup` +
  `/confirm` + `/disable`, `/auth/me`
- Money fields are always `amount_cents` (integer), never floats
- Full endpoint list grows in Stage 3 — check `crestmont-bank-backend`'s
  `config/urls.py` for what's live before assuming an endpoint exists

## Do not

- Do not let an admin credit/debit a balance without a reason and without
  it appearing in the audit log — that's the one hard rule from the
  original design discussion, kept for compliance reasons, not style
- Do not fabricate stats, regulatory claims, or FDIC/licensing language
  anywhere in the UI — those remain explicit placeholders until legally
  verified
