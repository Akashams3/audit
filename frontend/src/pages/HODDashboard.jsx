import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AcademicYearSemesterFilter from "../components/AcademicYearSemesterFilter";
import Modal from "../components/Modal";
import RequiredFilesSection from "../components/RequiredFilesSection";
import { StatusBadge, Btn, Input, Select, Card, PageHeader, Table, Spinner, Alert } from "../components/UI";
import * as api from "../api/endpoints";

const ROLE = "HOD";

// ── Profile ──────────────────────────────────────────────────────────────────
function ProfileSection() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);
  const [changePasswordForm, setChangePasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    api.getMyHodProfile().then(r => { setProfile(r.data); setForm(r.data); }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      const r = await api.updateMyHodProfile(form);
      setProfile(r.data); setEditing(false); setMsg({ type: "success", text: "Profile updated!" });
    } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Failed" }); }
  };

  const handleChangePassword = async () => {
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    try {
      await api.changePassword({ currentPassword: changePasswordForm.oldPassword, newPassword: changePasswordForm.newPassword });
      setMsg({ type: "success", text: "Password changed successfully!" });
      setShowChangePassword(false);
      setChangePasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Failed to change password" });
    }
  };

  if (!profile) return <Spinner />;
  return (
    <div>
      <PageHeader title="My Profile" action={
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => setShowChangePassword(true)}>Change Password</Btn>
          <Btn onClick={() => setEditing(true)}>Edit Profile</Btn>
        </div>
      } />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ background: "#fff", borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", maxWidth: 480 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["Name", "hodName"], ["Email", "email"]].map(([label, key]) => (
            <div key={key} style={{ display: "flex", gap: 12 }}>
              <span style={{ width: 120, color: "#6b7280", fontSize: 14 }}>{label}</span>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{profile[key] || "—"}</span>
            </div>
          ))}
        </div>
      </div>
      {editing && (
        <Modal title="Edit Profile" onClose={() => setEditing(false)}>
          <Input label="Name" value={form.hodName || ""} onChange={e => setForm({ ...form, hodName: e.target.value })} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="outline" onClick={() => setEditing(false)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
      {showChangePassword && (
        <Modal title="Change Password" onClose={() => setShowChangePassword(false)}>
          <Input label="Current Password" type="password" value={changePasswordForm.oldPassword} onChange={e => setChangePasswordForm({ ...changePasswordForm, oldPassword: e.target.value })} />
          <Input label="New Password" type="password" value={changePasswordForm.newPassword} onChange={e => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })} />
          <Input label="Confirm New Password" type="password" value={changePasswordForm.confirmPassword} onChange={e => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Btn>
            <Btn onClick={handleChangePassword}>Change Password</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Faculty ──────────────────────────────────────────────────────────────────
function FacultySection() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ facultyName: "", email: "", designation: "" });

  const load = () => api.getFaculties().then(r => setItems(r.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      await api.createFaculty(form);
      setMsg({ type: "success", text: "Faculty created!" }); setShowForm(false); load();
    } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Failed" }); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await api.deleteFaculty(id); setMsg({ type: "success", text: "Deleted!" }); load(); }
    catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Failed" }); }
  };

  return (
    <div>
      <PageHeader title="Faculty Management" action={<Btn onClick={() => setShowForm(true)}>+ Add Faculty</Btn>} />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "facultyName", label: "Name" },
            { key: "email", label: "Email" },
            { key: "designation", label: "Designation" },
          ]}
          data={items}
          actions={(row) => (
            <Btn size="sm" variant="danger" onClick={() => del(row.id)}>Delete</Btn>
          )}
        />
      </div>
      {showForm && (
        <Modal title="Add Faculty" onClose={() => setShowForm(false)}>
          <Input label="Name" value={form.facultyName} onChange={e => setForm({ ...form, facultyName: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Designation" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="outline" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={submit}>Create</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Lesson Plans ──────────────────────────────────────────────────────────────
function LessonPlansSection() {
  const [plans, setPlans] = useState([]);
  const [msg, setMsg] = useState(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterSem, setFilterSem] = useState("");

  const load = () => api.getLessonPlans({ academicYear: filterYear || undefined }).then(r => {
    let data = r.data?.data || [];
    if (filterSem) {
      const s = filterSem.toUpperCase();
      data = data.filter((p) => (p.semester || "").toUpperCase() === s);
    }
    setPlans(data);
  }).catch(() => {});
  useEffect(() => { load(); }, [filterYear, filterSem]);

  const action = async (fn, id, label) => {
    if (!window.confirm(`${label}?`)) return;
    try { await fn(id); setMsg({ type: "success", text: `${label} done` }); load(); }
    catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Failed" }); }
  };

  return (
    <div>
      <PageHeader title="Lesson Plans" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ marginBottom: 16 }}>
        <AcademicYearSemesterFilter
          academicYear={filterYear}
          semester={filterSem}
          onAcademicYear={setFilterYear}
          onSemester={setFilterSem}
        />
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "subject", label: "Subject" },
            { key: "unitName", label: "Unit" },
            { key: "topic", label: "Topic" },
            { key: "plannedHours", label: "Planned" },
            { key: "completedHours", label: "Completed" },
            { key: "academicYear", label: "Year" },
            { key: "semester", label: "Sem" },
            { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
          ]}
          data={plans}
          actions={() => null}
        />
      </div>
    </div>
  );
}

// ── Timetable ──────────────────────────────────────────────────────────────────
function TimetableSection() {
  const [timetables, setTimetables] = useState([]);
  const [msg, setMsg] = useState(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterSem, setFilterSem] = useState("");

  const load = () =>
    api.getTimetables({
      academicYear: filterYear || undefined,
      semester: filterSem || undefined,
    }).then((r) => {
      const raw = r.data?.data ?? r.data ?? [];
      setTimetables(api.distinctTimetablePlans(Array.isArray(raw) ? raw : []));
    }).catch(() => {});
  useEffect(() => { load(); }, [filterYear, filterSem]);

  const download = async (params) => {
    try {
      await api.downloadTimetableToClient(params, "timetable.xlsx");
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Download failed" });
    }
  };

  return (
    <div>
      <PageHeader title="Timetable" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ marginBottom: 16 }}>
        <AcademicYearSemesterFilter
          academicYear={filterYear}
          semester={filterSem}
          onAcademicYear={setFilterYear}
          onSemester={setFilterSem}
        />
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "academicYear", label: "Academic Year" },
            { key: "semester", label: "Semester" },
          ]}
          data={timetables}
          actions={(row) => (
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="sm" onClick={() => download({ academicYear: row.academicYear, semester: row.semester })}>Download</Btn>
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ── Materials ─────────────────────────────────────────────────────────────────
function MaterialsSection() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterSem, setFilterSem] = useState("");

  const load = () => api.getMaterials({
    academicYear: filterYear || undefined,
    semester: filterSem || undefined,
  }).then(r => {
    const data = r.data?.data || [];
    // Filter to show only SUBMITTED items to HOD
    const filtered = data.filter(item => item.status === "SUBMITTED" || item.status === "APPROVED" || item.status === "REJECTED");
    setItems(filtered);
  }).catch(() => {});
  useEffect(() => { load(); }, [filterYear, filterSem]);

  const action = async (fn, id, label) => {
    if (!window.confirm(`${label}?`)) return;
    try { await fn(id); setMsg({ type: "success", text: `${label} done` }); load(); }
    catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Failed" }); }
  };

  const downloadMaterial = async (id, title) => {
    try {
      await api.downloadMaterialToClient(id, title);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Download failed" });
    }
  };

  return (
    <div>
      <PageHeader title="Materials" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ marginBottom: 16 }}>
        <AcademicYearSemesterFilter
          academicYear={filterYear}
          semester={filterSem}
          onAcademicYear={setFilterYear}
          onSemester={setFilterSem}
        />
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "title", label: "Title" },
            { key: "subject", label: "Subject" },
            { key: "academicYear", label: "Year" },
            { key: "semester", label: "Semester" },
            { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
          ]}
          data={items}
          actions={(row) => (
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <Btn size="sm" onClick={() => downloadMaterial(row.id, row.title)}>Download</Btn>
              {row.status === "SUBMITTED" && (
                <>
                  <Btn size="sm" variant="success" onClick={() => action(api.approveMaterial, row.id, "Approve")}>Approve</Btn>
                  <Btn size="sm" variant="danger" onClick={() => action(api.rejectMaterial, row.id, "Reject")}>Reject</Btn>
                </>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ── E-Resources ───────────────────────────────────────────────────────────────
function EResourcesSection() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);
  const [filterYear, setFilterYear] = useState("");

  const load = () => api.getEResources({ academicYear: filterYear || undefined }).then(r => {
    const data = r.data?.data || [];
    const filtered = data.filter(item => item.status === "SUBMITTED" || item.status === "APPROVED" || item.status === "REJECTED");
    setItems(filtered);
  }).catch(() => {});
  useEffect(() => { load(); }, [filterYear]);

  const action = async (fn, id, label) => {
    if (!window.confirm(`${label}?`)) return;
    try { await fn(id); setMsg({ type: "success", text: `${label} done` }); load(); }
    catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Failed" }); }
  };

  const downloadEResource = async (id, fileName) => {
    try {
      await api.downloadEResourceToClient(id, fileName);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Download failed" });
    }
  };

  return (
    <div>
      <PageHeader title="E-Resources" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ marginBottom: 16 }}>
        <AcademicYearSemesterFilter
          academicYear={filterYear}
          semester=""
          onAcademicYear={setFilterYear}
          onSemester={() => {}}
          showSemester={false}
        />
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "title", label: "Title" },
            { key: "subject", label: "Subject" },
            { key: "className", label: "Class" },
            { key: "type", label: "Type" },
            { key: "academicYear", label: "Year" },
            { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
          ]}
          data={items}
          actions={(row) => (
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              {row.type === "FILE" && <Btn size="sm" onClick={() => downloadEResource(row.id, row.fileName)}>Download</Btn>}
              {row.type === "LINK" && <Btn size="sm" variant="outline" onClick={() => downloadEResource(row.id, row.fileName)}>Open link</Btn>}
              {row.status === "SUBMITTED" && (
                <>
                  <Btn size="sm" variant="success" onClick={() => action(api.approveEResource, row.id, "Approve")}>Approve</Btn>
                  <Btn size="sm" variant="danger" onClick={() => action(api.rejectEResource, row.id, "Reject")}>Reject</Btn>
                </>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ── Video Lectures ────────────────────────────────────────────────────────────
function VideoLecturesSection() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);
  const [filterYear, setFilterYear] = useState("");

  const load = () => api.getVideoLectures({ academicYear: filterYear || undefined }).then(r => {
    const data = r.data?.data || [];
    // Filter to show only SUBMITTED items to HOD
    const filtered = data.filter(item => item.status === "SUBMITTED" || item.status === "APPROVED" || item.status === "REJECTED");
    setItems(filtered);
  }).catch(() => {});
  useEffect(() => { load(); }, [filterYear]);

  const action = async (fn, id, label) => {
    if (!window.confirm(`${label}?`)) return;
    try { await fn(id); setMsg({ type: "success", text: `${label} done` }); load(); }
    catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Failed" }); }
  };

  return (
    <div>
      <PageHeader title="Video Lectures" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ marginBottom: 16 }}>
        <AcademicYearSemesterFilter
          academicYear={filterYear}
          semester=""
          onAcademicYear={setFilterYear}
          onSemester={() => {}}
          showSemester={false}
        />
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "title", label: "Title" },
            { key: "subject", label: "Subject" },
            { key: "className", label: "Class" },
            { key: "academicYear", label: "Year" },
            { key: "videoUrl", label: "URL", render: (v) => v ? <a href={v} target="_blank" rel="noreferrer" style={{ color: "#1a3a5c" }}>🔗</a> : "—" },
            { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
          ]}
          data={items}
          actions={(row) => (
            row.status === "SUBMITTED" && (
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <Btn size="sm" variant="success" onClick={() => action(api.approveVideoLecture, row.id, "Approve")}>Approve</Btn>
                <Btn size="sm" variant="danger" onClick={() => action(api.rejectVideoLecture, row.id, "Reject")}>Reject</Btn>
              </div>
            )
          )}
        />
      </div>
    </div>
  );
}

