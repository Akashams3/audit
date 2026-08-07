import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Play, CheckCircle2, AlertCircle, FileText, Calendar, Filter, Sparkles } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getDisplayFileName } from '../utils/formatUtils';
import { isFppDocument } from '../utils/fppUtils';

const DirectorAuditStagePage = () => {
  const { authFetch } = useAuth();
  const [selectedStage, setSelectedStage] = useState('FPP');
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [year, setYear] = useState('1st Year');
  const [semester, setSemester] = useState('ODD');

  const [triggeringStage, setTriggeringStage] = useState(false);
  const [clearingStage, setClearingStage] = useState(false);
  const [activeFiles, setActiveFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeYear, setCompleteYear] = useState('1st Year');
  const [completeSem, setCompleteSem] = useState('Sem 1');

  const fetchActiveFiles = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`http://localhost:8080/api/director/required-files?stage=${selectedStage}&year=${encodeURIComponent(year)}&academicYear=${encodeURIComponent(academicYear)}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = data;
        if (selectedStage === 'FPP') {
          filtered = data.filter(isFppDocument);
        }
        setActiveFiles(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveFiles();
  }, [selectedStage, academicYear, year]);

  const [bannerMsg, setBannerMsg] = useState({ text: '', type: '' });

  const handleStartAuditStage = async () => {
    setTriggeringStage(true);
    setBannerMsg({ text: '', type: '' });
    try {
      const res = await authFetch('http://localhost:8080/api/director/trigger-audit-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: selectedStage,
          academicYear,
          year,
          semester
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBannerMsg({ text: data.message || `Audit stage '${selectedStage}' started successfully!`, type: 'success' });
        fetchActiveFiles();
      } else {
        const errData = await res.json();
        setBannerMsg({ text: errData.message || 'Cannot start audit stage: No audit schedule found for the selected parameters.', type: 'error' });
      }
    } catch (e) {
      setBannerMsg({ text: 'Error: ' + e.message, type: 'error' });
    } finally {
      setTriggeringStage(false);
    }
  };

  const handleAuditCompleteSubmit = async (e) => {
    if (e) e.preventDefault();
    setClearingStage(true);
    setBannerMsg({ text: '', type: '' });
    try {
      const res = await authFetch('http://localhost:8080/api/director/clear-required-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear,
          year: completeYear,
          semester: completeSem
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBannerMsg({ text: data.message || `Audit Complete! Snapshot saved in DB for ${completeYear}, ${completeSem}. Active view cleared.`, type: 'success' });
        setShowCompleteModal(false);
        fetchActiveFiles();
      } else {
        setBannerMsg({ text: 'Failed to complete audit stage.', type: 'error' });
      }
    } catch (e) {
      setBannerMsg({ text: 'Error: ' + e.message, type: 'error' });
    } finally {
      setClearingStage(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar role="ROLE_DIRECTOR" activeItem="audit-stage" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header role="ROLE_DIRECTOR" title="Director Audit Stage Control" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Description */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <Sparkles className="text-blue-600" size={20} />
              <span>Director Audit Stage & Lifecycle Control</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Select the Audit Stage, Academic Year, Year, and Semester to activate required files and trigger audit phases across all departments.
            </p>
          </div>

          {bannerMsg.text && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 border ${bannerMsg.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{bannerMsg.text}</span>
            </div>
          )}

          {/* Start Audit Control Card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white rounded-2xl p-6 shadow-xl border border-blue-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 block">Stage Activation Panel</span>
                <h3 className="text-base font-bold text-white mt-0.5">Start New Audit Stage</h3>
              </div>
              <button
                onClick={() => setShowCompleteModal(true)}
                disabled={clearingStage}
                className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer self-start md:self-auto"
              >
                <CheckCircle2 size={15} />
                <span>Audit Complete (Save DB & Clear List)</span>
              </button>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">1. Select Audit Stage</label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full bg-white/10 text-white font-bold text-xs px-3 py-2.5 rounded-xl border border-white/20 outline-none cursor-pointer focus:bg-slate-800"
                >
                  <option value="FPP" className="bg-slate-900 text-white">1. Start FPP Audit Stage</option>
                  <option value="POST_CAT_1" className="bg-slate-900 text-white">2. Start Post CAT 1 Audit Stage</option>
                  <option value="POST_CAT_2" className="bg-slate-900 text-white">3. Start Post CAT 2 Audit Stage</option>
                  <option value="POST_CAT_3" className="bg-slate-900 text-white">4. Start Post CAT 3 / End Sem Audit Stage</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">2. Academic Year</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-white/10 text-white font-bold text-xs px-3 py-2.5 rounded-xl border border-white/20 outline-none cursor-pointer focus:bg-slate-800"
                >
                  <option value="2026-27" className="bg-slate-900 text-white">2026-27</option>
                  <option value="2025-26" className="bg-slate-900 text-white">2025-26</option>
                  <option value="2024-25" className="bg-slate-900 text-white">2024-25</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">3. Academic Year Level</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-white/10 text-white font-bold text-xs px-3 py-2.5 rounded-xl border border-white/20 outline-none cursor-pointer focus:bg-slate-800"
                >
                  <option value="1st Year" className="bg-slate-900 text-white">1st Year</option>
                  <option value="2nd Year" className="bg-slate-900 text-white">2nd Year</option>
                  <option value="3rd Year" className="bg-slate-900 text-white">3rd Year</option>
                  <option value="4th Year" className="bg-slate-900 text-white">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">4. Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full bg-white/10 text-white font-bold text-xs px-3 py-2.5 rounded-xl border border-white/20 outline-none cursor-pointer focus:bg-slate-800"
                >
                  <option value="ODD" className="bg-slate-900 text-white">ODD Semester</option>
                  <option value="EVEN" className="bg-slate-900 text-white">EVEN Semester</option>
                  <option value="Sem 1" className="bg-slate-900 text-white">Sem 1</option>
                  <option value="Sem 2" className="bg-slate-900 text-white">Sem 2</option>
                  <option value="Sem 3" className="bg-slate-900 text-white">Sem 3</option>
                  <option value="Sem 4" className="bg-slate-900 text-white">Sem 4</option>
                  <option value="Sem 5" className="bg-slate-900 text-white">Sem 5</option>
                  <option value="Sem 6" className="bg-slate-900 text-white">Sem 6</option>
                  <option value="Sem 7" className="bg-slate-900 text-white">Sem 7</option>
                  <option value="Sem 8" className="bg-slate-900 text-white">Sem 8</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleStartAuditStage}
                disabled={triggeringStage}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2 cursor-pointer"
              >
                <Play size={16} />
                <span>{triggeringStage ? 'Activating Audit Stage...' : 'Start Selected Audit Stage'}</span>
              </button>
            </div>
          </div>

          {/* Active Required Files Overview */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Active Activated Required Files ({activeFiles.length})</h3>
                <p className="text-xs text-slate-400 font-semibold">Currently populated files visible for faculty upload.</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : activeFiles.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-slate-400 text-sm font-semibold">No required files activated yet. Click "Start Selected Audit Stage" above to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                      <th className="py-3 px-2">Document Name</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Target Role</th>
                      <th className="py-3 px-2">Mandatory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFiles.map(f => (
                      <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-2 font-bold text-slate-800">{getDisplayFileName(f.fileName)}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${f.fileCategory === 'ACADEMIC' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                            {f.fileCategory}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-semibold text-slate-600">{f.targetRole ? f.targetRole.name : 'Everyone'}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${f.mandatory ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'}`}>
                            {f.mandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Complete Snapshot Modal */}
          {showCompleteModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4 animate-fade-in">
                <h3 className="font-bold text-slate-800 text-base">Complete Audit & Save DB Snapshot</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Select the Year and Semester to permanently tag the audit schedules and academic calendar in MySQL DB before clearing active view.
                </p>
                <form onSubmit={handleAuditCompleteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Year Level</label>
                    <select
                      value={completeYear}
                      onChange={(e) => setCompleteYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Semester</label>
                    <select
                      value={completeSem}
                      onChange={(e) => setCompleteSem(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    >
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

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCompleteModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={clearingStage}
                      className="px-5 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md disabled:bg-slate-300"
                    >
                      {clearingStage ? 'Saving to DB...' : 'Save to DB & Clear Active View'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DirectorAuditStagePage;
