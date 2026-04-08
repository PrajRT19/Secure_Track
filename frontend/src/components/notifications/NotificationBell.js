import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Icon Map ────────────────────────────────────────────────────────────── */
const TYPE_ICON = {
  ISSUE_CREATED: { icon: 'bi-plus-circle-fill', color: '#3b82f6' },
  ISSUE_UPDATED: { icon: 'bi-pencil-fill', color: '#8b5cf6' },
  ISSUE_ASSIGNED: { icon: 'bi-person-fill-check', color: '#f59e0b' },
  ISSUE_STATUS_CHANGED: { icon: 'bi-arrow-repeat', color: '#22c55e' },
  VULNERABILITY_FOUND: { icon: 'bi-shield-exclamation', color: '#ef4444' },
};

/* ─── Single Notification Row ─────────────────────────────────────────────── */
const NotifRow = ({ notif, onRead, onDelete, onNavigate }) => {
  const cfg = TYPE_ICON[notif.type] || { icon: 'bi-bell-fill', color: '#64748b' };
  const timeAgo = formatTimeAgo(notif.createdAt);

  const handleClick = () => {
    if (!notif.read) onRead(notif._id);
    if (notif.link) onNavigate(notif.link);
  };

  return (
    <div
      className={`st-notif-row ${!notif.read ? 'st-notif-unread' : ''}`}
      onClick={handleClick}
      style={{ cursor: notif.link ? 'pointer' : 'default' }}
    >
      {/* Unread dot */}
      {!notif.read && <div className="st-notif-dot" />}

      {/* Icon */}
      <div className="st-notif-icon-wrap" style={{ background: cfg.color + '22' }}>
        <i className={`bi ${cfg.icon}`} style={{ color: cfg.color, fontSize: 14 }} />
      </div>

      {/* Content */}
      <div className="st-notif-content">
        <div className="st-notif-title">{notif.title}</div>
        <div className="st-notif-msg">{notif.message}</div>
        <div className="st-notif-time">{timeAgo}</div>
      </div>

      {/* Delete */}
      <button
        className="st-notif-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
        title="Remove"
      >
        <i className="bi bi-x" />
      </button>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────────────────────── */
const NotificationBell = ({ notifications, unreadCount, loading, onRead, onReadAll, onDelete, onClearAll }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleNavigate = (link) => {
    setOpen(false);
    navigate(link);
  };

  return (
    <div className="st-bell-wrap" ref={panelRef}>
      {/* Bell Button */}
      <button
        className={`st-bell-btn ${open ? 'active' : ''}`}
        onClick={() => setOpen((p) => !p)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <i className={`bi ${unreadCount > 0 ? 'bi-bell-fill' : 'bi-bell'}`} />
        {unreadCount > 0 && (
          <span className="st-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="st-notif-panel">
          {/* Header */}
          <div className="st-notif-header">
            <span className="fw-semibold" style={{ fontSize: 13 }}>
              Notifications
              {unreadCount > 0 && (
                <span className="st-notif-count-badge">{unreadCount}</span>
              )}
            </span>
            <div className="d-flex gap-2">
              {unreadCount > 0 && (
                <button className="st-notif-action-btn" onClick={onReadAll} title="Mark all read">
                  <i className="bi bi-check2-all" />
                </button>
              )}
              {notifications.length > 0 && (
                <button className="st-notif-action-btn" onClick={onClearAll} title="Clear all">
                  <i className="bi bi-trash" />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="st-notif-body">
            {loading ? (
              <div className="st-notif-empty">
                <div className="spinner-border spinner-border-sm text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="st-notif-empty">
                <i className="bi bi-bell-slash" style={{ fontSize: 28, color: '#475569', marginBottom: 8 }} />
                <div style={{ color: '#64748b', fontSize: 12 }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifRow
                  key={n._id}
                  notif={n}
                  onRead={onRead}
                  onDelete={onDelete}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="st-notif-footer">
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Helper ──────────────────────────────────────────────────────────────── */
const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default NotificationBell;
