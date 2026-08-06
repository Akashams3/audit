import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

const InvigilatorAddUserPage = () => {
  const { authFetch } = useAuth();

  const [role, setRole] = useState('ROLE_FACULTY');
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    departmentCode: 'CSE',
  });
  const [designations, setDesignations] = useState({
    class_incharge: false,
    mentor: false,
    mini_project_mentor: false,
    project_mentor: false,
    ccm_coordinator: false,
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

  const designationLabels = [
    { key: 'class_incharge', label: 'Class Incharge' },
    { key: 'mentor', label: 'Mentor' },
    { key: 'mini_project_mentor', label: 'Mini Project Mentor' },
    { key: 'project_mentor', label: 'Project Mentor' },
    { key: 'ccm_coordinator', label: 'CCM Coordinator' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const designationsList = role === 'ROLE_FACULTY'
        ? Object.entries(designations)
            .filter(([, v]) => v)
            .map(([k]) => k.replace(/_/g, ' '))
            .join(',')
        : '';

      const payload = {
        ...form,
        designations: designationsList,
      };

      const endpoint = role === 'ROLE_HOD'
        ? 'http://localhost:8080/api/invigilator/create-hod'
        : role === 'ROLE_INVIGILATOR'
        ? 'http://localhost:8080/api/invigilator/create-invigilator'
        : 'http://localhost:8080/api/invigilator/create-faculty';

      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const roleName = role === 'ROLE_HOD' ? 'HOD' : role === 'ROLE_INVIGILATOR' ? 'Invigilator' : 'Faculty';
        setMsg({
          text: `${roleName} account for "${form.name}" created successfully!`,
          type: 'success',
        });
        setForm({ name: '', username: '', email: '', password: '', departmentCode: 'CSE' });
        setDesignations({
          class_incharge: false, mentor: false,
          mini_project_mentor: false, project_mentor: false, ccm_coordinator: false,
        });
      } else {
        const err = await res.json();
        setMsg({ text: 'Failed: ' + (err.message || 'Unknown error'), type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-3xl">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Add User Account</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Add User Account</p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Card Header */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <UserPlus size={16} className="text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Register User Account</h3>
        </div>

        {/* Status Message */}
        {msg.text && (
          <div className={`p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold ${
            msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {msg.type === 'error'
              ? <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              : <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account Role */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Account Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-bold appearance-none"
            >
              <option value="ROLE_FACULTY">Faculty Member</option>
              <option value="ROLE_HOD">HOD (Head of Department)</option>
              <option value="ROLE_INVIGILATOR">IQAC Invigilator</option>
            </select>
          </div>

          {/* Name + Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                required type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dr. John Doe"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {role === 'ROLE_FACULTY' ? 'Faculty Code (Username) *' : 'Username *'}
              </label>
              <input
                required type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={role === 'ROLE_FACULTY' ? 'e.g. Faculty101' : 'e.g. hod_csbs'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Email + Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email ID *
              </label>
              <input
                required type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. johndoe@college.edu"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <input
                required type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Department *
            </label>
            <select
              value={form.departmentCode}
              onChange={(e) => setForm({ ...form, departmentCode: e.target.value })}
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold appearance-none"
            >
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Designations (only for Faculty) */}
          {role === 'ROLE_FACULTY' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Faculty Designations
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {designationLabels.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center space-x-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={designations[key]}
                      onChange={(e) => setDesignations({ ...designations, [key]: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1A56DB] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <UserPlus size={15} />
            <span>{submitting ? 'Creating Account...' : 'Register User Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvigilatorAddUserPage;
