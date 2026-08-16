// Local dev goes through Vite's /api proxy (see vite.config.js) so the
// browser never has to deal with CORS. Static hosting has no server-side
// proxy, so production needs the real backend URL baked in at build time
// via VITE_API_URL (Vite only inlines env vars prefixed VITE_).
const BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Backend errors come in two shapes depending on whether a view's own check
// failed ({"error": "..."}) or a DRF serializer rejected the input
// ({"field": ["msg"]} or {"non_field_errors": ["msg"]}). Flatten both into
// one readable string for the UI.
function extractMessage(body) {
  if (!body || typeof body !== "object") return "Something went wrong. Try again.";
  if (typeof body.error === "string") return body.error;
  if (typeof body.detail === "string") return body.detail;
  const firstKey = Object.keys(body)[0];
  if (firstKey && Array.isArray(body[firstKey])) return body[firstKey][0];
  return "Something went wrong. Try again.";
}

let accessToken = null;
let onAuthExpired = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setOnAuthExpired(handler) {
  onAuthExpired = handler;
}

async function rawRequest(path, { method = "GET", body, auth = true } = {}) {
  const isFormData = body instanceof FormData;
  const headers = {};
  // For FormData, let the browser set Content-Type itself (it needs to
  // include the multipart boundary, which we can't set by hand).
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(data), res.status, data);
  }
  return data;
}

async function tryRefresh() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return false;
  try {
    const data = await rawRequest("/auth/token/refresh", {
      method: "POST",
      body: { refresh },
      auth: false,
    });
    setAccessToken(data.access);
    return true;
  } catch {
    localStorage.removeItem("refresh_token");
    return false;
  }
}

export async function request(path, options = {}) {
  try {
    return await rawRequest(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && options.auth !== false) {
      const refreshed = await tryRefresh();
      if (refreshed) return rawRequest(path, options);
      if (onAuthExpired) onAuthExpired();
    }
    throw err;
  }
}

export const api = {
  register: (data) => request("/auth/register", { method: "POST", body: data, auth: false }),
  login: (data) => request("/auth/login", { method: "POST", body: data, auth: false }),
  me: () => request("/auth/me"),
  listAccounts: () => request("/accounts"),
  createAccount: (data) => request("/accounts", { method: "POST", body: data }),
  accountTransactions: (id) => request(`/accounts/${id}/transactions`),
  createTransfer: (data) => request("/transfers", { method: "POST", body: data }),
  listKycDocuments: () => request("/kyc/documents"),
  uploadKycDocument: (formData) => request("/kyc/documents", { method: "POST", body: formData }),
  listNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),
  listLoanProducts: () => request("/loans/products"),
  listLoanApplications: () => request("/loans/applications"),
  createLoanApplication: (data) => request("/loans/applications", { method: "POST", body: data }),

  // Staff console
  staffListUsers: (search) => request(`/staff/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  staffGetUser: (id) => request(`/staff/users/${id}`),
  staffBlockUser: (id, reason) => request(`/staff/users/${id}/block`, { method: "POST", body: { reason } }),
  staffUnblockUser: (id) => request(`/staff/users/${id}/unblock`, { method: "POST" }),
  staffPromoteUser: (id) => request(`/staff/users/${id}/promote`, { method: "POST" }),
  staffFreezeAccount: (id, reason) =>
    request(`/staff/accounts/${id}/freeze`, { method: "POST", body: { reason } }),
  staffUnfreezeAccount: (id) => request(`/staff/accounts/${id}/unfreeze`, { method: "POST" }),
  staffListAdjustments: () => request("/staff/adjustments"),
  staffCreateAdjustment: (data) => request("/staff/adjustments", { method: "POST", body: data }),
  staffApproveAdjustment: (id) => request(`/staff/adjustments/${id}/approve`, { method: "POST" }),
  staffRejectAdjustment: (id, reason) =>
    request(`/staff/adjustments/${id}/reject`, { method: "POST", body: { reason } }),
  staffListWithdrawals: () => request("/staff/withdrawals"),
  staffApproveWithdrawal: (id) => request(`/staff/withdrawals/${id}/approve`, { method: "POST" }),
  staffRejectWithdrawal: (id, reason) =>
    request(`/staff/withdrawals/${id}/reject`, { method: "POST", body: { reason } }),
  staffListKycDocuments: () => request("/staff/kyc/documents"),
  staffApproveKycDocument: (id) => request(`/staff/kyc/documents/${id}/approve`, { method: "POST" }),
  staffRejectKycDocument: (id, reason) =>
    request(`/staff/kyc/documents/${id}/reject`, { method: "POST", body: { reason } }),
  staffListLoanApplications: () => request("/staff/loans/applications"),
  staffApproveLoan: (id) => request(`/staff/loans/applications/${id}/approve`, { method: "POST" }),
  staffRejectLoan: (id, reason) =>
    request(`/staff/loans/applications/${id}/reject`, { method: "POST", body: { reason } }),
  staffListLoanProducts: () => request("/staff/loan-products"),
  staffCreateLoanProduct: (data) => request("/staff/loan-products", { method: "POST", body: data }),
  staffUpdateLoanProduct: (id, data) =>
    request(`/staff/loan-products/${id}`, { method: "PATCH", body: data }),
  staffListAuditLog: () => request("/staff/audit-log"),
  staffListCards: () => request("/staff/cards"),
  staffBlockCard: (id, reason) => request(`/staff/cards/${id}/block`, { method: "POST", body: { reason } }),
  staffReactivateCard: (id) => request(`/staff/cards/${id}/reactivate`, { method: "POST" }),

  // Notices
  listActiveNotices: () => request("/notices/active"),
  staffListNotices: () => request("/staff/notices"),
  staffCreateNotice: (data) => request("/staff/notices", { method: "POST", body: data }),
  staffUpdateNotice: (id, data) => request(`/staff/notices/${id}`, { method: "PATCH", body: data }),
  staffDeleteNotice: (id) => request(`/staff/notices/${id}`, { method: "DELETE" }),
};
