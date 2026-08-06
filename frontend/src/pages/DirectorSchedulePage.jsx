import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Plus, Send, Trash2, CheckCircle, Clock, Edit2, Upload, Sparkles } from 'lucide-react';
import IqacCalendarGrid from '../components/IqacCalendarGrid';

const DirectorSchedulePage = () => {
  const { authFetch } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calSubmitting, setCalSubmitting] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [showCalForm, setShowCalForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    auditDate: '',
    dueDate: '',
    dueTime: '23:59',
    description: '',
    departmentCode: 'ALL',
    auditType: 'ACADEMIC',
    academicPhase: 'FPP'
  });

  const [calForm, setCalForm] = useState({
    academicYear: '2026-27 ODD SEM',
    reopeningDate: '2026-06-09',
    cat1Date: '2026-07-13',
    cat2Date: '2026-08-05',
    cat3Date: '2026-09-01',
    lastWorkingDay: '2026-09-07',
    practicalExamDate: '2026-09-10',
    theoryExamDate: '2026-09-20',
  });

  const [calImageUploading, setCalImageUploading] = useState(false);

  const handleCalendarImageUpload = async (file) => {
    if (!file) return;
    setCalImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch('http://localhost:8080/api/director/academic-calendar/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowCalForm(false);
        fetchAcademicCalendar();
        fetchSchedules();
      } else {
        const err = await res.json();
        alert('Failed to process image: ' + (err.message || 'Unknown error'));
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setCalImageUploading(false);
    }
  };

  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const formatDateValue = (val) => {
    if (!val) return '';
    if (Array.isArray(val)) {
      const y = val[0];
      const m = String(val[1]).padStart(2, '0');
      const d = String(val[2]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof val === 'string') {
      return val.split('T')[0];
    }
    return '';
  };

  const fetchSchedules = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/director/schedules');
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(s => ({
          ...s,
          auditDate: formatDateValue(s.auditDate),
          dueDate: formatDateValue(s.dueDate),
        }));
        setSchedules(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicCalendar = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/director/academic-calendar');
      if (res.ok) {
        const data = await res.json();
        if (data && data.reopeningDate) {
          setAcademicCalendar(data);
          setCalForm({
            academicYear: data.academicYear || '2026-27 ODD SEM',
            reopeningDate: data.reopeningDate,
            cat1Date: data.cat1Date,
            cat2Date: data.cat2Date,
            cat3Date: data.cat3Date,
            lastWorkingDay: data.lastWorkingDay,
            practicalExamDate: data.practicalExamDate,
            theoryExamDate: data.theoryExamDate,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/director/department-summary');
      if (res.ok) setDepartments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchAcademicCalendar();
    fetchDepartments();
  }, []);

  const handleSaveAcademicCalendar = async (e) => {
    e.preventDefault();
    setCalSubmitting(true);
    try {
      const res = await authFetch('http://localhost:8080/api/director/academic-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calForm),
      });

      if (res.ok) {
        setShowCalForm(false);
        fetchAcademicCalendar();
        fetchSchedules();
      } else {
        const err = await res.json();
        alert('Failed to publish Academic Calendar: ' + (err.message || 'Unknown error'));
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setCalSubmitting(false);
    }
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
      const res = await authFetch('http://localhost:8080/api/director/schedules/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert('CSV imported successfully! Audit schedules loaded, Invigilators and HODs notified.');
        setCsvFile(null);
        if (document.getElementById('csv-file-input')) {
          document.getElementById('csv-file-input').value = '';
        }
        fetchSchedules();
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
    const headers = "title,auditDate,dueDate,description,departmentCode,status,auditType\n";
    const row1 = "Annual Academic Audit,2026-07-20,2026-07-28,Audit for CSE department,CSE,PUBLISHED,ACADEMIC\n";
    const row2 = "Interim Department Review,2026-08-05,2026-08-12,Audit for all departments,ALL,DRAFT,ANNUAL\n";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1 + row2);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "sample_audit_schedules.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFormState = () => {
    setForm({ title: '', auditDate: '', dueDate: '', dueTime: '23:59', description: '', departmentCode: 'ALL', auditType: 'ACADEMIC', academicPhase: 'FPP' });
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (s) => {
    setForm({
      title: s.title,
      auditDate: formatDateValue(s.auditDate),
      dueDate: formatDateValue(s.dueDate),
      dueTime: s.dueTime ? s.dueTime.substring(0, 5) : '23:59',
      description: s.description || '',
      departmentCode: s.departmentCode || 'ALL',
      auditType: s.auditType || 'ACADEMIC',
      academicPhase: s.academicPhase || 'FPP'
    });
    setEditId(s.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = isEditing 
        ? `http://localhost:8080/api/director/schedules/${editId}`
        : 'http://localhost:8080/api/director/schedules';
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await authFetch(url, {
        method, body: JSON.stringify(form)
      });
      if (res.ok) {
        resetFormState();
        fetchSchedules();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save schedule.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('Publish this schedule? Both IQAC Invigilators and HODs will be notified via email and in-app notification.')) return;
    try {
      const res = await authFetch(`http://localhost:8080/api/director/schedules/${id}/publish`, { method: 'POST' });
      if (res.ok) { alert('Schedule published! Invigilators and HODs notified.'); fetchSchedules(); }
      else alert('Failed to publish.');
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await authFetch(`http://localhost:8080/api/director/schedules/${id}`, { method: 'DELETE' });
      fetchSchedules();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Academic Calendar & Audit Schedule</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Upload Academic Calendar to auto-generate 10-day FPP, Post CAT & End Sem schedules for all departments. Invigilators & HODs are automatically notified.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCalForm(!showCalForm)}
            className="flex items-center space-x-2 bg-[#0A3D91] hover:bg-[#082E6E] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            <Sparkles size={14} />
            <span>Upload Academic Calendar</span>
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-[#1A56DB] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Academic Calendar Upload & Config Form */}
      {showCalForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Upload / Configure Academic Calendar</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Set key semester dates. The system will auto-allocate 10-day pre-reopening department FPP audits, Post CAT audits, and End Sem audits.
              </p>
            </div>
            <button onClick={() => setShowCalForm(false)} className="text-slate-400 font-bold text-xs">✕</button>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Upload size={16} className="text-[#0A3D91]" />
              <div>
                <p className="text-xs font-bold text-slate-800">Auto-Extract Dates from Calendar Image / PDF (OCR)</p>
                <p className="text-[10px] text-slate-500 font-medium">Upload the Academic Calendar image or PDF file directly to extract dates and auto-generate MySQL schedules.</p>
              </div>
            </div>
            <label className="bg-[#0A3D91] hover:bg-[#082E6E] text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all flex-shrink-0">
              {calImageUploading ? 'Processing OCR...' : 'Choose Image / PDF'}
              <input
                type="file"
                accept="image/*,.pdf,.csv,.txt"
                onChange={(e) => handleCalendarImageUpload(e.target.files[0])}
                className="hidden"
                disabled={calImageUploading}
              />
            </label>
          </div>

          <form onSubmit={handleSaveAcademicCalendar} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Year / Semester *</label>
              <input
                required
                type="text"
                value={calForm.academicYear}
                onChange={(e) => setCalForm({ ...calForm, academicYear: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
                placeholder="e.g. 2026-27 ODD SEMESTER (III & IV Year)"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#0A3D91] uppercase tracking-wider mb-1">Reopening Date * (FPP -10 Days)</label>
              <input
                required
                type="date"
                value={calForm.reopeningDate}
                onChange={(e) => setCalForm({ ...calForm, reopeningDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT I Date *</label>
              <input
                required
                type="date"
                value={calForm.cat1Date}
                onChange={(e) => setCalForm({ ...calForm, cat1Date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT II Date *</label>
              <input
                required
                type="date"
                value={calForm.cat2Date}
                onChange={(e) => setCalForm({ ...calForm, cat2Date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT III Date *</label>
              <input
                required
                type="date"
                value={calForm.cat3Date}
                onChange={(e) => setCalForm({ ...calForm, cat3Date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Last Working Day (LWD) *</label>
              <input
                required
                type="date"
                value={calForm.lastWorkingDay}
                onChange={(e) => setCalForm({ ...calForm, lastWorkingDay: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Practical Exam Date *</label>
              <input
                required
                type="date"
                value={calForm.practicalExamDate}
                onChange={(e) => setCalForm({ ...calForm, practicalExamDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Theory Exam Date *</label>
              <input
                required
                type="date"
                value={calForm.theoryExamDate}
                onChange={(e) => setCalForm({ ...calForm, theoryExamDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCalForm(false)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={calSubmitting}
                className="bg-[#0A3D91] hover:bg-[#082E6E] disabled:bg-slate-200 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all"
              >
                {calSubmitting ? 'Generating & Notifying...' : 'Generate & Publish Audit Calendar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Single Schedule Form */}
      {showForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">{isEditing ? 'Edit Audit Schedule' : 'Create New Schedule'}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
                placeholder="e.g. FPP CSE Department Audit" />
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Department *</label>
                <select
                  required
                  value={form.departmentCode}
                  onChange={e => setForm({ ...form, departmentCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => (
                    <option key={d.departmentId || d.code} value={d.code}>{d.name || d.code} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Type *</label>
                <select
                  required
                  value={form.auditType}
                  onChange={e => setForm({ ...form, auditType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
                >
                  <option value="ACADEMIC">Academic Audit</option>
                  <option value="ANNUAL">Annual Audit</option>
                </select>
              </div>
              {form.auditType === 'ACADEMIC' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Phase *</label>
                  <select
                    value={form.academicPhase}
                    onChange={e => setForm({ ...form, academicPhase: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
                  >
                    <option value="FPP">FPP (10 Days Before Reopening)</option>
                    <option value="POST_CAT">Post CAT Exam</option>
                    <option value="END_SEM">End Semester</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Date *</label>
              <input required type="date" value={form.auditDate} onChange={e => setForm({ ...form, auditDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date *</label>
                <input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Time *</label>
                <input required type="time" value={form.dueTime} onChange={e => setForm({ ...form, dueTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none resize-none focus:border-blue-400 font-semibold"
                placeholder="Optional notes about this audit..." />
            </div>
            <div className="sm:col-span-2 flex items-center space-x-3">
              <button type="submit" disabled={submitting}
                className="bg-[#1A56DB] hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all">
                {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save as Draft'}
              </button>
              <button type="button" onClick={resetFormState}
                className="text-slate-500 hover:text-slate-700 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IQAC Audit Calendar Matrix Component */}
      <IqacCalendarGrid academicCalendar={academicCalendar} schedules={schedules} />

      {/* Schedules List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">All Scheduled Audits ({schedules.length})</h3>
          <div className="flex items-center space-x-2">
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
                className="bg-[#0A3D91] hover:bg-[#082E6E] disabled:bg-slate-200 text-white font-bold py-1 px-3 rounded-lg text-[10px] transition-all"
              >
                {csvUploading ? 'Importing...' : 'Import CSV'}
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
            <CalendarDays className="mx-auto text-slate-300 mb-3" size={36} />
            <p className="text-slate-400 text-sm font-semibold">No schedules created yet.</p>
            <p className="text-slate-300 text-xs mt-1">Upload Academic Calendar or click "New Schedule" to start.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((s) => (
              <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{s.title}</p>
                      {s.academicPhase && (
                        <span className="inline-block bg-yellow-100 text-yellow-900 text-[9px] font-extrabold px-2 py-0.5 rounded mt-1">
                          Phase: {s.academicPhase}
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                      s.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {s.status === 'PUBLISHED' ? <span className="flex items-center gap-1"><CheckCircle size={10} /> Published</span> : <span className="flex items-center gap-1"><Clock size={10} /> Draft</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Audit Date</span>
                      <span className="text-slate-800 font-bold">{s.auditDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Due Date</span>
                      <span className="text-rose-600 font-bold">{s.dueDate} @ {s.dueTime ? s.dueTime.substring(0, 5) : '23:59'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Target Department</span>
                      <span className="text-blue-700 font-bold uppercase">{s.departmentCode || 'ALL'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Audit Type</span>
                      <span className="text-purple-700 font-bold uppercase">{s.auditType || 'ACADEMIC'}</span>
                    </div>
                  </div>

                  {s.description && <p className="text-[10px] text-slate-400 font-medium mt-2">{s.description}</p>}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-50">
                  {s.status === 'DRAFT' && (
                    <button onClick={() => handlePublish(s.id)}
                      className="flex items-center space-x-1 bg-[#0B1E3F] hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all">
                      <Send size= {11} />
                      <span>Publish & Notify</span>
                    </button>
                  )}
                  <button onClick={() => startEdit(s)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all"
                    title="Edit Schedule"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectorSchedulePage;
