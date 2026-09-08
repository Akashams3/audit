import React, { useState, useEffect } from 'react';
import api from '../api/api';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/director/logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.relatedRecord?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.newValue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Audit Trail Logs</h1>
          <p className="text-sm text-slate-500">Record of audit creations, schedule changes, uploads, and status transitions</p>
        </div>

        <input
          type="text"
          placeholder="Search logs by user, action, or record..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading audit logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-500 border shadow-sm">
          No audit log records found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 border-b text-xs uppercase font-semibold text-slate-600">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Related Record</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{log.username}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium border">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-xs text-blue-700 font-semibold">{log.action}</td>
                    <td className="p-3.5 font-medium text-slate-800">{log.relatedRecord || '-'}</td>
                    <td className="p-3.5 text-xs text-slate-600 max-w-md truncate">
                      {log.newValue || log.oldValue || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
