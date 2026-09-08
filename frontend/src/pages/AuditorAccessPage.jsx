import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Mail, Shield, CheckCircle } from 'lucide-react';

const AuditorAccessPage = () => {
  const { authFetch } = useAuth();
  const [auditor, setAuditor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAuditorInfo = async () => {
    try {
      setLoading(true);
      // Fetch director details as the main auditor
      const res = await authFetch('http://localhost:8080/api/director/users');
      if (res.ok) {
        const data = await res.json();
        const dir = data.find(u => u.role === 'ROLE_DIRECTOR');
        setAuditor(dir);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditorInfo();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Auditor Access Control</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Auditor Access</p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <ShieldCheck className="text-blue-600" size={18} />
              <h3 className="font-bold text-slate-800 text-sm">Active Auditor Accounts</h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                    AD
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{auditor?.name || 'Dr. Director'}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{auditor?.email || 'director@iqac.edu'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[10px] font-bold">
                  <span className="bg-purple-50 border border-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">
                    Director / Auditor
                  </span>
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 text-xs font-medium text-slate-600">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-3">Auditor Permissions</h3>
            <div className="space-y-2">
              <p className="flex items-center space-x-1.5 text-slate-500">
                <CheckCircle size={13} className="text-emerald-500" />
                <span>View course submissions in real-time</span>
              </p>
              <p className="flex items-center space-x-1.5 text-slate-500">
                <CheckCircle size={13} className="text-emerald-500" />
                <span>View department summary reports</span>
              </p>
              <p className="flex items-center space-x-1.5 text-slate-500">
                <CheckCircle size={13} className="text-emerald-500" />
                <span>Add review feedback / comment flags</span>
              </p>
              <p className="flex items-center space-x-1.5 text-slate-500">
                <CheckCircle size={13} className="text-emerald-500" />
                <span>Complete and lock audit process</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditorAccessPage;
