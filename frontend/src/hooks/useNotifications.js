import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsAPI } from '../api';

/**
 * useNotifications — centralized notification state manager.
 *
 * Handles:
 * - Initial fetch of stored notifications from REST API
 * - Appending new real-time notifications from socket
 * - Mark as read (single + all)
 * - Delete (single + all)
 * - Unread count badge
 *
 * @param {{ on, off }} socketHook - Result of useSocket()
 * @param {boolean} isAuthenticated - Only fetch/listen when logged in
 */
const useNotifications = (socketHook, isAuthenticated) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  // ─── Initial fetch from REST API ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll({ limit: 30 });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications();
    }
    if (!isAuthenticated) {
      hasFetched.current = false;
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // ─── Real-time socket listener ────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !socketHook?.on) return;

    const handleNewNotification = (notification) => {
      // Prepend to list and increment unread badge
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socketHook.on('notification:new', handleNewNotification);
    return () => socketHook.off('notification:new', handleNewNotification);
  }, [isAuthenticated, socketHook]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('markAllAsRead error:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    const notif = notifications.find((n) => n._id === id);
    try {
      await notificationsAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (notif && !notif.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('deleteNotification error:', err);
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('clearAll error:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
  };
};

export default useNotifications;
