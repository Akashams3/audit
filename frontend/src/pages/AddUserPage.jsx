import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const AddUserPage = () => {
  const { authFetch, user, API_BASE_URL } = useAuth();
  const [role, setRole] = useState('ROLE_FACULTY');
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    departmentCode: user?.role === 'ROLE_HOD' ? (user.department || 'CSE') : 'CSE',
    class_incharge: false,
    mentor: false,
    mini_project_mentor: false,
    project_mentor: false,
    ccm_cordinator: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const designationsList = [];
      if (role === 'ROLE_FACULTY') {
        if (form.class_incharge) designationsList.push('class incharge');
        if (form.mentor) designationsList.push('mentor');
        if (form.mini_project_mentor) designationsList.push('mini project mentor');
        if (form.project_mentor) designationsList.push('project mentor');
        if (form.ccm_cordinator) designationsList.push('ccm cordinator');
      }

      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        departmentCode: form.departmentCode,
        designations: designationsList.join(','),
      };

      const endpoint = user?.role === 'ROLE_HOD'
        ? `${API_BASE_URL}/api/hod/faculty`
        : (role === 'ROLE_INVIGILATOR'
            ? `${API_BASE_URL}/api/director/invigilators`
            : `${API_BASE_URL}/api/director/faculty`);

      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg({ text: `Account for ${form.name} created successfully!`, type: 'success' });
        setForm({
          name: '',
          username: '',
          email: '',
          password: '',
          departmentCode: 'CSE',
          class_incharge: false,
          mentor: false,
          mini_project_mentor: false,
          project_mentor: false,
          ccm_cordinator: false,
        });
      } else {
        const errData = await res.json();
        setMsg({ text: 'Failed to create user: ' + (errData.message || 'Unknown error'), type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Add User Account</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Add Faculty & Invigilator</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
          <UserPlus size={18} className="text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Register User Account</h3>
        </div>

        {msg.text && (
          <div className={`p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {msg.type === 'error' ? <AlertCircle size={16} className="flex-shrink-0" /> : <CheckCircle size={16} className="flex-shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {user?.role !== 'ROLE_HOD' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-bold"
              >
                <option value="ROLE_FACULTY">Faculty Member</option>
                <option value="ROLE_INVIGILATOR">IQAC Invigilator</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dr. John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {role === 'ROLE_FACULTY' ? 'Faculty Code (Username) *' : 'Username *'}
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={role === 'ROLE_FACULTY' ? 'e.g. Faculty101' : 'e.g. cse_invigilator_custom'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email ID *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. johndoe@college.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
              />
            </div>

            {user?.role !== 'ROLE_HOD' ? (
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department *</label>
                <select
                  value={form.departmentCode}
                  onChange={(e) => setForm({ ...form, departmentCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
                >
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <input
                  type="text"
                  disabled
                  value={`${user.department || ''} - ${departments.find(d => d.code === user.department)?.name || ''}`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 font-semibold cursor-not-allowed outline-none"
                />
              </div>
            )}
          </div>

          {role === 'ROLE_FACULTY' && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty Designations</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.class_incharge}
                    onChange={(e) => setForm({ ...form, class_incharge: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Class Incharge</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.mentor}
                    onChange={(e) => setForm({ ...form, mentor: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Mentor</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.mini_project_mentor}
                    onChange={(e) => setForm({ ...form, mini_project_mentor: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Mini Project Mentor</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.project_mentor}
                    onChange={(e) => setForm({ ...form, project_mentor: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Project Mentor</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.ccm_cordinator}
                    onChange={(e) => setForm({ ...form, ccm_cordinator: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>CCM Coordinator</span>
                </label>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1A56DB] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Register User Account</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserPage;
