import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './notifications/NotificationBell';

const Navbar = ({ notifHook }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  const {
    notifications = [],
    unreadCount = 0,
    loading = false,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = notifHook || {};

  return (
    <nav className="navbar navbar-expand-lg navbar-dark st-navbar sticky-top">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/dashboard">
          <i className="bi bi-shield-lock-fill text-primary" />
          <span>Secure<span className="text-primary">Track</span></span>
        </Link>

        <button className="navbar-toggler border-0" type="button" onClick={() => setCollapsed(!collapsed)}>
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${!collapsed ? 'show' : ''}`}>
          {user && (
            <>
              <ul className="navbar-nav me-auto gap-1">
                {[
                  { to: '/dashboard', icon: 'bi-kanban', label: 'Dashboard' },
                  { to: '/ai-fix', icon: 'bi-magic', label: 'AI Fix' },
                  { to: '/analyze', icon: 'bi-cpu', label: 'Analyzer' },
                  { to: '/history', icon: 'bi-clock-history', label: 'History' },
                ].map(({ to, icon, label }) => (
                  <li className="nav-item" key={to}>
                    <NavLink
                      className={({ isActive }) => `nav-link st-nav-link ${isActive ? 'active' : ''}`}
                      to={to}
                      onClick={() => setCollapsed(true)}
                    >
                      <i className={`bi ${icon} me-1`} /> {label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="d-flex align-items-center gap-3">
                {/* Real-time notification bell */}
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loading}
                  onRead={markAsRead}
                  onReadAll={markAllAsRead}
                  onDelete={deleteNotification}
                  onClearAll={clearAll}
                />
                <div className="st-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <span className="text-light small d-none d-lg-inline">{user.name}</span>
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
