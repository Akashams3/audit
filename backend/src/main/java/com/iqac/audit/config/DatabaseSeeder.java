package com.iqac.audit.config;

import com.iqac.audit.entity.audit.AuditStage;
import com.iqac.audit.entity.audit.AuditStatus;
import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.user.Director;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.FacultyRole;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.entity.user.Role;
import com.iqac.audit.entity.user.User;
import com.iqac.audit.repository.audit.AuditStatusRepository;
import com.iqac.audit.repository.audit.FeedbackRepository;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.department.DepartmentRepository;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.repository.notification.NotificationRepository;
import com.iqac.audit.repository.user.DirectorRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.FacultyRoleRepository;
import com.iqac.audit.repository.user.HodRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import com.iqac.audit.repository.user.RoleRepository;
import com.iqac.audit.repository.user.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private FacultyRoleRepository facultyRoleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private IqacInvigilatorRepository iqacInvigilatorRepository;

    @Autowired
    private DirectorRepository directorRepository;

    @Autowired
    private HodRepository hodRepository;

    @Autowired
    private AuditStatusRepository auditStatusRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private AcademicFileRepository academicFileRepository;

    @Autowired
    private DepartmentFileRepository departmentFileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private RequiredFileRepository requiredFileRepository;

    @Override
    public void run(String... args) throws Exception {
        Role directorRole = getOrCreateRole("ROLE_DIRECTOR");
        Role invigilatorRole = getOrCreateRole("ROLE_INVIGILATOR");
        Role hodRole = getOrCreateRole("ROLE_HOD");
        Role facultyRole = getOrCreateRole("ROLE_FACULTY");

        Department cce = getOrCreateDept("Computer and Communication Engineering", "CCE");
        Department csbs = getOrCreateDept("Computer Science and Business Systems", "CSBS");
        Department cse = getOrCreateDept("Computer Science and Engineering", "CSE");
        Department aids = getOrCreateDept("Artificial Intelligence & Data Science", "AIDS");
        Department aiml = getOrCreateDept("Artificial Intelligence and Machine Learning", "AIML");
        Department vlsi = getOrCreateDept("VLSI Design and Technology", "VLSI");
        Department ece = getOrCreateDept("Electronics and Communication Engineering", "ECE");
        Department mech = getOrCreateDept("Mechanical Engineering", "MECH");
        Department biotech = getOrCreateDept("Biotechnology", "BIOTECH");
        Department hs = getOrCreateDept("Humanities and Sciences", "H&S");

        getOrCreateAuditStatus(cce);
        getOrCreateAuditStatus(csbs);
        getOrCreateAuditStatus(cse);
        getOrCreateAuditStatus(aids);
        getOrCreateAuditStatus(aiml);
        getOrCreateAuditStatus(vlsi);
        getOrCreateAuditStatus(ece);
        getOrCreateAuditStatus(mech);
        getOrCreateAuditStatus(biotech);
        getOrCreateAuditStatus(hs);

        if (userRepository.findByUsername("director").isEmpty() && userRepository.findByEmail("director@iqac.edu").isEmpty()) {
            User user = new User();
            user.setUsername("director");
            user.setEmail("director@iqac.edu");
            user.setPassword(passwordEncoder.encode("password"));
            user.setRole(directorRole);
            user.setEnabled(true);

            Director director = new Director();
            director.setUser(user);
            director.setName("Director");
            directorRepository.save(director);
        }

    
        getOrCreateFacultyRole("Class Incharge");
        getOrCreateFacultyRole("Mentor");
        getOrCreateFacultyRole("Mini Project Mentor");
        getOrCreateFacultyRole("Project Mentor");
        getOrCreateFacultyRole("CCM Coordinator");
        getOrCreateFacultyRole("Project Manager");

        // Required files start empty on initial run until Director selects and clicks "Start Selected Audit"
        // seedRequiredFiles();
    }

    private void seedRequiredFiles() {
        FacultyRole classIncharge = getOrCreateFacultyRole("Class Incharge");
        FacultyRole mentor = getOrCreateFacultyRole("Mentor");
        FacultyRole miniProjectMentor = getOrCreateFacultyRole("Mini Project Mentor");
        FacultyRole projectMentor = getOrCreateFacultyRole("Project Mentor");

        Set<AuditStage> allStages = EnumSet.of(AuditStage.FPP, AuditStage.POST_CAT_1, AuditStage.POST_CAT_2, AuditStage.POST_CAT_3);
        Set<AuditStage> postCat1Only = EnumSet.of(AuditStage.POST_CAT_1);
        Set<AuditStage> postCat2Only = EnumSet.of(AuditStage.POST_CAT_2);   
        Set<AuditStage> postCat3Only = EnumSet.of(AuditStage.POST_CAT_3);
        Set<AuditStage> fppAndPostCat1 = EnumSet.of(AuditStage.FPP, AuditStage.POST_CAT_1);
        Set<AuditStage> allPostCatStages = EnumSet.of(AuditStage.POST_CAT_1, AuditStage.POST_CAT_2, AuditStage.POST_CAT_3);

        createOrUpdateRequiredFile("Curriculum", "ACADEMIC", "Curriculum Document", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Syllabus", "ACADEMIC", "Syllabus Document", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CO, PO, PSO Mapping", "ACADEMIC", "CO, PO, PSO Mapping Document", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Lesson Planning", "ACADEMIC", "Lesson Planning Sheet", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Pedagogy / Reports", "ACADEMIC", "Pedagogy Reports", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course Committee Meeting – I", "ACADEMIC", "Course Committee Meeting 1 Minutes", true, false, postCat1Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course Committee Meeting – II", "ACADEMIC", "Course Committee Meeting 2 Minutes", true, false, postCat2Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course Committee Meeting – III", "ACADEMIC", "Course Committee Meeting 3 Minutes", true, false, postCat3Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Assignment Details", "ACADEMIC", "Assignment Details and Questions", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course PPT", "ACADEMIC", "Course PPT Presentation", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Green Book", "ACADEMIC", "Green Book Record", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Blue Book", "ACADEMIC", "Blue Book Record", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CAT 1 Question Paper & Answer Key", "ACADEMIC", "CAT 1 Question Paper & Answer Key", true, true, postCat1Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CAT 2 Question Paper & Answer Key", "ACADEMIC", "CAT 2 Question Paper & Answer Key", true, true, postCat2Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CAT 3 Question Paper & Answer Key", "ACADEMIC", "CAT 3 Question Paper & Answer Key", true, true, postCat3Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Internal Assessment Answer Script Sample", "ACADEMIC", "Internal Assessment Answer Script Sample", true, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Faculty Evaluator Name", "ACADEMIC", "Faculty Evaluator Name", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Remarks", "ACADEMIC", "Academic Remarks", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Cycle 1", "ACADEMIC", "Cycle 1 File", false, false, postCat1Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Cycle 2", "ACADEMIC", "Cycle 2 File", false, false, postCat2Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Cycle 3", "ACADEMIC", "Cycle 3 File", false, false, postCat3Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Faculty", "DEPARTMENT", "Faculty List & Details", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Remarks", "DEPARTMENT", "Department Remarks", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CO-PO Attainment Sheet (X)", "ACADEMIC", "CO-PO Attainment Sheet", true, true, postCat3Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("IMS Update", "ACADEMIC", "IMS Update Confirmation", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Mentor Details", "ACADEMIC", "Mentor Details & Formats", true, false, allStages, "ALL", "ALL", mentor);
        createOrUpdateRequiredFile("Class Committee Meeting 1 ", "ACADEMIC", "Class Committee Meeting 1 Minutes", true, true, postCat1Only, "ALL", "ALL", classIncharge);
        createOrUpdateRequiredFile("Class Committee Meeting 2 ", "ACADEMIC", "Class Committee Meeting 2 Minutes", true, true, postCat2Only, "ALL", "ALL", classIncharge);
        createOrUpdateRequiredFile("Class Committee Meeting 3", "ACADEMIC", "Class Committee Meeting 3 Minutes", true, true, postCat3Only, "ALL", "ALL", classIncharge);
        createOrUpdateRequiredFile("Mini Project", "ACADEMIC", "Mini Project Details & Guide Reports", false, false, allStages, "ALL", "ALL", miniProjectMentor);
        createOrUpdateRequiredFile("Project", "ACADEMIC", "Major Project Reports", false, false, allStages, "ALL", "ALL", projectMentor);
        createOrUpdateRequiredFile("PEC Seminar", "ACADEMIC", "PEC Seminar Documents", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("PEC Student Attendance ", "ACADEMIC", "PEC Student Attendance", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("PEC Delivery Content ", "ACADEMIC", "PEC Delivery Content", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("PEC Assessment ", "ACADEMIC", "PEC Assessment Details", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Assessment Outcome ", "ACADEMIC", "Assessment Outcome Report", false, true, postCat3Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course File", "ACADEMIC", "Overall Course File", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Fast Learner Encouragement ", "ACADEMIC", "Fast Learner Encouragement Details", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course Notes", "ACADEMIC", "Course Notes & Handouts", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Lab Manual", "ACADEMIC", "Lab Manual", false, false, allStages, "ALL", "ALL", null);
    }

    private void createOrUpdateRequiredFile(String fileName, String fileCategory, String description, boolean mandatory, boolean isXFile, Set<AuditStage> stages, String year, String semester, FacultyRole targetRole) {
        Optional<RequiredFile> opt = requiredFileRepository.findByFileName(fileName);
        RequiredFile rf;
        if (opt.isPresent()) {
            rf = opt.get();
        } else {
            rf = new RequiredFile();
            rf.setFileName(fileName);
            rf.setCreatedAt(LocalDateTime.now());
        }
        rf.setFileCategory(fileCategory);
        rf.setDescription(description);
        rf.setMandatory(mandatory);
        rf.setXFile(isXFile);
        rf.setStages(stages);
        rf.setYear(year);
        rf.setSemester(semester);
        rf.setTargetRole(targetRole);
        requiredFileRepository.save(rf);
    }

    private Role getOrCreateRole(String name) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            return roleRepository.save(role);
        });
    }

    private Department getOrCreateDept(String name, String code) {
        return departmentRepository.findByCode(code).orElseGet(() -> {
            Department dept = new Department();
            dept.setName(name);
            dept.setCode(code);
            return departmentRepository.save(dept);
        });
    }

    private void getOrCreateAuditStatus(Department dept) {
        if (auditStatusRepository.findByDepartmentId(dept.getId()).isEmpty()) {
            AuditStatus status = new AuditStatus();
            status.setDepartment(dept);
            status.setStatus("IN_PROGRESS");
            status.setLastUpdated(LocalDateTime.now());
            auditStatusRepository.save(status);
        }
    }

    private FacultyRole getOrCreateFacultyRole(String name) {
        return facultyRoleRepository.findByName(name).orElseGet(() -> {
            FacultyRole fr = new FacultyRole();
            fr.setName(name);
            return facultyRoleRepository.save(fr);
        });
    }
}