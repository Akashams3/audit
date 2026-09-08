import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Building, CheckCircle, PieChartIcon } from 'lucide-react';

const ReportsPage = () => {
  const { authFetch, user } = useAuth();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await authFetch('http://localhost:8080/api/director/department-summary');
      const statsRes = await authFetch('http://localhost:8080/api/director/dashboard');
      if (res.ok && statsRes.ok) {
        let summary = await res.json();
        if (user && user.role === 'ROLE_INVIGILATOR') {
          summary = summary.filter(d => d.code === user.department);
        }
        setData(summary);
        setStats(await statsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Sum up overall stats
  const totalCoursesSubmitted = data.reduce((acc, curr) => acc + (curr.academicSubmitted ?? curr.courseSubmitted ?? 0), 0);
  const totalCoursesExpected = user?.role === 'ROLE_DIRECTOR'
    ? (stats?.courseTotal ?? 0)
    : data.reduce((acc, curr) => acc + (curr.courseTotal ?? curr.courseExpected ?? 0), 0);

  const totalDeptsSubmitted = data.reduce((acc, curr) => acc + (curr.deptSubmitted ?? 0), 0);
  const totalDeptsExpected = user?.role === 'ROLE_DIRECTOR'
    ? (stats?.deptTotal ?? 0)
    : data.reduce((acc, curr) => acc + (curr.deptTotal ?? curr.deptExpected ?? 0), 0);

  const totalSubmitted = totalCoursesSubmitted + totalDeptsSubmitted;
  const totalExpected = totalCoursesExpected + totalDeptsExpected;

  const totalDepts = data.length;
  const completedDepts = data.filter(d => d.status === 'AUDIT_COMPLETED').length;

  const pieData = [
    { name: 'Submitted Files', value: totalSubmitted },
    { name: 'Pending Files', value: Math.max(0, totalExpected - totalSubmitted) }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Audit Reports & Metrics</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Reports</p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Audits</h4>
                <p className="text-xl font-extrabold text-slate-800 mt-1">{completedDepts} / {totalDepts} Depts</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Submissions</h4>
                <p className="text-xl font-extrabold text-slate-800 mt-1">{totalCoursesSubmitted} / {totalCoursesExpected} Files</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
              <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dept Submissions</h4>
                <p className="text-xl font-extrabold text-slate-800 mt-1">{totalDeptsSubmitted} / {totalDeptsExpected} Files</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
              <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Completion</h4>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.progress, 0) / data.length) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Completion Progress Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Building size={16} className="text-blue-600" />
                <span>Completion Status by Department (%)</span>
              </h3>
              <div className="h-72 w-full text-xs font-bold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="code" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="progress" name="Completion %" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart of Upload status */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <PieChartIcon size={16} className="text-emerald-600" />
                <span>Overall Submission Split</span>
              </h3>
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center space-x-4 text-[10px] font-bold text-slate-500">
                <div className="flex items-center space-x-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0088FE]"></span>
                  <span>Submitted ({totalSubmitted})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00C49F]"></span>
                  <span>Pending ({Math.max(0, totalExpected - totalSubmitted)})</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
