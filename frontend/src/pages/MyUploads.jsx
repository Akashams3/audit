import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Trash2, Search } from 'lucide-react';
import { isFppDocument } from '../utils/fppUtils';

const MyUploads = () => {
  const { authFetch, API_BASE_URL } = useAuth();
  const [academicFiles, setAcademicFiles] = useState([]);
  const [deptFiles, setDeptFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const cRes = await authFetch('http://localhost:8080/api/faculty/academic-files');
      const dRes = await authFetch('http://localhost:8080/api/faculty/department-files');
      if (cRes.ok && dRes.ok) {
        setAcademicFiles(await cRes.json());
        setDeptFiles(await dRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (id, isAcademic) => {
    const confirm = window.confirm('Are you sure you want to delete this file?');
    if (!confirm) return;

    try {
      const url = isAcademic 
        ? `http://localhost:8080/api/faculty/academic-files/${id}`
        : `http://localhost:8080/api/faculty/department-files/${id}`;
      const res = await authFetch(url, { method: 'DELETE' });
      if (res.ok) {
        fetchFiles();
      } else {
        const err = await res.json();
        alert(err.message || 'Delete failed');
      }
    } catch (e) {
      alert('Error deleting file: ' + e.message);
    }
  };

  const allFiles = [
    ...academicFiles.map(f => ({ ...f, type: 'Academic File' })),
    ...deptFiles.map(f => ({ ...f, type: 'Department File', courseName: '-' }))
  ];

  const filteredFiles = allFiles.filter(f => {
    const tabMatch = activeTab === 'ALL'
      ? true
      : activeTab === 'fpp'
      ? isFppDocument(f)
      : activeTab === 'ACADEMIC'
      ? f.type === 'Academic File'
      : f.type === 'Department File';
    const searchMatch = f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        f.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (f.courseName && f.courseName.toLowerCase().includes(searchQuery.toLowerCase()));
    return tabMatch && searchMatch;
  });

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-4 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-base font-bold text-slate-800">My Uploaded Documents</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage and review all your uploaded files in one place</p>
        </div>

        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by file name or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6 border-b border-slate-100 pb-3">
        {['ALL', 'ACADEMIC', 'DEPARTMENT', 'fpp'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold pb-1 transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            {tab === 'ALL' ? `All (${allFiles.length})` : tab === 'ACADEMIC' ? `Academic Files (${allFiles.filter(f => f.type === 'Academic File').length})` : tab === 'DEPARTMENT' ? `Department Files (${allFiles.filter(f => f.type === 'Department File').length})` : `FPP Files (${allFiles.filter(isFppDocument).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No matching documents found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                <th className="py-3 px-2">File Name</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Document Type</th>
                <th className="py-3 px-2">Course / Subject</th>
                <th className="py-3 px-2">Uploaded On</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(f => (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                  <td className="py-3.5 px-2 text-brand-600 font-semibold truncate max-w-[150px]">{f.fileName}</td>
                  <td className="py-3.5 px-2 text-slate-500">{f.type}</td>
                  <td className="py-3.5 px-2 text-slate-700 font-bold">{f.documentType}</td>
                  <td className="py-3.5 px-2 text-slate-600">{f.courseName}</td>
                  <td className="py-3.5 px-2 text-slate-400 font-semibold">
                    {new Date(f.uploadedDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <a
                        href={f.type === 'Academic File' 
                          ? `${API_BASE_URL}/api/files/download/academic/${f.id}`
                          : `${API_BASE_URL}/api/files/download/department/${f.id}`
                        }
                        className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleDelete(f.id, f.type === 'Academic File')}
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                        title="Delete"
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
  );
};

export default MyUploads;
