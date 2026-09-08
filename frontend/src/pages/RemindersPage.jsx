import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Check, AlertCircle, Users, Send } from 'lucide-react';

const RemindersPage = () => {
  const { authFetch } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const res = await authFetch('http://localhost:8080/api/invigilator/faculty-status');
      if (res.ok) {
        const data = await res.json();
        setFaculties(data);
        
        // Auto-select those who have pending uploads
        const pending = data.filter(f => (f.academiaFilesSubmitted ?? f.courseFilesSubmitted ?? 0) < (f.academiaFilesTotal ?? f.courseFilesTotal ?? 0)).map(f => f.facultyId);
        setSelectedIds(pending);
      }
    } catch (e) {
      console.error(e);
      setMsg({ text: 'Failed to load faculty status.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === faculties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(faculties.map(f => f.facultyId));
    }
  };

  const handleSendReminders = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Please select at least one faculty member.');
      return;
    }

    setSending(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await authFetch('http://localhost:8080/api/invigilator/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedIds),
      });

      if (res.ok) {
        setMsg({ text: `Email reminders successfully sent to ${selectedIds.length} faculty members!`, type: 'success' });
      } else {
        const data = await res.json();
        setMsg({ text: data.message || 'Failed to send reminders.', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Error sending reminders: ' + err.message, type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Faculty Reminders Workspace</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Send Reminders</p>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-start space-x-2 text-xs font-semibold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {msg.type === 'error' ? <AlertCircle size={16} className="flex-shrink-0" /> : <Check size={16} className="flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : faculties.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-xs font-semibold">
          <Users className="mx-auto text-slate-300 mb-2" size={32} />
          <span>No registered faculty members in your department.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Checklist */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Select Faculty Members</h3>
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-[11px] text-blue-600 hover:underline font-bold"
              >
                {selectedIds.length === faculties.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2">
              {faculties.map((fac) => {
                const sub = fac.academiaFilesSubmitted ?? fac.courseFilesSubmitted ?? 0;
                const tot = fac.academiaFilesTotal ?? fac.courseFilesTotal ?? 0;
                const isPending = sub < tot;
                const isChecked = selectedIds.includes(fac.facultyId);
                return (
                  <div
                    key={fac.facultyId}
                    onClick={() => handleToggle(fac.facultyId)}
                    className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                      isChecked ? 'border-blue-200 bg-blue-50/10' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Swapped by outer div click
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{fac.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{fac.email}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        isPending ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {sub} / {tot} Academic Files
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trigger Card */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Send Reminders Now</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Sends a formatted audit pending email notification to the selected faculty members.
                </p>
              </div>

              <div className="border-t border-slate-50 pt-4 space-y-3.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Selected Receivers:</span>
                  <span className="text-blue-600">{selectedIds.length} Faculty</span>
                </div>

                <button
                  onClick={handleSendReminders}
                  disabled={sending || selectedIds.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-1.5"
                >
                  {sending ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Reminders</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPage;
