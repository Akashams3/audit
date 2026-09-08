import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useYearFilteredApi from '../hooks/useYearFilteredApi';
import { CalendarDays, Plus, Send, Trash2, CheckCircle, Clock, Edit2, Upload, Sparkles, LayoutGrid, TableProperties } from 'lucide-react';
import VisualCalendarMatrix from '../components/VisualCalendarMatrix';

const DirectorSchedulePage = () => {
  const { authFetch } = useAuth();
  const { selectedAcademicYear, selectedStudyYear, buildYearParams } = useYearFilteredApi();
  
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'timetable'

  const [schedules, setSchedules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [generatedDates, setGeneratedDates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calSubmitting, setCalSubmitting] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
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
    academicPhase: 'FPP',
    year: 'ALL',
    semester: 'ALL',
    academicType: 'Assigned Individual'
  });

  const [calForm, setCalForm] = useState({
    academicYear: `${selectedAcademicYear} ODD SEM`,
    reopeningDate: '2026-06-09',
    cat1Date: '2026-07-13',
    cat1EndDate: '2026-07-20',
    cat2Date: '2026-08-05',
    cat2EndDate: '2026-08-12',
    cat3Date: '2026-09-01',
    cat3EndDate: '2026-09-08',
    lastWorkingDay: '2026-09-07',
    practicalExamDate: '2026-09-10',
    theoryExamDate: '2026-09-20',
  });

  useEffect(() => {
    setCalForm(prev => ({ ...prev, academicYear: `${selectedAcademicYear} ODD SEM` }));
  }, [selectedAcademicYear]);

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
      const res = await authFetch(`http://localhost:8080/api/director/schedules${buildYearParams()}`);
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
      const res = await authFetch(`http://localhost:8080/api/director/academic-calendar${buildYearParams()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.reopeningDate) {
          setAcademicCalendar(data);
          setCalForm({
            academicYear: data.academicYear || '2026-27 ODD SEM',
            reopeningDate: data.reopeningDate,
            cat1Date: data.cat1Date,
            cat1EndDate: data.cat1EndDate || data.cat1Date,
            cat2Date: data.cat2Date,
            cat2EndDate: data.cat2EndDate || data.cat2Date,
            cat3Date: data.cat3Date,
            cat3EndDate: data.cat3EndDate || data.cat3Date,
            lastWorkingDay: data.lastWorkingDay,
            practicalExamDate: data.practicalExamDate,
            theoryExamDate: data.theoryExamDate,
          });
          
          if (data.gridDataJson) {
             try {
                 setGeneratedDates(JSON.parse(data.gridDataJson));
             } catch(e) {
                 setGeneratedDates([]);
             }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await authFetch(`http://localhost:8080/api/director/department-summary${buildYearParams()}`);
      if (res.ok) setDepartments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchAcademicCalendar();
    fetchDepartments();
  }, [selectedAcademicYear, selectedStudyYear]);

  const handleSaveAcademicCalendar = async (e) => {
    e.preventDefault();
    setCalSubmitting(true);
    try {
      const res = await authFetch('http://localhost:8080/api/director/academic-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...calForm,
          year: selectedStudyYear !== 'ALL' && selectedStudyYear ? selectedStudyYear : '1st Year',
          semester: calForm.academicYear.toUpperCase().includes('ODD') ? 'ODD' : 'EVEN'
        }),
      });

      if (res.ok) {
        fetchAcademicCalendar();
        alert('Schedule Grid generated successfully!');
      } else {
        const err = await res.json();
        alert('Failed to generate Schedule Grid: ' + (err.message || 'Unknown error'));
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setCalSubmitting(false);
    }
  };

  const resetFormState = () => {
    setForm({ 
       title: '', auditDate: '', dueDate: '', dueTime: '23:59', description: '', 
       departmentCode: 'ALL', auditType: 'ACADEMIC', academicPhase: 'FPP',
       year: 'ALL', semester: 'ALL', academicType: 'Assigned Individual'
    });
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
      academicPhase: s.academicPhase || 'FPP',
      year: s.year || 'ALL',
      semester: s.semester || 'ALL',
      academicType: s.academicType || 'Assigned Individual'
    });
    setEditId(s.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDateSelect = (e) => {
     const selectedDate = e.target.value;
     const match = generatedDates.find(d => d.date === selectedDate);
     let phase = 'FPP';
     if(match) {
         if(match.type === 'FPP') phase = 'FPP';
         else if(match.type === 'Post-CAT 1') phase = 'POST_CAT_1';
         else if(match.type === 'Post-CAT 2') phase = 'POST_CAT_2';
         else if(match.type === 'End Semester') phase = 'END_SEM';
     }
     setForm({ ...form, auditDate: selectedDate, academicPhase: phase });
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

  const getPhaseColor = (type) => {
      switch(type) {
          case 'FPP': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'Post-CAT 1': return 'bg-amber-100 text-amber-800 border-amber-200';
          case 'Post-CAT 2': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
          case 'End Semester': return 'bg-purple-100 text-purple-800 border-purple-200';
          default: return 'bg-slate-100 text-slate-800 border-slate-200';
      }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Academic Calendar & Audit Schedule</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Generate working days using the Schedule Grid, and assign tasks in the Schedule Timetable.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
          <button 
             onClick={() => setActiveTab('grid')}
             className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'grid' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
             <LayoutGrid size={16} />
             <span>Schedule Grid</span>
          </button>
          <button 
             onClick={() => setActiveTab('timetable')}
             className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'timetable' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
             <TableProperties size={16} />
             <span>Schedule Timetable</span>
          </button>
      </div>

      {activeTab === 'grid' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center space-x-2">
                      <Sparkles size={16} className="text-blue-500" />
                      <span>Academic Dates Setup</span>
                  </h3>
                  <form onSubmit={handleSaveAcademicCalendar} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Year</label>
                        <input value={calForm.academicYear} onChange={e => setCalForm({...calForm, academicYear: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reopening Date</label>
                        <input type="date" value={calForm.reopeningDate} onChange={e => setCalForm({...calForm, reopeningDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CAT 1 Start</label>
                        <input type="date" value={calForm.cat1Date} onChange={e => setCalForm({...calForm, cat1Date: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CAT 1 End</label>
                        <input type="date" value={calForm.cat1EndDate} onChange={e => setCalForm({...calForm, cat1EndDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CAT 2 Start</label>
                        <input type="date" value={calForm.cat2Date} onChange={e => setCalForm({...calForm, cat2Date: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CAT 2 End</label>
                        <input type="date" value={calForm.cat2EndDate} onChange={e => setCalForm({...calForm, cat2EndDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CAT 3 Start</label>
                        <input type="date" value={calForm.cat3Date} onChange={e => setCalForm({...calForm, cat3Date: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CAT 3 End</label>
                        <input type="date" value={calForm.cat3EndDate} onChange={e => setCalForm({...calForm, cat3EndDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Working Day</label>
                        <input type="date" value={calForm.lastWorkingDay} onChange={e => setCalForm({...calForm, lastWorkingDay: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Practical Exam</label>
                        <input type="date" value={calForm.practicalExamDate} onChange={e => setCalForm({...calForm, practicalExamDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Theory Exam</label>
                        <input type="date" value={calForm.theoryExamDate} onChange={e => setCalForm({...calForm, theoryExamDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none" required />
                      </div>
                      
                      <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end mt-2">
                          <button type="submit" disabled={calSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md">
                            {calSubmitting ? 'Generating...' : 'Generate Schedule Grid'}
                          </button>
                      </div>
                  </form>
              </div>

              {/* Visual Calendar Matrix */}
              {academicCalendar && academicCalendar.reopeningDate && (
                  <VisualCalendarMatrix academicCalendar={academicCalendar} generatedDates={generatedDates} schedules={schedules} />
              )}
          </div>
      )}

      {activeTab === 'timetable' && (
          <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Schedule Timetable</h3>
                  <button onClick={() => { resetFormState(); setShowForm(!showForm); }}
                      className="bg-[#0A3D91] hover:bg-[#082E6E] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center space-x-1 shadow-sm">
                      <Plus size={14} /> <span>{showForm ? 'Cancel Entry' : 'New Schedule Entry'}</span>
                  </button>
              </div>

              {/* Manual Single Schedule Form */}
              {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md relative">
                  <button onClick={resetFormState} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
                  <h3 className="font-bold text-slate-800 text-sm mb-4">{isEditing ? 'Edit Schedule Entry' : 'Create New Schedule Entry'}</h3>
                  <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title *</label>
                      <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400"
                        placeholder="e.g. FPP CSE Department Audit" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Date (Generated) *</label>
                      <select required value={form.auditDate} onChange={handleDateSelect}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400">
                         <option value="" disabled>Select a date</option>
                         {generatedDates.map(d => (
                            <option key={d.date} value={d.date}>{d.date} ({d.type})</option>
                         ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Department *</label>
                      <select required value={form.departmentCode} onChange={e => setForm({ ...form, departmentCode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400">
                        <option value="ALL">All Departments</option>
                        {departments.map(d => (
                          <option key={d.departmentId || d.code} value={d.code}>{d.name || d.code} ({d.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Phase *</label>
                        <select value={form.academicPhase} onChange={e => setForm({ ...form, academicPhase: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400">
                            <option value="FPP">FPP</option>
                            <option value="POST_CAT_1">Post CAT 1</option>
                            <option value="POST_CAT_2">Post CAT 2</option>
                            <option value="END_SEM">End Semester</option>
                            <option value="NC_CLOSING">N.C Closing</option>
                            <option value="DEAN_MEETING">Meeting with Deans</option>
                            <option value="COORDINATOR_MEETING">Meeting with IQAC Coordinator</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year Level</label>
                        <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400">
                            <option value="ALL">ALL</option>
                            <option value="I Year">I Year</option>
                            <option value="II Year">II Year</option>
                            <option value="III Year">III Year</option>
                            <option value="IV Year">IV Year</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Type</label>
                        <input value={form.academicType} onChange={e => setForm({ ...form, academicType: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400"
                            placeholder="e.g. Assigned Individual" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date *</label>
                        <input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400" />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                      <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none resize-none focus:border-blue-400"
                        placeholder="Optional notes..." />
                    </div>
                    
                    <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end mt-2 space-x-3">
                      <button type="button" onClick={resetFormState}
                        className="text-slate-500 hover:text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all">
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md">
                        {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Entry'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Schedules List Display */}
              {loading ? (
                <div className="py-12 flex justify-center">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : schedules.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
                  <CalendarDays className="mx-auto text-slate-300 mb-3" size={36} />
                  <p className="text-slate-400 text-sm font-semibold">No timetable entries yet.</p>
                  <p className="text-slate-300 text-xs mt-1">Generate a schedule grid and create assignments here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schedules.map((s) => (
                    <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{s.title}</p>
                            {s.academicPhase && (
                              <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-extrabold px-2 py-0.5 rounded mt-1 mr-1 border border-slate-200 uppercase">
                                Phase: {s.academicPhase}
                              </span>
                            )}
                            {s.year && s.year !== 'ALL' && (
                                <span className="inline-block bg-blue-50 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded mt-1 border border-blue-100 uppercase">
                                  {s.year}
                                </span>
                            )}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                            s.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {s.status === 'PUBLISHED' ? <span className="flex items-center gap-1"><CheckCircle size={10} /> Published</span> : <span className="flex items-center gap-1"><Clock size={10} /> Draft</span>}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-semibold text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Audit Date</span>
                            <span className="text-slate-800 font-bold">{s.auditDate}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Target Dept</span>
                            <span className="text-blue-700 font-bold uppercase">{s.departmentCode || 'ALL'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Type</span>
                            <span className="text-purple-700 font-bold capitalize">{s.academicType || 'Standard'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Due Date</span>
                            <span className="text-rose-600 font-bold">{s.dueDate}</span>
                          </div>
                        </div>

                        {s.description && <p className="text-[10px] text-slate-500 font-medium mt-3 border-t border-slate-100 pt-2">{s.description}</p>}
                      </div>

                      {s.status !== 'AUDIT_COMPLETED' && (
                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-50 mt-2">
                          {s.status === 'DRAFT' && (
                            <button onClick={() => handlePublish(s.id)}
                              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all">
                              <Send size={11} />
                              <span>Publish</span>
                            </button>
                          )}
                          <button onClick={() => startEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all"
                            title="Edit Entry"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all"
                            title="Delete Entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
      )}
    </div>
  );
};

export default DirectorSchedulePage;
