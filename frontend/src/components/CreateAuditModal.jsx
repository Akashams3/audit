import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../api/api';
import { useAcademicYear } from '../context/AcademicYearContext';
import { Upload, Sparkles, Plus } from 'lucide-react';

const CreateAuditModal = ({ isOpen, onClose, onAuditCreated, invigilators = [], departments = [] }) => {
  if (!isOpen) return null;

  const { selectedAcademicYear } = useAcademicYear();

  const [calForm, setCalForm] = useState({
    academicYear: `${selectedAcademicYear} ODD SEM`,
    reopeningDate: '2026-06-09',
    cat1Date: '2026-07-13',
    cat2Date: '2026-08-05',
    cat3Date: '2026-09-01',
    lastWorkingDay: '2026-09-07',
    practicalExamDate: '2026-09-10',
    theoryExamDate: '2026-09-20',
  });

  useEffect(() => {
    setCalForm(prev => ({ ...prev, academicYear: `${selectedAcademicYear} ODD SEM` }));
  }, [selectedAcademicYear]);

  const defaultAuditItem = {
    name: 'FPP Academic Audit 2026',
    academicYear: selectedAcademicYear || '2026–2027',
    departmentCode: departments[0]?.code || 'CCE',
    yearLevel: 'First Year',
    auditType: 'ACADEMIC',
    description: '',
    startDate: '',
    endDate: '',
    auditTime: '10:00',
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
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/director/academic-calendar/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data) {
        setCalForm(prev => ({
          ...prev,
          reopeningDate: res.data.reopeningDate || prev.reopeningDate,
          cat1Date: res.data.cat1Date || prev.cat1Date,
          cat2Date: res.data.cat2Date || prev.cat2Date,
          cat3Date: res.data.cat3Date || prev.cat3Date,
          lastWorkingDay: res.data.lastWorkingDay || prev.lastWorkingDay,
          practicalExamDate: res.data.practicalExamDate || prev.practicalExamDate,
          theoryExamDate: res.data.theoryExamDate || prev.theoryExamDate,
        }));
        alert('Academic Calendar OCR dates extracted successfully!');
      }
    } catch (err) {
      alert('OCR extraction failed: ' + (err.response?.data?.message || err.message));
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
    setCalForm(prev => ({
      ...prev,
      reopeningDate: val,
      academicYear: `${computedYear} ODD SEM`
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
    if (field === 'startDate' && value) {
      updated[index]['academicYear'] = getAcademicYearFromDate(value);
    }
    setAudits(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Save & Publish Academic Calendar
      await api.post('/api/director/academic-calendar', calForm);

      // 2. Save Custom Department Audits if valid
      const validAudits = audits
        .filter(a => a.name && a.startDate && a.endDate)
        .map(a => ({
          ...a,
          invigilatorId: a.invigilatorId ? Number(a.invigilatorId) : null
        }));

      if (validAudits.length > 0) {
        if (validAudits.length === 1) {
          await api.post('/api/director/audits', validAudits[0]);
        } else {
          await api.post('/api/director/audits/batch', validAudits);
        }
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
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Audit Name *</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleChange(idx, 'name', e.target.value)}
                      placeholder="e.g. FPP Academic Audit 2026"
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    />
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

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Department *</label>
                    <select
                      value={item.departmentCode}
                      onChange={(e) => handleChange(idx, 'departmentCode', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="ALL">All Departments (ALL)</option>
                      {departments.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
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

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={item.startDate}
                      onChange={(e) => handleChange(idx, 'startDate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={item.endDate}
                      onChange={(e) => handleChange(idx, 'endDate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    />
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
