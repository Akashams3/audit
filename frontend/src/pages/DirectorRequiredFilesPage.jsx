import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, Trash2, BookOpen, FolderOpen, Edit2 } from 'lucide-react';
import { getDisplayFileName } from '../utils/formatUtils';
import { isFppDocument } from '../utils/fppUtils';

const DirectorRequiredFilesPage = () => {
  const { authFetch } = useAuth();
  const [files, setFiles] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ fileName: '', fileCategory: 'ACADEMIC', description: '', mandatory: true, targetRoleId: '' });
  const [activeTab, setActiveTab] = useState('ALL');
  const [roles, setRoles] = useState([]);
  
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const [selectedStageFilter, setSelectedStageFilter] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8080/api/director/required-files';
      const query = [];
      if (selectedStageFilter) query.push(`stage=${selectedStageFilter}`);
      if (selectedYearFilter) query.push(`year=${selectedYearFilter}`);
      if (selectedSemesterFilter) query.push(`semester=${selectedSemesterFilter}`);
      if (query.length > 0) url += `?${query.join('&')}`;

      const res = await authFetch(url);
      if (res.ok) setFiles(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/director/faculty-roles');
      if (res.ok) setRoles(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchCalendar = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/director/academic-calendar');
      if (res.ok) setAcademicCalendar(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchFiles();
    fetchRoles();
    fetchCalendar();
  }, [selectedStageFilter, selectedYearFilter, selectedSemesterFilter]);

  const resetFormState = () => {
    setForm({ fileName: '', fileCategory: 'ACADEMIC', description: '', mandatory: true, targetRoleId: '' });
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (f) => {
    setForm({
      fileName: f.fileName,
      fileCategory: f.fileCategory,
      description: f.description || '',
      mandatory: f.mandatory,
      targetRoleId: f.targetRole ? f.targetRole.id : ''
    });
    setEditId(f.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = isEditing
        ? `http://localhost:8080/api/director/required-files/${editId}`
        : 'http://localhost:8080/api/director/required-files';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method, body: JSON.stringify({ ...form, mandatory: form.mandatory.toString() })
      });
      if (res.ok) {
        alert(isEditing ? 'Required file updated!' : 'Required file added! All invigilators have been notified.');
        resetFormState();
        fetchFiles();
      } else alert('Failed to save required file.');
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this required file?')) return;
    try {
      await authFetch(`http://localhost:8080/api/director/required-files/${id}`, { method: 'DELETE' });
      fetchFiles();
    } catch (e) { alert(e.message); }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Please select a CSV file first.');
      return;
    }
    setCsvUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await authFetch('http://localhost:8080/api/director/required-files/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert('CSV imported successfully! Required files defined and loaded.');
        setCsvFile(null);
        if (document.getElementById('csv-file-input')) {
          document.getElementById('csv-file-input').value = '';
        }
        fetchFiles();
      } else {
        const errData = await res.json();
        alert('CSV Import failed: ' + (errData.message || 'Unknown error'));
      }
    } catch (e) {
      alert('Error importing CSV: ' + e.message);
    } finally {
      setCsvUploading(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const headers = "fileName,fileCategory,description,mandatory,targetRole\n";
    const row1 = "Syllabus,COURSE,Course syllabus details,true,Everyone\n";
    const row2 = "Lesson Plan,COURSE,Weekly lesson plan details,true,Class Incharge\n";
    const row3 = "Department Budget,DEPARTMENT,Annual department budget details,false,Project Manager\n";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1 + row2 + row3);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "sample_required_files.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [selectedStage, setSelectedStage] = useState('FPP');
  const [triggeringStage, setTriggeringStage] = useState(false);
  const [clearingStage, setClearingStage] = useState(false);

  const handleTriggerAuditStage = async () => {
    if (!window.confirm(`Populate required files for '${selectedStage}' audit? Existing required files will be updated to prevent duplication.`)) return;
    setTriggeringStage(true);
    try {
      const res = await authFetch('http://localhost:8080/api/director/trigger-audit-stage', {
        method: 'POST',
        body: JSON.stringify({ stage: selectedStage })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || `Audit stage '${selectedStage}' started successfully!`);
        if (selectedStage === 'FPP') {
          setActiveTab('fpp');
        } else {
          setActiveTab('ALL');
        }
        fetchFiles();
      } else {
        alert('Failed to start audit stage.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setTriggeringStage(false);
    }
  };

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeYear, setCompleteYear] = useState('1st Year');
  const [completeSem, setCompleteSem] = useState('Sem 1');

  const handleAuditCompleteSubmit = async (e) => {
    if (e) e.preventDefault();
    setClearingStage(true);
    try {
      const res = await authFetch('http://localhost:8080/api/director/clear-required-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: completeYear, semester: completeSem })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || `Audit Complete! Audit Schedule & Calendar saved in DB for ${completeYear}, ${completeSem}. Active view cleared.`);
        setShowCompleteModal(false);
        fetchFiles();
      } else {
        alert('Failed to complete audit.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setClearingStage(false);
    }
  };

  const allCount = files.length;
  const fppCount = files.filter(isFppDocument).length;
  const academicCount = files.filter(f => f.fileCategory === 'ACADEMIC' && !isFppDocument(f)).length;
  const deptCount = files.filter(f => f.fileCategory === 'DEPARTMENT').length;

  const filtered = activeTab === 'ALL'
    ? files
    : activeTab === 'fpp'
    ? files.filter(isFppDocument)
    : activeTab === 'ACADEMIC'
    ? files.filter(f => f.fileCategory === 'ACADEMIC' && !isFppDocument(f))
    : files.filter(f => f.fileCategory === activeTab);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Required Files Master Definition</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage master required files, roles, and mandatory criteria. To activate audit stages and clear active views, use the Director Audit Stage Control tab.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleCsvUpload} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
            <input
              type="file"
              id="csv-file-input"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="text-[10px] text-slate-500 font-semibold file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              disabled={csvUploading}
              className="bg-[#0A3D91] hover:bg-[#082E6E] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-1 px-3 rounded-lg text-[10px] transition-all"
            >
              {csvUploading ? 'Importing...' : 'Import CSV'}
            </button>
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="text-blue-600 hover:text-blue-700 font-extrabold text-[10px] px-1 hover:underline transition-all"
              title="Download format sample CSV"
            >
              Sample CSV
            </button>
          </form>

          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-[#1A56DB] hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all">
            <Plus size={14} />
            <span>Add Required File</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">{isEditing ? 'Edit Required File' : 'Add Required File'}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">File Name / Document Name *</label>
              <input required value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400"
                placeholder="e.g. Course Outcome Attainment Report" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:col-span-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category *</label>
                <select value={form.fileCategory} onChange={e => setForm({ ...form, fileCategory: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400">
                  <option value="ACADEMIC">Academic File</option>
                  <option value="DEPARTMENT">Department File</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mandatory</label>
                <select value={form.mandatory.toString()} onChange={e => setForm({ ...form, mandatory: e.target.value === 'true' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400">
                  <option value="true">Yes - Mandatory</option>
                  <option value="false">No - Optional</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Role *</label>
                <select value={form.targetRoleId} onChange={e => setForm({ ...form, targetRoleId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold">
                  <option value="">Everyone</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none resize-none focus:border-blue-400"
                placeholder="Brief description of what this file should contain..." />
            </div>
            <div className="sm:col-span-2 flex items-center space-x-3">
              <button type="submit" disabled={submitting}
                className="bg-[#1A56DB] hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all">
                {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add & Notify Invigilators'}
              </button>
              <button type="button" onClick={resetFormState}
                className="text-slate-500 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-6 border-b border-slate-100 pb-3">
          {['ALL', 'ACADEMIC', 'DEPARTMENT', 'fpp'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold pb-1 transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab === 'ALL' ? `All (${allCount})` : tab === 'ACADEMIC' ? `Academic Files (${academicCount})` : tab === 'DEPARTMENT' ? `Department Files (${deptCount})` : `FPP Files (${fppCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-slate-400 text-sm font-semibold">No required files defined yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                  <th className="py-3 px-2">File / Document Name</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Target Role</th>
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2">Mandatory</th>
                  <th className="py-3 px-2 text-right">Action</th>
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
                    <td className="py-3.5 px-2 text-slate-500 max-w-[200px] truncate">{f.description || '—'}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${f.mandatory ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'}`}>
                        {f.mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => startEdit(f)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all"
                          title="Edit Required File"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(f.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all">
                          <Trash2 size={13} />
                        </button>
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
  );
};

export default DirectorRequiredFilesPage;
