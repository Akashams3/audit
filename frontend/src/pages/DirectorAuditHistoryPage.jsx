import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Search, Calendar, FileText, Download, Eye, ShieldCheck, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import IqacCalendarGrid from '../components/IqacCalendarGrid';

const DirectorAuditHistoryPage = () => {
  const { authFetch } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCompletedHistory = async () => {
    setLoading(true);
    try {
      const res = await authFetch('http://localhost:8080/api/director/schedules');
      if (res.ok) {
        const data = await res.json();
        const completed = data.filter(s => s.status === 'AUDIT_COMPLETED');
        setSchedules(completed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedHistory();
  }, []);

  const filtered = schedules.filter(s => {
    const matchYear = !selectedYear || selectedYear === 'ALL' || (s.year && s.year.equalsIgnoreCase ? s.year.equalsIgnoreCase(selectedYear) : s.year === selectedYear);
    const matchSem = !selectedSemester || selectedSemester === 'ALL' || (s.semester && s.semester.equalsIgnoreCase ? s.semester.equalsIgnoreCase(selectedSemester) : s.semester === selectedSemester);
    const matchDept = !selectedDept || selectedDept === 'ALL' || (s.departmentCode && s.departmentCode.equalsIgnoreCase ? s.departmentCode.equalsIgnoreCase(selectedDept) : s.departmentCode === selectedDept);
    const matchSearch = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.departmentCode && s.departmentCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchYear && matchSem && matchDept && matchSearch;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar role="ROLE_DIRECTOR" activeItem="audit-history" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header role="ROLE_DIRECTOR" title="Director Audit History Records" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <History className="text-blue-600" size={20} />
                <span>Audit History & Archived Records</span>
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Inspect read-only historical completed audit schedules and snapshot records saved in database.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-600 flex items-center space-x-1">
                <Filter size={14} className="text-blue-600" />
                <span>Filters:</span>
              </span>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Academic Year Level</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="">All Semesters</option>
                  <option value="Sem 1">Sem 1</option>
                  <option value="Sem 2">Sem 2</option>
                  <option value="Sem 3">Sem 3</option>
                  <option value="Sem 4">Sem 4</option>
                  <option value="Sem 5">Sem 5</option>
                  <option value="Sem 6">Sem 6</option>
                  <option value="Sem 7">Sem 7</option>
                  <option value="Sem 8">Sem 8</option>
                  <option value="ODD">ODD</option>
                  <option value="EVEN">EVEN</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CCE">CCE</option>
                  <option value="CSBS">CSBS</option>
                  <option value="AIDS">AIDS</option>
                  <option value="AIML">AIML</option>
                  <option value="VLSI">VLSI</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-700 font-semibold focus:bg-white w-48 transition-all"
              />
            </div>
          </div>

          {/* History List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Completed Audit Records ({filtered.length})</h3>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <History className="mx-auto text-slate-300 mb-3" size={36} />
                <p className="font-bold">No completed audit history records found for selected filters.</p>
                <p className="text-[10px] text-slate-300 mt-1">Completed audit snapshots will appear here when marked 'Audit Complete'.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(s => (
                  <div key={s.id} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{s.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Dept: <strong className="text-slate-700">{s.departmentCode || 'ALL'}</strong> &bull; Year: <strong className="text-slate-700">{s.year || 'N/A'}</strong> &bull; Sem: <strong className="text-slate-700">{s.semester || 'N/A'}</strong>
                        </span>
                      </div>
                      <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full text-[9px] border border-slate-200">
                        🔒 AUDIT COMPLETED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Audit Date</span>
                        <span className="text-slate-800 font-bold">{s.auditDate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Due Date</span>
                        <span className="text-slate-600 font-bold">{s.dueDate}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span>Historical DB Snapshot</span>
                      <span className="text-slate-400 italic">No Edit / Delete Allowed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DirectorAuditHistoryPage;
