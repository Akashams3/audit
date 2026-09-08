import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAcademicYear } from '../context/AcademicYearContext';
import useYearFilteredApi from '../hooks/useYearFilteredApi';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  FolderOpen
} from 'lucide-react';

const InvigilatorDashboard = () => {
  const { user, authFetch } = useAuth();
  const { selectedAcademicYear, selectedStudyYear, buildYearParams } = useYearFilteredApi();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingAudit, setUpcomingAudit] = useState(null);
  const [countdown, setCountdown] = useState('');

  const formatDateValue = (val) => {
    if (!val) return '';
    if (Array.isArray(val)) {
      const y = val[0];
      const m = String(val[1]).padStart(2, '0');
      const d = String(val[2]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof val === 'string') {
      return val.split('T')[0];
    }
    return '';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`http://localhost:8080/api/invigilator/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }

      const schedRes = await authFetch(`http://localhost:8080/api/invigilator/schedules${buildYearParams()}`);
      if (schedRes.ok) {
        const schedules = await schedRes.json();
        const now = new Date();
        const futureSchedules = schedules.filter(s => {
          const dDate = new Date(`${formatDateValue(s.dueDate)}T23:59:59`);
          return dDate >= now;
        });
        futureSchedules.sort((a, b) => new Date(`${formatDateValue(a.dueDate)}T23:59:59`) - new Date(`${formatDateValue(b.dueDate)}T23:59:59`));
        if (futureSchedules.length > 0) {
          setUpcomingAudit(futureSchedules[0]);
        }
      }
    } catch (err) {
      console.error('Error loading invigilator dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAcademicYear, selectedStudyYear]);

  useEffect(() => {
    if (!upcomingAudit) return;
    const interval = setInterval(() => {
      const dueDate = new Date(`${formatDateValue(upcomingAudit.dueDate)}T23:59:59`);
      const now = new Date();
      const diff = dueDate - now;
      if (diff <= 0) {
        setCountdown('Audit deadline passed');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [upcomingAudit]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-10 text-slate-500">Failed to load dashboard data.</div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Invigilator Dashboard - {stats.departmentName}</h2>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Department Audit Control & Monitoring</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-bold text-blue-800">AY: {selectedAcademicYear === 'ALL' ? 'All AY' : selectedAcademicYear}</span>
        </div>
      </div>

      {upcomingAudit && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Upcoming: {upcomingAudit.title}</h3>
            <p className="text-blue-100 text-sm mt-1">
              Audit Date: {formatDateValue(upcomingAudit.auditDate)} | Due Date: {formatDateValue(upcomingAudit.dueDate)}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-1">Time Remaining</p>
            <p className="text-2xl font-black font-mono tracking-tight">{countdown || 'Calculating...'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-blue-700">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <FolderOpen size={20} className="text-blue-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100/50 px-2 py-1 rounded-md">Expected</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500">Total Expected</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-slate-800">{stats.courseTotal + stats.deptTotal}</p>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">Files across department</p>
          </div>
        </div>

        <div className="bg-[#F0FDF4] border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-emerald-700">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100/50 px-2 py-1 rounded-md">Received</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500">Files Submitted</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-slate-800">{stats.academicSubmitted + stats.deptSubmitted}</p>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">From Faculty & HOD</p>
          </div>
        </div>

        <div className="bg-[#FFF8F1] border border-orange-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-orange-700">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <AlertCircle size={20} className="text-orange-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100/50 px-2 py-1 rounded-md">Pending</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500">Pending Files</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-slate-800">{(stats.courseTotal + stats.deptTotal) - (stats.academicSubmitted + stats.deptSubmitted)}</p>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">Require follow-up</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-700">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-sm border border-slate-100">
              <FileText size={20} className="text-slate-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">Progress</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500">Completion</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-slate-800">{stats.completionPercentage}%</p>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">Overall submission rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvigilatorDashboard;
