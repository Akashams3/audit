import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFppDocument } from '../utils/fppUtils';
import {
  Mail,
  MoreVertical,
  CheckCircle,
  FileText,
  FolderOpen,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  X
} from 'lucide-react';

import IqacCalendarGrid from '../components/IqacCalendarGrid';

const IqacDashboard = () => {
  const { user, authFetch, API_BASE_URL } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [courseFiles, setCourseFiles] = useState([]);
  const [deptFiles, setDeptFiles] = useState([]);
  const [requiredFiles, setRequiredFiles] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [notifyingAuditor, setNotifyingAuditor] = useState(false);

  // Add User Module State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserRole, setAddUserRole] = useState('ROLE_FACULTY');
  const [addUserForm, setAddUserForm] = useState({ name: '', username: '', email: '', password: '', departmentCode: '' });
  const [addUserMsg, setAddUserMsg] = useState({ text: '', type: '' });
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);

  const departments = [
    { code: 'CCE', name: 'Computer and Communication Engineering' },
    { code: 'CSBS', name: 'Computer Science and Business Systems' },
    { code: 'CSE', name: 'Computer Science and Engineering' },
    { code: 'AIDS', name: 'Artificial Intelligence & Data Science' },
    { code: 'AIML', name: 'Artificial Intelligence and Machine Learning' },
    { code: 'VLSI', name: 'VLSI Design and Technology' },
    { code: 'ECE', name: 'Electronics and Communication Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'BIOTECH', name: 'Biotechnology' },
    { code: 'H&S', name: 'Humanities and Sciences' },
  ];

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAddUserSubmitting(true);
    setAddUserMsg({ text: '', type: '' });
    try {
      const endpoint = addUserRole === 'ROLE_HOD'
        ? 'http://localhost:8080/api/invigilator/create-hod'
        : 'http://localhost:8080/api/invigilator/create-faculty';
      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm),
      });
      if (res.ok) {
        setAddUserMsg({ text: `${addUserRole === 'ROLE_HOD' ? 'HOD' : 'Faculty'} account for ${addUserForm.name} created successfully!`, type: 'success' });
        setAddUserForm({ name: '', username: '', email: '', password: '', departmentCode: '' });
        fetchData();
      } else {
        const err = await res.json();
        setAddUserMsg({ text: 'Failed: ' + (err.message || 'Unknown error'), type: 'error' });
      }
    } catch (err) {
      setAddUserMsg({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setAddUserSubmitting(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      try {
        const statsRes = await authFetch('http://localhost:8080/api/invigilator/dashboard');
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (e) { console.error('Dashboard stats fetch error:', e); }

      try {
        const facRes = await authFetch('http://localhost:8080/api/invigilator/faculty-status');
        if (facRes.ok) setFaculties(await facRes.json());
      } catch (e) { console.error('Faculty status fetch error:', e); }

      try {
        const cFilesRes = await authFetch('http://localhost:8080/api/invigilator/academic-files');
        if (cFilesRes.ok) setCourseFiles(await cFilesRes.json());
      } catch (e) { console.error('Academic files fetch error:', e); }

      try {
        const dFilesRes = await authFetch('http://localhost:8080/api/invigilator/department-files');
        if (dFilesRes.ok) setDeptFiles(await dFilesRes.json());
      } catch (e) { console.error('Department files fetch error:', e); }

      try {
        const rFilesRes = await authFetch('http://localhost:8080/api/invigilator/required-files');
        if (rFilesRes.ok) setRequiredFiles(await rFilesRes.json());
      } catch (e) { console.error('Required files fetch error:', e); }

      try {
        const calRes = await authFetch('http://localhost:8080/api/invigilator/academic-calendar');
        if (calRes.ok) setAcademicCalendar(await calRes.json());
      } catch (e) { console.error('Academic calendar fetch error:', e); }

      try {
        const schedRes = await authFetch('http://localhost:8080/api/invigilator/schedules');
        if (schedRes.ok) setSchedules(await schedRes.json());
      } catch (e) { console.error('Schedules fetch error:', e); }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSelectFaculty = (id) => {
    if (selectedFaculty.includes(id)) {
      setSelectedFaculty(selectedFaculty.filter(facId => facId !== id));
    } else {
      setSelectedFaculty([...selectedFaculty, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pendingIds = faculties
        .filter(f => (f.academiaFilesSubmitted ?? f.courseFilesSubmitted ?? 0) < (f.academiaFilesTotal ?? f.courseFilesTotal ?? 0))
        .map(f => f.facultyId);
      setSelectedFaculty(pendingIds);
    } else {
      setSelectedFaculty([]);
    }
  };

  const sendReminders = async () => {
    if (selectedFaculty.length === 0) {
      alert('Please select at least one faculty member to send reminders.');
      return;
    }

    setSendingReminder(true);
    try {
      const res = await authFetch('http://localhost:8080/api/invigilator/send-reminders', {
        method: 'POST',
        body: JSON.stringify(selectedFaculty),
      });

      if (res.ok) {
        alert('Reminder emails sent successfully.');
        setSelectedFaculty([]);
        fetchData();
      } else {
        alert('Failed to send reminders.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSendingReminder(false);
    }
  };

  const handleNotifyAuditor = async () => {
    setNotifyingAuditor(true);
    try {
      const res = await authFetch('http://localhost:8080/api/invigilator/notify-auditor', {
        method: 'POST',
      });

      if (res.ok) {
        alert('Auditor has been successfully notified about the department submission.');
        fetchData();
      } else {
        alert('Failed to notify auditor.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setNotifyingAuditor(false);
    }
  };

  // Helper to fetch initials
  const getInitials = (name) => {
    if (!name) return 'FC';
    const parts = name.replace('Dr. ', '').replace('Mrs. ', '').replace('Mr. ', '').trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Custom static mock lists to replicate image content for full completeness
  const samplePendingCourses = [
    { name: "Dr. S. Kumar", initials: "SK", color: "bg-purple-100 text-purple-700", course: "Data Structures", date: "25 Jun 2025" },
    { name: "Mrs. R. Meena", initials: "RM", color: "bg-emerald-100 text-emerald-700", course: "Database Management Systems", date: "26 Jun 2025" },
    { name: "Mr. A. Johnson", initials: "AJ", color: "bg-orange-100 text-orange-700", course: "Operating Systems", date: "26 Jun 2025" },
    { name: "Ms. P. Shalini", initials: "PS", color: "bg-blue-100 text-blue-700", course: "Computer Networks", date: "27 Jun 2025" }
  ];

  const samplePendingDepts = [
    { name: "Computer Science and Engineering", date: "28 Jun 2025" },
    { name: "Information Technology", date: "28 Jun 2025" },
    { name: "Electronics and Communication", date: "29 Jun 2025" },
    { name: "Mechanical Engineering", date: "29 Jun 2025" },
    { name: "Civil Engineering", date: "30 Jun 2025" }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">IQAC - Department Invigilator</h2>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Dashboard Overview</p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => { setShowAddUserModal(true); setAddUserMsg({ text: '', type: '' }); }}
            className="flex items-center space-x-1.5 bg-[#1A56DB] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            <UserPlus size={13} />
            <span>Register User</span>
          </button>
          <span className="bg-yellow-50 text-yellow-800 font-extrabold px-3 py-1.5 rounded-lg border border-yellow-200 uppercase tracking-wide">
            Audit Type: Academic (FPP / Post CAT / End Sem)
          </span>
          <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-wide">
            Dept: {stats?.departmentCode || 'CSE'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Course Files (Blue) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Files</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-800">
                  {stats?.academicSubmitted ?? stats?.courseSubmitted ?? 0} <span className="text-xs text-slate-400 font-bold">/ {stats?.courseTotal ?? 0}</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Submitted / Total</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${stats?.courseTotal > 0 ? Math.round((stats.courseSubmitted / stats.courseTotal) * 100) : 0}%` }}></div>
              </div>
              <div className="text-[10px] text-right font-bold text-blue-600">
                {stats?.courseTotal > 0 ? Math.round((stats.courseSubmitted / stats.courseTotal) * 100) : 0}%
              </div>
            </div>

            {/* Card 2: Department Files (Green) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <FolderOpen size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Files</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-800">
                  {stats?.deptSubmitted ?? 0} <span className="text-xs text-slate-400 font-bold">/ {stats?.deptTotal ?? 0}</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Submitted / Total</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1">
                <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${stats?.deptTotal > 0 ? Math.round((stats.deptSubmitted / stats.deptTotal) * 100) : 0}%` }}></div>
              </div>
              <div className="text-[10px] text-right font-bold text-emerald-600">
                {stats?.deptTotal > 0 ? Math.round((stats.deptSubmitted / stats.deptTotal) * 100) : 0}%
              </div>
            </div>

            {/* Card 3: Faculty (Orange) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Users size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-800">{stats?.totalFaculty || 18}</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 font-sans">Total Faculty</p>
              </div>
            </div>

            {/* Card 4: Reminders Sent (Purple) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Mail size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reminders Sent</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-800">{stats?.remindersSentThisWeek || 6}</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">This Week</p>
              </div>
            </div>
          </div>

          {/* IQAC Calendar Grid Component with View/Download PDF options */}
          <IqacCalendarGrid academicCalendar={academicCalendar} schedules={schedules} />

          {/* Combined Department Submissions & Audits Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-4 space-y-3 sm:space-y-0">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Department Submissions & Audits</h3>
                <div className="flex items-center space-x-4 mt-1.5">
                  <button
                    onClick={() => setActiveTab('Pending')}
                    className={`text-xs font-bold pb-1 transition-all ${
                      activeTab === 'Pending'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Pending Submissions ({faculties.filter(f => (f.academiaFilesSubmitted ?? f.courseFilesSubmitted ?? 0) < (f.academiaFilesTotal ?? f.courseFilesTotal ?? 0)).length})
                  </button>
                  <button
                    onClick={() => setActiveTab('Course')}
                    className={`text-xs font-bold pb-1 transition-all ${
                      activeTab === 'Course'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Academic Files ({courseFiles.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('Dept')}
                    className={`text-xs font-bold pb-1 transition-all ${
                      activeTab === 'Dept'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Department Files ({deptFiles.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('fpp')}
                    className={`text-xs font-bold pb-1 transition-all ${
                      activeTab === 'fpp'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    FPP Files ({[...courseFiles, ...deptFiles].filter(isFppDocument).length})
                  </button>
                </div>
              </div>

              {activeTab === 'Pending' && (
                <button
                  onClick={sendReminders}
                  disabled={sendingReminder || selectedFaculty.length === 0}
                  className="bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 font-bold py-2 px-4 rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Mail size={14} />
                  <span>Send Reminder to Selected</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              {activeTab === 'Pending' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-2 w-8">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="py-3 px-2">Faculty Name</th>
                      <th className="py-3 px-2">Role / Designation</th>
                      <th className="py-3 px-2">File Status</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculties.map((f) => {
                      const isPending = (f.academiaFilesSubmitted ?? f.courseFilesSubmitted ?? 0) < (f.academiaFilesTotal ?? f.courseFilesTotal ?? 0);
                      return (
                        <tr key={f.facultyId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                          <td className="py-3.5 px-2">
                            <input
                              type="checkbox"
                              disabled={!isPending}
                              checked={selectedFaculty.includes(f.facultyId)}
                              onChange={() => handleSelectFaculty(f.facultyId)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                            />
                          </td>
                          <td className="py-3.5 px-2 flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 text-[#0B1E3F] flex items-center justify-center text-xs font-bold">
                              {f.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{f.name}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{f.email}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <div className="flex flex-col gap-1">
                              {f.facultyRoles && (
                                <span className="bg-blue-50 text-[#0A3D91] px-2 py-0.5 rounded text-[9px] font-bold block w-fit">
                                  {f.facultyRoles}
                                </span>
                              )}
                              {f.designations && (
                                <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold block w-fit border border-slate-100 uppercase">
                                  {f.designations}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              isPending ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {isPending ? 'Submissions Pending' : 'All Uploaded'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right text-slate-400">
                            {isPending ? (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await authFetch('http://localhost:8080/api/invigilator/send-reminders', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify([f.facultyId])
                                    });
                                    if (res.ok) alert('Reminder sent!');
                                  } catch (e) {
                                    alert('Error sending reminder');
                                  }
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded transition-all text-[10px] font-bold px-2 py-1"
                              >
                                Remind Now
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold">Done</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTab === 'Course' && courseFiles.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No academic files uploaded yet.
                </div>
              )}

              {activeTab === 'Course' && courseFiles.length > 0 && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-2">Course Name</th>
                      <th className="py-3 px-2">File Name</th>
                      <th className="py-3 px-2">Uploaded By</th>
                      <th className="py-3 px-2">Uploaded On</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseFiles.map((cf) => (
                      <tr key={cf.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                        <td className="py-3.5 px-2 text-slate-800 font-bold">{cf.courseName}</td>
                        <td className="py-3.5 px-2 text-blue-600 truncate max-w-[200px]" title={cf.fileName}>{cf.fileName}</td>
                        <td className="py-3.5 px-2 text-slate-600">{cf.faculty?.name || 'Faculty'}</td>
                        <td className="py-3.5 px-2 text-slate-400">{new Date(cf.uploadedDate).toLocaleDateString()}</td>
                        <td className="py-3.5 px-2 text-right space-x-2">
                          {cf.fileName.toLowerCase().endsWith('.pdf') && (
                            <a
                              href={`${API_BASE_URL}/api/files/view/academic/${cf.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold inline-flex items-center space-x-1"
                            >
                              <span>View</span>
                            </a>
                          )}
                          <a
                            href={`${API_BASE_URL}/api/files/download/academic/${cf.id}`}
                            className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold inline-flex items-center space-x-1"
                          >
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'Dept' && deptFiles.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No department files uploaded yet.
                </div>
              )}

              {activeTab === 'Dept' && deptFiles.length > 0 && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-2">Document Type</th>
                      <th className="py-3 px-2">File Name</th>
                      <th className="py-3 px-2">Uploaded By</th>
                      <th className="py-3 px-2">Uploaded On</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptFiles.map((df) => (
                      <tr key={df.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                        <td className="py-3.5 px-2 text-slate-800 font-bold">{df.documentType}</td>
                        <td className="py-3.5 px-2 text-blue-600 truncate max-w-[200px]" title={df.fileName}>{df.fileName}</td>
                        <td className="py-3.5 px-2 text-slate-600">{df.faculty?.name || 'Faculty'}</td>
                        <td className="py-3.5 px-2 text-slate-400">{new Date(df.uploadedDate).toLocaleDateString()}</td>
                        <td className="py-3.5 px-2 text-right space-x-2">
                          {df.fileName.toLowerCase().endsWith('.pdf') && (
                            <a
                              href={`${API_BASE_URL}/api/files/view/department/${df.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold inline-flex items-center space-x-1"
                            >
                              <span>View</span>
                            </a>
                          )}
                          <a
                            href={`${API_BASE_URL}/api/files/download/department/${df.id}`}
                            className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold inline-flex items-center space-x-1"
                          >
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'fpp' && [...courseFiles.map(f => ({ ...f, fileType: 'Academic File' })), ...deptFiles.map(f => ({ ...f, fileType: 'Department File' }))].filter(isFppDocument).length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                  No FPP files uploaded yet.
                </div>
              )}
              {activeTab === 'fpp' && [...courseFiles.map(f => ({ ...f, fileType: 'Academic File' })), ...deptFiles.map(f => ({ ...f, fileType: 'Department File' }))].filter(isFppDocument).length > 0 && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                      <th className="py-3 px-2">Document / File Name</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Uploaded By</th>
                      <th className="py-3 px-2">Uploaded On</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...courseFiles.map(f => ({ ...f, fileType: 'Academic File' })), ...deptFiles.map(f => ({ ...f, fileType: 'Department File' }))].filter(isFppDocument).map((ff) => (
                      <tr key={ff.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                        <td className="py-3.5 px-2 text-slate-800 font-bold">{ff.fileName || ff.documentType}</td>
                        <td className="py-3.5 px-2 text-slate-600">{ff.fileType}</td>
                        <td className="py-3.5 px-2 text-slate-600">{ff.faculty?.name || ff.uploadedBy || 'Faculty'}</td>
                        <td className="py-3.5 px-2 text-slate-400">{ff.uploadedDate ? new Date(ff.uploadedDate).toLocaleDateString() : '—'}</td>
                        <td className="py-3.5 px-2 text-right">
                          <a
                            href={ff.fileType === 'Academic File'
                              ? `${API_BASE_URL}/api/files/download/academic/${ff.id}`
                              : `${API_BASE_URL}/api/files/download/department/${ff.id}`
                            }
                            className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold inline-flex items-center space-x-1"
                          >
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Stepper & Notify auditor section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stepper */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 mb-4">Submission & Audit Workflow</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3.5 border border-blue-100 bg-blue-50/20 rounded-xl space-y-1.5 text-xs">
                  <span className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-[10px] font-bold">1</span>
                  <p className="font-bold text-slate-800 leading-tight">Faculty Submits Files</p>
                  <p className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wide">In Progress</p>
                </div>
                <div className="p-3.5 border border-blue-100 bg-blue-50/20 rounded-xl space-y-1.5 text-xs">
                  <span className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-[10px] font-bold">2</span>
                  <p className="font-bold text-slate-800 leading-tight">Invigilator Reviews</p>
                  <p className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wide">In Progress</p>
                </div>
                <div className="p-3.5 border border-slate-100 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <span className="h-6 w-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto text-[10px] font-bold">3</span>
                  <p className="font-bold text-slate-500 leading-tight">All Files Submitted</p>
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Pending</p>
                </div>
                <div className="p-3.5 border border-slate-100 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <span className="h-6 w-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto text-[10px] font-bold">4</span>
                  <p className="font-bold text-slate-500 leading-tight">Auditor Audits Files</p>
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Pending</p>
                </div>
              </div>
            </div>

            {/* Notify Auditor */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Notify Auditor</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Once all files are submitted, notify the auditor to start the audit process.</p>
              </div>

              {/* Status summary */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Academic Files</span>
                  <span>{stats?.academicSubmitted ?? stats?.courseSubmitted ?? 0} / {stats?.courseTotal ?? 0}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Department Files</span>
                  <span>{stats?.deptSubmitted ?? 0} / {stats?.deptTotal ?? 0}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-700">
                  <span>Overall Completion</span>
                  <span>{stats?.completionPercentage ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                  <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${stats?.completionPercentage ?? 0}%` }}></div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleNotifyAuditor}
                  disabled={notifyingAuditor}
                  className="w-full bg-[#0B1E3F] hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
                >
                  <Send size={14} />
                  <span>Notify Auditor</span>
                </button>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-[10px] text-blue-800 font-bold leading-normal">
                Notification will be sent to the registered auditor email. Auditor will be able to download and audit all files.
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Register User Account</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Create a new Faculty or HOD account.</p>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all">
                <X size={16} />
              </button>
            </div>

            {addUserMsg.text && (
              <div className={`p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold ${
                addUserMsg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {addUserMsg.type === 'error' ? <AlertCircle size={15} className="flex-shrink-0" /> : <CheckCircle2 size={15} className="flex-shrink-0" />}
                <span>{addUserMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ val: 'ROLE_FACULTY', label: 'Faculty Member' }, { val: 'ROLE_HOD', label: 'HOD' }].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setAddUserRole(opt.val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        addUserRole === opt.val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                <input required type="text" value={addUserForm.name}
                  onChange={e => setAddUserForm({ ...addUserForm, name: e.target.value })}
                  placeholder="e.g. Dr. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {addUserRole === 'ROLE_FACULTY' ? 'Faculty Code (Username) *' : 'Username *'}
                </label>
                <input required type="text" value={addUserForm.username}
                  onChange={e => setAddUserForm({ ...addUserForm, username: e.target.value })}
                  placeholder={addUserRole === 'ROLE_FACULTY' ? 'e.g. FAC2024001' : 'e.g. hod_csbs'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email ID *</label>
                <input required type="email" value={addUserForm.email}
                  onChange={e => setAddUserForm({ ...addUserForm, email: e.target.value })}
                  placeholder="e.g. john@college.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password *</label>
                <input required type="password" value={addUserForm.password}
                  onChange={e => setAddUserForm({ ...addUserForm, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department *</label>
                <select value={addUserForm.departmentCode}
                  onChange={e => setAddUserForm({ ...addUserForm, departmentCode: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold">
                  <option value="">— Select Department —</option>
                  {departments.map(d => (
                    <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <button type="submit" disabled={addUserSubmitting}
                  className="flex-1 bg-[#1A56DB] hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all">
                  <UserPlus size={14} />
                  <span>{addUserSubmitting ? 'Creating...' : `Create ${addUserRole === 'ROLE_HOD' ? 'HOD' : 'Faculty'} Account`}</span>
                </button>
                <button type="button" onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IqacDashboard;
