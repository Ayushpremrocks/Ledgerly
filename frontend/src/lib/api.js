import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid token anywhere except the sign-in calls -> sign out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login?expired=1";
    }
    return Promise.reject(error);
  }
);

/** The server's {"message": "..."} or a friendly fallback. */
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err?.response) return "Can't reach the server. Check your connection.";
  return err.response.data?.message || fallback;
}

const data = (p) => p.then((r) => r.data);

export const authAPI = {
  login: (username, password) => data(api.post("/auth/login", { username, password })),
  register: (body) => data(api.post("/auth/register", body)),
};

export const userAPI = {
  me: () => data(api.get("/users/me")),
  update: (body) => data(api.put("/users/me", body)),
  changePassword: (body) => data(api.put("/users/me/password", body)),
};

export const accountAPI = {
  list: () => data(api.get("/accounts/my-accounts")),
  get: (number) => data(api.get(`/accounts/${number}`)),
  create: (body) => data(api.post("/accounts", body)),
  rename: (number, nickname) => data(api.patch(`/accounts/${number}`, { nickname })),
  close: (number) => data(api.post(`/accounts/${number}/close`)),
  lookup: (number) => data(api.get(`/accounts/lookup/${encodeURIComponent(number.trim())}`)),
  totalBalance: () => data(api.get("/accounts/total-balance")),
};

export const transactionAPI = {
  transfer: (body) => data(api.post("/transactions/transfer", body)),
  deposit: (body) => data(api.post("/transactions/deposit", body)),
  withdraw: (body) => data(api.post("/transactions/withdraw", body)),
  mine: (filters = {}) => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v != null));
    return data(api.get("/transactions/my", { params }));
  },
  forAccount: (number) => data(api.get(`/transactions/account/${number}`)),
  statement: (number, from, to) =>
    api.get(`/transactions/account/${number}/statement`, {
      params: { from: from || undefined, to: to || undefined },
      responseType: "blob",
    }),
};

export const beneficiaryAPI = {
  list: () => data(api.get("/beneficiaries")),
  add: (body) => data(api.post("/beneficiaries", body)),
  remove: (id) => data(api.delete(`/beneficiaries/${id}`)),
};

export const notificationAPI = {
  list: () => data(api.get("/notifications")),
  unreadCount: () => data(api.get("/notifications/unread-count")),
  markRead: (id) => data(api.post(`/notifications/${id}/read`)),
  markAllRead: () => data(api.post("/notifications/read-all")),
};

export const insightsAPI = {
  get: () => data(api.get("/insights")),
};

export const adminAPI = {
  stats: () => data(api.get("/admin/stats")),
  users: () => data(api.get("/admin/users")),
  setUserActive: (id, active) => data(api.patch(`/admin/users/${id}/status`, { active })),
  accounts: () => data(api.get("/admin/accounts")),
  setFrozen: (number, frozen) => data(api.patch(`/admin/accounts/${number}/freeze`, { frozen })),
  transactions: () => data(api.get("/admin/transactions")),
};

export default api;
