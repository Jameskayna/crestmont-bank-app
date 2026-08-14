import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api, ApiError } from "../api/client";

export default function Notifications() {
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.listNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load notifications.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkRead(id) {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the notification.");
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update notifications.");
    }
  }

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      {notifications === null ? (
        <p>Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="empty-state">No notifications yet.</div>
      ) : (
        <div className="ledger">
          {notifications.map((n) => (
            <div
              className="ledger-row"
              key={n.id}
              style={{ background: n.is_read ? "transparent" : "rgba(180, 146, 63, 0.06)", cursor: n.is_read ? "default" : "pointer" }}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
            >
              <div>
                <div className="ledger-desc" style={{ fontWeight: n.is_read ? 400 : 600 }}>
                  {n.title}
                  {!n.is_read && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        marginLeft: 8,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </div>
                {n.body && <div className="ledger-meta">{n.body}</div>}
                <div className="ledger-meta">
                  {new Date(n.created_at).toLocaleString()}
                  <span className="status-pill" style={{ background: "#eef1f6", color: "var(--ink-muted)" }}>
                    {n.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
