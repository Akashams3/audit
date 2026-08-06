import api from "./api";
import { normalizeAcademicYearShort } from "../utils/academicYear";

/** Backend timetable APIs expect `academicYear`; forms may still use `year`. */
function timetableQueryParams(params = {}) {
  if (!params || typeof params !== "object") return {};
  const { academicYear, year, semester } = params;
  const out = {};
  const ay = academicYear ?? year;
  if (ay != null && ay !== "") out.academicYear = ay;
  if (semester != null && semester !== "") out.semester = semester;
  return out;
}

/** One DB row per slot; UI should list distinct academic year + semester. */
export function distinctTimetablePlans(rows) {
  if (!Array.isArray(rows)) return [];
  const map = new Map();
  for (const r of rows) {
    const academicYear = r.academicYear ?? r.year;
    const semester = r.semester;
    if (academicYear == null || academicYear === "" || semester == null || semester === "") continue;
    const ayKey = normalizeAcademicYearShort(academicYear) ?? academicYear;
    const key = `${ayKey}\0${semester}`;
    if (!map.has(key)) map.set(key, { academicYear, semester });
  }
  return [...map.values()];
}

export async function saveBlobDownloadResponse(res, defaultFilename = "download") {
  const blob = res.data;
  const ct = (res.headers["content-type"] || "").toLowerCase();
  const blobType = blob instanceof Blob ? (blob.type || "").toLowerCase() : "";
  if (ct.includes("application/json") || blobType.includes("application/json")) {
    const text = blob instanceof Blob ? await blob.text() : String(blob);
    let msg = "Download failed";
    try {
      const j = JSON.parse(text);
      msg = j.message || j.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const disp = res.headers["content-disposition"] || "";
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(disp);
  let filename = defaultFilename;
  if (m && m[1]) {
    try {
      filename = decodeURIComponent(m[1].trim());
    } catch {
      filename = m[1].trim();
    }
  }
  const outBlob = blob instanceof Blob ? blob : new Blob([blob], { type: res.headers["content-type"] || undefined });
  const url = window.URL.createObjectURL(outBlob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadEResourceToClient(id, fileNameHint) {
  const res = await api.get(`/iqac/academics/planning/e-resources/${id}/download`, { responseType: "blob" });
  const ct = (res.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    const j = JSON.parse(await res.data.text());
    const link = j?.data;
    if (typeof link === "string" && link) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }
    throw new Error(j?.message || "No link available");
  }
  await saveBlobDownloadResponse(res, fileNameHint || "e-resource");
}

export async function downloadMaterialToClient(id, title) {
  const safe = (title && String(title).replace(/[^\w.\-]+/g, "_").slice(0, 80)) || `material-${id}`;
  const res = await api.get(`/iqac/academics/planning/materials/${id}`, { responseType: "blob" });
  await saveBlobDownloadResponse(res, `${safe}.pdf`);
}

export async function downloadCurriculumToClient(id, fileNameHint) {
  const res = await api.get(`/iqac/academics/planning/curriculum-syllabus/${id}`, { responseType: "blob" });
  await saveBlobDownloadResponse(res, fileNameHint || "curriculum.pdf");
}

export async function downloadTimetableToClient(params, fileNameHint) {
  const res = await api.get("/iqac/academics/planning/timetable/download", {
    params: timetableQueryParams(params),
    responseType: "blob",
  });
  await saveBlobDownloadResponse(res, fileNameHint || "timetable.xlsx");
}

// Auth
export const login = (data) => api.post("/api/auth/login", data).catch(() => api.post("/iqac/auth/login", data));
export const changePassword = (data) => api.post("/iqac/auth/change-password", data);
export const forgotPassword = (data) => api.post("/iqac/auth/change-password", data);

// Department
export const getDepartments = () => api.get("/iqac/department");
export const getDepartment = (id) => api.get(`/iqac/department/${id}`);
export const createDepartment = (data) => api.post("/iqac/department", data);
export const updateDepartment = (id, data) => api.put(`/iqac/department/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/iqac/department/${id}`);

// Faculty
export const getFaculties = () => api.get("/iqac/faculty");
export const getMyFacultyProfile = () => api.get("/iqac/faculty/me");
export const getFaculty = (id) => api.get(`/iqac/faculty/${id}`);
export const createFaculty = (data) => api.post("/iqac/faculty", data);
export const updateMyFacultyProfile = (data) => api.put("/iqac/faculty/me", data);
export const deleteFaculty = (id) => api.delete(`/iqac/faculty/${id}`);

// HOD
export const getHods = () => api.get("/iqac/hod");
export const getMyHodProfile = () => api.get("/iqac/hod/me");
export const getHod = (id) => api.get(`/iqac/hod/${id}`);
export const createHod = (data) => api.post("/iqac/hod", data);
export const updateMyHodProfile = (data) => api.put("/iqac/hod/me", data);
export const deleteHod = (id) => api.delete(`/iqac/hod/${id}`);

// Coordinator
export const getMyCoordinatorProfile = () => api.get("/iqac/coordinator/me");
export const updateMyCoordinatorProfile = (data) => api.put("/iqac/coordinator/me", data);

// Lesson Plan
export const createLessonPlan = (data) => api.post("/iqac/academics/planning/lesson-plan", data);
export const getMyLessonPlans = () => api.get("/iqac/academics/planning/lesson-plan/my");
export const getLessonPlans = (params) => api.get("/iqac/academics/planning/lesson-plan", { params });
export const updateLessonPlan = (id, data) => api.put(`/iqac/academics/planning/lesson-plan/${id}`, data);
export const submitLessonPlan = (id) => api.put(`/iqac/academics/planning/lesson-plan/${id}/submit`);
export const approveLessonPlan = (id) => api.put(`/iqac/academics/planning/lesson-plan/${id}/approve`);
export const rejectLessonPlan = (id) => api.put(`/iqac/academics/planning/lesson-plan/${id}/reject`);
export const deleteLessonPlan = (id) => api.delete(`/iqac/academics/planning/lesson-plan/${id}`);

// Timetable
export const getTimetables = (params) => api.get("/iqac/academics/planning/timetable", { params });
export const uploadTimetable = (formData, params) =>
  api.post("/iqac/academics/planning/timetable/upload", formData, { params: timetableQueryParams(params) });
export const updateTimetable = (params, data) => api.put(`/iqac/academics/planning/timetable/${params.year}/${params.semester}/${params.day}/${params.period}`, data);
export const downloadTimetable = (params) =>
  api.get("/iqac/academics/planning/timetable/download", { params: timetableQueryParams(params), responseType: "blob" });
export const deleteTimetable = (params) => api.delete("/iqac/academics/planning/timetable", { params: timetableQueryParams(params) });

// Materials
export const createMaterial = (formData) => api.post("/iqac/academics/planning/materials", formData);
export const getMyMaterials = () => api.get("/iqac/academics/planning/materials/my");
export const getMaterials = (params) => api.get("/iqac/academics/planning/materials", { params });
export const updateMaterial = (id, data) => api.put(`/iqac/academics/planning/materials/${id}`, data);
export const submitMaterial = (id) => api.put(`/iqac/academics/planning/materials/${id}/submit`);
export const approveMaterial = (id) => api.put(`/iqac/academics/planning/materials/${id}/approve`);
export const rejectMaterial = (id) => api.put(`/iqac/academics/planning/materials/${id}/reject`);
export const downloadMaterial = (id) => api.get(`/iqac/academics/planning/materials/${id}`, { responseType: "blob" });
export const deleteMaterial = (id) => api.delete(`/iqac/academics/planning/materials/${id}`);

// E-Resources
export const createEResource = (formData) => api.post("/iqac/academics/planning/e-resources", formData);
export const getMyEResources = () => api.get("/iqac/academics/planning/e-resources/my");
export const getEResources = (params) => api.get("/iqac/academics/planning/e-resources", { params });
export const getEResource = (id) => api.get(`/iqac/academics/planning/e-resources/${id}`);
export const updateEResource = (id, formData) => api.put(`/iqac/academics/planning/e-resources/${id}`, formData);
export const submitEResource = (id) => api.put(`/iqac/academics/planning/e-resources/${id}/submit`);
export const approveEResource = (id) => api.put(`/iqac/academics/planning/e-resources/${id}/approve`);
export const rejectEResource = (id) => api.put(`/iqac/academics/planning/e-resources/${id}/reject`);
export const downloadEResource = (id) =>
  api.get(`/iqac/academics/planning/e-resources/${id}/download`, { responseType: "blob" });
export const deleteEResource = (id) => api.delete(`/iqac/academics/planning/e-resources/${id}`);

// Video Lectures
export const createVideoLecture = (data) => api.post("/iqac/academics/planning/video-lectures", data);
export const getMyVideoLectures = () => api.get("/iqac/academics/planning/video-lectures/my");
export const getVideoLectures = (params) => api.get("/iqac/academics/planning/video-lectures", { params });
export const getVideoLecture = (id) => api.get(`/iqac/academics/planning/video-lectures/${id}`);
export const updateVideoLecture = (id, data) => api.put(`/iqac/academics/planning/video-lectures/${id}`, data);
export const submitVideoLecture = (id) => api.put(`/iqac/academics/planning/video-lectures/${id}/submit`);
export const approveVideoLecture = (id) => api.put(`/iqac/academics/planning/video-lectures/${id}/approve`);
export const rejectVideoLecture = (id) => api.put(`/iqac/academics/planning/video-lectures/${id}/reject`);
export const deleteVideoLecture = (id) => api.delete(`/iqac/academics/planning/video-lectures/${id}`);

// Curriculum & Syllabus
export const uploadCurriculum = (formData) => api.post("/iqac/academics/planning/curriculum-syllabus", formData);
export const getCurriculums = (params) => api.get("/iqac/academics/planning/curriculum-syllabus", { params });
export const getCurriculum = (id) => api.get(`/iqac/academics/planning/curriculum-syllabus/${id}/details`);
export const downloadCurriculum = (id) => api.get(`/iqac/academics/planning/curriculum-syllabus/${id}`, { responseType: "blob" });
export const deleteCurriculum = (id) => api.delete(`/iqac/academics/planning/curriculum-syllabus/${id}`);

// Required Files & Audit File Submission
export const getFacultyRequiredFiles = (params) => api.get("/api/faculty/required-files", { params });
export const getInvigilatorRequiredFiles = (params) => api.get("/api/invigilator/required-files", { params });
export const uploadAcademicFile = (formData) => api.post("/api/faculty/academic-files", formData);
export const uploadDepartmentFile = (formData) => api.post("/api/faculty/department-files", formData);
export const getMyAcademicFiles = (params) => api.get("/api/faculty/academic-files", { params });
export const getMyDepartmentFiles = (params) => api.get("/api/faculty/department-files", { params });

// CCM Members
export const createCcmMember = (data) => api.post("/iqac/academics/planning/ccm/members", data);
export const getCcmMembers = (params) => api.get("/iqac/academics/planning/ccm/members", { params });
export const getCcmMember = (id) => api.get(`/iqac/academics/planning/ccm/members/${id}`);
export const updateCcmMember = (id, data) => api.put(`/iqac/academics/planning/ccm/members/${id}`, data);
export const deleteCcmMember = (id) => api.delete(`/iqac/academics/planning/ccm/members/${id}`);

// COCM Members
export const createCocmMember = (data) => api.post("/iqac/academics/planning/cocm/members", data);
export const getCocmMembers = (params) => api.get("/iqac/academics/planning/cocm/members", { params });
export const getCocmMember = (id) => api.get(`/iqac/academics/planning/cocm/members/${id}`);
export const updateCocmMember = (id, data) => api.put(`/iqac/academics/planning/cocm/members/${id}`, data);
export const deleteCocmMember = (id) => api.delete(`/iqac/academics/planning/cocm/members/${id}`);

// Class Incharge
export const createClassIncharge = (data) => api.post("/iqac/academics/planning/incharge", data);
export const getClassIncharges = (params) => api.get("/iqac/academics/planning/incharge", { params });
export const getClassIncharge = (id) => api.get(`/iqac/academics/planning/incharge/${id}`);
export const updateClassIncharge = (id, data) => api.put(`/iqac/academics/planning/incharge/${id}`, data);
export const deleteClassIncharge = (id) => api.delete(`/iqac/academics/planning/incharge/${id}`);
export const deleteClassInchargeByYear = (academicYear) => api.delete("/iqac/academics/planning/incharge", { params: { academicYear } });

// Class Mentor
export const createClassMentor = (data) => api.post("/iqac/academics/planning/mentor", data);
export const getClassMentors = (params) => api.get("/iqac/academics/planning/mentor", { params });
export const getClassMentor = (id) => api.get(`/iqac/academics/planning/mentor/${id}`);
export const updateClassMentor = (id, data) => api.put(`/iqac/academics/planning/mentor/${id}`, data);
export const deleteClassMentor = (id) => api.delete(`/iqac/academics/planning/mentor/${id}`);
export const deleteClassMentorByYear = (academicYear) => api.delete("/iqac/academics/planning/mentor", { params: { academicYear } });
