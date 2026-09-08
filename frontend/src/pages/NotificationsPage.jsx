import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell, Check, Clock, CalendarDays, ClipboardList,
  Upload, MessageSquare, ShieldCheck, AlertCircle
} from 'lucide-react';

const TYPE_CONFIG = {
  SCHEDULE:      { icon: CalendarDays,  bg: 'bg-blue-100',    text: 'text-blue-600',   label: 'Schedule' },
  REQUIRED_FILE: { icon: ClipboardList, bg: 'bg-purple-100',  text: 'text-purple-600', label: 'Required File' },
  REMINDER:      { icon: Clock,         bg: 'bg-amber-100',   text: 'text-amber-600',  label: 'Reminder' },
  FEEDBACK:      { icon: MessageSquare, bg: 'bg-rose-100',    text: 'text-rose-600',   label: 'Feedback' },
  UPLOAD:        { icon: Upload,        bg: 'bg-emerald-100', text: 'text-emerald-600',label: 'Upload' },
  AUDIT:         { icon: ShieldCheck,   bg: 'bg-indigo-100',  text: 'text-indigo-600', label: 'Audit' },
  DEFAULT:       { icon: Bell,          bg: 'bg-slate-100',   text: 'text-slate-500',  label: 'Notification' },
};

const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.DEFAULT;

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const NotificationsPage = () => {
  const { authFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await authFetch('http://localhost:8080/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markOne = async (id) => {
    await authFetch(`http://localhost:8080/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAll = async () => {
    await authFetch('http://localhost:8080/api/notifications/read-all', { method: 'PUT' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filters = ['ALL', 'UNREAD', 'SCHEDULE', 'REQUIRED_FILE', 'REMINDER', 'FEEDBACK', 'UPLOAD', 'AUDIT'];

  const filtered = notifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UNREAD') return !n.read;
    return (n.type || 'DEFAULT') === activeFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5">
            <Check size={13} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => {
          const count = f === 'ALL' ? notifications.length
            : f === 'UNREAD' ? unreadCount
            : notifications.filter(n => (n.type || 'DEFAULT') === f).length;
          if (count === 0 && f !== 'ALL' && f !== 'UNREAD') return null;
          const cfg = f === 'ALL' || f === 'UNREAD' ? null : getConfig(f);
          return (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                activeFilter === f
                  ? 'bg-[#0B1E3F] text-white border-[#0B1E3F]'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              {cfg && <cfg.icon size={11} />}
              <span>{f === 'REQUIRED_FILE' ? 'Required File' : f.charAt(0) + f.slice(1).toLowerCase()}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                activeFilter === f ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-14 text-center shadow-sm">
          <Bell className="mx-auto text-slate-200 mb-3" size={40} />
          <p className="text-slate-400 text-sm font-semibold">No notifications here.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {filtered.map((n, idx) => {
            const cfg = getConfig(n.type);
            const Icon = cfg.icon;
            return (
              <div key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                  idx !== filtered.length - 1 ? 'border-b border-slate-50' : ''
                } ${!n.read ? 'bg-blue-50/20' : 'hover:bg-slate-50/50'}`}>

                {/* Icon */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                  <Icon size={15} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.title && (
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${cfg.text}`}>
                        {n.title}
                      </span>
                    )}
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 leading-relaxed ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-semibold">
                    <Clock size={10} />
                    <span>{timeAgo(n.createdAt || n.createdDate)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Mark read */}
                {!n.read && (
                  <button onClick={() => markOne(n.id)}
                    title="Mark as read"
                    className="flex-shrink-0 p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all">
                    <Check size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