// ── CCM Members ───────────────────────────────────────────────────────────────
function CcmSection() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => api.getCcmMembers({}).then(r => setItems(r.data?.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="CCM Members" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "role", label: "Role" },
            { key: "className", label: "Class" },
            { key: "academicYear", label: "Year" },
          ]}
          data={items}
        />
      </div>
    </div>
  );
}

// ── COCM Members ──────────────────────────────────────────────────────────────
function CocmSection() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => api.getCocmMembers({}).then(r => setItems(r.data?.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="COCM Members" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "role", label: "Role" },
            { key: "academicYear", label: "Year" },
          ]}
          data={items}
        />
      </div>
    </div>
  );
}

// ── Class Incharge ────────────────────────────────────────────────────────────
function InchargeSection() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => api.getClassIncharges({}).then(r => setItems(r.data?.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Class Incharge" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "facultyName", label: "Faculty" },
            { key: "className", label: "Class" },
            { key: "academicYear", label: "Year" },
          ]}
          data={items}
        />
      </div>
    </div>
  );
}

// ── Class Mentor ──────────────────────────────────────────────────────────────
function MentorSection() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => api.getClassMentors({}).then(r => setItems(r.data?.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Class Mentor" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "facultyName", label: "Faculty" },
            { key: "className", label: "Class" },
            { key: "academicYear", label: "Year" },
          ]}
          data={items}
        />
      </div>
    </div>
  );
}

