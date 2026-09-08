import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Send, CheckCircle, Clock } from 'lucide-react';
import VisualCalendarMatrix from '../components/VisualCalendarMatrix';

const InvigilatorAssignWorkPage = () => {
  const { authFetch } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [hods, setHods] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [requiredFiles, setRequiredFiles] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedHods, setSelectedHods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schRes, hodRes, calRes, facRes, reqFilesRes] = await Promise.all([
          authFetch('http://localhost:8080/api/invigilator/schedules'),
          authFetch('http://localhost:8080/api/invigilator/hod-status'),
          authFetch('http://localhost:8080/api/faculty/academic-calendar'),
          authFetch('http://localhost:8080/api/invigilator/faculty-status'),
          authFetch('http://localhost:8080/api/invigilator/required-files')
        ]);
        
        if (schRes.ok) {
          const schData = await schRes.json();
          setSchedules(schData.filter(s => s.status === 'PUBLISHED'));
        }
        if (hodRes.ok) {
          setHods(await hodRes.json());
        }
        if (calRes.ok) {
          setAcademicCalendar(await calRes.json());
        }
        if (facRes.ok) {
          setFacultyList(await facRes.json());
        }
        if (reqFilesRes.ok) {
          setRequiredFiles(await reqFilesRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authFetch]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedHods(hods.map(h => h.facultyId));
    } else {
      setSelectedHods([]);
    }
  };

  const handleToggleHod = (id) => {
    setSelectedHods(prev => 
      prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!selectedSchedule) {
      setMsg({ text: 'Please select an Audit Schedule.', type: 'error' });
      return;
    }
    if (selectedHods.length === 0) {
      setMsg({ text: 'Please select at least one HOD.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMsg({ text: '', type: '' });
    
    try {
      let specificMessage = "";
      if(selectedFaculty && selectedFile) {
         const fName = facultyList.find(f => f.facultyId.toString() === selectedFaculty)?.name || selectedFaculty;
         const fileObj = requiredFiles.find(f => f.id.toString() === selectedFile);
         const fileName = fileObj ? fileObj.fileName : selectedFile;
         specificMessage = `Follow up on file: ${fileName} for Faculty: ${fName}`;
      }
      
      const res = await authFetch('http://localhost:8080/api/invigilator/assign-audit-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: selectedSchedule,
          hodIds: selectedHods,
          specificMessage
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: 'success' });
        setSelectedHods([]);
      } else {
        setMsg({ text: data.message || 'Failed to assign work.', type: 'error' });
      }
    } catch (e) {
      setMsg({ text: 'Error connecting to server.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <Send className="text-blue-100" size={24} />
            <h2 className="text-xl font-bold">Assign Audit Work</h2>
          </div>
          <p className="text-blue-100 text-xs font-medium">Select an upcoming audit schedule and assign it to faculties to notify them to start preparing.</p>
        </div>

        {academicCalendar && (
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Academic Calendar Reference</h3>
            <VisualCalendarMatrix academicCalendar={academicCalendar} schedules={schedules} />
          </div>
        )}

        <div className="p-6 space-y-6">
          {msg.text && (
            <div className={`p-3 rounded-xl text-xs font-bold border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {msg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. Select Audit Schedule</label>
            <select
              value={selectedSchedule}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 font-semibold"
            >
              <option value="">-- Select an Audit Schedule --</option>
              {schedules.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} (Audit: {s.auditDate} | Due: {s.dueDate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">2. Specific Follow-up (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 font-semibold"
              >
                <option value="">-- Select Faculty --</option>
                {facultyList.map(f => (
                  <option key={f.facultyId} value={f.facultyId}>{f.name}</option>
                ))}
              </select>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 font-semibold"
              >
                <option value="">-- Select File --</option>
                {requiredFiles.map(f => (
                  <option key={f.id} value={f.id}>{f.fileName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">3. Select HODs</label>
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                <input 
                  type="checkbox" 
                  checked={selectedHods.length === hods.length && hods.length > 0}
                  onChange={handleSelectAll}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-600">Select All</span>
              </label>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-[400px] overflow-y-auto">
              {hods.length > 0 ? (
                <div className="space-y-2">
                  {hods.map(hod => (
                    <label key={hod.facultyId} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-blue-200 transition-colors">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedHods.includes(hod.facultyId)}
                          onChange={() => handleToggleHod(hod.facultyId)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{hod.name}</p>
                        </div>
                      </div>
                      {selectedHods.includes(hod.facultyId) && (
                        <CheckCircle size={16} className="text-emerald-500" />
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-semibold">No HOD found in your department.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleAssign}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={16} />
              )}
              <span>{submitting ? 'Assigning Work...' : `Assign Work to ${selectedHods.length} Member(s)`}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvigilatorAssignWorkPage;
