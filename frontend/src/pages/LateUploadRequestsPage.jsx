import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Check, X, AlertTriangle, FileText, ArrowRight, ShieldCheck, Calendar } from 'lucide-react';

const LateUploadRequestsPage = () => {
  const { authFetch, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [lateFiles, setLateFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [actioningId, setActioningId] = useState(null);
  const [extendedDeadline, setExtendedDeadline] = useState('');
  const [msg, setMsg] = useState('');

  const isDirector = user?.role === 'ROLE_DIRECTOR';

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Late Upload Requests
      const reqRes = await authFetch('http://localhost:8080/api/director/late-upload-requests');
      if (reqRes.ok) {
        setRequests(await reqRes.json());
      }

      // Fetch Files to find late submissions
      let filesList = [];
      if (user?.role === 'ROLE_DIRECTOR') {
        const filesRes = await authFetch('http://localhost:8080/api/director/files');
        if (filesRes.ok) {
          filesList = await filesRes.json();
        }
      } else if (user?.role === 'ROLE_INVIGILATOR') {
        const cRes = await authFetch('http://localhost:8080/api/invigilator/academic-files');
        const dRes = await authFetch('http://localhost:8080/api/invigilator/department-files');
        let cList = [];
        let dList = [];
        if (cRes.ok) cList = await cRes.json();
        if (dRes.ok) dList = await dRes.json();
        filesList = [...cList, ...dList];
      }

      // Filter files that are marked late
      const filteredLateFiles = filesList.filter(f => f.isLate === true);
      setLateFiles(filteredLateFiles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    if (!extendedDeadline) {
      alert('Please select an extended deadline date and time.');
      return;
    }

    try {
      // Format: "yyyy-MM-ddTHH:mm:ss" -> backend LocalDateTime
      const formattedDeadline = extendedDeadline + ':00';
      const res = await authFetch(`http://localhost:8080/api/director/late-upload-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendedDeadline: formattedDeadline })
      });

      if (res.ok) {
        setMsg('Late upload request approved successfully.');
        setActioningId(null);
        setExtendedDeadline('');
        fetchData();
      } else {
        alert('Failed to approve request.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      const res = await authFetch(`http://localhost:8080/api/director/late-upload-requests/${id}/reject`, {
        method: 'POST'
      });
      if (res.ok) {
        setMsg('Request rejected successfully.');
        fetchData();
      } else {
        alert('Failed to reject request.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const calculateDelay = (deadline, actual) => {
    if (!deadline || !actual) return 'N/A';
    const diffMs = new Date(actual) - new Date(deadline);
    if (diffMs <= 0) return 'No delay';
    const diffMins = Math.floor(diffMs / 1000 / 60);
    const days = Math.floor(diffMins / (24 * 60));
    const hours = Math.floor((diffMins % (24 * 60)) / 60);
    const mins = diffMins % 60;
    
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    return parts.join(' ') + ' late';
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Late Upload Management</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Late Uploads</p>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-bold flex items-center space-x-1.5">
          <Check size={14} />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-100 pb-2 space-x-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`text-xs font-bold pb-1 transition-all flex items-center space-x-1.5 ${
            activeTab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock size={14} />
          <span>Permission Requests ({requests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('delays')}
          className={`text-xs font-bold pb-1 transition-all flex items-center space-x-1.5 ${
            activeTab === 'delays'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Late Submissions Delay Log ({lateFiles.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {activeTab === 'requests' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              {requests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  <ShieldCheck className="mx-auto text-slate-300 mb-2" size={32} />
                  No late upload requests submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-3 px-2">Faculty</th>
                        <th className="py-3 px-2">Schedule / Deadline</th>
                        <th className="py-3 px-2">Requested On</th>
                        <th className="py-3 px-2">Reason</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                          <td className="py-3.5 px-2">
                            <p className="font-bold text-slate-800">{req.faculty?.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{req.faculty?.department?.code}</p>
                          </td>
                          <td className="py-3.5 px-2">
                            <p className="font-bold text-slate-700">{req.schedule?.title}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                              Deadline: {req.schedule?.dueDate} @ {req.schedule?.dueTime || '23:59:59'}
                            </p>
                          </td>
                          <td className="py-3.5 px-2 text-slate-500">
                            {new Date(req.requestTime).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-2 text-slate-600 max-w-[200px] truncate" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              req.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {req.status === 'PENDING' ? (
                              isDirector ? (
                                actioningId === req.id ? (
                                  <div className="flex flex-col items-end space-y-1.5">
                                    <input
                                      type="datetime-local"
                                      value={extendedDeadline}
                                      onChange={(e) => setExtendedDeadline(e.target.value)}
                                      className="border border-slate-200 rounded-lg p-1 text-[10px] text-slate-700 outline-none"
                                    />
                                    <div className="flex space-x-1.5">
                                      <button
                                        onClick={() => handleApprove(req.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px]"
                                      >
                                        Submit
                                      </button>
                                      <button
                                        onClick={() => setActioningId(null)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1 rounded text-[10px]"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-end space-x-1.5">
                                    <button
                                      onClick={() => setActioningId(req.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded-lg text-[10px] flex items-center space-x-0.5"
                                    >
                                      <Check size={11} />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      onClick={() => handleReject(req.id)}
                                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2 rounded-lg text-[10px] flex items-center space-x-0.5"
                                    >
                                      <X size={11} />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Awaiting Director Action</span>
                              )
                            ) : req.status === 'APPROVED' ? (
                              <p className="text-[9px] text-emerald-600 font-extrabold">
                                Extended: {new Date(req.extendedDeadline).toLocaleString()}
                              </p>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'delays' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              {lateFiles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                  No late submissions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-3 px-2">Faculty</th>
                        <th className="py-3 px-2">File / Document Type</th>
                        <th className="py-3 px-2">Original Deadline</th>
                        <th className="py-3 px-2">Actual Submission</th>
                        <th className="py-3 px-2 text-right">Delay Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lateFiles.map((file) => (
                        <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                          <td className="py-3.5 px-2">
                            <p className="font-bold text-slate-800">{file.faculty?.name || 'Faculty'}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{file.department}</p>
                          </td>
                          <td className="py-3.5 px-2">
                            <p className="font-bold text-slate-700">{file.fileName}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">{file.documentType} &bull; {file.courseName || 'Dept Level'}</p>
                          </td>
                          <td className="py-3.5 px-2 text-slate-500">
                            {file.originalDeadline ? new Date(file.originalDeadline).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-2 text-slate-500">
                            {file.actualSubmissionTime ? new Date(file.actualSubmissionTime).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-extrabold">
                              {calculateDelay(file.originalDeadline, file.actualSubmissionTime)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LateUploadRequestsPage;
