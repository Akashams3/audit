import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import {
  LayoutDashboard,
  Building,
  FileText,
  Files,
  Bell,
  History,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  Upload,
  UserCheck,
  HelpCircle,
  MessageSquare,
  Mail,
  User,
  CalendarDays,
  ClipboardList,
  Activity,
  Key,
  UserPlus,
  Clock,
  Play
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, authFetch } = useAuth();
  const role = user?.role;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!user) return;
      try {
        const response = await authFetch('http://localhost:8080/api/notifications/unread-count');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const isFaculty = role === 'ROLE_FACULTY';

  const getLinks = () => {
    if (role === 'ROLE_DIRECTOR') {
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/director/audit-stage', label: 'Audit Stage Control', icon: Play },
        { to: '/director/audit-history', label: 'Audit History', icon: History },
        { to: '/director/progress', label: 'Progress Tracker', icon: Activity },
        { to: '/director/schedule', label: 'Schedule', icon: CalendarDays },
        { to: '/director/required-files', label: 'Required Files', icon: ClipboardList },
        { to: '/director/late-requests', label: 'Late Upload Requests', icon: Clock },
        { to: '/audit-logs', label: 'System Audit Logs', icon: History },
        { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
        { to: '/feedback', label: 'Feedback & Comments', icon: MessageSquare },
        { to: '/reports', label: 'Reports', icon: FileText },
        { to: '/audit-status', label: 'Audit Status', icon: ShieldCheck },
        { to: '/users', label: 'Users', icon: Users },
        { to: '/director/add-invigilator', label: 'Add IQAC Invigilator', icon: UserCheck },
        { to: '/settings', label: 'Settings', icon: Settings },
      ];
    } else if (role === 'ROLE_HOD') {
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/hod/add-faculty', label: 'Add Faculty', icon: UserCheck },
        { to: '/hod/roles', label: 'Role Assignment', icon: Key },
        { to: '/hod/late-requests', label: 'Late Upload Requests', icon: Clock },
      ];
    } else if (role === 'ROLE_INVIGILATOR') {
      return [
        { to: '/', label: 'Submissions & Faculty', icon: LayoutDashboard },
        { to: '/invigilator/assign-work', label: 'Assign Audit Work', icon: Users },
        { to: '/due-date-reminders', label: 'Due Date Reminders', icon: Mail },
        { to: '/invigilator/late-requests', label: 'Late Upload Requests', icon: Clock },
        { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
        { to: '/invigilator/add-user', label: 'Add User Account', icon: UserPlus },
        { to: '/auditor-access', label: 'Auditor Access', icon: ShieldCheck },
        { to: '/reports', label: 'Reports', icon: FileText },
        { to: '/settings', label: 'Settings', icon: Settings },
      ];
    } else if (role === 'ROLE_AUDITOR') {
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/upload-academic', label: 'Upload Academic File', icon: Upload },
        { to: '/upload-department', label: 'Upload Dept File', icon: Files },
        { to: '/my-uploads', label: 'My Uploads', icon: Files },
        { to: '/required-files', label: 'Required Files', icon: ClipboardList },
        { to: '/profile', label: 'Profile', icon: User },
      ];
    } else {
      // Faculty links
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/upload-academic', label: 'Upload Academic File', icon: Upload },
        { to: '/upload-department', label: 'Upload Dept File', icon: Files },
        { to: '/my-uploads', label: 'My Uploads', icon: Files },
        { to: '/required-files', label: 'Required Files', icon: ClipboardList },
        { to: '/profile', label: 'Profile', icon: User },
      ];
    }
  };

  const links = getLinks();

  // Styles based on theme
  // Faculty is off-white sidebar with red highlights.
  // Director/Invigilator is dark navy blue sidebar with blue highlights.
  const sidebarBg = isFaculty ? 'bg-[#FAF8F8] border-r border-slate-200' : 'bg-[#0B1E3F] text-slate-300';
  const logoText = isFaculty ? 'text-slate-800' : 'text-white';
  const logoSubtitle = isFaculty ? 'text-slate-400' : 'text-slate-400';

  return (
    <aside className={`w-64 flex flex-col h-screen fixed left-0 top-0 z-30 ${sidebarBg}`}>
      {/* Sidebar Header */}
      <div className={`p-5 border-b ${isFaculty ? 'border-slate-200/60' : 'border-slate-800'} flex items-center space-x-3`}>
        {isFaculty ? (
          <div className="flex items-center space-x-2">
            <img src={logoImg} alt="Logo" className="h-10 w-10 object-contain drop-shadow-md rounded-full bg-white/10" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">AUDIT APP</h2>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2.5">
            <img src={logoImg} alt="Logo" className="h-10 w-10 object-contain drop-shadow-md rounded-full bg-white/10" />
            <div>
              <h2 className={`text-md font-bold ${logoText} tracking-tight`}>IQAC</h2>
              <span className={`text-[8px] ${logoSubtitle} font-bold tracking-wider uppercase block leading-3`}>
                Internal Quality<br />Assurance Cell
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto">
        {links.map((link, idx) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={idx}
              to={link.to}
              className={({ isActive }) => {
                let base = "flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ";
                if (isFaculty) {
                  return base + (isActive
                    ? "bg-[#0A3D91] text-white shadow-md shadow-blue-900/10"
                    : "text-slate-600 hover:text-[#0A3D91] hover:bg-slate-100");
                } else {
                  return base + (isActive
                    ? "bg-[#1A56DB] text-white shadow-md shadow-blue-900/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50");
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <Icon size={15} />
                <span>{link.label}</span>
              </div>
              {link.badge !== undefined && (
                <span className={`h-4.5 min-w-4.5 px-1 flex items-center justify-center rounded-full text-[9px] font-extrabold text-white bg-rose-600`}>
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer context-dependent panels */}
      <div className={`p-4 border-t ${isFaculty ? 'border-slate-200' : 'border-slate-800'}`}>
        {role === 'ROLE_DIRECTOR' && (
          <div className="bg-[#102347] border border-slate-800 rounded-xl p-3.5 text-center space-y-2">
            <MessageSquare className="mx-auto text-blue-400" size={18} />
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Provide Feedback</h4>
            <p className="text-[9px] text-slate-400 leading-normal">
              Share your comments with the IQAC invigilator for improvements.
            </p>
            <button
              onClick={() => {
                if (window.location.pathname === '/') {
                  const el = document.getElementById('feedback-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.href = '/#feedback-section';
                }
              }}
              className="mt-2 block w-full bg-[#1A56DB] hover:bg-blue-600 text-white font-bold py-1.5 px-2 rounded-lg text-[10px] transition-colors text-center cursor-pointer"
            >
              Add Feedback
            </button>
          </div>
        )}

        {role === 'ROLE_INVIGILATOR' && (
          <div className="bg-[#102347] border border-slate-800 rounded-xl p-3.5 text-center space-y-2">
            <Mail className="mx-auto text-blue-400" size={18} />
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Send Reminder</h4>
            <p className="text-[9px] text-slate-400 leading-normal">
              Send email reminders to faculty for pending submissions.
            </p>
            <NavLink
              to="/reminders"
              className="mt-2 block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-2 rounded-lg text-[10px] transition-colors"
            >
              Send Now
            </NavLink>
          </div>
        )}

        <button
          onClick={logout}
          className={`w-full flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all mt-4 ${isFaculty
            ? 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
