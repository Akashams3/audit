import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, Clock, Upload, Download, Trash2,
  ArrowRight, MessageSquare, BookOpen, FolderOpen, FileText, Eye
} from 'lucide-react';
import { getDisplayFileName } from '../utils/formatUtils';

import { isFppDocument } from '../utils/fppUtils';
import IqacCalendarGrid from '../components/IqacCalendarGrid';

const FacultyDashboard = () => {
  const { user, authFetch, API_BASE_URL } = useAuth();

  const [selectedStudentYear, setSelectedStudentYear] = useState('1st Year');
  const [courseFiles, setCourseFiles] = useState([]);
  const [deptFiles, setDeptFiles] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [requiredFiles, setRequiredFiles] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      try {
        const cRes = await authFetch('http://localhost:8080/api/faculty/academic-files');
        if (cRes.ok) setCourseFiles(await cRes.json());
      } catch (e) { console.error(e); }

      try {
        const dRes = await authFetch('http://localhost:8080/api/faculty/department-files');
        if (dRes.ok) setDeptFiles(await dRes.json());
      } catch (e) { console.error(e); }

      try {
        const fRes = await authFetch('http://localhost:8080/api/director/feedback');
        if (fRes.ok) {
          const fData = await fRes.json();
          setFeedbackList(fData.filter(item => item.facultyId === user?.id || item.department === user?.department));
        }
      } catch (e) { console.error(e); }

      try {
        const rRes = await authFetch('http://localhost:8080/api/faculty/required-files');
        if (rRes.ok) setRequiredFiles(await rRes.json());
      } catch (e) { console.error(e); }

      try {
        const calRes = await authFetch('http://localhost:8080/api/faculty/academic-calendar');
        if (calRes.ok) setAcademicCalendar(await calRes.json());
      } catch (e) { console.error(e); }

      try {
        const schedRes = await authFetch('http://localhost:8080/api/invigilator/schedules');
        if (schedRes.ok) setSchedules(await schedRes.json());
      } catch (e) { console.error(e); }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const handleDelete = async (id, isCourse) => {
    if (!window.confirm('Delete this file?')) return;
    const url = isCourse
      ? `http://localhost:8080/api/faculty/academic-files/${id}`
      : `http://localhost:8080/api/faculty/department-files/${id}`;
    const res = await authFetch(url, { method: 'DELETE' });
    if (res.ok) fetchAll();
    else { const e = await res.json(); alert(e.message || 'Failed to delete.'); }
  };

  const courseRequired = requiredFiles.filter(r => (r.fileCategory === 'ACADEMIC' || r.fileCategory === 'COURSE') && isFppDocument(r));
  const deptRequired = requiredFiles.filter(r => r.fileCategory === 'DEPARTMENT');

  // Match uploaded file to required doc by documentType
  const getUploadedFile = (docName, isCourse) =>
    (isCourse ? courseFiles : deptFiles).find(
      f => f.documentType?.toLowerCase() === docName.toLowerCase()
    );

  const courseSubmitted = courseRequired.filter(r => getUploadedFile(r.fileName, true)).length;
  const deptSubmitted = deptRequired.filter(r => getUploadedFile(r.fileName, false)).length;
  const totalRequired = courseRequired.length + deptRequired.length;
  const totalSubmitted = courseSubmitted + deptSubmitted;
  const overallPct = totalRequired > 0 ? Math.round((totalSubmitted / totalRequired) * 100) : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Faculty Dashboard</h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Hello, <strong className="text-slate-800">{user?.name}</strong>. Track your audit file submissions below.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Year Level:</span>
            <select
              value={selectedStudentYear}
              onChange={(e) => setSelectedStudentYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-lg outline-none cursor-pointer focus:border-blue-500"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="ALL">All Years</option>
            </select>
          </div>
          <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-lg border border-slate-200 uppercase">
            {user?.department}
          </span>
          <span className="bg-blue-50 text-[#0A3D91] font-bold px-3 py-1 rounded-lg border border-blue-100 uppercase">
            Faculty
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="h-8 w-8 border-4 border-[#0A3D91] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Overall Progress Bar */}
          {totalRequired > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Overall Submission Progress</span>
                <span className="text-xs font-bold text-[#0A3D91]">{totalSubmitted} / {totalRequired} files</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${overallPct === 100 ? 'bg-emerald-500' : 'bg-[#0A3D91]'}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
          )}

          {/* IQAC Calendar Grid Matrix Component */}
          <IqacCalendarGrid academicCalendar={academicCalendar} schedules={schedules} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Course File Checklist */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen size={15} className="text-[#0A3D91]" />
                    <h3 className="font-bold text-slate-800 text-sm">Academic File Checklist</h3>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {courseSubmitted}/{courseRequired.length}
                    </span>
                  </div>
                  <Link to="/upload-academic" className="text-[#0A3D91] hover:text-blue-800 text-xs font-bold flex items-center space-x-1">
                    <Upload size={12} />
                    <span>Upload</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {courseRequired.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                    <FileText className="mx-auto text-slate-300 mb-2" size={28} />
                    <p className="text-slate-400 text-xs font-semibold">No academic files required yet.</p>
                    <p className="text-slate-300 text-[10px] mt-1">The IQAC Director hasn't defined required files.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {courseRequired.map((req) => {
                      const uploaded = getUploadedFile(req.fileName, true);
                      return (
                        <div key={req.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                          uploaded ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                        }`}>
                          <div className="flex items-center space-x-3 min-w-0">
                            {uploaded
                              ? <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
                              : <Clock className="text-amber-400 flex-shrink-0" size={18} />
                            }
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{getDisplayFileName(req.fileName, academicCalendar)}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                                {uploaded ? uploaded.fileName : (req.description || 'Not yet uploaded')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                            {req.mandatory && !uploaded && (
                              <span className="text-[9px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded">Required</span>
                            )}
                            {uploaded ? (
                              <>
                                 {uploaded.fileName.toLowerCase().endsWith('.pdf') && (
                                   <a href={`${API_BASE_URL}/api/files/view/academic/${uploaded.id}`}
                                     target="_blank" rel="noopener noreferrer"
                                     className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg border border-slate-200/50 transition-colors">
                                     <Eye size={13} />
                                   </a>
                                 )}
                                 <a href={`${API_BASE_URL}/api/files/download/academic/${uploaded.id}`}
                                   className="p-1.5 text-slate-400 hover:text-[#0A3D91] hover:bg-white rounded-lg border border-slate-200/50 transition-colors">
                                   <Download size={13} />
                                 </a>
                                 <button onClick={() => handleDelete(uploaded.id, true)}
                                   className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-slate-200/50 transition-colors">
                                   <Trash2 size={13} />
                                 </button>
                                 <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                   Submitted
                                 </span>
                               </>
                             ) : (
                              <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Department File Checklist */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <FolderOpen size={15} className="text-orange-500" />
                    <h3 className="font-bold text-slate-800 text-sm">Department File Checklist</h3>
                    <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                      {deptSubmitted}/{deptRequired.length}
                    </span>
                  </div>
                  <Link to="/upload-department" className="text-[#0A3D91] hover:text-blue-800 text-xs font-bold flex items-center space-x-1">
                    <Upload size={12} />
                    <span>Upload</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {deptRequired.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                    <FolderOpen className="mx-auto text-slate-300 mb-2" size={28} />
                    <p className="text-slate-400 text-xs font-semibold">No department files required yet.</p>
                    <p className="text-slate-300 text-[10px] mt-1">The IQAC Director hasn't defined required files.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {deptRequired.map((req) => {
                      const uploaded = getUploadedFile(req.fileName, false);
                      return (
                        <div key={req.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                          uploaded ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                        }`}>
                          <div className="flex items-center space-x-3 min-w-0">
                            {uploaded
                              ? <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
                              : <Clock className="text-amber-400 flex-shrink-0" size={18} />
                            }
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{req.fileName}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                                {uploaded ? uploaded.fileName : (req.description || 'Not yet uploaded')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                            {req.mandatory && !uploaded && (
                              <span className="text-[9px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded">Required</span>
                            )}
                            {uploaded ? (
                              <>
                                 {uploaded.fileName.toLowerCase().endsWith('.pdf') && (
                                   <a href={`${API_BASE_URL}/api/files/view/department/${uploaded.id}`}
                                     target="_blank" rel="noopener noreferrer"
                                     className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg border border-slate-200/50 transition-colors">
                                     <Eye size={13} />
                                   </a>
                                 )}
                                 <a href={`${API_BASE_URL}/api/files/download/department/${uploaded.id}`}
                                   className="p-1.5 text-slate-400 hover:text-[#0A3D91] hover:bg-white rounded-lg border border-slate-200/50 transition-colors">
                                   <Download size={13} />
                                 </a>
                                <button onClick={() => handleDelete(uploaded.id, false)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-slate-200/50 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                  Submitted
                                </span>
                              </>
                            ) : (
                              <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center space-y-1">
                  <p className="text-2xl font-bold text-emerald-600">{courseSubmitted}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Course Submitted</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center space-y-1">
                  <p className="text-2xl font-bold text-amber-500">{courseRequired.length - courseSubmitted}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Course Pending</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center space-y-1">
                  <p className="text-2xl font-bold text-emerald-600">{deptSubmitted}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dept Submitted</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center space-y-1">
                  <p className="text-2xl font-bold text-amber-500">{deptRequired.length - deptSubmitted}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dept Pending</p>
                </div>
              </div>

              {/* Feedback Panel */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-4 mb-4 flex items-center space-x-2">
                  <MessageSquare size={15} className="text-[#0A3D91]" />
                  <span>Auditor Feedback</span>
                  {feedbackList.length > 0 && (
                    <span className="ml-auto text-[9px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">
                      {feedbackList.length}
                    </span>
                  )}
                </h3>
                {feedbackList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="mx-auto text-emerald-300 mb-2" size={28} />
                    No comments on your files yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedbackList.map((item) => (
                      <div key={item.id} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span className="text-[#0A3D91] font-bold truncate max-w-[140px]">{item.fileName}</span>
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-100 font-medium">
                          "{item.comment}"
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-bold">
                          <span className="text-slate-500">By: {item.commentedBy}</span>
                          <span className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {item.status === 'ACTIVE' ? 'Unread' : 'Read'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyDashboard;
