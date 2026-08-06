import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, Download, Trash2, HelpCircle, CheckCircle, AlertCircle, FileText, Clock } from 'lucide-react';
import { getDisplayFileName } from '../utils/formatUtils';

const AcademicFileUpload = () => {
  const { authFetch, API_BASE_URL } = useAuth();
  const [courseName, setCourseName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [submissionType, setSubmissionType] = useState('file');
  const [textContent, setTextContent] = useState('');
  
  const [myFiles, setMyFiles] = useState([]);
  const [requiredFiles, setRequiredFiles] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [uploadStatus, setUploadStatus] = useState({ blocked: false, requestStatus: 'NONE' });
  const [lateReason, setLateReason] = useState('');

  const fetchUploadStatus = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/faculty/upload-status');
      if (res.ok) {
        setUploadStatus(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMyFiles = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/faculty/academic-files');
      if (res.ok) {
        const data = await res.json();
        setMyFiles(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRequiredFiles = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/faculty/required-files');
      if (res.ok) {
        const data = await res.json();
        setRequiredFiles(data.filter(r => r.fileCategory === 'ACADEMIC' || r.fileCategory === 'COURSE'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCalendar = async () => {
    try {
      const res = await authFetch('http://localhost:8080/api/director/academic-calendar');
      if (res.ok) {
        setAcademicCalendar(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMyFiles();
    fetchRequiredFiles();
    fetchCalendar();
    fetchUploadStatus();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const maxSize = 50 * 1024 * 1024;
    const validExtensions = ['pdf', 'docx', 'xlsx', 'xls', 'doc'];
    const ext = selectedFile.name.split('.').pop().toLowerCase();

    if (selectedFile.size > maxSize) {
      setMsg({ text: 'File exceeds 50MB size limit.', type: 'error' });
      setFile(null);
      return;
    }

    if (!validExtensions.includes(ext)) {
      setMsg({ text: 'Unsupported file type. Please upload PDF, DOCX, or XLSX.', type: 'error' });
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setMsg({ text: `File selected: ${selectedFile.name}`, type: 'success' });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!courseName || !documentType) {
      setMsg({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    if (submissionType === 'file' && !file) {
      setMsg({ text: 'Please select a file to upload.', type: 'error' });
      return;
    }
    if (submissionType === 'text' && !textContent.trim()) {
      setMsg({ text: 'Please enter document text.', type: 'error' });
      return;
    }

    setUploading(true);
    setProgress(15);
    setMsg({ text: '', type: '' });

    try {
      const formData = new FormData();
      if (submissionType === 'file') {
        formData.append('file', file);
      } else {
        formData.append('textContent', textContent);
        formData.append('file', new Blob(), '');
      }
      formData.append('courseName', courseName);
      formData.append('documentType', documentType);

      setProgress(50);
      const res = await authFetch('http://localhost:8080/api/faculty/academic-files', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);
      if (res.ok) {
        setMsg({ text: submissionType === 'file' ? 'File uploaded successfully!' : 'Document text submitted and converted to PDF!', type: 'success' });
        setFile(null);
        setTextContent('');
        setCourseName('');
        setDocumentType('');
        fetchMyFiles();
      } else {
        const errData = await res.json();
        setMsg({ text: errData.message || 'Upload failed.', type: 'error' });
      }
    } catch (e) {
      setMsg({ text: 'Error uploading file: ' + e.message, type: 'error' });
    } finally {
      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleRequestLatePermission = async (e) => {
    e.preventDefault();
    if (!lateReason.trim()) {
      alert('Please state a reason for late submission.');
      return;
    }
    try {
      const res = await authFetch('http://localhost:8080/api/faculty/late-upload-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: uploadStatus.scheduleId, reason: lateReason })
      });
      if (res.ok) {
        alert('Permission request submitted successfully.');
        setLateReason('');
        fetchUploadStatus();
      } else {
        alert('Failed to submit request.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this file?');
    if (!confirm) return;

    try {
      const res = await authFetch(`http://localhost:8080/api/faculty/academic-files/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMsg({ text: 'File deleted successfully', type: 'success' });
        fetchMyFiles();
      } else {
        const errData = await res.json();
        setMsg({ text: errData.message || 'Delete failed.', type: 'error' });
      }
    } catch (e) {
      setMsg({ text: 'Error: ' + e.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Upload Academic File</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Upload Academic File</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Upload Academic File</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Upload academic related documents for audit.</p>
            </div>

            {uploadStatus.blocked ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-2">
                  <div className="flex items-center space-x-2 font-bold">
                    <Clock size={16} />
                    <span>Upload Blocked: Deadline Passed</span>
                  </div>
                  <p>
                    The submission deadline for the schedule <strong>{uploadStatus.scheduleTitle}</strong> expired on {uploadStatus.dueDate} at {uploadStatus.dueTime || '23:59:59'}.
                  </p>
                </div>

                {uploadStatus.requestStatus === 'NONE' || uploadStatus.requestStatus === 'REJECTED' ? (
                  <form onSubmit={handleRequestLatePermission} className="space-y-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    {uploadStatus.requestStatus === 'REJECTED' && (
                      <p className="text-[10px] text-rose-600 font-extrabold uppercase">
                        Your previous request was rejected. You can request again below:
                      </p>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Late Submission Reason
                      </label>
                      <textarea
                        required
                        value={lateReason}
                        onChange={(e) => setLateReason(e.target.value)}
                        placeholder="Please state the reason you need to upload after the deadline..."
                        rows={4}
                        className="mt-1.5 block w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#0A3D91] font-semibold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1"
                    >
                      Submit Late Upload Permission Request
                    </button>
                  </form>
                ) : (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 flex items-start space-x-2 font-bold">
                    <Clock size={16} className="mt-0.5" />
                    <div>
                      <p>Late Upload Request Pending Approval</p>
                      <p className="text-[10px] text-blue-600 font-medium mt-1">
                        Your request for late submission is currently under review by the Director. You will be allowed to upload once approved.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {msg.text && (
                  <div className={`p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {msg.type === 'error' ? <AlertCircle size={16} className="flex-shrink-0" /> : <CheckCircle size={16} className="flex-shrink-0" />}
                    <span>{msg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpload} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course / Subject Name</label>
                    <input
                      type="text"
                      required
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g. Data Structures"
                      className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-[#0A3D91] outline-none transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Type</label>
                    <select
                      required
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-[#0A3D91] outline-none transition-all font-semibold"
                    >
                      <option value="">Select Document Type</option>
                      {requiredFiles.map((req) => (
                        <option key={req.id} value={req.fileName}>
                          {getDisplayFileName(req.fileName, academicCalendar)} {req.mandatory ? ' (Required)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submission Mode Toggle */}
                  <div className="flex space-x-2 border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setSubmissionType('file')}
                      className={`text-xs font-bold pb-2 px-4 border-b-2 transition-all ${
                        submissionType === 'file' ? 'border-[#0A3D91] text-[#0A3D91]' : 'border-transparent text-slate-400'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmissionType('text')}
                      className={`text-xs font-bold pb-2 px-4 border-b-2 transition-all ${
                        submissionType === 'text' ? 'border-[#0A3D91] text-[#0A3D91]' : 'border-transparent text-slate-400'
                      }`}
                    >
                      Enter Document Text
                    </button>
                  </div>

                  {submissionType === 'file' ? (
                    /* Drag and Drop Zone */
                    <div className="space-y-3">
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border border-dashed rounded-2xl p-8 text-center transition-all ${
                          dragActive ? 'border-[#0A3D91] bg-blue-50/10' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="file"
                          id="course-file-input"
                          multiple={false}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <UploadCloud className="mx-auto text-slate-400 mb-3" size={32} />
                        <p className="text-xs font-bold text-slate-700">Drag and drop file here</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">or click to browse from device</p>
                        <label
                          htmlFor="course-file-input"
                          className="mt-4 inline-block bg-[#0A3D91] hover:bg-[#082E6E] text-white font-bold py-2 px-4 rounded-lg text-[10px] cursor-pointer transition-colors shadow-sm"
                        >
                          Select File
                        </label>
                      </div>

                      {file && (
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs font-bold">
                          <span className="text-slate-700 truncate max-w-[250px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setMsg({ text: '', type: '' });
                            }}
                            className="text-rose-600 hover:text-rose-800 font-bold px-2 uppercase text-[10px] tracking-wider"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Text Input Area */
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Text Content</label>
                      <textarea
                        required
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        rows={8}
                        placeholder="Type or paste the text content for this document..."
                        className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-[#0A3D91] outline-none transition-all font-semibold"
                      />
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-[#0A3D91] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading || (submissionType === 'file' ? !file : !textContent.trim())}
                    className="w-full bg-[#0A3D91] hover:bg-[#082E6E] disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md"
                  >
                    Upload Document
                  </button>
                </form>
              </>
            )}

            {/* Blue instructions block */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-800">
                <AlertCircle size={15} />
                <span>Instructions</span>
              </div>
              <ul className="list-disc pl-5 text-[10px] text-blue-800 font-bold space-y-1">
                <li>Upload the complete academic file as per the guidelines.</li>
                <li>Ensure all pages are clear and readable.</li>
                <li>Only one file can be uploaded at a time.</li>
              </ul>
            </div>
          </div>

          {/* List of uploaded files */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4">My Uploaded Academic Files</h3>

            {myFiles.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No academic files uploaded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-2">Document Type</th>
                      <th className="py-3 px-2">Course Name</th>
                      <th className="py-3 px-2">File Name</th>
                      <th className="py-3 px-2">Uploaded On</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFiles.map((f) => (
                      <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                        <td className="py-3.5 px-2 font-bold text-slate-700">{f.documentType}</td>
                        <td className="py-3.5 px-2 text-slate-600">{f.courseName}</td>
                        <td className="py-3.5 px-2 text-[#0A3D91] font-semibold truncate max-w-[120px]">{f.fileName}</td>
                        <td className="py-3.5 px-2 text-slate-400">{new Date(f.uploadedDate).toLocaleDateString()}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <a
                              href={`${API_BASE_URL}/api/files/download/academic/${f.id}`}
                              className="p-1 text-slate-500 hover:text-[#0A3D91] hover:bg-slate-100 rounded transition-colors"
                            >
                              <Download size={14} />
                            </a>
                            <button
                              onClick={() => handleDelete(f.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Side Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
              🎓
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">About Academic Files</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Academic files include syllabus, lesson plan, course outcomes, assignments, and other related documents.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-center space-x-2 text-[10px] font-bold text-slate-400 uppercase">
              <CheckCircle size={15} className="text-emerald-500" />
              <span>Required by Internal Audit Team</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicFileUpload;
