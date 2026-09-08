import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../api/api';

const FileVersionModal = ({ isOpen, onClose, fileId, fileCategory, fileName }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && fileId && fileCategory) {
      fetchVersions();
    }
  }, [isOpen, fileId, fileCategory]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/faculty/files/${fileCategory}/${fileId}/versions`);
      setVersions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Version History: ${fileName || 'File'}`}>
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-6 text-gray-500 text-sm">Loading version history...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No previous versions stored for this file. Only current version exists.
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((ver, idx) => (
              <div
                key={ver.id || idx}
                className="p-3 border rounded-lg bg-white shadow-sm flex items-center justify-between hover:border-blue-300 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                      Version {ver.versionNumber}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{ver.fileName}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Uploaded by: <span className="font-medium text-gray-700">{ver.uploadedBy}</span> on{' '}
                    {new Date(ver.uploadedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      ver.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : ver.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {ver.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 mt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FileVersionModal;