// ── Curriculum ────────────────────────────────────────────────────────────────
function CurriculumSection() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterSem, setFilterSem] = useState("");

  const load = () => api.getCurriculums({ academicYear: filterYear || undefined }).then(r => {
    let data = r.data?.data || [];
    if (filterSem) {
      const s = filterSem.toUpperCase();
      data = data.filter((c) => (c.semester || "").toUpperCase() === s);
    }
    setItems(data);
  }).catch(() => {});
  useEffect(() => { load(); }, [filterYear, filterSem]);

  const download = async (id, fileName) => {
    try {
      await api.downloadCurriculumToClient(id, fileName || "curriculum.pdf");
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Download failed" });
    }
  };

  return (
    <div>
      <PageHeader title="Curriculum & Syllabus" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ marginBottom: 16 }}>
        <AcademicYearSemesterFilter
          academicYear={filterYear}
          semester={filterSem}
          onAcademicYear={setFilterYear}
          onSemester={setFilterSem}
        />
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <Table
          columns={[
            { key: "fileName", label: "File" },
            { key: "academicYear", label: "Year" },
            { key: "semester", label: "Semester" },
            { key: "regulation", label: "Regulation" },
          ]}
          data={items}
          actions={(row) => (
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="sm" onClick={() => download(row.id, row.fileName)}>Download</Btn>
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ── Change Password ───────────────────────────────────────────────────────────
function ChangePasswordSection() {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [msg, setMsg] = useState(null);

  const submit = async () => {
    if (form.newPassword !== form.confirmPassword) { setMsg({ type: "error", text: "Passwords do not match" }); return; }
    try {
      await api.changePassword({ currentPassword: form.oldPassword, newPassword: form.newPassword });
      setMsg({ type: "success", text: "Password changed!" });
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Failed" }); }
  };

  return (
    <div>
      <PageHeader title="Change Password" />
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ background: "#fff", borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", maxWidth: 400 }}>
        <Input label="Current Password" type="password" value={form.oldPassword} onChange={e => setForm({ ...form, oldPassword: e.target.value })} />
        <Input label="New Password" type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
        <Input label="Confirm New Password" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
        <Btn onClick={submit}>Change Password</Btn>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardOverview() {
  const [counts, setCounts] = useState({ faculty: 0, lessonPlans: 0, materials: 0, pending: 0 });
  useEffect(() => {
    Promise.allSettled([
      api.getFaculties(),
      api.getLessonPlans({}),
      api.getMaterials({}),
    ]).then(([f, lp, mat]) => {
      const lpData = lp.value?.data?.data || [];
      setCounts({
        faculty: f.value?.data?.length || 0,
        lessonPlans: lpData.length,
        materials: mat.value?.data?.data?.length || 0,
        pending: lpData.filter(x => x.status === "SUBMITTED").length,
      });
    });
  }, []);

  return (
    <div>
      <PageHeader title="HOD Dashboard" subtitle="Department overview and approvals" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Card title="Faculty" value={counts.faculty} icon="👥" color="#1a3a5c" />
        <Card title="Lesson Plans" value={counts.lessonPlans} icon="📋" color="#16a34a" />
        <Card title="Materials" value={counts.materials} icon="📁" color="#d97706" />
        <Card title="Pending Approvals" value={counts.pending} icon="⏳" color="#dc2626" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HODDashboard() {
  const [active, setActive] = useState("dashboard");

  const sections = {
    dashboard: <DashboardOverview />,
    profile: <ProfileSection />,
    requiredFiles: <RequiredFilesSection />,
    faculty: <FacultySection />,
    lessonplans: <LessonPlansSection />,
    timetable: <TimetableSection />,
    materials: <MaterialsSection />,
    eresources: <EResourcesSection />,
    videoLectures: <VideoLecturesSection />,
    ccm: <CcmSection />,
    cocm: <CocmSection />,
    incharge: <InchargeSection />,
    mentor: <MentorSection />,
    curriculum: <CurriculumSection />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" }}>
      <Header />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar role={ROLE} active={active} onSelect={setActive} />
        <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {sections[active] || <DashboardOverview />}
        </main>
      </div>
    </div>
  );
}
