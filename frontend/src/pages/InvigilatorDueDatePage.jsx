import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Send, Users } from 'lucide-react';

const InvigilatorDueDatePage = () => {
  const { authFetch } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await authFetch('http://localhost:8080/api/invigilator/faculty-status');
        if (res.ok) setFaculties(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const sendReminder = async (facultyId, facultyName) => {
    if (!dueDate) { alert('Please set a due date first.'); return; }
    setSending(facultyId);
    try {
      const res = await authFetch('http://localhost:8080/api/invigilator/send-due-date-reminder', {
        method: 'POST',
        body: JSON.stringify({ facultyId, dueDate, message })
      });
      if (res.ok) alert(`Due date reminder sent to ${facultyName}`);
      else alert('Failed to send reminder.');
    } catch (e) { alert(e.message); }
    finally { setSending(null); }
  };

  const sendToAll = async () => {
    if (!dueDate) { alert('Please set a due date first.'); return; }
    const pending = faculties.filter(f => f.courseFilesSubmitted < f.courseFilesTotal);
    if (pending.length === 0) { alert('No pending faculty found.'); return; }
    if (!window.confirm(`Send due date reminder to all ${pending.length} pending faculty?`)) return;

    for (const f of pending) {
      await sendReminder(f.facultyId, f.name);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Send Due Date Reminders</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Send email and notification reminders to faculty with pending submissions.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Reminder Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date *</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Custom Message (Optional)</label>
            <input value={message} onChange={e => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400"
              placeholder="e.g. Please submit all files urgently." />
          </div>
        </div>
        <button onClick={sendToAll}
          className="flex items-center space-x-2 bg-[#0B1E3F] hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm">
          <Mail size={13} />
          <span>Send to All Pending Faculty</span>
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Users size={15} className="text-slate-500" />
          <h3 className="font-bold text-slate-800 text-sm">Faculty Submission Status</h3>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                  <th className="py-3 px-2">Faculty</th>
                  <th className="py-3 px-2">Academic Files</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Remind</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map(f => {
                  const submitted = f.academiaFilesSubmitted ?? f.courseFilesSubmitted ?? 0;
                  const total = f.academiaFilesTotal ?? f.courseFilesTotal ?? 0;
                  const isPending = submitted < total;
                  return (
                    <tr key={f.facultyId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                            {f.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{f.name}</p>
                            <p className="text-[9px] text-slate-400">{f.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 font-bold text-slate-600">{submitted} / {total}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isPending ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {isPending ? 'Pending' : 'Complete'}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {isPending ? (
                          <button
                            disabled={sending === f.facultyId}
                            onClick={() => sendReminder(f.facultyId, f.name)}
                            className="flex items-center space-x-1 ml-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all disabled:opacity-50">
                            <Send size={11} />
                            <span>{sending === f.facultyId ? 'Sending...' : 'Send Reminder'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvigilatorDueDatePage;
