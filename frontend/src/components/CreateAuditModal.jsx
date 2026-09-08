import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../api/api';
import { useAcademicYear } from '../context/AcademicYearContext';
import { Upload, Sparkles, Plus } from 'lucide-react';

const CreateAuditModal = ({ isOpen, onClose, onAuditCreated, invigilators = [], departments = [], academicCalendar = null }) => {
  if (!isOpen) return null;

  const { selectedAcademicYear } = useAcademicYear();

  const [calForm, setCalForm] = useState({
    academicYear: `${selectedAcademicYear} ODD SEM`,
    reopeningDate: '',
    cat1Date: '',
    cat1EndDate: '',
    cat2Date: '',
    cat2EndDate: '',
    cat3Date: '',
    cat3EndDate: '',
    lastWorkingDay: '',
    practicalExamDate: '',
    theoryExamDate: '',
  });

  useEffect(() => {
    if (academicCalendar) {
      setCalForm({
        academicYear: academicCalendar.academicYear || `${selectedAcademicYear} ODD SEM`,
        reopeningDate: academicCalendar.reopeningDate || '',
        cat1Date: academicCalendar.cat1Date || '',
        cat1EndDate: academicCalendar.cat1EndDate || '',
        cat2Date: academicCalendar.cat2Date || '',
        cat2EndDate: academicCalendar.cat2EndDate || '',
        cat3Date: academicCalendar.cat3Date || '',
        cat3EndDate: academicCalendar.cat3EndDate || '',
        lastWorkingDay: academicCalendar.lastWorkingDay || '',
        practicalExamDate: academicCalendar.practicalExamDate || '',
        theoryExamDate: academicCalendar.theoryExamDate || '',
      });
    } else {
      setCalForm(prev => ({ ...prev, academicYear: `${selectedAcademicYear} ODD SEM` }));
    }
  }, [academicCalendar, selectedAcademicYear]);

  const defaultAuditItem = {
    academicPhase: 'POST_CAT_1',
    academicYear: selectedAcademicYear || '2026–2027',
    orderedDepartments: Array(10).fill(''),
    yearLevel: 'First Year',
    auditType: 'ACADEMIC',
    description: '',
    invigilatorId: '',
    additionalNotes: '',
  };

  const [audits, setAudits] = useState([{ ...defaultAuditItem }]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAudits(prev => prev.map(item => ({ ...item, academicYear: selectedAcademicYear })));
  }, [selectedAcademicYear]);

  const handleOcrUpload = async (file) => {
    if (!file) return;
    setOcrLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Use extract-dates: returns dates only, does NOT save to DB
      const res = await api.post('/api/director/academic-calendar/extract-dates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const d = res.data;
      if (d) {
        // Only set fields that were actually extracted (non-empty)
        setCalForm(prev => ({
          ...prev,
          ...(d.academicYear ? { academicYear: d.academicYear } : {}),
          ...(d.reopeningDate ? { reopeningDate: d.reopeningDate } : {}),
          ...(d.cat1Date ? { cat1Date: d.cat1Date } : {}),
          ...(d.cat1EndDate ? { cat1EndDate: d.cat1EndDate } : {}),
          ...(d.cat2Date ? { cat2Date: d.cat2Date } : {}),
          ...(d.cat2EndDate ? { cat2EndDate: d.cat2EndDate } : {}),
          ...(d.cat3Date ? { cat3Date: d.cat3Date } : {}),
          ...(d.cat3EndDate ? { cat3EndDate: d.cat3EndDate } : {}),
          ...(d.lastWorkingDay ? { lastWorkingDay: d.lastWorkingDay } : {}),
          ...(d.practicalExamDate ? { practicalExamDate: d.practicalExamDate } : {}),
          ...(d.theoryExamDate ? { theoryExamDate: d.theoryExamDate } : {}),
        }));

        // Count extracted vs missing
        const dateFields = ['reopeningDate', 'cat1Date', 'cat2Date', 'cat3Date', 'lastWorkingDay', 'practicalExamDate', 'theoryExamDate'];
        const found = dateFields.filter(f => d[f]);
        const missing = dateFields.filter(f => !d[f]);

        const note = d._extractionNote || '';
        const sem = d.academicYear || '';

        if (found.length === dateFields.length) {
          alert(`✅ Academic Calendar OCR dates extracted successfully!\nDetected: ${sem}\nAll ${found.length} dates were extracted. Please review before publishing.`);
        } else if (found.length > 0) {
          alert(`⚠️ Partial OCR extraction for: ${sem}\n${found.length}/${dateFields.length} dates extracted.\n${note}\nMissing: ${missing.join(', ')}\nPlease fill remaining dates manually.`);
        } else {
          alert(`⚠️ OCR detected: ${sem}\nCould not extract individual dates from this calendar format.\n${note}\nPlease enter dates manually.`);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      alert('❌ OCR extraction failed: ' + msg);
    } finally {
      setOcrLoading(false);
    }
  };

  const getAcademicYearFromDate = (dateStr) => {
    if (!dateStr) return selectedAcademicYear || '2026–2027';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return selectedAcademicYear || '2026–2027';
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (month >= 6) {
      return `${year}–${year + 1}`;
    } else {
      return `${year - 1}–${year}`;
    }
  };

  const handleReopeningDateChange = (val) => {
    const computedYear = getAcademicYearFromDate(val);
    // Detect semester from chosen month: Jan-May → EVEN, Jun-Dec → ODD
    let semLabel = 'ODD SEM';
    if (val) {
      const month = new Date(val).getMonth() + 1; // 1-indexed
      semLabel = month >= 1 && month <= 5 ? 'EVEN SEM' : 'ODD SEM';
    }
    setCalForm(prev => ({
      ...prev,
      reopeningDate: val,
      academicYear: `${computedYear} ${semLabel}`,
    }));
  };

  const handleAddAuditCard = () => {
    setAudits([...audits, { ...defaultAuditItem, academicYear: selectedAcademicYear }]);
  };

  const handleRemoveAuditCard = (index) => {
    if (audits.length === 1) return;
    setAudits(audits.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...audits];
    updated[index][field] = value;
    setAudits(updated);
  };

  const handleDepartmentOrderChange = (auditIndex, deptIndex, value) => {
    const updated = [...audits];
    updated[auditIndex].orderedDepartments[deptIndex] = value;
    setAudits(updated);
  };

  const addWorkingDays = (dateStr, daysOffset) => {
    if (!dateStr) return null;
    let result = new Date(dateStr);
    let remainingDays = daysOffset;
    let step = daysOffset > 0 ? 1 : -1;
    if (daysOffset < 0) remainingDays = -daysOffset;
    
    while (remainingDays > 0) {
        result.setDate(result.getDate() + step);
        if (result.getDay() !== 0 && result.getDay() !== 6) {
            remainingDays--;
        }
    }
    return result.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Save & Publish Academic Calendar
      await api.post('/api/director/academic-calendar', calForm);

      // 2. Save Custom Department Audits if valid
      let validAudits = [];
      for (const a of audits) {
        if (!a.academicPhase) continue;
        
        let phaseLabel = a.academicPhase;
        let baseDate = null;
        let baseOffset = 1;

        if (a.academicPhase === 'FPP') { phaseLabel = 'FPP'; baseDate = calForm.reopeningDate; baseOffset = -10; }
        else if (a.academicPhase === 'POST_CAT_1') { phaseLabel = 'POST CAT 1'; baseDate = calForm.cat1EndDate; baseOffset = 1; }
        else if (a.academicPhase === 'POST_CAT_2') { phaseLabel = 'POST CAT 2'; baseDate = calForm.cat2EndDate; baseOffset = 1; }
        else if (a.academicPhase === 'POST_CAT_3') { phaseLabel = 'POST CAT 3'; baseDate = calForm.cat3EndDate; baseOffset = 1; }
        else if (a.academicPhase === 'END_SEM') { phaseLabel = 'END SEM'; baseDate = calForm.theoryExamDate || calForm.lastWorkingDay; baseOffset = 1; }

        if (!baseDate) continue;

        let currentDate = addWorkingDays(baseDate, baseOffset);
        const deps = a.orderedDepartments.filter(d => d && d !== '');
        
        for (let i = 0; i < deps.length; i++) {
          let scheduleDate = currentDate;
          if (i > 0) {
            scheduleDate = addWorkingDays(currentDate, 1);
            currentDate = scheduleDate;
          }
          
          validAudits.push({
            ...a,
            name: `${phaseLabel} Academic Audit ${a.academicYear.split(' ')[0]}`,
            departmentCode: deps[i],
            startDate: scheduleDate,
            endDate: scheduleDate,
            invigilatorId: a.invigilatorId ? Number(a.invigilatorId) : null
          });
        }
      }

      if (validAudits.length > 0) {
        await api.post('/api/director/audits/batch', validAudits);
      }

      onAuditCreated();
      onClose();
      alert('Audit Calendar & Department Audits generated and published successfully!');
    } catch (err) {
      console.error("Submission error:", err);
      const serverMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || err.message;
      setError(serverMsg || 'Failed to save schedule. Please check date inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload / Configure Academic Calendar & Create Audit(s)" width={850}>
      <div className="p-5 max-h-[82vh] overflow-y-auto space-y-6">
        <p className="text-xs text-slate-400 font-semibold -mt-2">
          Set key semester dates (or extract via OCR) and configure custom department audits in one unified operation.
        </p>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* OCR Auto-Extract Banner */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Upload size={20} className="text-[#0A3D91]" />
            <div>
              <p className="text-xs font-bold text-slate-800">Auto-Extract Dates from Calendar Image / PDF (OCR)</p>
              <p className="text-[10px] text-slate-500 font-medium">Upload the Academic Calendar image or PDF file directly to extract dates and auto-populate schedules.</p>
            </div>
          </div>
          <label className="bg-[#0A3D91] hover:bg-[#082E6E] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all flex-shrink-0 shadow-sm">
            {ocrLoading ? 'Processing OCR...' : 'Choose Image / PDF'}
            <input
              type="file"
              accept="image/*,.pdf,.csv,.txt"
              onChange={(e) => handleOcrUpload(e.target.files[0])}
              className="hidden"
              disabled={ocrLoading}
            />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Part 1: Key Semester Dates */}
          <div className="space-y-3 border-b border-slate-100 pb-5">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Part 1: Key Semester Dates</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Year / Semester *</label>
                <input
                  required
                  type="text"
                  value={calForm.academicYear}
                  onChange={(e) => setCalForm({ ...calForm, academicYear: e.target.value })}
                  placeholder="e.g. 2026-27 ODD SEM"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0A3D91] uppercase tracking-wider mb-1">Reopening Date * (FPP -10 Days)</label>
                <input
                  required
                  type="date"
                  value={calForm.reopeningDate}
                  onChange={(e) => handleReopeningDateChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT I Start *</label>
                  <input required type="date" value={calForm.cat1Date} onChange={(e) => setCalForm({ ...calForm, cat1Date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT I End *</label>
                  <input required type="date" value={calForm.cat1EndDate} onChange={(e) => setCalForm({ ...calForm, cat1EndDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT II Start *</label>
                  <input required type="date" value={calForm.cat2Date} onChange={(e) => setCalForm({ ...calForm, cat2Date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT II End *</label>
                  <input required type="date" value={calForm.cat2EndDate} onChange={(e) => setCalForm({ ...calForm, cat2EndDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT III Start *</label>
                  <input required type="date" value={calForm.cat3Date} onChange={(e) => setCalForm({ ...calForm, cat3Date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">CAT III End *</label>
                  <input required type="date" value={calForm.cat3EndDate} onChange={(e) => setCalForm({ ...calForm, cat3EndDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-400" />
                </div>
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
            </div>
          </div>

          {/* Part 2: Department Audit Configuration */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Part 2: Department Audit Configuration</h4>
              <p className="text-[10px] text-slate-400 font-medium">Add specific department audits to create along with the calendar schedule.</p>
            </div>

            {audits.map((item, idx) => (
              <div key={idx} className="p-4 border rounded-xl bg-slate-50/70 relative space-y-3 border-slate-200">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs">Audit #{idx + 1}</h4>
                  {audits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAuditCard(idx)}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Academic Phase *</label>
                    <select
                      value={item.academicPhase}
                      onChange={(e) => handleChange(idx, 'academicPhase', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="FPP">FPP</option>
                      <option value="POST_CAT_1">POST CAT 1</option>
                      <option value="POST_CAT_2">POST CAT 2</option>
                      <option value="END_SEM">END SEM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Academic Year *</label>
                    <input
                      required
                      type="text"
                      value={item.academicYear}
                      onChange={(e) => handleChange(idx, 'academicYear', e.target.value)}
                      placeholder="e.g. 2024–2025"
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-2 border-b border-slate-200 pb-1">Department Sequence (10 Working Days) *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {item.orderedDepartments.map((dept, deptIdx) => (
                        <div key={deptIdx} className="flex flex-col">
                          <label className="text-[9px] text-slate-500 font-bold mb-0.5">Day {deptIdx + 1}</label>
                          <select
                            value={dept}
                            title={departments.find(d => d.code === dept)?.name || 'Select Department'}
                            onChange={(e) => handleDepartmentOrderChange(idx, deptIdx, e.target.value)}
                            className="w-full px-2 py-1.5 text-[10px] border rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value="">-- Select --</option>
                            {departments
                              .filter(d => !item.orderedDepartments.includes(d.code) || d.code === dept)
                              .map((d) => (
                                <option key={d.code} value={d.code} title={d.name}>{d.code}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Year Level *</label>
                    <select
                      value={item.yearLevel}
                      onChange={(e) => handleChange(idx, 'yearLevel', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Audit Type</label>
                    <select
                      value={item.auditType}
                      onChange={(e) => handleChange(idx, 'auditType', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="ACADEMIC">Academic Audit</option>
                      <option value="DEPARTMENTAL">Departmental Audit</option>
                      <option value="ANNUAL">Annual Audit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Assigned Invigilator</label>
                    <select
                      value={item.invigilatorId}
                      onChange={(e) => handleChange(idx, 'invigilatorId', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- None --</option>
                      {invigilators.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.department?.code || 'IQAC'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Description & Notes</label>
                  <textarea
                    rows="2"
                    value={item.description}
                    onChange={(e) => handleChange(idx, 'description', e.target.value)}
                    placeholder="Enter audit scope and instructions..."
                    className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                  ></textarea>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddAuditCard}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs border flex items-center gap-1.5 transition"
            >
              <Plus size={14} />
              <span>Add Another Audit</span>
            </button>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#0A3D91] to-[#1A56DB] hover:from-[#082E6E] hover:to-blue-700 disabled:bg-slate-200 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-2"
            >
              <Sparkles size={14} />
              <span>{loading ? 'Publishing...' : 'Generate & Publish Audit Calendar'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateAuditModal;
