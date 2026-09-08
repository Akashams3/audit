import { useState, useEffect } from "react";
import AcademicYearSemesterFilter from "./AcademicYearSemesterFilter";
import Modal from "./Modal";
import { Btn, Input, Select, Table, StatusBadge, Alert, Spinner } from "./UI";
import * as api from "../api/endpoints";
import { getDisplayFileName } from "../utils/formatUtils";

export default function RequiredFilesSection() {
  const [stage, setStage] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [requiredFiles, setRequiredFiles] = useState([]);
  const [myAcademicFiles, setMyAcademicFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFileItem, setSelectedFileItem] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    courseName: "CSE-101",
    documentType: "",
    stage: "FPP",
    year: "1st Year",
    semester: "Sem 1",
    file: null,
    textContent: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (stage) params.stage = stage;
      if (year) params.year = year;
      if (semester) params.semester = semester;

      const [reqRes, myRes] = await Promise.allSettled([
        api.getFacultyRequiredFiles(params),
        api.getMyAcademicFiles(params),
      ]);

      if (reqRes.status === "fulfilled") {
        setRequiredFiles(reqRes.value.data || []);
      } else {
        setRequiredFiles([]);
      }

      if (myRes.status === "fulfilled") {
        setMyAcademicFiles(myRes.value.data || []);
      } else {
        setMyAcademicFiles([]);
      }
    } catch (err) {
      console.error("Error loading required files:", err);
      setMsg({ type: "error", text: "Failed to fetch required files." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stage, year, semester]);

  const openUploadModal = (item) => {
    setSelectedFileItem(item);
    setUploadForm({
      courseName: "CSE-101",
      documentType: item ? item.fileName : "",
      stage: stage || "FPP",
      year: year || "1st Year",
      semester: semester || "Sem 1",
      file: null,
      textContent: "",
    });
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (uploadForm.file) {
        formData.append("file", uploadForm.file);
      }
      if (uploadForm.textContent) {
        formData.append("textContent", uploadForm.textContent);
      }
      formData.append("courseName", uploadForm.courseName);
      formData.append("documentType", uploadForm.documentType);
      if (uploadForm.stage) formData.append("stage", uploadForm.stage);
      if (uploadForm.year) formData.append("year", uploadForm.year);
      if (uploadForm.semester) formData.append("semester", uploadForm.semester);

      if (selectedFileItem && selectedFileItem.fileCategory === "DEPARTMENT") {
        await api.uploadDepartmentFile(formData);
      } else {
        await api.uploadAcademicFile(formData);
      }

      setMsg({ type: "success", text: `Successfully submitted '${uploadForm.documentType}'!` });
      setShowUploadModal(false);
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Upload failed." });
    }
  };

  const getSubmissionForFile = (fileName) => {
    return myAcademicFiles.find((f) => f.documentType === fileName);
  };

  return (
    <div style={{ background: "#f8fafc", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>Required Audit Files</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>
            Filter required files by Audit Stage, Year, and Semester.
          </p>
        </div>
      </div>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      <div style={{ marginBottom: 20 }}>
        <AcademicYearSemesterFilter
          stage={stage}
          onStage={setStage}
          academicYear={year}
          onAcademicYear={setYear}
          semester={semester}
          onSemester={setSemester}
          showStage={true}
          showYear={true}
          showSemester={true}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : requiredFiles.length === 0 ? (
        <div style={{ background: "#f1f5f9", padding: 32, borderRadius: 10, textAlign: "center", border: "1px dashed #cbd5e1" }}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>📑</span>
          <h4 style={{ margin: 0, color: "#334155", fontSize: 16 }}>No Required Files Found</h4>
          <p style={{ margin: "6px 0 0 0", color: "#64748b", fontSize: 13 }}>
            If your department's audit is completed, active submission grids are hidden from the frontend display while remaining safely preserved in the database.
          </p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <Table
            columns={[
              {
                key: "fileName",
                label: "Document Name",
                render: (val, row) => (
                  <div>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{getDisplayFileName(val)}</span>
                    {row.mandatory && <span style={{ color: "#ef4444", marginLeft: 4, fontWeight: "bold" }}>*</span>}
                  </div>
                ),
              },
              { key: "fileCategory", label: "Category" },
              {
                key: "stages",
                label: "Audit Stages",
                render: (stages) => (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {Array.isArray(stages) && stages.length > 0 ? (
                      stages.map((s) => (
                        <span key={s} style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>All Stages</span>
                    )}
                  </div>
                ),
              },
              {
                key: "status",
                label: "Submission Status",
                render: (_, row) => {
                  const sub = getSubmissionForFile(row.fileName);
                  if (sub) {
                    return <StatusBadge status={sub.status || "SUBMITTED"} />;
                  }
                  return <span style={{ color: "#94a3b8", fontSize: 13 }}>Pending</span>;
                },
              },
            ]}
            data={requiredFiles}
            actions={(row) => {
              const sub = getSubmissionForFile(row.fileName);
              return (
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {sub ? (
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Uploaded</span>
                  ) : (
                    <Btn size="sm" onClick={() => openUploadModal(row)}>
                      Upload File
                    </Btn>
                  )}
                </div>
              );
            }}
          />
        </div>
      )}

      {showUploadModal && (
        <Modal title={`Upload: ${selectedFileItem?.fileName || "Required File"}`} onClose={() => setShowUploadModal(false)}>
          <form onSubmit={handleUploadSubmit}>
            <Input
              label="Course Name"
              value={uploadForm.courseName}
              onChange={(e) => setUploadForm({ ...uploadForm, courseName: e.target.value })}
              required
            />
            <Input
              label="Document Type"
              value={uploadForm.documentType}
              onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
              required
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Select label="Stage" value={uploadForm.stage} onChange={(e) => setUploadForm({ ...uploadForm, stage: e.target.value })}>
                <option value="FPP">FPP</option>
                <option value="POST_CAT_1">Post CAT 1</option>
                <option value="POST_CAT_2">Post CAT 2</option>
                <option value="POST_CAT_3">Post CAT 3 / End Sem</option>
              </Select>
              <Select label="Year" value={uploadForm.year} onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })}>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </Select>
              <Select label="Semester" value={uploadForm.semester} onChange={(e) => setUploadForm({ ...uploadForm, semester: e.target.value })}>
                <option value="Sem 1">Sem 1</option>
                <option value="Sem 2">Sem 2</option>
                <option value="Sem 3">Sem 3</option>
                <option value="Sem 4">Sem 4</option>
                <option value="Sem 5">Sem 5</option>
                <option value="Sem 6">Sem 6</option>
                <option value="Sem 7">Sem 7</option>
                <option value="Sem 8">Sem 8</option>
              </Select>
            </div>

            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Select File</label>
              <input
                type="file"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                style={{ fontSize: 13 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <Btn variant="outline" type="button" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Btn>
              <Btn type="submit" disabled={!uploadForm.file && !uploadForm.textContent}>
                Submit File
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
