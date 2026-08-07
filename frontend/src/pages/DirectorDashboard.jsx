import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAcademicYear } from '../context/AcademicYearContext';
import { isFppDocument } from '../utils/fppUtils';
import {
  Search,
  Download,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  FileText,
  Send,
  HelpCircle,
  Eye,
  Building,
  FolderOpen,
  Sliders,
  ChevronRight
} from 'lucide-react';

const DirectorDashboard = () => {
  const { user, authFetch, API_BASE_URL } = useAuth();
  const { selectedAcademicYear } = useAcademicYear();
  
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState([]);
  const [files, setFiles] = useState([]);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [requiredFiles, setRequiredFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for files
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  // Selected file for feedback workspace
  const [selectedFileForFeedback, setSelectedFileForFeedback] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackFileSearch, setFeedbackFileSearch] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const insertFormat = (formatType) => {
    const textarea = document.getElementById('feedback-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    switch (formatType) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        break;
      case 'underline':
        replacement = `<u>${selected || 'underlined text'}</u>`;
        break;
      case 'list-bullet':
        replacement = `\n- ${selected || 'list item'}`;
        break;
      case 'list-number':
        replacement = `\n1. ${selected || 'list item'}`;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'quote text'}`;
        break;
      case 'link':
        replacement = `[${selected || 'link text'}](https://example.com)`;
        break;
      default:
        return;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setFeedbackComment(newText);
    
    // Refocus & reset selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, sumRes, filesRes, feedbackRes, reqRes] = await Promise.allSettled([
        authFetch(`http://localhost:8080/api/director/dashboard?academicYear=${encodeURIComponent(selectedAcademicYear)}`),
        authFetch(`http://localhost:8080/api/director/department-summary?academicYear=${encodeURIComponent(selectedAcademicYear)}`),
        authFetch('http://localhost:8080/api/director/files'),
        authFetch('http://localhost:8080/api/director/feedback'),
        authFetch('http://localhost:8080/api/director/required-files')
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        try { setStats(await statsRes.value.json()); } catch (e) {}
      }
      if (sumRes.status === 'fulfilled' && sumRes.value.ok) {
        try {
          const sumData = await sumRes.value.json();
          setSummary(Array.isArray(sumData) ? sumData : []);
        } catch (e) {}
      }
      if (filesRes.status === 'fulfilled' && filesRes.value.ok) {
        try {
          const filesData = await filesRes.value.json();
          const validFiles = Array.isArray(filesData) ? filesData : [];
          setFiles(validFiles);
          if (validFiles.length > 0 && !selectedFileForFeedback) {
            setSelectedFileForFeedback(validFiles[0]);
          }
        } catch (e) {}
      }
      if (feedbackRes.status === 'fulfilled' && feedbackRes.value.ok) {
        try {
          const fbData = await feedbackRes.value.json();
          setFeedbackHistory(Array.isArray(fbData) ? fbData : []);
        } catch (e) {}
      }
      if (reqRes.status === 'fulfilled' && reqRes.value.ok) {
        try {
          const reqData = await reqRes.value.json();
          setRequiredFiles(Array.isArray(reqData) ? reqData : []);
        } catch (e) {}
      }
    } catch (e) {
      console.error("Error fetching director dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedAcademicYear]);

  const safeFiles = Array.isArray(files) ? files : [];
  const safeSummary = Array.isArray(summary) ? summary : [];
  const safeFeedbackHistory = Array.isArray(feedbackHistory) ? feedbackHistory : [];

  const fppCount = safeFiles.filter(isFppDocument).length;

  // Filter files in main grid
  const filteredFiles = safeFiles.filter(f => {
    if (!f) return false;
    const deptMatch = selectedDeptFilter === 'All' || f.department === selectedDeptFilter;
    const typeMatch = selectedTypeFilter === 'All'
      ? true
      : selectedTypeFilter === 'fpp'
      ? isFppDocument(f)
      : f.fileType === selectedTypeFilter;
    
    const query = (fileSearchQuery || '').toLowerCase();
    const fileName = (f.fileName || '').toLowerCase();
    const courseName = (f.courseName || '').toLowerCase();
    const uploadedBy = (f.uploadedBy || '').toLowerCase();
    const searchMatch = !query || fileName.includes(query) || courseName.includes(query) || uploadedBy.includes(query);
    return deptMatch && typeMatch && searchMatch;
  });

  // Filter files in feedback search scroll list
  const filteredFilesForFeedbackSelection = safeFiles.filter(f => {
    if (!f) return false;
    const query = (feedbackFileSearch || '').toLowerCase();
    const fileName = (f.fileName || '').toLowerCase();
    const department = (f.department || '').toLowerCase();
    return !query || fileName.includes(query) || department.includes(query);
  });

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!selectedFileForFeedback || !feedbackComment.trim()) {
      alert('Please select a file and write a comment.');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const payload = {
        fileId: selectedFileForFeedback.id,
        fileType: selectedFileForFeedback.fileType === 'Course File' ? 'COURSE' : 'DEPARTMENT',
        comment: feedbackComment
      };

      const res = await authFetch('http://localhost:8080/api/director/feedback', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Feedback submitted successfully and notification sent.');
        setFeedbackComment('');
        fetchData();
      } else {
        alert('Failed to submit feedback.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCompleteAudit = (deptId) => {
    const confirm = window.confirm('Mark this department audit as completed? (Frontend only, won\'t affect DB)');
    if (!confirm) return;

    const currentYear = new Date().getFullYear();
    const storageKey = `completed_depts_frontend_${currentYear}`;
    const completedDepts = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!completedDepts.includes(deptId)) {
      completedDepts.push(deptId);
      localStorage.setItem(storageKey, JSON.stringify(completedDepts));
    }
    alert('Audit marked as COMPLETED locally. Department hidden.');
    fetchData();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">IQAC - Director Dashboard</h2>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Institution-wide Audit Control & Monitoring Workspace</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-bold text-blue-800">Active Academic Year: {selectedAcademicYear}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Departments (Blue Card) */}
            <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-blue-700">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Building size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Departments</span>
              </div>
              <h4 className="text-2xl font-bold text-slate-800">{stats?.totalDepartments ?? 10}</h4>
              <p className="text-[10px] text-slate-500 font-bold">Active Departments</p>
            </div>

            {/* Card 2: Course Files (Green Card) */}
            <div className="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-emerald-700">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <FileText size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Academic Files</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-800">
                  {stats?.academicSubmitted ?? stats?.courseSubmitted ?? 0} <span className="text-xs text-slate-400 font-bold">/ {stats?.courseTotal ?? 0}</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Submitted / Total</p>
              </div>
              <div className="w-full bg-slate-200/50 rounded-full h-1 mt-1">
                <div className="bg-emerald-500 h-1 rounded-full animate-all" style={{ width: `${(stats?.courseTotal > 0 && (stats?.academicSubmitted || stats?.courseSubmitted)) ? Math.round(((stats.academicSubmitted || stats.courseSubmitted) / stats.courseTotal) * 100) : 0}%` }}></div>
              </div>
            </div>

            {/* Card 3: Department Files (Orange Card) */}
            <div className="bg-[#FFF7ED] border border-orange-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-orange-700">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <FolderOpen size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Department Files</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-800">
                  {stats?.deptSubmitted ?? 0} <span className="text-xs text-slate-400 font-bold">/ {stats?.deptTotal ?? 0}</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Submitted / Total</p>
              </div>
              <div className="w-full bg-slate-200/50 rounded-full h-1 mt-1">
                <div className="bg-orange-500 h-1 rounded-full animate-all" style={{ width: `${(stats?.deptTotal > 0 && stats?.deptSubmitted) ? Math.round((stats.deptSubmitted / stats.deptTotal) * 100) : 0}%` }}></div>
              </div>
            </div>

            {/* Card 4: Overall Progress (Purple Card) */}
            <div className="bg-[#F5F3FF] border border-purple-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-purple-700">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <CheckCircle size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Overall Progress</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-800">{stats?.overallProgress ?? 0}%</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Overall Completion</p>
              </div>
              <div className="w-full bg-slate-200/50 rounded-full h-1 mt-1">
                <div className="bg-purple-600 h-1 rounded-full animate-all" style={{ width: `${stats?.overallProgress ?? 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Department Summary */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Department Summary</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Overview of file submissions by department.</p>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                    <th className="py-3 px-2">Department</th>
                    <th className="py-3 px-2">Academic Files (Submitted / Total)</th>
                    <th className="py-3 px-2">Department Files (Submitted / Total)</th>
                    <th className="py-3 px-2">Progress</th>
                    <th className="py-3 px-2">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {safeSummary.filter(s => {
                    if (!s) return false;
                    const currentYear = new Date().getFullYear();
                    const storageKey = `completed_depts_frontend_${currentYear}`;
                    const completedDepts = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    return !completedDepts.includes(s.departmentId);
                  }).map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                      <td className="py-3.5 px-2 text-slate-800 font-bold">{s.name}</td>
                      <td className="py-3.5 px-2 text-slate-600">{s.academicSubmitted ?? s.courseSubmitted ?? 0} / {s.courseTotal ?? s.courseExpected ?? 0}</td>
                      <td className="py-3.5 px-2 text-slate-600">{s.deptSubmitted ?? 0} / {s.deptTotal ?? s.deptExpected ?? 0}</td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-[10px] text-slate-700 w-8">{s.progress}%</span>
                          <div className="w-24 bg-slate-100 rounded-full h-1">
                            <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${s.progress}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-slate-400 font-semibold">
                        {s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-50">
              <a href="#" className="text-blue-600 hover:text-blue-700 text-xs font-bold block">
                View detailed reports &rarr;
              </a>
            </div>
          </div>

          {/* All Files by Department Table */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-50 pb-3 space-y-3 md:space-y-0">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">All Files by Department</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">View and download all submitted academic files and department files.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold outline-none cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                </select>

                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold outline-none cursor-pointer"
                >
                  <option value="All">All File Types</option>
                  <option value="Academic File">Academic Files</option>
                  <option value="Department File">Department Files</option>
                  <option value="fpp">FPP Files</option>
                </select>
              </div>
            </div>

            {/* Dynamic tabs for one-tap filtering of all files */}
            <div className="flex items-center space-x-6 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('All')}
                className={`text-xs font-bold pb-1 transition-all ${
                  selectedTypeFilter === 'All'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600'
                }`}
              >
                All Files ({files.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('Academic File')}
                className={`text-xs font-bold pb-1 transition-all ${
                  selectedTypeFilter === 'Academic File' || selectedTypeFilter === 'Course File'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Academic Files ({files.filter(f => f.fileType === 'Academic File' || f.fileType === 'Course File').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('Department File')}
                className={`text-xs font-bold pb-1 transition-all ${
                  selectedTypeFilter === 'Department File'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Department Files ({files.filter(f => f.fileType === 'Department File').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('fpp')}
                className={`text-xs font-bold pb-1 transition-all ${
                  selectedTypeFilter === 'fpp'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                FPP Files ({fppCount})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                    <th className="py-3 px-2">Department</th>
                    <th className="py-3 px-2">File Name</th>
                    <th className="py-3 px-2">File Type</th>
                    <th className="py-3 px-2">Uploaded By</th>
                    <th className="py-3 px-2">Uploaded On</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map(f => (
                    <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                      <td className="py-3.5 px-2 text-slate-700 font-bold">{f.department}</td>
                      <td className="py-3.5 px-2 text-blue-600 font-bold cursor-pointer hover:underline">{f.fileName}</td>
                      <td className="py-3.5 px-2">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                          {f.fileType || 'Academic File'}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-600">{f.uploadedBy}</td>
                      <td className="py-3.5 px-2 text-slate-400">{f.uploadedDate ? new Date(f.uploadedDate).toLocaleDateString() : '—'}</td>
                      <td className="py-3.5 px-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wide">
                          Submitted
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end space-x-2 text-slate-400">
                          <a
                            href={f.fileType === 'Academic File' || f.fileType === 'Course File'
                              ? `${API_BASE_URL}/api/files/view/academic/${f.id}`
                              : `${API_BASE_URL}/api/files/view/department/${f.id}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-100 rounded-lg transition-all"
                            title="View File in Browser"
                          >
                            <Eye size={13} />
                          </a>
                          <a
                            href={f.fileType === 'Academic File' || f.fileType === 'Course File'
                              ? `${API_BASE_URL}/api/files/download/academic/${f.id}`
                              : `${API_BASE_URL}/api/files/download/department/${f.id}`
                            }
                            className="p-1 hover:text-blue-600 hover:bg-slate-50 border border-slate-100 rounded transition-all"
                            title="Download File"
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Provide Feedback Workspace */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Provide Feedback / Comments to IQAC Invigilator</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select a file and provide your feedback or comments to the IQAC invigilator.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: File Scroll Selector */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select File</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={12} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search files by name..."
                    value={feedbackFileSearch}
                    onChange={(e) => setFeedbackFileSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-700 font-semibold focus:bg-white"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {filteredFilesForFeedbackSelection.map(f => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFileForFeedback(f)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                        selectedFileForFeedback?.id === f.id
                          ? 'border-blue-500 bg-blue-50/15 font-bold shadow-sm'
                          : 'border-slate-100 bg-white hover:bg-slate-50/50 font-semibold'
                      }`}
                    >
                      <p className="text-slate-800 truncate">{f.fileName}</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 font-bold">
                        <span>{f.department} &bull; {f.documentType}</span>
                        <span>{new Date(f.uploadedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Columns: Feedback Detail and Form */}
              <div id="feedback-section" className="lg:col-span-2 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Feedback Details</span>
                
                {/* File Dropdown Selector */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select File for Comment *</label>
                  <select
                    value={selectedFileForFeedback?.id || ''}
                    onChange={(e) => {
                      const fileId = parseInt(e.target.value);
                      const selected = files.find(f => f.id === fileId);
                      setSelectedFileForFeedback(selected || null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold"
                  >
                    <option value="">-- Choose a submitted file --</option>
                    {files.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.fileName} ({f.department} - {f.documentType})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFileForFeedback ? (
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex items-center space-x-3 text-xs">
                    <div className="h-10 w-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase select-none">
                      PDF
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{selectedFileForFeedback.fileName}</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                        {selectedFileForFeedback.department} &bull; {selectedFileForFeedback.fileType || 'Academic File'} &bull; Uploaded by {selectedFileForFeedback.uploadedBy} on {new Date(selectedFileForFeedback.uploadedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-100 border-dashed rounded-xl p-4 text-center text-slate-400 text-xs font-semibold">
                    No file selected. Choose a file from the list or select box.
                  </div>
                )}

                <form onSubmit={handleSendFeedback} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Comment / Feedback *</label>
                    <div className="mt-1.5 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-all bg-slate-50">
                      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center space-x-3 text-slate-400 font-bold select-none text-[11px]">
                        <button type="button" onClick={() => insertFormat('bold')} className="hover:text-slate-800 font-extrabold px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors" title="Bold">B</button>
                        <button type="button" onClick={() => insertFormat('italic')} className="hover:text-slate-800 italic px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors" title="Italic">I</button>
                        <button type="button" onClick={() => insertFormat('underline')} className="hover:text-slate-800 underline px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors" title="Underline">U</button>
                        <span className="text-slate-200">|</span>
                        <button type="button" onClick={() => insertFormat('list-bullet')} className="hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors text-[10px]" title="Bulleted List">Bullet List</button>
                        <button type="button" onClick={() => insertFormat('list-number')} className="hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors text-[10px]" title="Numbered List">Num List</button>
                        <button type="button" onClick={() => insertFormat('quote')} className="hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors text-[10px]" title="Quote">Blockquote</button>
                        <button type="button" onClick={() => insertFormat('link')} className="hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors text-[10px]" title="Insert Link">Link</button>
                      </div>
                      <textarea
                        id="feedback-textarea"
                        required
                        rows={4}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Type your comment here..."
                        className="block w-full bg-slate-50 p-4 text-xs text-slate-800 outline-none resize-none font-medium"
                      />
                      <div className="bg-white px-3 py-1.5 text-right text-[9px] text-slate-400 font-bold border-t border-slate-100">
                        {feedbackComment.length}/1000
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Send To</label>
                      <select className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold outline-none">
                        <option>IQAC Invigilator</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={submittingFeedback || !selectedFileForFeedback || !feedbackComment.trim()}
                        className="w-full bg-[#1A56DB] hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
                      >
                        <Send size={13} />
                        <span>Send Comment</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start space-x-2 text-[10px] text-amber-800 font-bold leading-relaxed">
                    <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
                    <div>
                      <p>Your feedback will be visible to the IQAC Invigilator for review and action.</p>
                      <p className="text-slate-400 text-[9px] mt-0.5">The invigilator will be notified about your feedback.</p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Feedback History Log */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Feedback History</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Track your previous comments and their status.</p>
            </div>
            
            {safeFeedbackHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No feedback comment history logged.
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider">
                      <th className="py-3 px-2">File Name</th>
                      <th className="py-3 px-2">Comment Preview</th>
                      <th className="py-3 px-2">Sent To</th>
                      <th className="py-3 px-2">Sent On</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeFeedbackHistory.map(h => (
                      <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                        <td className="py-3.5 px-2 text-blue-600 font-bold truncate max-w-[150px]">{h.fileName}</td>
                        <td className="py-3.5 px-2 text-slate-700 italic">"{h.comment}"</td>
                        <td className="py-3.5 px-2 text-slate-500 font-bold">IQAC Invigilator</td>
                        <td className="py-3.5 px-2 text-slate-400">
                          {h.date ? new Date(h.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {h.status === 'ACTIVE' ? 'Unread' : 'Read'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-slate-50">
              <a href="#" className="text-blue-600 hover:text-blue-700 text-xs font-bold block">
                View all feedback &rarr;
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DirectorDashboard;
