import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, Plus, Trash2, Edit2, Check, X, Search, ShieldCheck, UserCog } from 'lucide-react';

const DirectorRolesPage = () => {
  const { authFetch, user, API_BASE_URL } = useAuth();
  const [roles, setRoles] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Role creation form state
  const [newRoleName, setNewRoleName] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);
  
  // Editing role state
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRoleName, setEditingRoleName] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Faculty filtering state
  const [facultySearch, setFacultySearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      const rolesUrl = user?.role === 'ROLE_HOD'
        ? `${API_BASE_URL}/api/hod/faculty-roles`
        : `${API_BASE_URL}/api/director/faculty-roles`;
      
      const facsUrl = user?.role === 'ROLE_HOD'
        ? `${API_BASE_URL}/api/hod/faculties`
        : `${API_BASE_URL}/api/director/faculties`;

      const rolesRes = await authFetch(rolesUrl);
      const facsRes = await authFetch(facsUrl);
      if (rolesRes.ok && facsRes.ok) {
        setRoles(await rolesRes.json());
        setFaculties(await facsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setSubmittingRole(true);
    try {
      const rolesEndpoint = user?.role === 'ROLE_HOD'
        ? `${API_BASE_URL}/api/hod/faculty-roles`
        : `${API_BASE_URL}/api/director/faculty-roles`;

      const res = await authFetch(rolesEndpoint, {
        method: 'POST',
        body: JSON.stringify({ name: newRoleName.trim() })
      });
      if (res.ok) {
        setNewRoleName('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create role');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleUpdateRole = async (id) => {
    if (!editingRoleName.trim()) return;
    setUpdatingRole(true);
    try {
      const rolesEndpoint = user?.role === 'ROLE_HOD'
        ? `${API_BASE_URL}/api/hod/faculty-roles/${id}`
        : `${API_BASE_URL}/api/director/faculty-roles/${id}`;

      const res = await authFetch(rolesEndpoint, {
        method: 'PUT',
        body: JSON.stringify({ name: editingRoleName.trim() })
      });
      if (res.ok) {
        setEditingRoleId(null);
        setEditingRoleName('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update role');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Delete this role? All associated faculties and required file constraints will be reset.')) return;
    try {
      const rolesEndpoint = user?.role === 'ROLE_HOD'
        ? `${API_BASE_URL}/api/hod/faculty-roles/${id}`
        : `${API_BASE_URL}/api/director/faculty-roles/${id}`;

      const res = await authFetch(rolesEndpoint, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete role');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleRole = async (facultyId, roleId, isChecked, currentRoles) => {
    try {
      let updatedRoleIds = currentRoles ? currentRoles.map(r => r.id) : [];
      if (isChecked) {
        updatedRoleIds = updatedRoleIds.filter(id => id !== roleId);
      } else {
        updatedRoleIds = [...updatedRoleIds, roleId];
      }
      
      const assignUrl = user?.role === 'ROLE_HOD'
        ? `${API_BASE_URL}/api/hod/faculties/${facultyId}/assign-role`
        : `${API_BASE_URL}/api/director/faculties/${facultyId}/assign-role`;

      const res = await authFetch(assignUrl, {
        method: 'POST',
        body: JSON.stringify({ roleIds: updatedRoleIds })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to update roles');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const startEditRole = (role) => {
    setEditingRoleId(role.id);
    setEditingRoleName(role.name);
  };

  const cancelEditRole = () => {
    setEditingRoleId(null);
    setEditingRoleName('');
  };

  const filteredFaculties = faculties.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(facultySearch.toLowerCase()) || f.facultyCode.toLowerCase().includes(facultySearch.toLowerCase());
    const matchDept = deptFilter === 'All' || f.department.code === deptFilter;
    return matchSearch && matchDept;
  });

  const uniqueDepts = Array.from(new Set(faculties.map(f => f.department.code))).filter(Boolean);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Faculty Role Management & Assignment
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Create, update, and delete roles/designations (e.g. Class Incharge, Mini Project, Project) and assign them to faculty members.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles Creation & Listing (Left Panel) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Create New Designation</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Define specialized roles like Class Incharge, Mini Project, or Project.</p>
          </div>

          <form onSubmit={handleCreateRole} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. Class Incharge"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-medium"
            />
            <button
              type="submit"
              disabled={submittingRole || !newRoleName.trim()}
              className="bg-[#1A56DB] hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center transition-all"
            >
              <Plus size={16} />
            </button>
          </form>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Defined Roles</span>
            
            {loading ? (
              <div className="py-6 flex justify-center">
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : roles.length === 0 ? (
              <p className="text-slate-400 text-xs font-semibold text-center py-4">No custom roles defined yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {roles.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                    {editingRoleId === r.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          required
                          value={editingRoleName}
                          onChange={e => setEditingRoleName(e.target.value)}
                          className="flex-1 bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none"
                        />
                        <button
                          onClick={() => handleUpdateRole(r.id)}
                          disabled={updatingRole || !editingRoleName.trim()}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEditRole}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <Key size={13} className="text-blue-500" />
                          <span className="text-xs font-bold text-slate-800">{r.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => startEditRole(r)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="Edit Role Name"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                            title="Delete Role"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Role Assignment UI (Right Panel) */}
        <div className={user?.role === 'ROLE_HOD' ? 'bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4' : 'lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4'}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Assign Roles to Faculty</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Assign specialized roles to control file upload requirements.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Faculty */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={12} />
                </span>
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={facultySearch}
                  onChange={e => setFacultySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-700 font-semibold focus:bg-white w-40 transition-all"
                />
              </div>

              {/* Department Filter */}
              {user?.role !== 'ROLE_HOD' && (
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] text-slate-700 font-bold outline-none cursor-pointer"
                >
                  <option value="All">All Depts</option>
                  {uniqueDepts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredFaculties.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No faculty found matching search filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                    <th className="py-2.5 px-2">Faculty Name</th>
                    <th className="py-2.5 px-2">Faculty Code</th>
                    <th className="py-2.5 px-2">Department</th>
                    <th className="py-2.5 px-2">Assigned Roles</th>
                    <th className="py-2.5 px-2 text-right">Assign / Toggle Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculties.map(f => (
                    <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-800">{f.name}</td>
                      <td className="py-3 px-2 text-slate-500 font-semibold">{f.facultyCode}</td>
                      <td className="py-3 px-2 text-slate-400 font-bold uppercase">{f.department?.code}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {f.facultyRoles && f.facultyRoles.length > 0 ? (
                            f.facultyRoles.map(role => (
                              <span key={role.id} className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                {role.name}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-400">
                              Faculty (Standard)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex flex-wrap justify-end gap-2.5">
                          {roles.map(r => {
                            const isChecked = f.facultyRoles && f.facultyRoles.some(role => role.id === r.id);
                            return (
                              <label key={r.id} className="inline-flex items-center space-x-1 cursor-pointer bg-slate-50/50 hover:bg-slate-100 border border-slate-100 rounded px-1.5 py-0.5 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked || false}
                                  onChange={() => handleToggleRole(f.id, r.id, isChecked, f.facultyRoles)}
                                  className="rounded text-blue-600 focus:ring-blue-400 h-3 w-3 border-slate-300 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-slate-600 select-none cursor-pointer">{r.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorRolesPage;
