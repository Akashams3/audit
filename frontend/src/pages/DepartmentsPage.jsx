import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const DepartmentsPage = () => {
  const { authFetch } = useAuth();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await authFetch('http://localhost:8080/api/director/department-summary');
        if (res.ok) {
          setSummary(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center space-x-3">
        <Link to="/" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-800">All Academic Departments</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-semibold">Department-wise file submission progress status</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summary.map(dept => (
            <div key={dept.departmentId} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-brand-50 text-brand-700 h-9 w-9 rounded-lg flex items-center justify-center font-extrabold text-xs">
                    {dept.code}
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-800 leading-tight truncate max-w-[150px]">{dept.name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                  dept.status === 'AUDIT_COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                  dept.status === 'SUBMITTED_TO_AUDITOR' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {dept.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Academic Files Submitted:</span>
                  <span className="font-bold text-slate-800">{dept.academicSubmitted ?? dept.courseSubmitted ?? 0} / {dept.courseTotal ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dept Files Submitted:</span>
                  <span className="font-bold text-slate-800">{dept.deptSubmitted} / {dept.deptTotal}</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>COMPLETION PROGRESS</span>
                    <span>{dept.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${dept.progress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
