import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import './RecurringNotifications.css';

const RecurringNotifications = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/recurring_posts?limit=10`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to load notifications');
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const intervalId = setInterval(fetchEvents, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const unreadCount = events.length;

  return (
    <div className="recurring-notifications">
      <button
        className="notification-button"
        type="button"
        aria-label="Recurring transaction notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <FaBell />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-panel" role="dialog" aria-live="polite">
          <div className="panel-header">
            <h4>Recurring Posts</h4>
            <button type="button" onClick={fetchEvents}>
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="panel-status">Loading...</p>
          ) : error ? (
            <p className="panel-status error">{error}</p>
          ) : events.length === 0 ? (
            <p className="panel-status">No recent recurring posts.</p>
          ) : (
            <ul className="notification-list">
              {events.map((event) => (
                <li key={event.id}>
                  <div className="notification-item">
                    <span className="title">{event.transaction?.title || 'Recurring transaction'}</span>
                    <span className="amount">
                      {event.transaction?.type === 'Expense' ? '-' : '+'}
                      {event.transaction?.amount}
                    </span>
                  </div>
                  <div className="notification-meta">
                    <span>{event.transaction?.date || 'Unknown date'}</span>
                    <span>{new Date(event.posted_at).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringNotifications;
