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
    <div className="space-y-6 font-sans p-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Faculty Role Management & Assignment
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Create, update, and delete roles/designations (e.g. Class Incharge, Mini Project, Project) and assign them to faculty members.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Roles Creation & Listing (Left Panel) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Create New Designation</h3>
              <p className="text-xs text-slate-500 mt-1">Define specialized roles like Class Incharge, Mini Project, or Project.</p>
            </div>

            <form onSubmit={handleCreateRole} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="e.g. Class Incharge"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={submittingRole || !newRoleName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center transition-all shadow-sm"
              >
                <Plus size={18} />
              </button>
            </form>

            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block border-b pb-2">Defined Roles</span>
              
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : roles.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No custom roles defined yet.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {roles.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                      {editingRoleId === r.id ? (
                        <div className="flex items-center gap-3 w-full">
                          <input
                            type="text"
                            required
                            value={editingRoleName}
                            onChange={e => setEditingRoleName(e.target.value)}
                            className="flex-1 bg-white border border-blue-500 rounded-md px-3 py-1.5 text-sm text-slate-800 outline-none"
                          />
                          <button
                            onClick={() => handleUpdateRole(r.id)}
                            disabled={updatingRole || !editingRoleName.trim()}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEditRole}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <Key size={16} className="text-blue-600" />
                            <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditRole(r)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                              title="Edit Role Name"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(r.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                              title="Delete Role"
                            >
                              <Trash2 size={14} />
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
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Assign Roles to Faculty</h3>
                <p className="text-xs text-slate-500 mt-1">Assign specialized roles to control file upload requirements.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Search Faculty */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search faculty..."
                    value={facultySearch}
                    onChange={e => setFacultySearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none text-slate-700 focus:bg-white focus:border-blue-500 transition-all w-56"
                  />
                </div>

                {/* Department Filter */}
                {user?.role !== 'ROLE_HOD' && (
                  <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-all"
                  >
                    <option value="All">All Departments</option>
                    {uniqueDepts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredFaculties.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <p className="text-lg font-medium">No faculty found.</p>
                <p className="text-sm mt-1">Try adjusting your search filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm border-collapse bg-white">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Faculty Name</th>
                      <th className="py-3 px-4">Faculty Code</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Assigned Roles</th>
                      <th className="py-3 px-4 text-right">Assign Roles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredFaculties.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-semibold text-slate-800">{f.name}</td>
                        <td className="py-4 px-4 text-slate-600">{f.facultyCode}</td>
                        <td className="py-4 px-4 text-slate-600 uppercase font-medium">{f.department?.code}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {f.facultyRoles && f.facultyRoles.length > 0 ? (
                              f.facultyRoles.map(role => (
                                <span key={role.id} className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  {role.name}
                                </span>
                              ))
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                Standard Faculty
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap justify-end gap-3 max-w-xs ml-auto">
                            {roles.map(r => {
                              const isChecked = f.facultyRoles && f.facultyRoles.some(role => role.id === r.id);
                              return (
                                <label key={r.id} className="inline-flex items-center space-x-2 cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 transition-colors shadow-sm">
                                  <input
                                    type="checkbox"
                                    checked={isChecked || false}
                                    onChange={() => handleToggleRole(f.id, r.id, isChecked, f.facultyRoles)}
                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300 cursor-pointer"
                                  />
                                  <span className="text-xs font-medium text-slate-700 select-none cursor-pointer">{r.name}</span>
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
