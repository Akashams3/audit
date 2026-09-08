import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Check, Clock, AlertTriangle, FileCheck } from 'lucide-react';
import useYearFilteredApi from '../hooks/useYearFilteredApi';
import { useFilterSortSearch } from '../hooks/useFilterSortSearch';
import { Search } from 'lucide-react';

const AuditStatusPage = () => {
  const { authFetch, user } = useAuth();
  const { selectedAcademicYear, selectedStudyYear, buildYearParams } = useYearFilteredApi();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerMsg, setBannerMsg] = useState({ text: '', type: '' });

  const fetchStatusData = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`http://localhost:8080/api/director/department-summary${buildYearParams()}`);
      if (res.ok) {
        const summary = await res.json();
        setData(Array.isArray(summary) ? summary : []);
      }
    } catch (e) {
      console.error(e);
      setBannerMsg({ text: 'Unable to fetch audit status data. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusData();
  }, [selectedAcademicYear, selectedStudyYear]);

  const handleToggleDeptComplete = async (deptCode, isCompleted) => {
    const action = isCompleted ? 'reopen' : 'complete';
    try {
      const res = await authFetch(`http://localhost:8080/api/director/department-status/${deptCode}/${action}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setBannerMsg({ text: data.message || `Audit status updated for ${deptCode}.`, type: 'success' });
        fetchStatusData();
      } else {
        setBannerMsg({ text: `Failed to update department status for ${deptCode}.`, type: 'error' });
      }
    } catch (e) {
      setBannerMsg({ text: 'Error: ' + e.message, type: 'error' });
    }
  };

  const isDirector = user?.role === 'ROLE_DIRECTOR';

  const searchHook = useFilterSortSearch(data, {
    searchKeys: ['name', 'code', 'status']
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Multi-Year Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Audit Status Control</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Audit Status &bull; Year-Wise Audit Management</p>
        </div>
        <div className="flex items-center space-x-3 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
          <span className="text-xs font-bold text-blue-800">
            Year: {selectedStudyYear === 'ALL' ? 'All Years' : selectedStudyYear} | AY: {selectedAcademicYear === 'ALL' ? 'All AY' : selectedAcademicYear}
          </span>
        </div>
      </div>

      {bannerMsg.text && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 border ${bannerMsg.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
          <Check size={14} className="flex-shrink-0" />
          <span>{bannerMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-end">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search departments..."
                value={searchHook.searchTerm}
                onChange={(e) => searchHook.setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-700 font-semibold focus:bg-white w-64 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-3 px-2">Department Name</th>
                  <th className="py-3 px-2">Files (Course / Dept)</th>
                  <th className="py-3 px-2">Completion Rate</th>
                  <th className="py-3 px-2">Current Audit Status</th>
                  <th className="py-3 px-2">Last Updated</th>
                  {isDirector && <th className="py-3 px-2 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {searchHook.filteredData.map((dept) => {
                  const isCompleted = dept.status === 'AUDIT_COMPLETED';
                  return (
                    <tr key={dept.departmentId || dept.code} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                      <td className="py-3.5 px-2">
                        <p className="font-bold text-slate-800">{dept.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{dept.code}</p>
                      </td>
                      <td className="py-3.5 px-2 text-slate-600 font-semibold">
                        Course: {dept.courseSubmitted}/{dept.courseTotal} &bull; Dept: {dept.deptSubmitted}/{dept.deptTotal}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1">
                            <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${dept.progress}%` }}></div>
                          </div>
                          <span className="font-extrabold text-[10px] text-slate-700">{dept.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center space-x-1 w-max uppercase tracking-wider ${
                          isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          dept.status === 'SUBMITTED_TO_AUDITOR' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {isCompleted && <Check size={11} className="mr-0.5" />}
                          {dept.status === 'SUBMITTED_TO_AUDITOR' && <ShieldCheck size={11} className="mr-0.5" />}
                          {(!dept.status || dept.status === 'IN_PROGRESS') && <Clock size={11} className="mr-0.5" />}
                          <span>{isCompleted ? 'AUDIT COMPLETED' : dept.status?.replace(/_/g, ' ') || 'IN PROGRESS'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-400 font-semibold">
                        {dept.lastUpdated ? new Date(dept.lastUpdated).toLocaleDateString() : 'Never'}
                      </td>
                      {isDirector && (
                        <td className="py-3.5 px-2 text-right">
                          {dept.deadlineExpired && !isCompleted ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 font-extrabold px-3 py-1.5 rounded-lg text-[10px] inline-block">
                              Audit Complete (Deadline Passed)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleDeptComplete(dept.code, isCompleted)}
                              className={`font-bold py-1.5 px-3 rounded-lg text-[10px] shadow-sm transition-all cursor-pointer ${
                                isCompleted
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isCompleted ? 'Re-open Audit' : 'Complete Audit'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditStatusPage;
