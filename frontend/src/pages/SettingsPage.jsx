import React, { useState } from 'react';
import { Settings, Save, HardDrive, Mail, Key } from 'lucide-react';

const SettingsPage = () => {
  const [storagePath, setStoragePath] = useState('c:\\iqac-audit-uploads');
  const [maxSize, setMaxSize] = useState('50');
  const [jwtExpiry, setJwtExpiry] = useState('86400');
  const [smtpServer, setSmtpServer] = useState('localhost');
  const [smtpPort, setSmtpPort] = useState('25');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">System Settings</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Settings</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800 font-bold">
          Settings updated and saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Configuration */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3 mb-2">
            <HardDrive size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Storage Settings</h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Local Disk Upload path</label>
              <input
                type="text"
                required
                value={storagePath}
                onChange={(e) => setStoragePath(e.target.value)}
                className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-[#0A3D91] outline-none transition-all font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Upload File size (MB)</label>
              <input
                type="number"
                required
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
                className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-[#0A3D91] outline-none transition-all font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Email & Alert configurations */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3 mb-2">
            <Mail size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">SMTP / Email Configuration</h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMTP Server Host</label>
              <input
                type="text"
                required
                value={smtpServer}
                onChange={(e) => setSmtpServer(e.target.value)}
                className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-[#0A3D91] outline-none transition-all font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMTP Port</label>
              <input
                type="number"
                required
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-[#0A3D91] outline-none transition-all font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Authentication Settings */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3 mb-2">
            <Key size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Security & Auth Token</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">JWT Expiration duration (seconds)</label>
              <input
                type="number"
                required
                value={jwtExpiry}
                onChange={(e) => setJwtExpiry(e.target.value)}
                className="mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-[#0A3D91] outline-none transition-all font-semibold"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-[#0A3D91] hover:bg-[#082E6E] text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-1.5"
              >
                <Save size={14} />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
