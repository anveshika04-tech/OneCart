import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { io } from 'socket.io-client';
import socket from "./socket";

const Navbar = ({ bgColor }) => {
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const syncUser = () => setUser(JSON.parse(localStorage.getItem("user")));
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  useEffect(() => {
    if (user && notifOpen) {
      axios.get(`http://localhost:3000/api/notifications?user_id=${user.name}`)
        .then(res => {
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.is_read).length);
        });
    }
  }, [user, notifOpen]);

  useEffect(() => {
    if (!user) return;
    // Listen for real-time notifications
    socket.on('notification', (notif) => {
      if (notif.user_id === user.name) {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(count => count + 1);
      }
    });
    return () => {
      socket.off('notification');
    };
  }, [user]);

  const handleMarkRead = (id) => {
    axios.post(`/api/notifications/${id}/read`).then(() => {
      setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(count => Math.max(0, count - 1));
    });
  };

  const navigate = useNavigate();
  const location = useLocation();
  const inGroupRoom = location.pathname.startsWith("/room/");

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setDropdownOpen(false);
    navigate("/");
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (!e.target.closest('.profile-dropdown')) setDropdownOpen(false);
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  return (
    <nav className={`w-full flex items-center justify-between px-8 py-4 mb-8 fixed top-0 left-0 z-30 ${bgColor === 'black' ? 'bg-black' : 'bg-[#F3E6FA]'}` }>
      <div className="flex items-center gap-2">
        <Link to="/" className="text-4xl font-bold" style={{ color: bgColor === 'black' ? '#AB81CD' : '#222A68' }}>OneCart</Link>
      </div>
      <div className="flex gap-6 items-center">
        <Link to="/about" className="text-gray-700 font-semibold hover:text-[#FF9500] transition-colors">About</Link>
        <Link to="/" className="text-gray-700 font-semibold hover:text-[#FF9500] transition-colors">Back to Start</Link>
        {/* Notification Bell */}
        {user && inGroupRoom && (
          <div className="relative">
            <button
              className="relative focus:outline-none"
              onClick={() => setNotifOpen(v => !v)}
              aria-label="Notifications"
            >
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-50 animate-fade-in max-h-96 overflow-y-auto">
                <div className="p-3 font-bold border-b">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-gray-500">No notifications</div>
                ) : notifications.map(n => (
                  <div key={n.id} className={`p-3 border-b flex items-start gap-2 ${n.is_read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                    <div className="flex-1">
                      <div className="text-sm">{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</div>
                    </div>
                    {!n.is_read && (
                      <button className="ml-2 text-xs text-blue-600 underline" onClick={() => handleMarkRead(n.id)}>Mark as read</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {user ? (
          <div className="relative profile-dropdown ml-4">
            <button
              className="flex items-center gap-2 focus:outline-none"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <span className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 text-lg font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </span>
              <span className="font-semibold text-gray-700 text-base">{user.name}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow-lg z-50 animate-fade-in">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-pink-50 rounded"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/" className="bg-pink-500 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-[#FF9500]">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 