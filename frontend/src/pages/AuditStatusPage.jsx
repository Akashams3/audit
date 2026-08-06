import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Check, Clock, AlertTriangle, FileCheck } from 'lucide-react';

const AuditStatusPage = () => {
  const { authFetch, user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchStatusData = async () => {
    try {
      setLoading(true);
      const res = await authFetch('http://localhost:8080/api/director/department-summary');
      if (res.ok) {
        const summary = await res.json();
        setData(summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusData();
  }, []);

  const handleCompleteAudit = (deptId) => {
    const confirm = window.confirm('Are you sure you want to mark this department audit as COMPLETED? (Frontend only, won\'t affect DB)');
    if (!confirm) return;

    const currentYear = new Date().getFullYear();
    const storageKey = `completed_depts_frontend_${currentYear}`;
    const completedDepts = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!completedDepts.includes(deptId)) {
      completedDepts.push(deptId);
      localStorage.setItem(storageKey, JSON.stringify(completedDepts));
    }
    setMsg('Audit marked as COMPLETED locally. Department hidden.');
    fetchStatusData();
  };

  const handleClearRequiredFiles = async () => {
    const confirm = window.confirm('Pressing Audit Complete will clear the required file list so you can select a different audit stage (e.g. Post CAT 1 audit) without duplicating files. Continue?');
    if (!confirm) return;

    try {
      const res = await authFetch('http://localhost:8080/api/director/clear-required-files', {
        method: 'POST'
      });
      if (res.ok) {
        setMsg('Audit Complete! Required files list is now empty. You can select a different audit stage from Required Files page.');
        fetchStatusData();
      } else {
        alert('Failed to clear required files.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const isDirector = user?.role === 'ROLE_DIRECTOR';

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Audit Status Control</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Audit Status</p>
        </div>
        {isDirector && (
          <button
            onClick={handleClearRequiredFiles}
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Audit Complete (Clear Files List)</span>
          </button>
        )}
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-bold flex items-center space-x-1.5">
          <Check size={14} />
          <span>{msg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
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
                {data.filter(dept => {
                  const currentYear = new Date().getFullYear();
                  const storageKey = `completed_depts_frontend_${currentYear}`;
                  const completedDepts = JSON.parse(localStorage.getItem(storageKey) || '[]');
                  return !completedDepts.includes(dept.departmentId);
                }).map((dept) => (
                  <tr key={dept.departmentId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
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
                        dept.status === 'AUDIT_COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        dept.status === 'SUBMITTED_TO_AUDITOR' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {dept.status === 'AUDIT_COMPLETED' && <Check size={11} className="mr-0.5" />}
                        {dept.status === 'SUBMITTED_TO_AUDITOR' && <ShieldCheck size={11} className="mr-0.5" />}
                        {dept.status === 'IN_PROGRESS' && <Clock size={11} className="mr-0.5" />}
                        <span>{dept.status?.replace(/_/g, ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-400 font-semibold">
                      {dept.lastUpdated ? new Date(dept.lastUpdated).toLocaleDateString() : 'Never'}
                    </td>
                    {isDirector && (
                      <td className="py-3.5 px-2 text-right">
                        {dept.status === 'SUBMITTED_TO_AUDITOR' ? (
                          <button
                            onClick={() => handleCompleteAudit(dept.departmentId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] shadow-sm transition-all"
                          >
                            Mark Completed
                          </button>
                        ) : dept.status === 'AUDIT_COMPLETED' ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end space-x-1">
                            <FileCheck size={13} />
                            <span>Audit Locked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">Awaiting Submission</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditStatusPage;
