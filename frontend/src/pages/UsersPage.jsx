import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Mail, Building, Plus, CheckCircle, XCircle, Award, Eye, FileText, Search, Filter, User } from 'lucide-react';

const UsersPage = () => {
  const { user: currentUser, authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // User Creation Modal States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [role, setRole] = useState(
    currentUser?.role === 'ROLE_DIRECTOR' ? 'ROLE_INVIGILATOR' :
    currentUser?.role === 'ROLE_IQAC_INVIGILATOR' ? 'ROLE_HOD' : 'ROLE_FACULTY'
  );
  const [form, setForm] = useState({
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
    profileImage: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authFetch('http://localhost:8080/api/director/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height *= maxDimension / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width *= maxDimension / height;
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setForm(prev => ({ ...prev, profileImage: canvas.toDataURL('image/jpeg', 0.7) }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);

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
        profileImage: form.profileImage,
      };

      let endpoint = 'http://localhost:8080/api/director/faculty';
      if (role === 'ROLE_INVIGILATOR') {
        endpoint = 'http://localhost:8080/api/director/invigilators';
      } else if (role === 'ROLE_HOD') {
        endpoint = 'http://localhost:8080/api/director/hod';
      }

      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('User account created successfully!');
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
        setShowAddUserModal(false);
        fetchUsers();
      } else {
        const errData = await res.json();
        alert('Failed to create account: ' + (errData.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };



  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.username?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesDept = deptFilter === 'ALL' || u.departmentCode === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Settings & Accounts</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Users</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center space-x-2 bg-[#1A56DB] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
        >
          <Plus size={14} />
          <span>Add User Account</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Filters Section */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by name or Faculty Code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ROLE_DIRECTOR">Director</option>
                  <option value="ROLE_INVIGILATOR">Invigilator</option>
                  <option value="ROLE_HOD">HOD</option>
                  <option value="ROLE_FACULTY">Faculty</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                <Building size={14} className="text-slate-400" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">All Depts</option>
                  {departments.map(d => (
                    <option key={d.code} value={d.code}>{d.code}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">Faculty Code</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Department</th>
                  <th className="py-3 px-2">Designations</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                    <td className="py-3.5 px-2 font-bold text-slate-800">
                      <div className="flex items-center space-x-3">
                        {u.profileImageBase64 ? (
                          <img src={u.profileImageBase64} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <User size={14} className="text-slate-400" />
                          </div>
                        )}
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-600">{u.username}</td>
                    <td className="py-3.5 px-2 font-semibold text-[#0A3D91]">{u.email}</td>
                    <td className="py-3.5 px-2">
                      {u.departmentCode && u.departmentCode !== 'ALL' ? (
                        <div>
                          <span className="font-bold text-slate-800 text-xs">{u.departmentCode}</span>
                          {u.department && (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{u.department}</p>
                          )}
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-500 text-xs">{u.department || '-'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 max-w-[180px]">
                      {u.designations ? (
                        <div className="flex flex-wrap gap-1">
                          {u.designations.split(',').filter(d => d.trim()).map((d, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded capitalize">
                              {d.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                        u.role === 'ROLE_DIRECTOR' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        u.role === 'ROLE_INVIGILATOR' || u.role === 'ROLE_IQAC_INVIGILATOR' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        u.role === 'ROLE_HOD' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {u.role ? u.role.replace('ROLE_', '').replace('_', ' ') : 'USER'}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                        Active
                      </span>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400 font-semibold text-xs">
                      No users match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Add New User Account</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Directly register a new Invigilator or Faculty member.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-bold"
                >
                  <option value="ROLE_FACULTY">Faculty Member</option>
                  <option value="ROLE_HOD">HOD (Head of Department)</option>
                  <option value="ROLE_INVIGILATOR">IQAC Invigilator</option>
                </select>
              </div>

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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Profile Picture (Optional)</label>
                <div className="flex items-center space-x-4">
                  {form.profileImage ? (
                    <img src={form.profileImage} alt="Preview" className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <User size={16} className="text-slate-400" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1 block w-full text-xs text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-xs file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100 transition-all cursor-pointer"
                  />
                </div>
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
                  placeholder="Enter secure password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
                />
              </div>

              <div>
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

              {role === 'ROLE_FACULTY' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty Designations</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
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

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0A3D91] hover:bg-[#082E6E] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
