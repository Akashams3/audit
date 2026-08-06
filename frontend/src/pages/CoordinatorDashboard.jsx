import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AcademicYearSemesterFilter from "../components/AcademicYearSemesterFilter";
import RequiredFilesSection from "../components/RequiredFilesSection";
import * as api from "../api/endpoints";
import {
  getMyCoordinatorProfile,
  updateMyCoordinatorProfile,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getHods,
  createHod,
  deleteHod,
  getFaculties,
  createFaculty,
  deleteFaculty,
  getCcmMembers,
  createCcmMember,
  updateCcmMember,
  deleteCcmMember,
  getCocmMembers,
  createCocmMember,
  updateCocmMember,
  deleteCocmMember,
  getClassIncharges,
  createClassIncharge,
  updateClassIncharge,
  deleteClassIncharge,
  getClassMentors,
  createClassMentor,
  updateClassMentor,
  deleteClassMentor,
  getLessonPlans,
  getMaterials,
  getEResources,
  getVideoLectures,
  getTimetables,
  uploadTimetable,
  deleteTimetable,
  getCurriculums,
  uploadCurriculum,
  deleteCurriculum,
  distinctTimetablePlans,
  downloadMaterialToClient,
  downloadEResourceToClient,
  downloadCurriculumToClient,
  downloadTimetableToClient,
  changePassword
} from "../api/endpoints";

const LIST_FILTER_SECTIONS = new Set([
  "lessonplans",
  "materials",
  "eresources",
  "videoLectures",
  "timetable",
  "curriculum",
]);

