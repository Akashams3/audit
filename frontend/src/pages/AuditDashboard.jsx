import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AcademicYearSemesterFilter from "../components/AcademicYearSemesterFilter";
import RequiredFilesSection from "../components/RequiredFilesSection";
import Modal from "../components/Modal";
import { Btn, Card, PageHeader, Table, Spinner, Alert, StatusBadge, Input } from "../components/UI";
import api from "../api/api";

export default function AuditDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [deptSummary, setDeptSummary] = useState([]);
  const [stats, setStats] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const userRole = localStorage.getItem("role") || "ROLE_DIRECTOR";

  const loadData = async () => {
    setLoading(true);
    try {
      if (userRole === "ROLE_DIRECTOR") {
        const [dashRes, deptRes, calRes] = await Promise.allSettled([
          api.get("/api/director/dashboard"),
          api.get("/api/director/department-summary"),
          api.get("/api/director/academic-calendar"),
        ]);
        if (dashRes.status === "fulfilled") setStats(dashRes.value.data);
        if (deptRes.status === "fulfilled") setDeptSummary(deptRes.value.data || []);
        if (calRes.status === "fulfilled") setCalendar(calRes.value.data);
      } else {
        const [dashRes, calRes] = await Promise.allSettled([
          api.get("/api/invigilator/dashboard"),
          api.get("/api/invigilator/schedules"),
        ]);
        if (dashRes.status === "fulfilled") setStats(dashRes.value.data);
      }
    } catch (err) {
      console.error("Error loading audit data:", err);
      setMsg({ type: "error", text: "Failed to load audit dashboard data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteAudit = async (deptId, deptName) => {
    if (!window.confirm(`Are you sure you want to mark Audit as COMPLETED for ${deptName}? This will store the calendar & file grid in the database.`)) {
      return;
    }
    try {
      const res = await api.post(`/api/director/complete-audit/${deptId}`);
      setMsg({ type: "success", text: res.data?.message || `Audit completed for ${deptName}` });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to complete audit." });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      <Header />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar role={userRole === "ROLE_DIRECTOR" ? "IQAC_COORDINATOR" : "HOD"} active={activeSection} onSelect={setActiveSection} />
        <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

          {activeSection === "requiredFiles" ? (
            <RequiredFilesSection />
          ) : (
            <div>
              <PageHeader
                title={userRole === "ROLE_DIRECTOR" ? "IQAC Director Audit Dashboard" : "IQAC Invigilator Dashboard"}
                subtitle="Overview of Academic Audits, Department Progress, Required Files, and Academic Calendars."
              />

              {loading ? (
                <Spinner />
              ) : (
                <>
                  {/* Top Stats Cards */}
                  {stats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                      <Card title="Total Departments" value={stats.totalDepartments || stats.departmentName || "10"} icon="🏢" color="#1e3a8a" />
                      <Card title="Academic Submitted" value={stats.academicSubmitted || 0} icon="📑" color="#047857" />
                      <Card title="Department Files Submitted" value={stats.deptSubmitted || 0} icon="📁" color="#b45309" />
                      <Card title="Overall Progress" value={`${stats.overallProgress || stats.completionPercentage || 0}%`} icon="📊" color="#6d28d9" />
                    </div>
                  )}

                  {/* Academic Calendar Grid Card */}
                  {calendar && calendar.academicYear && (
                    <div style={{ background: "#ffffff", borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 17, color: "#0f172a" }}>Academic Calendar Grid ({calendar.academicYear})</h3>
                        <StatusBadge status={calendar.status || "ACTIVE"} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, fontSize: 13, background: "#f8fafc", padding: 14, borderRadius: 8 }}>
                        <div><span style={{ color: "#64748b" }}>Reopening:</span> <strong>{calendar.reopeningDate}</strong></div>
                        <div><span style={{ color: "#64748b" }}>CAT 1 Date:</span> <strong>{calendar.cat1Date}</strong></div>
                        <div><span style={{ color: "#64748b" }}>CAT 2 Date:</span> <strong>{calendar.cat2Date}</strong></div>
                        <div><span style={{ color: "#64748b" }}>CAT 3 Date:</span> <strong>{calendar.cat3Date}</strong></div>
                        <div><span style={{ color: "#64748b" }}>Last Working Day:</span> <strong>{calendar.lastWorkingDay}</strong></div>
                        <div><span style={{ color: "#64748b" }}>Practical Exams:</span> <strong>{calendar.practicalExamDate}</strong></div>
                        <div><span style={{ color: "#64748b" }}>Theory Exams:</span> <strong>{calendar.theoryExamDate}</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Department Summary Table */}
                  <div style={{ background: "#ffffff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: 17, color: "#0f172a" }}>Department Audit Progress Summary</h3>
                    <Table
                      columns={[
                        { key: "name", label: "Department Name" },
                        { key: "code", label: "Code" },
                        { key: "academicSubmitted", label: "Academic Files", render: (v, r) => `${v || 0} / ${r.courseTotal || 0}` },
                        { key: "deptSubmitted", label: "Dept Files", render: (v, r) => `${v || 0} / ${r.deptTotal || 0}` },
                        { key: "progress", label: "Progress", render: (v) => `${v || 0}%` },
                        { key: "status", label: "Audit Status", render: (v) => <StatusBadge status={v} /> },
                      ]}
                      data={deptSummary}
                      actions={(row) => (
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {row.status === "AUDIT_COMPLETED" ? (
                            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Audit Completed (Stored in DB)</span>
                          ) : (
                            userRole === "ROLE_DIRECTOR" && (
                              <Btn size="sm" variant="success" onClick={() => handleCompleteAudit(row.departmentId, row.name)}>
                                Mark Audit Complete
                              </Btn>
                            )
                          )}
                        </div>
                      )}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
