package com.iqac.audit.controller.audit;

import com.iqac.audit.entity.audit.AuditSchedule;
import com.iqac.audit.entity.audit.AuditStatus;
import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.notification.Notification;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.FacultyRole;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.entity.user.Role;
import com.iqac.audit.entity.user.User;
import com.iqac.audit.repository.audit.AuditScheduleRepository;
import com.iqac.audit.repository.audit.AuditStatusRepository;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.department.DepartmentRepository;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.repository.notification.EmailLogRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.HodRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import com.iqac.audit.repository.user.RoleRepository;
import com.iqac.audit.repository.user.UserRepository;
import com.iqac.audit.service.notification.EmailService;
import com.iqac.audit.service.notification.NotificationService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/invigilator")
public class IqacInvigilatorAuditController {

    @Autowired
    private IqacInvigilatorRepository iqacInvigilatorRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private AcademicFileRepository academicFileRepository;

    @Autowired
    private DepartmentFileRepository departmentFileRepository;

    @Autowired
    private AuditStatusRepository auditStatusRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/assign-audit-work")
    public ResponseEntity<?> assignAuditWork(@RequestBody Map<String, Object> payload) {
        try {
            Long scheduleId = Long.valueOf(payload.get("scheduleId").toString());
            AuditSchedule schedule = auditScheduleRepository.findById(scheduleId)
                    .orElseThrow(() -> new RuntimeException("Schedule not found."));

            List<?> facultyIdsRaw = (List<?>) payload.get("facultyIds");
            List<Long> facultyIds = new ArrayList<>();
            for (Object id : facultyIdsRaw) {
                facultyIds.add(Long.valueOf(id.toString()));
            }

            List<Faculty> faculties = facultyRepository.findAllById(facultyIds);
            for (Faculty fac : faculties) {
                notificationService.createNotification(fac.getUser(),
                        "You have been assigned to prepare files for the upcoming audit: " + schedule.getTitle() + ". Due date is " + schedule.getDueDate() + ".",
                        "AUDIT_ASSIGNMENT", "Audit Work Assigned");
                
                String html = "<html><body>" +
                        "<h3 style='color:#1A56DB;'>Audit Work Assigned</h3>" +
                        "<p>Dear " + fac.getName() + ",</p>" +
                        "<p>You have been assigned to prepare and submit your required files for the upcoming audit:</p>" +
                        "<ul><li><strong>Audit Title:</strong> " + schedule.getTitle() + "</li>" +
                        "<li><strong>Audit Date:</strong> " + schedule.getAuditDate() + "</li>" +
                        "<li><strong>Due Date:</strong> " + schedule.getDueDate() + "</li></ul>" +
                        "<p>Please log in to the portal and upload your files before the deadline.</p>" +
                        "<p>Best regards,<br/>IQAC Invigilator</p></body></html>";
                emailService.sendHtmlEmail(fac.getUser().getEmail(), "Audit Work Assigned: " + schedule.getTitle(), html);
            }

            return ResponseEntity.ok(Collections.singletonMap("message", "Work assigned successfully to " + faculties.size() + " faculties."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailLogRepository emailLogRepository;

    @Autowired
    private RequiredFileRepository requiredFileRepository;

    @Autowired
    private com.iqac.audit.repository.file.AcademicCalendarRepository academicCalendarRepository;

    @GetMapping("/academic-calendar")
    public ResponseEntity<?> getAcademicCalendar() {
        Optional<com.iqac.audit.entity.file.AcademicCalendar> calOpt = academicCalendarRepository.findFirstByStatusOrderByCreatedAtDesc("ACTIVE");
        if (calOpt.isPresent()) {
            return ResponseEntity.ok(calOpt.get());
        }
        Optional<com.iqac.audit.entity.file.AcademicCalendar> latestOpt = academicCalendarRepository.findFirstByOrderByIdDesc();
        if (latestOpt.isPresent()) {
            return ResponseEntity.ok(latestOpt.get());
        }
        return ResponseEntity.ok(Collections.emptyMap());
    }

    @Autowired
    private AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private HodRepository hodRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private IqacInvigilator getAuthenticatedInvigilator() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByUsernameOrEmail(principal);
        if (invOpt.isPresent()) {
            return invOpt.get();
        }
        Optional<Hod> hodOpt = hodRepository.findByUsernameOrEmail(principal);
        if (hodOpt.isPresent()) {
            Hod hod = hodOpt.get();
            IqacInvigilator tempInv = new IqacInvigilator();
            tempInv.setName(hod.getName());
            tempInv.setDepartment(hod.getDepartment());
            tempInv.setUser(hod.getUser());
            return tempInv;
        }
        throw new RuntimeException("Logged in user is not a registered IQAC Invigilator or HOD");
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        IqacInvigilator invigilator = getAuthenticatedInvigilator();
        String deptCode = invigilator.getDepartment().getCode();
        
        List<Faculty> faculties = facultyRepository.findByDepartmentCode(deptCode);
        long facultyCount = faculties.size();
        
        List<RequiredFile> requiredFiles = requiredFileRepository.findAll();
        
        long totalExpectedAcademic = 0;
        long totalSubmittedAcademic = 0;
        
        for (Faculty f : faculties) {
            Set<String> submittedAcademicTypes = new HashSet<>();
            List<AcademicFile> aFiles = academicFileRepository.findByFacultyId(f.getId());
            for (AcademicFile cf : aFiles) {
                submittedAcademicTypes.add(cf.getDocumentType());
            }
            
            for (RequiredFile rf : requiredFiles) {
                if (rf.getFileCategory().equals("ACADEMIC")) {
                    if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                        totalExpectedAcademic++;
                        if (submittedAcademicTypes.contains(rf.getFileName())) {
                            totalSubmittedAcademic++;
                        }
                    }
                }
            }
        }

        long totalExpectedDept = 0;
        long totalSubmittedDept = 0;
        
        Set<String> submittedDeptTypes = new HashSet<>();
        List<DepartmentFile> dFiles = departmentFileRepository.findByDepartment(deptCode);
        for (DepartmentFile df : dFiles) {
            submittedDeptTypes.add(df.getDocumentType());
        }
        
        for (RequiredFile rf : requiredFiles) {
            if (rf.getFileCategory().equals("DEPARTMENT")) {
                totalExpectedDept++;
                if (submittedDeptTypes.contains(rf.getFileName())) {
                    totalSubmittedDept++;
                }
            }
        }
        
        double overallCompletion = 0.0;
        long totalSubmitted = totalSubmittedAcademic + totalSubmittedDept;
        long totalExpected = totalExpectedAcademic + totalExpectedDept;
        if (totalExpected > 0) {
            overallCompletion = Math.round((double) totalSubmitted / totalExpected * 100);
        }

        long remindersCount = emailLogRepository.findAll().stream()
                .filter(log -> log.getSubject().contains("Reminder") && log.getSentAt().isAfter(LocalDateTime.now().minusDays(7)))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("departmentName", invigilator.getDepartment().getName());
        stats.put("departmentCode", deptCode);
        stats.put("academicSubmitted", totalSubmittedAcademic);
        stats.put("courseTotal", totalExpectedAcademic);
        stats.put("deptSubmitted", totalSubmittedDept);
        stats.put("deptTotal", totalExpectedDept);
        stats.put("totalFaculty", facultyCount);
        stats.put("remindersSentThisWeek", remindersCount);
        stats.put("completionPercentage", overallCompletion);

        String auditStatus = "IN_PROGRESS";
        Optional<AuditStatus> statusOpt = auditStatusRepository.findByDepartmentCode(deptCode);
        if (statusOpt.isPresent()) {
            auditStatus = statusOpt.get().getStatus();
        }
        stats.put("auditStatus", auditStatus);

        return ResponseEntity.ok(stats);
    }

    @GetMapping({"/academic-files"})
    public ResponseEntity<?> getAcademiaFiles() {
        IqacInvigilator inv = getAuthenticatedInvigilator();
        return ResponseEntity.ok(academicFileRepository.findByDepartment(inv.getDepartment().getCode()));
    }

    @GetMapping("/department-files")
    public ResponseEntity<?> getDeptFiles() {
        IqacInvigilator inv = getAuthenticatedInvigilator();
        return ResponseEntity.ok(departmentFileRepository.findByDepartment(inv.getDepartment().getCode()));
    }

    @GetMapping("/faculty-status")
    public ResponseEntity<?> getFacultyStatus() {
        IqacInvigilator invigilator = getAuthenticatedInvigilator();
        String deptCode = invigilator.getDepartment().getCode();
        
        List<Faculty> faculties = facultyRepository.findByDepartmentCode(deptCode);
        List<Map<String, Object>> facultyList = new ArrayList<>();
        List<RequiredFile> requiredFiles = requiredFileRepository.findAll();

        for (Faculty f : faculties) {
            Map<String, Object> map = new HashMap<>();
            map.put("facultyId", f.getId());
            map.put("name", f.getName());
            map.put("facultyCode", f.getFacultyCode());
            map.put("email", f.getUser().getEmail());

            // put designations and faculty roles
            map.put("designations", f.getDesignations());
            List<String> roleNames = new ArrayList<>();
            if (f.getFacultyRoles() != null) {
                for (FacultyRole fr : f.getFacultyRoles()) {
                    roleNames.add(fr.getName());
                }
            }
            map.put("facultyRoles", String.join(", ", roleNames));

            List<AcademicFile> academiaFiles = academicFileRepository.findByFacultyId(f.getId());
            List<DepartmentFile> deptFiles = departmentFileRepository.findByFacultyId(f.getId());

            Set<String> submittedAcademicTypes = new HashSet<>();
            for (AcademicFile cf : academiaFiles) {
                submittedAcademicTypes.add(cf.getDocumentType());
            }

            Set<String> submittedDeptTypes = new HashSet<>();
            for (DepartmentFile df : deptFiles) {
                submittedDeptTypes.add(df.getDocumentType());
            }

            long academicExpected = 0;
            long academicSubmitted = 0;
            for (RequiredFile rf : requiredFiles) {
                if (rf.getFileCategory().equals("ACADEMIC")) {
                    if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                        academicExpected++;
                        if (submittedAcademicTypes.contains(rf.getFileName())) {
                            academicSubmitted++;
                        }
                    }
                }
            }

            long deptExpected = 0;
            long deptSubmitted = 0;
            for (RequiredFile rf : requiredFiles) {
                if (rf.getFileCategory().equals("DEPARTMENT")) {
                    deptExpected++;
                    if (submittedDeptTypes.contains(rf.getFileName())) {
                        deptSubmitted++;
                    }
                }
            }

            map.put("academiaFilesSubmitted", academicSubmitted);
            map.put("academiaFilesTotal", academicExpected);
            map.put("courseFilesSubmitted", academicSubmitted);
            map.put("courseFilesTotal", academicExpected);
            map.put("departmentFilesSubmitted", deptSubmitted);
            map.put("departmentFilesTotal", deptExpected);

            LocalDateTime lastUpdated = null;
            for (AcademicFile file : academiaFiles) {
                if (lastUpdated == null || file.getUploadedDate().isAfter(lastUpdated)) {
                    lastUpdated = file.getUploadedDate();
                }
            }
            for (DepartmentFile file : deptFiles) {
                if (lastUpdated == null || file.getUploadedDate().isAfter(lastUpdated)) {
                    lastUpdated = file.getUploadedDate();
                }
            }

            map.put("lastUpdated", lastUpdated);
            facultyList.add(map);
        }

        return ResponseEntity.ok(facultyList);
    }

    // Faculty & Invigilator: view required files (with stage, year, semester filtering)
    @GetMapping("/required-files")
    public ResponseEntity<?> getRequiredFiles(
            @RequestParam(value = "stage", required = false) String stageStr,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "semester", required = false) String semester) {
        try {
            IqacInvigilator inv = getAuthenticatedInvigilator();
            Optional<AuditStatus> statusOpt = auditStatusRepository.findByDepartmentCode(inv.getDepartment().getCode());
            if (statusOpt.isPresent() && "AUDIT_COMPLETED".equalsIgnoreCase(statusOpt.get().getStatus())) {
                return ResponseEntity.ok(Collections.emptyList());
            }
        } catch (Exception ignored) {}

        com.iqac.audit.entity.audit.AuditStage stageEnum = null;
        if (stageStr != null && !stageStr.trim().isEmpty()) {
            try {
                stageEnum = com.iqac.audit.entity.audit.AuditStage.valueOf(stageStr.trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        List<RequiredFile> allFiles = requiredFileRepository.findAll();
        List<RequiredFile> filtered = new ArrayList<>();

        for (RequiredFile rf : allFiles) {
            if (stageEnum != null) {
                if (rf.getStages() != null && !rf.getStages().isEmpty() && !rf.getStages().contains(stageEnum)) {
                    continue;
                }
                if (stageEnum == com.iqac.audit.entity.audit.AuditStage.FPP && (rf.isXFile() || rf.getFileName().toLowerCase().contains("(x)"))) {
                    continue;
                }
            }
            if (year != null && !year.trim().isEmpty() && !"ALL".equalsIgnoreCase(year)) {
                if (!"ALL".equalsIgnoreCase(rf.getYear()) && !rf.getYear().equalsIgnoreCase(year)) {
                    continue;
                }
            }
            if (semester != null && !semester.trim().isEmpty() && !"ALL".equalsIgnoreCase(semester)) {
                if (!"ALL".equalsIgnoreCase(rf.getSemester()) && !rf.getSemester().equalsIgnoreCase(semester)) {
                    continue;
                }
            }
            filtered.add(rf);
        }
        return ResponseEntity.ok(filtered);
    }

    // Faculty & Invigilator: view schedules
    @GetMapping("/schedules")
    public ResponseEntity<?> getSchedules() {
        try {
            IqacInvigilator inv = getAuthenticatedInvigilator();
            String deptCode = inv.getDepartment().getCode();
            List<AuditSchedule> allSchedules = auditScheduleRepository.findAll();
            List<AuditSchedule> filtered = new ArrayList<>();
            for (AuditSchedule s : allSchedules) {
                if (s.getDepartmentCode() == null || s.getDepartmentCode().equals("ALL") || s.getDepartmentCode().equalsIgnoreCase(deptCode)) {
                    filtered.add(s);
                }
            }
            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
            // If it's a faculty member accessing this endpoint (since comment says "Faculty & Invigilator"), they don't have getAuthenticatedInvigilator()
            // Let's fallback to returning all schedules
            return ResponseEntity.ok(auditScheduleRepository.findAll());
        }
    }

    // Invigilator: send due-date reminder to specific faculty
    @PostMapping("/send-due-date-reminder")
    public ResponseEntity<?> sendDueDateReminder(@RequestBody Map<String, Object> payload) {
        try {
            Long facultyId = Long.valueOf(payload.get("facultyId").toString());
            String dueDate = payload.get("dueDate").toString();
            String message = payload.getOrDefault("message", "").toString();

            Faculty faculty = facultyRepository.findById(facultyId)
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));

            String html = "<html><body>" +
                    "<h3 style='color:#a32a2a;'>IQAC Audit Due Date Reminder</h3>" +
                    "<p>Dear " + faculty.getName() + ",</p>" +
                    "<p>This is a reminder that your audit file submission is due by <strong>" + dueDate + "</strong>.</p>" +
                    (message.isEmpty() ? "" : "<p>" + message + "</p>") +
                    "<p>Please upload all required files before the deadline.</p>" +
                    "<p>Best regards,<br/>IQAC Invigilator</p></body></html>";

            emailService.sendHtmlEmail(faculty.getUser().getEmail(), "Audit File Due Date Reminder", html);
            notificationService.createNotification(faculty.getUser(),
                    "Reminder: Your audit files are due by " + dueDate + ". Please submit before the deadline.",
                    "REMINDER", "Audit Due Date Reminder");

            return ResponseEntity.ok(Collections.singletonMap("message", "Due date reminder sent to " + faculty.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/send-reminders")
    public ResponseEntity<?> sendReminders(@RequestBody List<Long> facultyIds) {
        try {
            List<Faculty> faculties = facultyRepository.findAllById(facultyIds);
            
            for (Faculty f : faculties) {
                String html = emailService.buildReminderEmailHtml(f.getName());
                emailService.sendHtmlEmail(f.getUser().getEmail(), "IQAC Audit File Submission Reminder", html);

                notificationService.createNotification(f.getUser(), "Please upload your pending audit files before the deadline (Sent by IQAC Invigilator).",
                        "REMINDER", "File Submission Reminder");
            }

            return ResponseEntity.ok(Collections.singletonMap("message", "Reminders sent successfully to " + faculties.size() + " faculty members."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/notify-auditor")
    public ResponseEntity<?> notifyAuditor() {
        try {
            IqacInvigilator invigilator = getAuthenticatedInvigilator();
            String deptCode = invigilator.getDepartment().getCode();
            String deptName = invigilator.getDepartment().getName();

            AuditStatus auditStatus = auditStatusRepository.findByDepartmentCode(deptCode)
                    .orElseGet(() -> {
                        AuditStatus newStatus = new AuditStatus();
                        newStatus.setDepartment(invigilator.getDepartment());
                        return newStatus;
                    });

            auditStatus.setStatus("SUBMITTED_TO_AUDITOR");
            auditStatus.setLastUpdated(LocalDateTime.now());
            auditStatusRepository.save(auditStatus);

            String html = emailService.buildAuditorNotificationHtml(deptName);
            emailService.sendHtmlEmail("director@iqac.edu", "IQAC Audit Submission Notification", html);

            Optional<User> directorUserOpt = userRepository.findByUsername("director");
            if (directorUserOpt.isPresent()) {
                notificationService.createNotification(directorUserOpt.get(), "Department " + deptName + " has submitted all required files and is ready for audit.",
                        "AUDIT", "Department Ready for Audit");
            }

            return ResponseEntity.ok(Collections.singletonMap("message", "Auditor notified and department status updated to SUBMITTED_TO_AUDITOR"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/create-hod")
    public ResponseEntity<?> createHod(@RequestBody Map<String, String> payload) {
        try {
            IqacInvigilator invigilator = getAuthenticatedInvigilator();
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String departmentCode = payload.getOrDefault("departmentCode", invigilator.getDepartment().getCode());
            String profileImageBase64 = payload.get("profileImage");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username already exists."));
            }

            Department dept = departmentRepository.findByCode(departmentCode)
                    .orElse(invigilator.getDepartment());

            Role hodRole = roleRepository.findByName("ROLE_HOD")
                    .orElseThrow(() -> new RuntimeException("Role ROLE_HOD not found."));

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(hodRole);
            user.setEnabled(true);
            if (profileImageBase64 != null && !profileImageBase64.isEmpty()) {
                user.setProfileImageBase64(profileImageBase64);
            }

            Hod hod = new Hod();
            hod.setUser(user);
            hod.setName(name);
            hod.setDepartment(dept);

            hodRepository.save(hod);
            return ResponseEntity.ok(Collections.singletonMap("message", "HOD account created successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/create-faculty")
    public ResponseEntity<?> createFaculty(@RequestBody Map<String, String> payload) {
        try {
            IqacInvigilator invigilator = getAuthenticatedInvigilator();
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String departmentCode = payload.getOrDefault("departmentCode", invigilator.getDepartment().getCode());
            String designations = payload.getOrDefault("designations", "");
            String profileImageBase64 = payload.get("profileImage");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username (Faculty Code) already exists."));
            }

            Department dept = departmentRepository.findByCode(departmentCode)
                    .orElse(invigilator.getDepartment());

            Role facRole = roleRepository.findByName("ROLE_FACULTY")
                    .orElseThrow(() -> new RuntimeException("Role ROLE_FACULTY not found."));

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(facRole);
            user.setEnabled(true);
            if (profileImageBase64 != null && !profileImageBase64.isEmpty()) {
                user.setProfileImageBase64(profileImageBase64);
            }

            Faculty fac = new Faculty();
            fac.setUser(user);
            fac.setName(name);
            fac.setFacultyCode(username);
            fac.setDepartment(dept);
            fac.setDesignations(designations);

            facultyRepository.save(fac);
            return ResponseEntity.ok(Collections.singletonMap("message", "Faculty account created successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/create-invigilator")
    public ResponseEntity<?> createInvigilator(@RequestBody Map<String, String> payload) {
        try {
            IqacInvigilator currentInvigilator = getAuthenticatedInvigilator();
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String departmentCode = payload.getOrDefault("departmentCode", currentInvigilator.getDepartment().getCode());
            String profileImageBase64 = payload.get("profileImage");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username already exists."));
            }

            Department dept = departmentRepository.findByCode(departmentCode)
                    .orElse(currentInvigilator.getDepartment());

            Role invRole = roleRepository.findByName("ROLE_INVIGILATOR")
                    .orElseThrow(() -> new RuntimeException("Role ROLE_INVIGILATOR not found."));

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(invRole);
            user.setEnabled(true);
            if (profileImageBase64 != null && !profileImageBase64.isEmpty()) {
                user.setProfileImageBase64(profileImageBase64);
            }

            IqacInvigilator newInvigilator = new IqacInvigilator();
            newInvigilator.setUser(user);
            newInvigilator.setName(name);
            newInvigilator.setDepartment(dept);

            iqacInvigilatorRepository.save(newInvigilator);
            return ResponseEntity.ok(Collections.singletonMap("message", "Invigilator account created successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }
}