function CoordinatorDashboard() {
   const [activeSection, setActiveSection] = useState("dashboard");
   const [profile, setProfile] = useState(null);
   const [departments, setDepartments] = useState([]);
   const [hods, setHods] = useState([]);
   const [faculties, setFaculties] = useState([]);
   const [ccmMembers, setCcmMembers] = useState([]);
   const [cocmMembers, setCocmMembers] = useState([]);
   const [classIncharges, setClassIncharges] = useState([]);
   const [classMentors, setClassMentors] = useState([]);
   const [lessonPlans, setLessonPlans] = useState([]);
   const [materials, setMaterials] = useState([]);
   const [eResources, setEResources] = useState([]);
   const [videoLectures, setVideoLectures] = useState([]);
   const [timetables, setTimetables] = useState([]);
   const [curriculums, setCurriculums] = useState([]);
   const [showModal, setShowModal] = useState(false);
   const [modalType, setModalType] = useState("");
   const [formData, setFormData] = useState({});
   const [editMode, setEditMode] = useState(false);
   const [notification, setNotification] = useState({ show: false, message: "", type: "" });
   const [loading, setLoading] = useState(false);
   const [filterYear, setFilterYear] = useState("");
   const [filterSem, setFilterSem] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    loadSectionData();
  }, [activeSection, filterYear, filterSem]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const fetchProfile = async () => {
    try {
      const res = await getMyCoordinatorProfile();
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

   const loadSectionData = async () => {
     setLoading(true);
     try {
       switch (activeSection) {
         case "departments":
           try {
             const deptRes = await getDepartments();
             setDepartments(Array.isArray(deptRes.data?.data) ? deptRes.data.data : Array.isArray(deptRes.data) ? deptRes.data : []);
           } catch (err) {
             console.error("Error loading departments:", err);
             setDepartments([]);
             showNotification("Error loading departments", "error");
           }
           break;
         case "hods":
           try {
             const hodRes = await getHods();
             setHods(Array.isArray(hodRes.data?.data) ? hodRes.data.data : Array.isArray(hodRes.data) ? hodRes.data : []);
           } catch (err) {
             console.error("Error loading hods:", err);
             setHods([]);
             showNotification("Error loading HODs", "error");
           }
           break;
         case "faculty":
           try {
             const facRes = await getFaculties();
             setFaculties(Array.isArray(facRes.data?.data) ? facRes.data.data : Array.isArray(facRes.data) ? facRes.data : []);
           } catch (err) {
             console.error("Error loading faculties:", err);
             setFaculties([]);
             showNotification("Error loading faculties", "error");
           }
           break;
         case "ccm":
           try {
             const ccmRes = await getCcmMembers();
             setCcmMembers(ccmRes.data?.data || ccmRes.data || []);
           } catch (err) {
             console.error("Error loading ccm members:", err);
             setCcmMembers([]);
             showNotification("Error loading CCM members", "error");
           }
           break;
         case "cocm":
           try {
             const cocmRes = await getCocmMembers();
             setCocmMembers(cocmRes.data?.data || cocmRes.data || []);
           } catch (err) {
             console.error("Error loading cocm members:", err);
             setCocmMembers([]);
             showNotification("Error loading COCM members", "error");
           }
           break;
         case "incharge":
           try {
             const inchargeRes = await getClassIncharges();
             setClassIncharges(inchargeRes.data?.data || inchargeRes.data || []);
           } catch (err) {
             console.error("Error loading class incharges:", err);
             setClassIncharges([]);
             showNotification("Error loading class incharges", "error");
           }
           break;
         case "mentor":
           try {
             const mentorRes = await getClassMentors();
             setClassMentors(mentorRes.data?.data || mentorRes.data || []);
           } catch (err) {
             console.error("Error loading class mentors:", err);
             setClassMentors([]);
             showNotification("Error loading class mentors", "error");
           }
           break;
         case "lessonplans":
           try {
             const lessonRes = await getLessonPlans({ academicYear: filterYear || undefined });
             let lp = lessonRes.data?.data ?? lessonRes.data;
             lp = Array.isArray(lp) ? lp : [];
             if (filterSem) {
               const s = filterSem.toUpperCase();
               lp = lp.filter((p) => (p.semester || "").toUpperCase() === s);
             }
             setLessonPlans(lp);
           } catch (err) {
             console.error("Error loading lesson plans:", err);
             setLessonPlans([]);
             showNotification("Error loading lesson plans", "error");
           }
           break;
         case "materials":
           try {
             const matRes = await getMaterials({
               academicYear: filterYear || undefined,
               semester: filterSem || undefined,
             });
             const list = matRes.data?.data ?? matRes.data;
             setMaterials(Array.isArray(list) ? list : []);
           } catch (err) {
             console.error("Error loading materials:", err);
             setMaterials([]);
             showNotification("Error loading materials", "error");
           }
           break;
         case "eresources":
           try {
             const eResRes = await getEResources({ academicYear: filterYear || undefined });
             setEResources(eResRes.data?.data || eResRes.data || []);
           } catch (err) {
             console.error("Error loading e-resources:", err);
             setEResources([]);
             showNotification("Error loading e-resources", "error");
           }
           break;
         case "videoLectures":
           try {
             const videoRes = await getVideoLectures({ academicYear: filterYear || undefined });
             setVideoLectures(videoRes.data?.data || videoRes.data || []);
           } catch (err) {
             console.error("Error loading video lectures:", err);
             setVideoLectures([]);
             showNotification("Error loading video lectures", "error");
           }
           break;
         case "timetable":
           try {
             const timeRes = await getTimetables({
               academicYear: filterYear || undefined,
               semester: filterSem || undefined,
             });
             const raw = timeRes.data?.data ?? timeRes.data ?? [];
             setTimetables(distinctTimetablePlans(Array.isArray(raw) ? raw : []));
           } catch (err) {
             console.error("Error loading timetables:", err);
             setTimetables([]);
             showNotification("Error loading timetables", "error");
           }
           break;
         case "curriculum":
           try {
             const curricRes = await getCurriculums({ academicYear: filterYear || undefined });
             let clist = curricRes.data?.data || curricRes.data || [];
             clist = Array.isArray(clist) ? clist : [];
             if (filterSem) {
               const s = filterSem.toUpperCase();
               clist = clist.filter((c) => (c.semester || "").toUpperCase() === s);
             }
             setCurriculums(clist);
           } catch (err) {
             console.error("Error loading curriculums:", err);
             setCurriculums([]);
             showNotification("Error loading curriculums", "error");
           }
           break;
       }
     } catch (err) {
       console.error("Error loading section data:", err);
       showNotification("Error loading data", "error");
     } finally {
       setLoading(false);
     }
   };

  const openModal = (type, data = {}) => {
    setModalType(type);
    setFormData(data);
    setEditMode(!!data.id);
    setShowModal(true);
    // Fetch departments if not already loaded
    if ((type === "hod" || type === "faculty") && departments.length === 0) {
      getDepartments().then(res => setDepartments(res.data || [])).catch(console.error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
    setEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        // Update existing
        switch (modalType) {
          case "department":
            await updateDepartment(formData.id, formData);
            break;
          case "ccm":
            await updateCcmMember(formData.id, formData);
            break;
          case "cocm":
            await updateCocmMember(formData.id, formData);
            break;
          case "incharge":
            await updateClassIncharge(formData.id, formData);
            break;
          case "mentor":
            await updateClassMentor(formData.id, formData);
            break;
        }
        showNotification("Updated successfully!");
      } else {
        // Create new
        switch (modalType) {
          case "department":
            await createDepartment(formData);
            break;
          case "hod":
            await createHod(formData);
            break;
          case "faculty":
            await createFaculty(formData);
            break;
          case "ccm":
            await createCcmMember(formData);
            break;
          case "cocm":
            await createCocmMember(formData);
            break;
          case "incharge":
            await createClassIncharge(formData);
            break;
          case "mentor":
            await createClassMentor(formData);
            break;
        }
        showNotification("Created successfully!");
      }
      closeModal();
      loadSectionData();
    } catch (err) {
      console.error("Error:", err);
      showNotification(err.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'}`, "error");
    }
  };

  const handleDelete = async (id, type) => {
    try {
      switch (type) {
        case "department":
          await deleteDepartment(id);
          break;
        case "hod":
          await deleteHod(id);
          break;
        case "faculty":
          await deleteFaculty(id);
          break;
        case "ccm":
          await deleteCcmMember(id);
          break;
        case "cocm":
          await deleteCocmMember(id);
          break;
        case "incharge":
          await deleteClassIncharge(id);
          break;
        case "mentor":
          await deleteClassMentor(id);
          break;
      }
      loadSectionData();
      showNotification("Deleted successfully!");
    } catch (err) {
      console.error("Error deleting:", err);
      showNotification(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar role="IQAC_COORDINATOR" active={activeSection} onSelect={setActiveSection} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">IQAC Coordinator Dashboard</h1>
          {profile && <p className="text-sm text-gray-600">Welcome, {profile.name}</p>}
        </div>
        {notification.show && (
          <div className={`mx-6 mt-4 p-4 rounded-lg ${notification.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
            {notification.message}
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">
           {LIST_FILTER_SECTIONS.has(activeSection) && (
             <div className="mb-4">
               <AcademicYearSemesterFilter
                 academicYear={filterYear}
                 semester={filterSem}
                 onAcademicYear={setFilterYear}
                 onSemester={setFilterSem}
                 showSemester={activeSection !== "eresources" && activeSection !== "videoLectures"}
               />
             </div>
           )}
           {loading && (
             <div className="flex items-center justify-center h-full">
               <div className="text-gray-600 text-lg">Loading...</div>
             </div>
           )}
           {!loading && activeSection === "dashboard" && <DashboardOverview />}
           {!loading && activeSection === "profile" && <ProfileSection profile={profile} onUpdate={fetchProfile} />}
           {!loading && activeSection === "departments" && (
            <DataTable
              title="Departments"
              data={departments}
              columns={["id", "deptName"]}
              onAdd={() => openModal("department")}
              onEdit={(row) => openModal("department", row)}
              onDelete={(id) => handleDelete(id, "department")}
            />
          )}
           {!loading && activeSection === "hods" && (
             <DataTable
               title="HODs"
               data={hods}
               columns={["id", "hodName", "email"]}
               onAdd={() => openModal("hod")}
               onDelete={(id) => handleDelete(id, "hod")}
             />
           )}
           {!loading && activeSection === "faculty" && (
             <DataTable
               title="Faculty"
               data={faculties}
               columns={["id", "facultyName", "email", "designation"]}
               onAdd={() => openModal("faculty")}
               onDelete={(id) => handleDelete(id, "faculty")}
             />
           )}
            {!loading && activeSection === "requiredFiles" && (
              <RequiredFilesSection />
            )}
            {!loading && activeSection === "ccm" && (
             <DataTable
               title="CCM Members"
               data={ccmMembers}
               columns={["id", "name", "role", "className", "academicYear"]}
               onAdd={() => openModal("ccm")}
               onEdit={(row) => openModal("ccm", row)}
               onDelete={(id) => handleDelete(id, "ccm")}
             />
           )}
           {!loading && activeSection === "cocm" && (
             <DataTable
               title="COCM Members"
               data={cocmMembers}
               columns={["id", "name", "designation", "role", "academicYear"]}
               onAdd={() => openModal("cocm")}
               onEdit={(row) => openModal("cocm", row)}
               onDelete={(id) => handleDelete(id, "cocm")}
             />
           )}
           {!loading && activeSection === "incharge" && (
             <DataTable
               title="Class Incharges"
               data={classIncharges}
               columns={["id", "facultyName", "className", "academicYear"]}
               onAdd={() => openModal("incharge")}
               onEdit={(row) => openModal("incharge", row)}
               onDelete={(id) => handleDelete(id, "incharge")}
             />
           )}
           {!loading && activeSection === "mentor" && (
             <DataTable
               title="Class Mentors"
               data={classMentors}
               columns={["id", "facultyName", "className", "academicYear"]}
               onAdd={() => openModal("mentor")}
               onEdit={(row) => openModal("mentor", row)}
               onDelete={(id) => handleDelete(id, "mentor")}
             />
           )}
           {!loading && activeSection === "lessonplans" && (
             <DataTable
               title="Lesson Plans"
               data={lessonPlans}
               columns={["id", "facultyName", "subject", "semester", "status"]}
               showAdd={false}
             />
           )}
           {activeSection === "materials" && (
             <DataTable
               title="Materials"
               data={materials}
               columns={["id", "title", "facultyName", "subject", "status"]}
               showAdd={false}
               actions={(row) => (
                 <button onClick={() => {
                   downloadMaterialToClient(row.id, row.title).catch((err) => {
                     console.error("Download error:", err);
                     showNotification(err.message || "Failed to download material", "error");
                   });
                 }} className="text-blue-600 hover:text-blue-900">
                   Download
                 </button>
               )}
             />
           )}
           {!loading && activeSection === "eresources" && (
             <DataTable
               title="E-Resources"
               data={eResources}
               columns={["id", "title", "faculty.facultyName", "subject", "status"]}
               showAdd={false}
               actions={(row) => (
                 <button type="button" onClick={() => {
                   downloadEResourceToClient(row.id, row.fileName).catch((err) => {
                     console.error("Download error:", err);
                     showNotification(err.message || "Failed to download e-resource", "error");
                   });
                 }} className="text-blue-600 hover:text-blue-900">
                   {row.type === "LINK" ? "Open" : "Download"}
                 </button>
               )}
             />
           )}
           {!loading && activeSection === "videoLectures" && (
             <DataTable
               title="Video Lectures"
               data={videoLectures}
               columns={["id", "title", "faculty.facultyName", "subject", "status"]}
               showAdd={false}
               actions={(row) => (
                 <button onClick={() => {
                   if (row.videoUrl) {
                     window.open(row.videoUrl, '_blank');
                   } else {
                     showNotification("No video URL available", "error");
                   }
                 }} className="text-blue-600 hover:text-blue-900">
                   View
                 </button>
               )}
             />
           )}
           {!loading && activeSection === "timetable" && (
             <TimetableSection
               timetables={timetables}
               onUpload={uploadTimetable}
               onDownload={downloadTimetableToClient}
               onDelete={deleteTimetable}
               onRefresh={loadSectionData}
             />
           )}
           {!loading && activeSection === "curriculum" && (
             <CurriculumSection
               curriculums={curriculums}
               onUpload={uploadCurriculum}
               onDownload={downloadCurriculumToClient}
               onDelete={deleteCurriculum}
               onRefresh={loadSectionData}
             />
           )}
        </main>
        </div>
      </div>

      {showModal && (
        <Modal
          title={`${editMode ? 'Edit' : 'Add'} ${modalType}`}
          onClose={closeModal}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          type={modalType}
          departments={departments}
          editMode={editMode}
        />
      )}
    </div>
  );
}

function DashboardOverview() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [dept, hod, fac, ccm, cocm, incharge, mentor, lesson, mat, eRes, video, time, curric] = await Promise.all([
        getDepartments().catch(() => ({ data: [] })),
        getHods().catch(() => ({ data: [] })),
        getFaculties().catch(() => ({ data: [] })),
        getCcmMembers().catch(() => ({ data: { data: [] } })),
        getCocmMembers().catch(() => ({ data: { data: [] } })),
        getClassIncharges().catch(() => ({ data: { data: [] } })),
        getClassMentors().catch(() => ({ data: { data: [] } })),
        getLessonPlans().catch(() => ({ data: [] })),
        getMaterials().catch(() => ({ data: [] })),
        getEResources().catch(() => ({ data: [] })),
        getVideoLectures().catch(() => ({ data: [] })),
        getTimetables().catch(() => ({ data: [] })),
        getCurriculums().catch(() => ({ data: [] }))
      ]);
      setStats({
        departments: (dept.data || []).length,
        hods: (hod.data || []).length,
        faculties: (fac.data || []).length,
        ccmMembers: (ccm.data?.data || ccm.data || []).length,
        cocmMembers: (cocm.data?.data || cocm.data || []).length,
        classIncharges: (incharge.data?.data || incharge.data || []).length,
        classMentors: (mentor.data?.data || mentor.data || []).length,
        lessonPlans: (lesson.data?.data || []).length,
        materials: (mat.data?.data || []).length,
        eResources: (eRes.data?.data || []).length,
        videoLectures: (video.data?.data || []).length,
        timetables: distinctTimetablePlans(time.data?.data || time.data || []).length,
        curriculums: (curric.data?.data || []).length
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Departments" value={stats.departments || 0} color="bg-blue-500" />
        <StatCard title="HODs" value={stats.hods || 0} color="bg-green-500" />
        <StatCard title="Faculties" value={stats.faculties || 0} color="bg-purple-500" />
        <StatCard title="CCM Members" value={stats.ccmMembers || 0} color="bg-orange-500" />
        <StatCard title="COCM Members" value={stats.cocmMembers || 0} color="bg-indigo-500" />
        <StatCard title="Class Incharges" value={stats.classIncharges || 0} color="bg-pink-500" />
        <StatCard title="Class Mentors" value={stats.classMentors || 0} color="bg-teal-500" />
        <StatCard title="Lesson Plans" value={stats.lessonPlans || 0} color="bg-cyan-500" />
        <StatCard title="Materials" value={stats.materials || 0} color="bg-red-500" />
        <StatCard title="E-Resources" value={stats.eResources || 0} color="bg-yellow-500" />
        <StatCard title="Video Lectures" value={stats.videoLectures || 0} color="bg-gray-500" />
        <StatCard title="Timetables" value={stats.timetables || 0} color="bg-blue-700" />
        <StatCard title="Curriculums" value={stats.curriculums || 0} color="bg-green-700" />
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} text-white p-6 rounded-lg shadow`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function ProfileSection({ profile, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [changePasswordForm, setChangePasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        coordinatorName: profile.coordinatorName || profile.name,
        email: profile.email
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMyCoordinatorProfile(formData);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

   const handleChangePassword = async (e) => {
     e.preventDefault();
     try {
       await changePassword({ currentPassword: changePasswordForm.oldPassword, newPassword: changePasswordForm.newPassword });
       setShowChangePassword(false);
       setChangePasswordForm({ oldPassword: "", newPassword: "" });
       alert("Password changed successfully!");
     } catch (err) {
       console.error("Error changing password:", err);
       alert(err.response?.data?.message || "Failed to change password");
     }
   };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Profile</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChangePassword(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Change Password
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                name="coordinatorName"
                value={formData.coordinatorName || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <p><strong>Name:</strong> {profile.coordinatorName || profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
        </div>
      )}
      {showChangePassword && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-bold mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={changePasswordForm.oldPassword}
                  onChange={(e) => setChangePasswordForm({ ...changePasswordForm, oldPassword: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function DataTable({ title, data: rawData, columns, onAdd, onEdit, onDelete, showAdd = true, actions }) {
  const data = Array.isArray(rawData) ? rawData : [];
  const [deleteId, setDeleteId] = useState(null);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {showAdd && onAdd && (
          <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            + Add New
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col}
                </th>
              ))}
              {(onEdit || onDelete || actions) && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm">
                      {col.split('.').reduce((obj, key) => obj?.[key], row) || "-"}
                    </td>
                  ))}
                  {(onEdit || onDelete || actions) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        deleteId === row.id ? (
                          <span className="space-x-2">
                            <button
                              onClick={() => { onDelete(row.id); setDeleteId(null); }}
                              className="text-red-600 hover:text-red-900 font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteId(row.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )
                      )}
                      {actions && actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Modal({ title, onClose, onSubmit, formData, setFormData, type, departments, editMode }) {
  const handleChange = (e) => {
    const value = e.target.type === "number" ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <form onSubmit={onSubmit}>
          {type === "department" && (
            <>
              <input
                name="deptName"
                placeholder="Department Name"
                className="w-full p-2 border rounded mb-3"
                value={formData.deptName || ""}
                onChange={handleChange}
                required
              />
            </>
          )}
          {(type === "hod" || type === "faculty") && (
            <>
              <input
                name={type === "hod" ? "hodName" : "facultyName"}
                placeholder="Name"
                className="w-full p-2 border rounded mb-3"
                value={formData[type === "hod" ? "hodName" : "facultyName"] || ""}
                onChange={handleChange}
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full p-2 border rounded mb-3"
                value={formData.email || ""}
                onChange={handleChange}
                required
              />
              {type === "faculty" && (
                <input
                  name="designation"
                  placeholder="Designation"
                  className="w-full p-2 border rounded mb-3"
                  value={formData.designation || ""}
                  onChange={handleChange}
                />
              )}
              <select
                name="departmentId"
                className="w-full p-2 border rounded mb-3"
                value={formData.departmentId || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments && departments.length > 0 ? (
                  departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.deptName}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading departments...</option>
                )}
              </select>
              <p className="text-sm text-gray-600 mb-3">
                Default password: {type === "hod" ? "Hod@1234" : "Faculty@1234"}
              </p>
            </>
          )}
          {(type === "ccm" || type === "cocm" || type === "incharge" || type === "mentor") && (
            <>
              {(type === "ccm" || type === "cocm") && (
                <>
                  <input
                    name="name"
                    placeholder="Name"
                    className="w-full p-2 border rounded mb-3"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                  />
                  {type === "cocm" && (
                    <input
                      name="designation"
                      placeholder="Designation"
                      className="w-full p-2 border rounded mb-3"
                      value={formData.designation || ""}
                      onChange={handleChange}
                    />
                  )}
                  <input
                    name="role"
                    placeholder="Role"
                    className="w-full p-2 border rounded mb-3"
                    value={formData.role || ""}
                    onChange={handleChange}
                  />
                  {type === "ccm" && (
                    <input
                      name="className"
                      placeholder="Class Name"
                      className="w-full p-2 border rounded mb-3"
                      value={formData.className || ""}
                      onChange={handleChange}
                      required
                    />
                  )}
                  <input
                    name="academicYear"
                    placeholder="Academic Year (e.g., 2024-25)"
                    className="w-full p-2 border rounded mb-3"
                    value={formData.academicYear || ""}
                    onChange={handleChange}
                    required
                  />
                </>
              )}
              {(type === "incharge" || type === "mentor") && (
                <>
                  <input
                    name="facultyId"
                    type="number"
                    placeholder="Faculty ID"
                    className="w-full p-2 border rounded mb-3"
                    value={formData.facultyId || ""}
                    onChange={handleChange}
                    required
                  />
                  <input
                    name="className"
                    placeholder="Class Name"
                    className="w-full p-2 border rounded mb-3"
                    value={formData.className || ""}
                    onChange={handleChange}
                    required
                  />
                  <input
                    name="academicYear"
                    placeholder="Academic Year (e.g., 2024-25)"
                    className="w-full p-2 border rounded mb-3"
                    value={formData.academicYear || ""}
                    onChange={handleChange}
                    required
                  />
                </>
              )}
            </>
          )}
          {type === "timetable" && (
            <>
              <input
                name="year"
                placeholder="Academic Year (e.g. 2024-25)"
                className="w-full p-2 border rounded mb-3"
                value={formData.year || ""}
                onChange={handleChange}
                required
              />
              <select
                name="semester"
                className="w-full p-2 border rounded mb-3"
                value={formData.semester || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select Semester</option>
                <option value="ODD">ODD</option>
                <option value="EVEN">EVEN</option>
              </select>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                className="w-full p-2 border rounded mb-3"
                required
              />
            </>
          )}
          {type === "curriculum" && (
            <>
              <input
                name="academicYear"
                placeholder="Academic Year (e.g. 2024-25)"
                className="w-full p-2 border rounded mb-3"
                value={formData.academicYear || ""}
                onChange={handleChange}
                required
              />
              <select
                name="semester"
                className="w-full p-2 border rounded mb-3"
                value={formData.semester || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select Semester</option>
                <option value="ODD">ODD</option>
                <option value="EVEN">EVEN</option>
              </select>
              <input
                name="regulation"
                placeholder="Regulation (e.g. R2021)"
                className="w-full p-2 border rounded mb-3"
                value={formData.regulation || ""}
                onChange={handleChange}
                required
              />
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                className="w-full p-2 border rounded mb-3"
                required
              />
            </>
          )}
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Submit
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TimetableSection({ timetables, onUpload, onDownload, onDelete, onRefresh }) {
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({});

  const handleUpload = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("file", formData.file);
    try {
      await onUpload(fd, { year: formData.year, semester: formData.semester });
      setShowUpload(false);
      setFormData({});
      onRefresh?.();
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleDownload = (row) => {
    onDownload({ academicYear: row.academicYear, semester: row.semester }, "timetable.xlsx").catch(console.error);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete timetable for ${row.academicYear} — ${row.semester}?`)) return;
    try {
      await onDelete({ academicYear: row.academicYear, semester: row.semester });
      onRefresh?.();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Timetables</h2>
        <button onClick={() => setShowUpload(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Upload Timetable
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timetables.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  No timetables available
                </td>
              </tr>
            ) : (
              timetables.map((row, idx) => (
                <tr key={`${row.academicYear}-${row.semester}-${idx}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{row.academicYear || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{row.semester || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button type="button" onClick={() => handleDownload(row)} className="text-blue-600 hover:text-blue-900">
                      Download
                    </button>
                    <button type="button" onClick={() => handleDelete(row)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showUpload && (
        <Modal
          title="Upload Timetable"
          onClose={() => setShowUpload(false)}
          onSubmit={handleUpload}
          formData={formData}
          setFormData={setFormData}
          type="timetable"
        />
      )}
    </div>
  );
}

function CurriculumSection({ curriculums, onUpload, onDownload, onDelete, onRefresh }) {
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({});

  const handleUpload = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("file", formData.file);
    fd.append("academicYear", formData.academicYear);
    fd.append("semester", formData.semester);
    fd.append("regulation", formData.regulation);
    try {
      await onUpload(fd);
      setShowUpload(false);
      setFormData({});
      onRefresh?.();
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm("Delete this curriculum entry?")) return;
    try {
      await onDelete(id);
      onRefresh?.();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Curriculums & Syllabi</h2>
        <button onClick={() => setShowUpload(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Upload Curriculum
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regulation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {curriculums.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No curriculums available
                </td>
              </tr>
            ) : (
              curriculums.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{row.fileName || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{row.academicYear || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{row.semester || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{row.regulation || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button type="button" onClick={() => onDownload(row.id, row.fileName || "curriculum.pdf").catch(console.error)} className="text-blue-600 hover:text-blue-900">
                      Download
                    </button>
                    <button type="button" onClick={() => handleDeleteRow(row.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showUpload && (
        <Modal
          title="Upload Curriculum"
          onClose={() => setShowUpload(false)}
          onSubmit={handleUpload}
          formData={formData}
          setFormData={setFormData}
          type="curriculum"
        />
      )}
    </div>
  );
}

export default CoordinatorDashboard;
