import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import './BudgetNotifications.css';

const BudgetNotifications = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/budget_alerts?limit=10`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to load alerts');
      }
      const data = await response.json();
      setAlerts(data.alerts || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const intervalId = setInterval(fetchAlerts, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const markAlertRead = async (alertId) => {
    try {
      await fetch(`${API_URL}/api/budget_alerts/${alertId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      setAlerts((prev) => prev.map((alert) => (
        alert.id === alertId ? { ...alert, is_read: true } : alert
      )));
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark alert as read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/api/budget_alerts/read_all`, {
        method: 'POST',
        credentials: 'include',
      });
      setAlerts((prev) => prev.map((alert) => ({ ...alert, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all alerts as read', err);
    }
  };

  return (
    <div className="budget-notifications">
      <button
        className="notification-button"
        type="button"
        aria-label="Budget alerts"
        onClick={() => setOpen((prev) => !prev)}
      >
        <FaBell />
        {unreadCount > 0 && <span className="notification-badge budget">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-panel" role="dialog" aria-live="polite">
          <div className="panel-header">
            <h4>Budget Alerts</h4>
            <div className="panel-actions">
              <button type="button" onClick={fetchAlerts}>
                Refresh
              </button>
              <button type="button" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
          </div>
          {loading ? (
            <p className="panel-status">Loading...</p>
          ) : error ? (
            <p className="panel-status error">{error}</p>
          ) : alerts.length === 0 ? (
            <p className="panel-status">No alerts yet.</p>
          ) : (
            <ul className="notification-list">
              {alerts.map((alert) => (
                <li key={alert.id} className={alert.is_read ? 'read' : 'unread'}>
                  <div className="notification-item">
                    <span className="title">{alert.category?.name || 'Category'} budget</span>
                    <span className="amount">{alert.percent_used}%</span>
                  </div>
                  <div className="notification-meta">
                    <span>{alert.month}</span>
                    <span>Threshold {alert.threshold}%</span>
                  </div>
                  {!alert.is_read && (
                    <button
                      type="button"
                      className="mark-read"
                      onClick={() => markAlertRead(alert.id)}
                    >
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetNotifications;
