import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAcademicYear } from '../context/AcademicYearContext';
import { notificationApi } from '../api/notificationApi';
import { Bell, LogOut, CheckCheck, Calendar, Layers, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const {
    selectedAcademicYear,
    setSelectedAcademicYear,
    academicYearsList,
    selectedStudyYear,
    setSelectedStudyYear,
    studyYearsList
  } = useAcademicYear();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data || []);
      const countRes = await notificationApi.getUnreadCount();
      setUnreadCount(countRes?.count || 0);
    } catch (e) {
      console.error('Notification fetch error:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <div className="bg-brand-500 text-white h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm tracking-wide shadow-sm">
          IQAC
        </div>
        <div>
          <h1 className="text-md font-bold text-slate-800 tracking-tight">IQAC ERP Portal</h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase hidden sm:block">Internal Quality Assurance Cell</p>
        </div>
      </div>

      {/* Global Academic Year & Study Year Selectors */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          <Calendar size={15} className="text-brand-600" />
          <span className="text-xs font-semibold text-slate-500 hidden md:inline">Acad. Year:</span>
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            {academicYearsList.map((ay) => (
              <option key={ay} value={ay}>
                {ay}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          <Layers size={15} className="text-brand-600" />
          <span className="text-xs font-semibold text-slate-500 hidden md:inline">Study Year:</span>
          <select
            value={selectedStudyYear}
            onChange={(e) => setSelectedStudyYear(e.target.value)}
            className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            {studyYearsList.map((sy) => (
              <option key={sy} value={sy}>
                {sy}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative border border-slate-100"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 text-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50">
                <span className="font-bold text-slate-800">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-brand-600 hover:text-brand-700 flex items-center space-x-1 font-medium"
                  >
                    <CheckCheck size={14} className="mr-0.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-xs">
                    No new alerts
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${!n.read ? 'bg-brand-50/20 font-semibold text-slate-900 border-l-2 border-brand-500' : 'text-slate-600'}`}
                    >
                      <p className="line-clamp-2 leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-slate-400 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
          >
            {user?.profileImageBase64 ? (
              <img
                src={user.profileImageBase64}
                alt="Profile Avatar"
                className="h-8 w-8 rounded-full object-cover border border-brand-200"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-100">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-700 leading-3">{user?.name}</p>
              <span className="text-[9px] text-slate-400 font-semibold uppercase">{user?.role?.replace('ROLE_', '')}</span>
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 text-xs">
              <div className="px-4 py-2.5 border-b border-slate-50 text-slate-600">
                <p className="font-bold text-slate-800 text-sm">{user?.name}</p>
                <p className="text-slate-400 truncate mt-0.5">{user?.email}</p>
                <div className="mt-2 flex items-center space-x-1.5">
                  <span className="bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded text-[9px] tracking-wide uppercase">
                    Dept: {user?.department || 'ALL'}
                  </span>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowProfileDropdown(false)}
                className="w-full flex items-center space-x-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left font-semibold"
              >
                <UserIcon size={14} />
                <span>My Profile & Avatar</span>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50/50 transition-colors text-left font-semibold border-t border-slate-50"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
