import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, FolderOpen, FileText } from 'lucide-react';
import { getDisplayFileName } from '../utils/formatUtils';
import { isFppDocument } from '../utils/fppUtils';

const FacultyRequiredFilesPage = () => {
  const { authFetch } = useAuth();
  const [files, setFiles] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const [selectedStageFilter, setSelectedStageFilter] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        let url = 'http://localhost:8080/api/faculty/required-files';
        const query = [];
        if (selectedStageFilter) query.push(`stage=${selectedStageFilter}`);
        if (selectedYearFilter) query.push(`year=${selectedYearFilter}`);
        if (selectedSemesterFilter) query.push(`semester=${selectedSemesterFilter}`);
        if (query.length > 0) url += `?${query.join('&')}`;

        const res = await authFetch(url);
        if (res.ok) setFiles(await res.json());
        const calRes = await authFetch('http://localhost:8080/api/director/academic-calendar');
        if (calRes.ok) setAcademicCalendar(await calRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [selectedStageFilter, selectedYearFilter, selectedSemesterFilter]);

  const fppCount = files.filter(isFppDocument).length;

  const filtered = activeTab === 'ALL'
    ? files
    : activeTab === 'fpp'
    ? files.filter(isFppDocument)
    : activeTab === 'ACADEMIC'
    ? files.filter(f => f.fileCategory === 'ACADEMIC' || f.fileCategory === 'COURSE')
    : files.filter(f => f.fileCategory === activeTab);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Required Audit Files</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Files required by the IQAC Director for the audit. Please ensure all mandatory files are submitted.</p>
        </div>

        {/* Filter Dropdowns for Stage, Year, and Semester */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Stage</label>
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="">All Stages</option>
              <option value="FPP">FPP</option>
              <option value="POST_CAT_1">Post CAT 1</option>
              <option value="POST_CAT_2">Post CAT 2</option>
              <option value="POST_CAT_3">Post CAT 3 / End Sem</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Year</label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none"
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
              value={selectedSemesterFilter}
              onChange={(e) => setSelectedSemesterFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none"
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
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-6 border-b border-slate-100 pb-3">
          {['ALL', 'ACADEMIC', 'DEPARTMENT', 'fpp'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold pb-1 transition-all ${activeTab === tab ? 'text-[#0A3D91] border-b-2 border-[#0A3D91]' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab === 'ALL' ? `All (${files.length})` : tab === 'ACADEMIC' ? `Academic Files (${files.filter(f => f.fileCategory === 'ACADEMIC' || f.fileCategory === 'COURSE').length})` : tab === 'DEPARTMENT' ? `Department Files (${files.filter(f => f.fileCategory === 'DEPARTMENT').length})` : `FPP Files (${fppCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 border-4 border-[#0A3D91] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-slate-400 text-sm font-semibold">No required files found for selected filters.</p>
            <p className="text-slate-300 text-xs mt-1">If audit is completed, active files are hidden from active display while preserved in database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                  <th className="py-3 px-2">File / Document Name</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Required For</th>
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2">Mandatory</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center space-x-2">
                        {(f.fileCategory === 'ACADEMIC' || f.fileCategory === 'COURSE')
                          ? <BookOpen size={13} className="text-blue-500 flex-shrink-0" />
                          : <FolderOpen size={13} className="text-orange-500 flex-shrink-0" />}
                        <span className="font-bold text-slate-800">{getDisplayFileName(f.fileName, academicCalendar)}</span>
                        {f.isXFile && <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded ml-1.5">(X)</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${(f.fileCategory === 'ACADEMIC' || f.fileCategory === 'COURSE') ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                        {(f.fileCategory === 'ACADEMIC' || f.fileCategory === 'COURSE') ? 'Academic File' : 'Department File'}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      {f.targetRole ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {f.targetRole.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-400">
                          Everyone
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-slate-500">{f.description || '—'}</td>
                    <td className="py-3.5 px-2">
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
    </div>
  );
};

export default FacultyRequiredFilesPage;
