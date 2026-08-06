import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Search, ArrowUpRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const DirectorProgressPage = () => {
  const { authFetch } = useAuth();
  const [data, setData] = useState({ faculty: [], invigilators: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('faculty');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await authFetch('http://localhost:8080/api/director/faculty-invigilator-progress');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const getProgressColor = (pct) => {
    if (pct === 100) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  const getProgressBg = (pct) => {
    if (pct === 100) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (pct >= 50) return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  const filteredFaculty = data.faculty.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === 'All' || f.department === deptFilter;
    return matchSearch && matchDept;
  });

  const filteredInvigilators = data.invigilators.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === 'All' || i.departmentCode === deptFilter;
    return matchSearch && matchDept;
  });

  // Calculate high-level stats
  const totalFacultyCount = data.faculty.length;
  const totalInvCount = data.invigilators.length;
  
  const avgFacultyProg = totalFacultyCount > 0 
    ? Math.round(data.faculty.reduce((sum, f) => sum + f.progress, 0) / totalFacultyCount) 
    : 0;

  const avgInvProg = totalInvCount > 0 
    ? Math.round(data.invigilators.reduce((sum, i) => sum + i.progress, 0) / totalInvCount) 
    : 0;

  const uniqueDepts = Array.from(new Set([
    ...data.faculty.map(f => f.department),
    ...data.invigilators.map(i => i.departmentCode)
  ])).filter(Boolean);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Faculty & Invigilator Progress</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Monitor the individual audit submission progress of faculty members and IQAC invigilators.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Faculty</span>
            <Users size={16} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{totalFacultyCount}</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Registered Faculty</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Faculty Progress</span>
            <CheckCircle size={16} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{avgFacultyProg}%</h3>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
            <div className="bg-purple-600 h-1 rounded-full" style={{ width: `${avgFacultyProg}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invigilators</span>
            <Shield size={16} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{totalInvCount}</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Assigned Invigilators</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Dept Progress</span>
            <CheckCircle size={16} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{avgInvProg}%</h3>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${avgInvProg}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Navigation & Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setActiveTab('faculty')}
              className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                activeTab === 'faculty' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              Faculty Progress ({filteredFaculty.length})
            </button>
            <button
              onClick={() => setActiveTab('invigilator')}
              className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                activeTab === 'invigilator' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              Invigilator Progress ({filteredInvigilators.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-700 font-semibold focus:bg-white w-48 transition-all"
              />
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              {uniqueDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'faculty' ? (
          filteredFaculty.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              No faculty found matching the filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFaculty.map(f => (
                <div key={f.id} className="border border-slate-100 rounded-2xl p-4 space-y-4 hover:shadow-md transition-all bg-slate-50/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{f.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Code: {f.code} &bull; Dept: {f.department}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 uppercase border border-blue-100">
                      {f.role}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>File Submissions</span>
                      <span>{f.submittedCount} / {f.expectedCount} Files</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(f.progress)}`}
                        style={{ width: `${f.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-bold mt-1">
                      <span className={`px-2 py-0.5 rounded border ${getProgressBg(f.progress)}`}>
                        {f.progress}% Complete
                      </span>
                      {f.progress === 100 ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle size={10} /> All Submitted
                        </span>
                      ) : f.expectedCount === 0 ? (
                        <span className="text-slate-400">No expected files</span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-0.5">
                          <Clock size={10} /> Pending Uploads
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredInvigilators.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              No invigilators found matching the filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInvigilators.map(i => (
                <div key={i.id} className="border border-slate-100 rounded-2xl p-4 space-y-4 hover:shadow-md transition-all bg-slate-50/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{i.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Assigned Department: {i.department} ({i.departmentCode})</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 uppercase border border-indigo-100">
                      Invigilator
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Department Progress</span>
                      <span>{i.submittedCount} / {i.expectedCount} Expected</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(i.progress)}`}
                        style={{ width: `${i.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-bold mt-1">
                      <span className={`px-2 py-0.5 rounded border ${getProgressBg(i.progress)}`}>
                        {i.progress}% Dept Progress
                      </span>
                      {i.progress === 100 ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle size={10} /> Fully Complete
                        </span>
                      ) : (
                        <span className="text-blue-600 flex items-center gap-0.5">
                          <Clock size={10} /> Audit In Progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DirectorProgressPage;
