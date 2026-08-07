package com.iqac.audit.controller.audit;

import com.iqac.audit.entity.audit.AuditSchedule;
import com.iqac.audit.entity.audit.AuditStage;
import com.iqac.audit.entity.audit.AuditStatus;
import com.iqac.audit.entity.audit.Feedback;
import com.iqac.audit.entity.audit.LateUploadRequest;
import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.file.AcademicCalendar;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.user.Director;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.FacultyRole;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.entity.user.Role;
import com.iqac.audit.entity.user.User;
import com.iqac.audit.repository.audit.AuditScheduleRepository;
import com.iqac.audit.repository.audit.AuditStatusRepository;
import com.iqac.audit.repository.audit.FeedbackRepository;
import com.iqac.audit.repository.audit.LateUploadRequestRepository;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.department.DepartmentRepository;
import com.iqac.audit.repository.file.AcademicCalendarRepository;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.repository.user.DirectorRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.FacultyRoleRepository;
import com.iqac.audit.repository.user.HodRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import com.iqac.audit.repository.user.RoleRepository;
import com.iqac.audit.repository.user.UserRepository;
import com.iqac.audit.service.file.CalendarOcrService;
import com.iqac.audit.service.notification.EmailService;
import com.iqac.audit.service.notification.NotificationService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/director")
public class DirectorAuditController {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private AcademicFileRepository academicFileRepository;

    @Autowired
    private DepartmentFileRepository departmentFileRepository;

    @Autowired
    private AuditStatusRepository auditStatusRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private IqacInvigilatorRepository iqacInvigilatorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DirectorRepository directorRepository;

    @Autowired
    private AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private RequiredFileRepository requiredFileRepository;

    @Autowired
    private LateUploadRequestRepository lateUploadRequestRepository;

    @Autowired
    private HodRepository hodRepository;

    @Autowired
    private AcademicCalendarRepository academicCalendarRepository;

    @Autowired
    private CalendarOcrService calendarOcrService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private FacultyRoleRepository facultyRoleRepository;

    @Autowired
    private com.iqac.audit.repository.academic.AcademicYearRepository academicYearRepository;

    @Autowired
    private com.iqac.audit.repository.audit.AuditRepository auditRepository;

    @Autowired
    private com.iqac.audit.repository.audit.AuditLogRepository auditLogRepository;

    @Autowired
    private com.iqac.audit.service.audit.AuditLogService auditLogService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        List<Department> departments = departmentRepository.findAll();
        long totalDepartments = departments.size();
        
        List<RequiredFile> allReq = requiredFileRepository.findAll();
        List<RequiredFile> requiredFiles = new ArrayList<>();
        for (RequiredFile rf : allReq) {
            if (year != null && !year.trim().isEmpty() && !"ALL".equalsIgnoreCase(year)) {
                if (!"ALL".equalsIgnoreCase(rf.getYear()) && !rf.getYear().equalsIgnoreCase(year)) {
                    continue;
                }
            }
            if (academicYear != null && !academicYear.trim().isEmpty() && !"ALL".equalsIgnoreCase(academicYear)) {
                if (!"ALL".equalsIgnoreCase(rf.getAcademicYear()) && !rf.getAcademicYear().equalsIgnoreCase(academicYear)) {
                    continue;
                }
            }
            requiredFiles.add(rf);
        }

        long globalExpectedAcademic = 0;
        long globalSubmittedAcademic = 0;
        long globalExpectedDept = 0;
        long globalSubmittedDept = 0;

        for (Department d : departments) {
            List<Faculty> deptFaculties = facultyRepository.findByDepartmentCode(d.getCode());
            for (Faculty f : deptFaculties) {
                Set<String> submittedAcademicTypes = new HashSet<>();
                List<AcademicFile> aFiles = academicFileRepository.findByFacultyId(f.getId());
                for (AcademicFile cf : aFiles) {
                    submittedAcademicTypes.add(cf.getDocumentType());
                }
                
                for (RequiredFile rf : requiredFiles) {
                    if (rf.getFileCategory().equals("ACADEMIC")) {
                        if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                            globalExpectedAcademic++;
                            if (submittedAcademicTypes.contains(rf.getFileName())) {
                                globalSubmittedAcademic++;
                            }
                        }
                    }
                }
            }

            Set<String> submittedDeptTypes = new HashSet<>();
            List<DepartmentFile> dFiles = departmentFileRepository.findByDepartment(d.getCode());
            for (DepartmentFile df : dFiles) {
                submittedDeptTypes.add(df.getDocumentType());
            }
            
            for (RequiredFile rf : requiredFiles) {
                if (rf.getFileCategory().equals("DEPARTMENT")) {
                    globalExpectedDept++;
                    if (submittedDeptTypes.contains(rf.getFileName())) {
                        globalSubmittedDept++;
                    }
                }
            }
        }

        long totalSubmitted = globalSubmittedAcademic + globalSubmittedDept;
        long totalExpected = globalExpectedAcademic + globalExpectedDept;

        double overallProgress = 0.0;
        if (totalExpected > 0) {
            overallProgress = Math.round((double) totalSubmitted / totalExpected * 100);
        }

        long pendingDepts = 0;
        long completedDepts = 0;
        for (Department d : departments) {
            Optional<AuditStatus> statusOpt = auditStatusRepository.findByDepartmentId(d.getId());
            if (statusOpt.isPresent() && statusOpt.get().getStatus().equals("AUDIT_COMPLETED")) {
                completedDepts++;
            } else {
                pendingDepts++;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDepartments", totalDepartments);
        stats.put("academicSubmitted", globalSubmittedAcademic);
        stats.put("courseTotal", globalExpectedAcademic);
        stats.put("deptSubmitted", globalSubmittedDept);
        stats.put("deptTotal", globalExpectedDept);
        stats.put("overallProgress", overallProgress);
        stats.put("pendingDepartments", pendingDepts);
        stats.put("completedDepartments", completedDepts);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/department-summary")
    public ResponseEntity<?> getDepartmentSummary(
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        List<Department> departments = departmentRepository.findAll();
        List<Map<String, Object>> summaryList = new ArrayList<>();
        
        List<RequiredFile> allReq = requiredFileRepository.findAll();
        List<RequiredFile> requiredFiles = new ArrayList<>();
        for (RequiredFile rf : allReq) {
            if (year != null && !year.trim().isEmpty() && !"ALL".equalsIgnoreCase(year)) {
                if (!"ALL".equalsIgnoreCase(rf.getYear()) && !rf.getYear().equalsIgnoreCase(year)) {
                    continue;
                }
            }
            if (academicYear != null && !academicYear.trim().isEmpty() && !"ALL".equalsIgnoreCase(academicYear)) {
                if (!"ALL".equalsIgnoreCase(rf.getAcademicYear()) && !rf.getAcademicYear().equalsIgnoreCase(academicYear)) {
                    continue;
                }
            }
            requiredFiles.add(rf);
        }

        for (Department d : departments) {
            Map<String, Object> map = new HashMap<>();
            map.put("departmentId", d.getId());
            map.put("name", d.getName());
            map.put("code", d.getCode());

            List<Faculty> deptFaculties = facultyRepository.findByDepartmentCode(d.getCode());
            long totalExpectedAcademic = 0;
            long totalSubmittedAcademic = 0;
            
            for (Faculty f : deptFaculties) {
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
            List<DepartmentFile> dFiles = departmentFileRepository.findByDepartment(d.getCode());
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

            map.put("academicSubmitted", totalSubmittedAcademic);
            map.put("courseTotal", totalExpectedAcademic);
            map.put("deptSubmitted", totalSubmittedDept);
            map.put("deptTotal", totalExpectedDept);

            long totalSubmitted = totalSubmittedAcademic + totalSubmittedDept;
            long totalExpected = totalExpectedAcademic + totalExpectedDept;
            double progress = 0.0;
            if (totalExpected > 0) {
                progress = Math.round((double) totalSubmitted / totalExpected * 100);
            }
            map.put("progress", progress);

            String status = "IN_PROGRESS";
            Optional<AuditStatus> statusOpt = auditStatusRepository.findByDepartmentId(d.getId());
            if (statusOpt.isPresent()) {
                status = statusOpt.get().getStatus();
            }
            map.put("status", status);

            LocalDateTime lastUpdated = null;
            List<AcademicFile> academiaFiles = academicFileRepository.findByDepartment(d.getCode());
            for (AcademicFile file : academiaFiles) {
                if (lastUpdated == null || file.getUploadedDate().isAfter(lastUpdated)) {
                    lastUpdated = file.getUploadedDate();
                }
            }
            List<DepartmentFile> deptFiles = departmentFileRepository.findByDepartment(d.getCode());
            for (DepartmentFile file : deptFiles) {
                if (lastUpdated == null || file.getUploadedDate().isAfter(lastUpdated)) {
                    lastUpdated = file.getUploadedDate();
                }
            }
            boolean deadlineExpired = true;
            boolean hasPublishedSchedule = false;
            LocalDate activeDueDate = null;
            List<AuditSchedule> schedules = auditScheduleRepository.findAll();
            for (AuditSchedule s : schedules) {
                if ("PUBLISHED".equalsIgnoreCase(s.getStatus()) && (s.getDepartmentCode().equalsIgnoreCase("ALL") || s.getDepartmentCode().equalsIgnoreCase(d.getCode()))) {
                    hasPublishedSchedule = true;
                    LocalTime dueTime = s.getDueTime() != null ? s.getDueTime() : LocalTime.MAX;
                    LocalDateTime deadline = LocalDateTime.of(s.getDueDate(), dueTime);
                    if (!LocalDateTime.now().isAfter(deadline)) {
                        deadlineExpired = false;
                        activeDueDate = s.getDueDate();
                        break;
                    }
                }
            }
            if (!hasPublishedSchedule) {
                deadlineExpired = false;
            }
            map.put("activeDueDate", activeDueDate);
            map.put("deadlineExpired", deadlineExpired);
            map.put("lastUpdated", lastUpdated);

            summaryList.add(map);
        }

        return ResponseEntity.ok(summaryList);
    }

    @GetMapping("/files")
    public ResponseEntity<?> getAllFiles() {
        List<AcademicFile> academiaFiles = academicFileRepository.findAll();
        List<DepartmentFile> deptFiles = departmentFileRepository.findAll();

        List<Map<String, Object>> unifiedFiles = new ArrayList<>();

        for (AcademicFile f : academiaFiles) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("fileName", f.getFileName());
            map.put("fileType", "Academic File");
            map.put("documentType", f.getDocumentType());
            map.put("courseName", f.getCourseName());
            map.put("department", f.getDepartment());
            map.put("uploadedBy", f.getFaculty().getName());
            map.put("uploadedDate", f.getUploadedDate());
            map.put("status", f.getStatus());
            map.put("fileSize", f.getFileSize());
            map.put("filePath", f.getFilePath());
            map.put("rawFileType", f.getFileType());
            unifiedFiles.add(map);
        }

        for (DepartmentFile f : deptFiles) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("fileName", f.getFileName());
            map.put("fileType", "Department File");
            map.put("documentType", f.getDocumentType());
            map.put("courseName", "-");
            map.put("department", f.getDepartment());
            map.put("uploadedBy", f.getFaculty().getName());
            map.put("uploadedDate", f.getUploadedDate());
            map.put("status", f.getStatus());
            map.put("fileSize", f.getFileSize());
            map.put("filePath", f.getFilePath());
            map.put("rawFileType", f.getFileType());
            unifiedFiles.add(map);
        }

        unifiedFiles.sort((f1, f2) -> ((LocalDateTime) f2.get("uploadedDate")).compareTo((LocalDateTime) f1.get("uploadedDate")));

        return ResponseEntity.ok(unifiedFiles);
    }

    @PostMapping("/feedback")
    public ResponseEntity<?> postFeedback(@RequestBody Map<String, Object> payload) {
        try {
            Long fileId = Long.valueOf(payload.get("fileId").toString());
            String fileType = payload.get("fileType").toString();
            String comment = payload.get("comment").toString();

            String fileName = "";
            Faculty faculty = null;
            String departmentCode = "";

            if (fileType.equalsIgnoreCase("ACADEMIC") || fileType.equalsIgnoreCase("Course File") || fileType.equalsIgnoreCase("Academic File")) {
                Optional<AcademicFile> fileOpt = academicFileRepository.findById(fileId);
                if (fileOpt.isEmpty()) return ResponseEntity.notFound().build();
                AcademicFile cf = fileOpt.get();
                fileName = cf.getFileName();
                faculty = cf.getFaculty();
                departmentCode = cf.getDepartment();
                
                cf.setStatus("REJECTED");
                academicFileRepository.save(cf);
            } else {
                Optional<DepartmentFile> fileOpt = departmentFileRepository.findById(fileId);
                if (fileOpt.isEmpty()) return ResponseEntity.notFound().build();
                DepartmentFile df = fileOpt.get();
                fileName = df.getFileName();
                faculty = df.getFaculty();
                departmentCode = df.getDepartment();

                df.setStatus("REJECTED");
                departmentFileRepository.save(df);
            }

            Feedback feedback = new Feedback();
            feedback.setFileId(fileId);
            feedback.setFileType(fileType);
            feedback.setFileName(fileName);
            feedback.setComment(comment);
            feedback.setCommentedBy("Director");
            feedback.setDepartment(departmentCode);
            feedback.setFacultyId(faculty.getId());
            feedback.setDate(LocalDateTime.now());
            feedback.setStatus("ACTIVE");
            feedbackRepository.save(feedback);

            String facultyEmail = faculty.getUser().getEmail();
            String html = emailService.buildFeedbackHtml(faculty.getName(), fileName, comment, "Director");
            emailService.sendHtmlEmail(facultyEmail, "New Feedback on Submitted Audit File", html);

            notificationService.createNotification(faculty.getUser(), 
                    "Director added a comment on '" + fileName + "': \"" + comment + "\"",
                    "FEEDBACK", "New Feedback on Your File");

            Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByDepartmentCode(departmentCode);
            if (invOpt.isPresent()) {
                notificationService.createNotification(invOpt.get().getUser(), 
                        "Director flagged file '" + fileName + "' in " + departmentCode + " department.",
                        "FEEDBACK", "File Flagged by Director");
            }

            return ResponseEntity.ok(feedback);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @GetMapping("/feedback")
    public ResponseEntity<List<Feedback>> getFeedbackHistory() {
        List<Feedback> history = feedbackRepository.findAll();
        history.sort((f1, f2) -> f2.getDate().compareTo(f1.getDate()));
        if (history.size() > 100) {
            history = history.subList(0, 100);
        }
        return ResponseEntity.ok(history);
    }

    @PostMapping("/complete-audit/{deptId}")
    public ResponseEntity<?> completeAudit(@PathVariable Long deptId) {
        try {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));

            AuditStatus status = auditStatusRepository.findByDepartmentId(deptId)
                    .orElseGet(() -> {
                        AuditStatus newStatus = new AuditStatus();
                        newStatus.setDepartment(dept);
                        return newStatus;
                    });

            status.setStatus("AUDIT_COMPLETED");
            status.setLastUpdated(LocalDateTime.now());
            auditStatusRepository.save(status);

            // Persist Academic Calendar grid state in DB upon audit completion
            Optional<AcademicCalendar> calOpt = academicCalendarRepository.findFirstByStatusOrderByCreatedAtDesc("ACTIVE");
            if (calOpt.isPresent()) {
                AcademicCalendar activeCal = calOpt.get();
                AcademicCalendar completedRecord = new AcademicCalendar();
                completedRecord.setAcademicYear(activeCal.getAcademicYear());
                completedRecord.setDepartmentCode(dept.getCode());
                completedRecord.setYear(activeCal.getYear());
                completedRecord.setSemester(activeCal.getSemester());
                completedRecord.setReopeningDate(activeCal.getReopeningDate());
                completedRecord.setCat1Date(activeCal.getCat1Date());
                completedRecord.setCat2Date(activeCal.getCat2Date());
                completedRecord.setCat3Date(activeCal.getCat3Date());
                completedRecord.setLastWorkingDay(activeCal.getLastWorkingDay());
                completedRecord.setPracticalExamDate(activeCal.getPracticalExamDate());
                completedRecord.setTheoryExamDate(activeCal.getTheoryExamDate());
                completedRecord.setStatus("AUDIT_COMPLETED");
                completedRecord.setAuditCompletedAt(LocalDateTime.now());
                completedRecord.setCreatedAt(LocalDateTime.now());
                academicCalendarRepository.save(completedRecord);
            }

            Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByDepartment(dept);
            if (invOpt.isPresent()) {
                notificationService.createNotification(invOpt.get().getUser(), 
                        "Director has marked the audit for department " + dept.getName() + " as COMPLETED. Calendar & required file grid stored in DB.",
                        "AUDIT", "Audit Marked Complete");
            }

            return ResponseEntity.ok(Collections.singletonMap("message", "Audit marked as COMPLETED for " + dept.getName() + ". Academic Calendar grid stored in DB."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ── Schedule endpoints ──────────────────────────────────────────────────

    @GetMapping("/schedules")
    public ResponseEntity<?> getSchedules() {
        List<AuditSchedule> all = auditScheduleRepository.findAll();
        List<AuditSchedule> activeList = all.stream()
                .filter(s -> !"AUDIT_COMPLETED".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(activeList);
    }

    @PostMapping("/schedules")
    public ResponseEntity<?> createSchedule(@RequestBody Map<String, Object> payload) {
        AuditSchedule schedule = new AuditSchedule();
        schedule.setTitle(payload.get("title").toString());
        schedule.setAuditDate(parseDate(payload.get("auditDate").toString()));
        schedule.setDueDate(parseDate(payload.get("dueDate").toString()));
        schedule.setDescription(payload.getOrDefault("description", "").toString());
        schedule.setDepartmentCode(payload.getOrDefault("departmentCode", "ALL").toString());
        
        String auditType = payload.getOrDefault("auditType", "ACADEMIC").toString().toUpperCase();
        schedule.setAuditType(auditType);

        if ("ANNUAL".equals(auditType)) {
            int year = schedule.getAuditDate().getYear();
            String deptCode = schedule.getDepartmentCode();
            List<AuditSchedule> all = auditScheduleRepository.findAll();
            for (AuditSchedule s : all) {
                if ("ANNUAL".equalsIgnoreCase(s.getAuditType()) && s.getAuditDate().getYear() == year) {
                    if (s.getDepartmentCode().equals("ALL") || deptCode.equals("ALL") || s.getDepartmentCode().equals(deptCode)) {
                        return ResponseEntity.badRequest().body(Collections.singletonMap("message", 
                            "An Annual Audit has already been scheduled for department " + s.getDepartmentCode() + " in the year " + year));
                    }
                }
            }
        }

        schedule.setStatus("DRAFT");
        schedule.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(auditScheduleRepository.save(schedule));
    }

    private void notifyInvigilatorsAndHods(AuditSchedule schedule) {
        String deptCode = schedule.getDepartmentCode();

        // 1. Invigilators
        List<IqacInvigilator> invigilators = new ArrayList<>();
        if (deptCode == null || deptCode.equals("ALL") || deptCode.trim().isEmpty()) {
            invigilators = iqacInvigilatorRepository.findAll();
        } else {
            Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByDepartmentCode(deptCode);
            invOpt.ifPresent(invigilators::add);
        }

        for (IqacInvigilator inv : invigilators) {
            if (inv == null || inv.getUser() == null) continue;
            try {
                notificationService.createNotification(inv.getUser(),
                        "New audit schedule published: '" + schedule.getTitle() + "' — Audit Date: " + schedule.getAuditDate() + ", Due: " + schedule.getDueDate(),
                        "SCHEDULE", "New Audit Schedule");
                String html = "<html><body>" +
                        "<h3 style='color:#1A56DB;'>New Audit Schedule Published</h3>" +
                        "<p>Dear " + inv.getName() + ",</p>" +
                        "<p>The IQAC Director has published a new audit schedule:</p>" +
                        "<ul><li><strong>Title:</strong> " + schedule.getTitle() + "</li>" +
                        "<li><strong>Audit Date:</strong> " + schedule.getAuditDate() + "</li>" +
                        "<li><strong>Due Date:</strong> " + schedule.getDueDate() + "</li></ul>" +
                        "<p>Please review and ensure all files are submitted before the due date.</p>" +
                        "<p>Best regards,<br/>IQAC Director</p></body></html>";
                if (inv.getUser().getEmail() != null) {
                    emailService.sendHtmlEmail(inv.getUser().getEmail(), "New Audit Schedule: " + schedule.getTitle(), html);
                }
            } catch (Exception e) {
                System.err.println("Failed to notify invigilator " + inv.getName() + ": " + e.getMessage());
            }
        }

        // 2. HODs
        List<Hod> hods = new ArrayList<>();
        if (deptCode == null || deptCode.equals("ALL") || deptCode.trim().isEmpty()) {
            hods = hodRepository.findAll();
        } else {
            Optional<Hod> hodOpt = hodRepository.findByDepartmentCode(deptCode);
            hodOpt.ifPresent(hods::add);
        }

        for (Hod hod : hods) {
            if (hod == null || hod.getUser() == null) continue;
            try {
                notificationService.createNotification(hod.getUser(),
                        "New audit schedule published for department " + ("ALL".equals(deptCode) ? "All" : deptCode) + ": '" + schedule.getTitle() + "' — Audit Date: " + schedule.getAuditDate() + ", Due: " + schedule.getDueDate(),
                        "SCHEDULE", "New Audit Schedule");
                String html = "<html><body>" +
                        "<h3 style='color:#1A56DB;'>New Audit Schedule Published</h3>" +
                        "<p>Dear HOD " + hod.getName() + ",</p>" +
                        "<p>The IQAC Director has published a new audit schedule for " + ("ALL".equals(deptCode) ? "All Departments" : deptCode) + ":</p>" +
                        "<ul><li><strong>Title:</strong> " + schedule.getTitle() + "</li>" +
                        "<li><strong>Audit Date:</strong> " + schedule.getAuditDate() + "</li>" +
                        "<li><strong>Due Date:</strong> " + schedule.getDueDate() + "</li></ul>" +
                        "<p>Best regards,<br/>IQAC Director</p></body></html>";
                if (hod.getUser().getEmail() != null) {
                    emailService.sendHtmlEmail(hod.getUser().getEmail(), "New Audit Schedule: " + schedule.getTitle(), html);
                }
            } catch (Exception e) {
                System.err.println("Failed to notify HOD " + hod.getName() + ": " + e.getMessage());
            }
        }
    }

    @GetMapping("/academic-calendar")
    public ResponseEntity<?> getActiveAcademicCalendar() {
        Optional<AcademicCalendar> calOpt = academicCalendarRepository.findFirstByStatusOrderByCreatedAtDesc("ACTIVE");
        if (calOpt.isPresent()) {
            return ResponseEntity.ok(calOpt.get());
        }
        Optional<AcademicCalendar> latestOpt = academicCalendarRepository.findFirstByOrderByIdDesc();
        if (latestOpt.isPresent()) {
            return ResponseEntity.ok(latestOpt.get());
        }
        return ResponseEntity.ok(Collections.emptyMap());
    }

    @PostMapping("/academic-calendar")
    public ResponseEntity<?> createAcademicCalendar(@RequestBody Map<String, Object> payload) {
        try {
            if (payload == null || payload.get("reopeningDate") == null || payload.get("cat1Date") == null
                    || payload.get("cat2Date") == null || payload.get("cat3Date") == null
                    || payload.get("lastWorkingDay") == null || payload.get("practicalExamDate") == null
                    || payload.get("theoryExamDate") == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "All key semester dates (Reopening, CAT I, II, III, Last Working Day, Practical, Theory) are required."));
            }

            String academicYear = payload.getOrDefault("academicYear", "2026-27 ODD SEM").toString();
            LocalDate reopeningDate = parseDate(payload.get("reopeningDate").toString());
            LocalDate cat1Date = parseDate(payload.get("cat1Date").toString());
            LocalDate cat2Date = parseDate(payload.get("cat2Date").toString());
            LocalDate cat3Date = parseDate(payload.get("cat3Date").toString());
            LocalDate lastWorkingDay = parseDate(payload.get("lastWorkingDay").toString());
            LocalDate practicalExamDate = parseDate(payload.get("practicalExamDate").toString());
            LocalDate theoryExamDate = parseDate(payload.get("theoryExamDate").toString());

            List<AcademicCalendar> existing = academicCalendarRepository.findAll();
            for (AcademicCalendar c : existing) {
                c.setStatus("ARCHIVED");
                academicCalendarRepository.save(c);
            }

            AcademicCalendar calendar = new AcademicCalendar();
            calendar.setAcademicYear(academicYear);
            calendar.setReopeningDate(reopeningDate);
            calendar.setCat1Date(cat1Date);
            calendar.setCat2Date(cat2Date);
            calendar.setCat3Date(cat3Date);
            calendar.setLastWorkingDay(lastWorkingDay);
            calendar.setPracticalExamDate(practicalExamDate);
            calendar.setTheoryExamDate(theoryExamDate);
            calendar.setStatus("ACTIVE");
            calendar.setCreatedAt(LocalDateTime.now());
            academicCalendarRepository.save(calendar);

            List<Department> depts = departmentRepository.findAll();
            if (depts.isEmpty()) {
                String[] defaultCodes = {"CCE", "CSBS", "CSE", "AIDS", "AIML", "VLSI", "ECE", "MECH", "BIOTECH", "H&S"};
                for (String code : defaultCodes) {
                    Department d = new Department();
                    d.setCode(code);
                    d.setName(code);
                    depts.add(d);
                }
            }

            List<AuditSchedule> generatedSchedules = new ArrayList<>();

            // 1. FPP Phase: 10 working days starting 10 days before reopeningDate (1 department per day)
            LocalDate currentFppDate = reopeningDate.minusDays(10);
            int deptIdx = 0;
            for (int i = 0; i < 15 && deptIdx < depts.size(); i++) {
                if (currentFppDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                    currentFppDate = currentFppDate.plusDays(1);
                    continue;
                }
                Department dept = depts.get(deptIdx);
                AuditSchedule fppSchedule = new AuditSchedule();
                fppSchedule.setTitle("FPP Academic Audit - " + dept.getCode());
                fppSchedule.setAuditDate(currentFppDate);
                fppSchedule.setDueDate(currentFppDate.plusDays(1));
                fppSchedule.setDescription("Faculty Preparation Program (FPP) Academic Files Audit for " + dept.getName() + " (Time: 10.30 AM)");
                fppSchedule.setStatus("PUBLISHED");
                fppSchedule.setDepartmentCode(dept.getCode());
                fppSchedule.setAuditType("ACADEMIC");
                fppSchedule.setAcademicPhase("FPP");
                fppSchedule.setCreatedAt(LocalDateTime.now());
                AuditSchedule saved = auditScheduleRepository.save(fppSchedule);
                generatedSchedules.add(saved);
                notifyInvigilatorsAndHods(saved);

                currentFppDate = currentFppDate.plusDays(1);
                deptIdx++;
            }

            // 2. Post CAT Phase: 10 working days per department for CAT I, CAT II, CAT III
            LocalDate[] catDates = {cat1Date, cat2Date, cat3Date};
            String[] catPhaseNames = {"Post CAT I Audit", "Post CAT II Audit", "Post CAT III Audit"};

            for (int k = 0; k < catDates.length; k++) {
                LocalDate cDate = catDates[k].plusDays(1);
                int catDeptIdx = 0;
                for (int i = 0; i < 15 && catDeptIdx < depts.size(); i++) {
                    if (cDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                        cDate = cDate.plusDays(1);
                        continue;
                    }
                    Department dept = depts.get(catDeptIdx);
                    AuditSchedule postCatSchedule = new AuditSchedule();
                    postCatSchedule.setTitle(catPhaseNames[k] + " - " + dept.getCode());
                    postCatSchedule.setAuditDate(cDate);
                    postCatSchedule.setDueDate(cDate.plusDays(1));
                    postCatSchedule.setDescription("Post Continuous Assessment Test Academic Audit for " + dept.getName() + " (Time: 10.30 AM)");
                    postCatSchedule.setStatus("PUBLISHED");
                    postCatSchedule.setDepartmentCode(dept.getCode());
                    postCatSchedule.setAuditType("ACADEMIC");
                    postCatSchedule.setAcademicPhase("POST_CAT");
                    postCatSchedule.setCreatedAt(LocalDateTime.now());
                    AuditSchedule saved = auditScheduleRepository.save(postCatSchedule);
                    generatedSchedules.add(saved);
                    notifyInvigilatorsAndHods(saved);

                    cDate = cDate.plusDays(1);
                    catDeptIdx++;
                }
            }

            // 3. End Sem Phase: 10 working days per department starting at lastWorkingDay
            LocalDate currentEndSemDate = lastWorkingDay;
            int endSemDeptIdx = 0;
            for (int i = 0; i < 15 && endSemDeptIdx < depts.size(); i++) {
                if (currentEndSemDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                    currentEndSemDate = currentEndSemDate.plusDays(1);
                    continue;
                }
                Department dept = depts.get(endSemDeptIdx);
                AuditSchedule endSemSchedule = new AuditSchedule();
                endSemSchedule.setTitle("End Semester Academic Audit - " + dept.getCode());
                endSemSchedule.setAuditDate(currentEndSemDate);
                endSemSchedule.setDueDate(currentEndSemDate.plusDays(1));
                endSemSchedule.setDescription("End Semester Comprehensive Academic Files Audit for " + dept.getName() + " (Time: 10.30 AM)");
                endSemSchedule.setStatus("PUBLISHED");
                endSemSchedule.setDepartmentCode(dept.getCode());
                endSemSchedule.setAuditType("ACADEMIC");
                endSemSchedule.setAcademicPhase("END_SEM");
                endSemSchedule.setCreatedAt(LocalDateTime.now());
                AuditSchedule saved = auditScheduleRepository.save(endSemSchedule);
                generatedSchedules.add(saved);
                notifyInvigilatorsAndHods(saved);

                currentEndSemDate = currentEndSemDate.plusDays(1);
                endSemDeptIdx++;
            }

            // 4. Meeting with Deans (Legend Code 4 - Green)
            AuditSchedule deanMeeting = new AuditSchedule();
            deanMeeting.setTitle("Meeting with Deans");
            deanMeeting.setAuditDate(reopeningDate.plusDays(2));
            deanMeeting.setDueDate(reopeningDate.plusDays(2));
            deanMeeting.setDescription("Strategic Academic Quality Review Meeting with Deans");
            deanMeeting.setStatus("PUBLISHED");
            deanMeeting.setDepartmentCode("ALL");
            deanMeeting.setAuditType("ACADEMIC");
            deanMeeting.setAcademicPhase("DEAN_MEETING");
            deanMeeting.setCreatedAt(LocalDateTime.now());
            AuditSchedule savedDean = auditScheduleRepository.save(deanMeeting);
            generatedSchedules.add(savedDean);
            notifyInvigilatorsAndHods(savedDean);

            // 5. Meeting with IQAC Coordinator (Legend Code 5 - Orange)
            AuditSchedule coordMeeting = new AuditSchedule();
            coordMeeting.setTitle("Meeting with IQAC Coordinator");
            coordMeeting.setAuditDate(reopeningDate.plusDays(5));
            coordMeeting.setDueDate(reopeningDate.plusDays(5));
            coordMeeting.setDescription("Department Audit Alignment Meeting with IQAC Coordinator");
            coordMeeting.setStatus("PUBLISHED");
            coordMeeting.setDepartmentCode("ALL");
            coordMeeting.setAuditType("ACADEMIC");
            coordMeeting.setAcademicPhase("COORDINATOR_MEETING");
            coordMeeting.setCreatedAt(LocalDateTime.now());
            AuditSchedule savedCoord = auditScheduleRepository.save(coordMeeting);
            generatedSchedules.add(savedCoord);
            notifyInvigilatorsAndHods(savedCoord);

            // 6. N.C Closing (Legend Code 3 - Peach)
            AuditSchedule ncClosing = new AuditSchedule();
            ncClosing.setTitle("N.C Closing");
            ncClosing.setAuditDate(currentEndSemDate.plusDays(2));
            ncClosing.setDueDate(currentEndSemDate.plusDays(3));
            ncClosing.setDescription("Non-Conformance (N.C) Closure and Compliance Verification");
            ncClosing.setStatus("PUBLISHED");
            ncClosing.setDepartmentCode("ALL");
            ncClosing.setAuditType("ACADEMIC");
            ncClosing.setAcademicPhase("NC_CLOSING");
            ncClosing.setCreatedAt(LocalDateTime.now());
            AuditSchedule savedNc = auditScheduleRepository.save(ncClosing);
            generatedSchedules.add(savedNc);
            notifyInvigilatorsAndHods(savedNc);

            return ResponseEntity.ok(Map.of(
                "message", "Academic Calendar published and " + generatedSchedules.size() + " department audit schedules auto-generated!",
                "calendar", calendar,
                "schedules", generatedSchedules
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Failed to publish Academic Calendar: " + e.getMessage()));
        }
    }

    @PostMapping("/trigger-audit-stage")
    public ResponseEntity<?> triggerAuditStage(@RequestBody Map<String, String> payload) {
        try {
            String stageStr = payload.getOrDefault("stage", "FPP").trim().toUpperCase();
            if ("END_SEM".equals(stageStr)) stageStr = "POST_CAT_3";
            AuditStage stageEnum = AuditStage.valueOf(stageStr);

            String academicYear = payload.getOrDefault("academicYear", "2026-27");
            String yearLevel = payload.getOrDefault("year", "1st Year");
            String semester = payload.getOrDefault("semester", "ODD");

            // Validate schedule existence: Must have an active AuditSchedule or Audit for this Academic Year & Year Level
            List<AuditSchedule> schedules = auditScheduleRepository.findAll();
            boolean hasSchedule = schedules.stream().anyMatch(s -> 
                !"AUDIT_COMPLETED".equalsIgnoreCase(s.getStatus()) &&
                (s.getYear() == null || s.getYear().equalsIgnoreCase(yearLevel) || s.getYear().equalsIgnoreCase("ALL"))
            );

            List<com.iqac.audit.entity.audit.Audit> audits = auditRepository.findByAcademicYearAndYearLevelAndArchivedFalse(academicYear, yearLevel);
            if (!audits.isEmpty()) {
                hasSchedule = true;
            }

            if (!hasSchedule) {
                String errorMsg = "Cannot start audit stage: No audit schedule found for Academic Year '" + academicYear + "', Year Level '" + yearLevel + "', and Semester '" + semester + "'. Please create or generate an Audit Schedule first.";
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", errorMsg));
            }

            ensureMasterRequiredFilesSeeded();

            List<RequiredFile> allFiles = requiredFileRepository.findAll();
            List<RequiredFile> matched = new ArrayList<>();
            for (RequiredFile rf : allFiles) {
                if (rf.getStages() != null && rf.getStages().contains(stageEnum)) {
                    if (stageEnum == AuditStage.FPP) {
                        String fn = rf.getFileName().toLowerCase();
                        if (rf.isXFile() || fn.contains("(x)") || fn.contains("pec") || fn.contains("committee") || fn.contains("cat ") || fn.contains("assessment") || fn.contains("attainment") || fn.contains("fast learner") || fn.contains("cycle")) {
                            continue;
                        }
                    }
                    matched.add(rf);
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", "Successfully started " + stageStr + " audit stage for " + academicYear + " (" + yearLevel + ", " + semester + " Sem)! " + matched.size() + " required files activated.",
                "count", matched.size(),
                "files", matched
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    private void ensureMasterRequiredFilesSeeded() {
        if (requiredFileRepository.count() > 0) {
            return;
        }

        FacultyRole classIncharge = facultyRoleRepository.findByName("Class Incharge").orElse(null);
        FacultyRole mentor = facultyRoleRepository.findByName("Mentor").orElse(null);
        FacultyRole miniProjectMentor = facultyRoleRepository.findByName("Mini Project Mentor").orElse(null);
        FacultyRole projectMentor = facultyRoleRepository.findByName("Project Mentor").orElse(null);

        Set<AuditStage> allStages = EnumSet.of(AuditStage.FPP, AuditStage.POST_CAT_1, AuditStage.POST_CAT_2, AuditStage.POST_CAT_3);
        Set<AuditStage> postCat1Only = EnumSet.of(AuditStage.POST_CAT_1);
        Set<AuditStage> postCat2Only = EnumSet.of(AuditStage.POST_CAT_2);
        Set<AuditStage> postCat3Only = EnumSet.of(AuditStage.POST_CAT_3);
        Set<AuditStage> fppAndPostCat1 = EnumSet.of(AuditStage.FPP, AuditStage.POST_CAT_1);
        Set<AuditStage> allPostCatStages = EnumSet.of(AuditStage.POST_CAT_1, AuditStage.POST_CAT_2, AuditStage.POST_CAT_3);

        createOrUpdateRequiredFile("Curriculum", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Curriculum Document", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Syllabus", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Syllabus Document", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CO, PO, PSO Mapping", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] CO, PO, PSO Mapping Document", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Lesson Planning", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Lesson Planning Sheet", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Pedagogy / Reports", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Pedagogy Reports", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course Committee Meeting – I", "ACADEMIC", "[Stage: Post CAT 1 Only] Course Committee Meeting 1 Minutes", true, false, postCat1Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course Committee Meeting – II", "ACADEMIC", "[Stage: Post CAT 2 Only] Course Committee Meeting 2 Minutes", true, false, postCat2Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course Committee Meeting – III", "ACADEMIC", "[Stage: End Sem Only] Course Committee Meeting 3 Minutes", true, false, postCat3Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Assignment Details", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Assignment Details and Questions", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course PPT", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Course PPT Presentation", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Green Book", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Green Book Record", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Blue Book", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Blue Book Record", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CAT 1 Question Paper & Answer Key (X)", "ACADEMIC", "[Stage: Post CAT 1 Only] CAT 1 Question Paper & Answer Key", true, true, postCat1Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CAT 2 Question Paper & Answer Key (X)", "ACADEMIC", "[Stage: Post CAT 2 Only] CAT 2 Question Paper & Answer Key", true, true, postCat2Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CAT 3 Question Paper & Answer Key (X)", "ACADEMIC", "[Stage: End Sem Only] CAT 3 Question Paper & Answer Key", true, true, postCat3Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Internal Assessment Answer Script Sample (X)", "ACADEMIC", "[Stage: Post CAT 1, Post CAT 2, End Sem] Internal Assessment Answer Script Sample", true, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Faculty Evaluator Name", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Faculty Evaluator Name", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Remarks", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Academic Remarks", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Cycle 1", "ACADEMIC", "[Stage: Post CAT 1 Only] Cycle 1 File", false, false, postCat1Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Cycle 2", "ACADEMIC", "[Stage: Post CAT 2 Only] Cycle 2 File", false, false, postCat2Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Cycle 3", "ACADEMIC", "[Stage: End Sem Only] Cycle 3 File", false, false, postCat3Only, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Faculty", "DEPARTMENT", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Faculty List & Details", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Remarks", "DEPARTMENT", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Department Remarks", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("CO-PO Attainment Sheet (X)", "ACADEMIC", "[Stage: Post CAT 1, Post CAT 2, End Sem] CO-PO Attainment Sheet", true, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("IMS Update", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] IMS Update Confirmation", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Mentor Details", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Mentor Details & Formats", true, false, allStages, "ALL", "ALL", mentor);
        createOrUpdateRequiredFile("Class Committee Meeting 1 (X)", "ACADEMIC", "[Stage: Post CAT 1 Only] Class Committee Meeting 1 Minutes", true, true, postCat1Only, "ALL", "ALL", classIncharge);
        createOrUpdateRequiredFile("Class Committee Meeting 2 (X)", "ACADEMIC", "[Stage: Post CAT 2 Only] Class Committee Meeting 2 Minutes", true, true, postCat2Only, "ALL", "ALL", classIncharge);
        createOrUpdateRequiredFile("Class Committee Meeting 3 (X)", "ACADEMIC", "[Stage: End Sem Only] Class Committee Meeting 3 Minutes", true, true, postCat3Only, "ALL", "ALL", classIncharge);
        createOrUpdateRequiredFile("Mini Project", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Mini Project Details & Guide Reports", false, false, allStages, "ALL", "ALL", miniProjectMentor);
        createOrUpdateRequiredFile("Project", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Major Project Reports", false, false, allStages, "ALL", "ALL", projectMentor);
        createOrUpdateRequiredFile("PEC Seminar (X)", "ACADEMIC", "[Stage: Post CAT 1, Post CAT 2, End Sem] PEC Seminar Documents", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("PEC Student Attendance (X)", "ACADEMIC", "[Stage: Post CAT 1, Post CAT 2, End Sem] PEC Student Attendance", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("PEC Delivery Content (X)", "ACADEMIC", "[Stage: Post CAT 1, Post CAT 2, End Sem] PEC Delivery Content", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("PEC Assessment (X)", "ACADEMIC", "[Stage: Post CAT 1, Post CAT 2, End Sem] PEC Assessment Details", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Assessment Outcome (X)", "ACADEMIC", "[Stage: Post CAT 1, Post CAT 2, End Sem] Assessment Outcome Report", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course File", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Overall Course File", true, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Fast Learner Encouragement (X)", "ACADEMIC", "[Stage: Post CAT 1, Post CAT 2, End Sem] Fast Learner Encouragement Details", false, true, allPostCatStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Course Notes", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Course Notes & Handouts", false, false, allStages, "ALL", "ALL", null);
        createOrUpdateRequiredFile("Lab Manual", "ACADEMIC", "[Stage: FPP, Post CAT 1, Post CAT 2, End Sem] Lab Manual", false, false, allStages, "ALL", "ALL", null);
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

    @PostMapping("/clear-required-files")
    public ResponseEntity<?> clearRequiredFiles(@RequestBody(required = false) Map<String, String> payload) {
        try {
            String year = payload != null && payload.get("year") != null ? payload.get("year") : "1st Year";
            String semester = payload != null && payload.get("semester") != null ? payload.get("semester") : "Sem 1";

            // 1. Store active schedules in DB with status = AUDIT_COMPLETED, year, and sem
            List<AuditSchedule> activeSchedules = auditScheduleRepository.findAll();
            for (AuditSchedule s : activeSchedules) {
                if (!"AUDIT_COMPLETED".equalsIgnoreCase(s.getStatus())) {
                    s.setStatus("AUDIT_COMPLETED");
                    if (year != null && !"ALL".equalsIgnoreCase(year)) s.setYear(year);
                    if (semester != null && !"ALL".equalsIgnoreCase(semester)) s.setSemester(semester);
                    auditScheduleRepository.save(s);
                }
            }

            // 2. Store active AcademicCalendar in DB with status = AUDIT_COMPLETED, year, sem, and completed timestamp
            Optional<AcademicCalendar> calOpt = academicCalendarRepository.findFirstByStatusOrderByCreatedAtDesc("ACTIVE");
            if (calOpt.isPresent()) {
                AcademicCalendar activeCal = calOpt.get();
                activeCal.setStatus("AUDIT_COMPLETED");
                activeCal.setAuditCompletedAt(LocalDateTime.now());
                if (year != null && !"ALL".equalsIgnoreCase(year)) activeCal.setYear(year);
                if (semester != null && !"ALL".equalsIgnoreCase(semester)) activeCal.setSemester(semester);
                academicCalendarRepository.save(activeCal);
            }

            // 3. Clear required files list from active view (records preserved in DB)
            requiredFileRepository.deleteAll();

            return ResponseEntity.ok(Collections.singletonMap("message", "Audit Complete! Schedules and Academic Calendar persisted in DB for Year: " + year + ", Sem: " + semester + ". Active frontend view cleared."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    private void populateOfficialRequiredFiles() {
        requiredFileRepository.findByFileName("Academic Committee Meeting – I, II, III").ifPresent(requiredFileRepository::delete);
        requiredFileRepository.findByFileName("Academic Committee Meeting - I, II, III").ifPresent(requiredFileRepository::delete);
        requiredFileRepository.findByFileName("CAT-1, CAT-2, CAT-3 Question Paper & Answer Key").ifPresent(requiredFileRepository::delete);
        requiredFileRepository.findByFileName("CAT-1, CAT-2, CAT-3 Question Paper & Answer").ifPresent(requiredFileRepository::delete);
        requiredFileRepository.findByFileName("CAT-1 Question Paper & Answer").ifPresent(requiredFileRepository::delete);
        requiredFileRepository.findByFileName("CAT-2 Question Paper & Answer").ifPresent(requiredFileRepository::delete);
        requiredFileRepository.findByFileName("CAT-3 Question Paper & Answer").ifPresent(requiredFileRepository::delete);

        String[] officialCriteria = {
            "Academic Calendar",
            "Even/ODD Semester Course Syllabus",
            "CO, PO & PSO Mapping of Courses",
            "Lesson Plan",
            "Pedagogy Planned Details",
            "Academic Committee Meeting - I",
            "Academic Committee Meeting - II",
            "Academic Committee Meeting - III",
            "Assignment Details",
            "Course Notes",
            "Blue Book",
            "Green Book",
            "CAT-1 Question Paper & Answer Key",
            "CAT-2 Question Paper & Answer Key",
            "CAT-3 Question Paper & Answer Key",
            "Internal Assessment Answer Script / Cycle Test Scripts",
            "CO, PO Attainment Sheet",
            "IMS Update Status",
            "Mentor Book",
            "Class Committee Meeting-I, II, III",
            "PEC file details-Slow learners",
            "Academic file of all subjects",
            "Lab Manual",
            "Fast Learners Engagement"
        };

        for (String criteriaName : officialCriteria) {
            Optional<RequiredFile> existing = requiredFileRepository.findByFileName(criteriaName);
            if (existing.isEmpty()) {
                RequiredFile rf = new RequiredFile();
                rf.setFileName(criteriaName);
                rf.setFileCategory("ACADEMIC");
                rf.setDescription("Official IQAC Academic Audit Criterion: " + criteriaName);
                rf.setMandatory(true);
                rf.setCreatedAt(LocalDateTime.now());
                requiredFileRepository.save(rf);
            }
        }
    }

    @PostMapping("/academic-calendar/upload-image")
    public ResponseEntity<?> uploadAcademicCalendarImage(@RequestParam("file") MultipartFile file) {
        Map<String, String> extracted = calendarOcrService.extractDatesFromCalendarFile(file);
        return createAcademicCalendar(new HashMap<>(extracted));
    }

    @PostMapping("/schedules/{id}/publish")
    public ResponseEntity<?> publishSchedule(@PathVariable Long id) {
        AuditSchedule schedule = auditScheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus("PUBLISHED");
        auditScheduleRepository.save(schedule);
        notifyInvigilatorsAndHods(schedule);
        return ResponseEntity.ok(Collections.singletonMap("message", "Schedule published and invigilator(s) and HOD(s) notified."));
    }

    @PostMapping("/create-invigilator")
    public ResponseEntity<?> createInvigilator(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String departmentCode = payload.get("departmentCode");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username already exists."));
            }

            Department dept = departmentRepository.findByCode(departmentCode)
                    .orElseThrow(() -> new RuntimeException("Department not found: " + departmentCode));

            Role invRole = roleRepository.findByName("ROLE_IQAC_INVIGILATOR")
                    .orElseThrow(() -> new RuntimeException("Role ROLE_IQAC_INVIGILATOR not found."));

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(invRole);
            user.setEnabled(true);

            IqacInvigilator inv = new IqacInvigilator();
            inv.setUser(user);
            inv.setName(name);
            inv.setDepartment(dept);

            iqacInvigilatorRepository.save(inv);
            return ResponseEntity.ok(Collections.singletonMap("message", "IQAC Invigilator account created successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
        auditScheduleRepository.deleteById(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Deleted"));
    }

    @PutMapping("/schedules/{id}")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        AuditSchedule schedule = auditScheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        
        String title = payload.get("title").toString();
        LocalDate auditDate = parseDate(payload.get("auditDate").toString());
        LocalDate dueDate = parseDate(payload.get("dueDate").toString());
        String description = payload.getOrDefault("description", "").toString();
        String departmentCode = payload.getOrDefault("departmentCode", "ALL").toString();
        String auditType = payload.getOrDefault("auditType", "ACADEMIC").toString().toUpperCase();
        
        if ("ANNUAL".equals(auditType)) {
            int year = auditDate.getYear();
            List<AuditSchedule> all = auditScheduleRepository.findAll();
            for (AuditSchedule s : all) {
                if (s.getId().equals(id)) continue;
                if ("ANNUAL".equalsIgnoreCase(s.getAuditType()) && s.getAuditDate().getYear() == year) {
                    if (s.getDepartmentCode().equals("ALL") || departmentCode.equals("ALL") || s.getDepartmentCode().equals(departmentCode)) {
                        return ResponseEntity.badRequest().body(Collections.singletonMap("message", 
                            "An Annual Audit has already been scheduled for department " + s.getDepartmentCode() + " in the year " + year));
                    }
                }
            }
        }
        
        schedule.setTitle(title);
        schedule.setAuditDate(auditDate);
        schedule.setDueDate(dueDate);
        schedule.setDescription(description);
        schedule.setDepartmentCode(departmentCode);
        schedule.setAuditType(auditType);
        
        return ResponseEntity.ok(auditScheduleRepository.save(schedule));
    }

    @PostMapping("/schedules/upload")
    public ResponseEntity<?> uploadSchedulesCsv(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "File is empty."));
            }
            List<AuditSchedule> savedSchedules = new ArrayList<>();
            try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream()))) {
                String line;
                boolean isFirstLine = true;
                while ((line = reader.readLine()) != null) {
                    if (isFirstLine) {
                        isFirstLine = false;
                        if (line.toLowerCase().contains("title") || line.toLowerCase().contains("date")) {
                            continue;
                        }
                    }
                    String[] parts = line.split(",", -1);
                    if (parts.length >= 3) {
                        String title = parts[0].trim();
                        String auditDateStr = parts[1].trim();
                        String dueDateStr = parts[2].trim();
                        if (title.isEmpty() || auditDateStr.isEmpty() || dueDateStr.isEmpty()) {
                            continue;
                        }
                        String description = parts.length > 3 ? parts[3].trim() : "";
                        String departmentCode = parts.length > 4 ? parts[4].trim() : "ALL";
                        if (departmentCode.isEmpty()) {
                            departmentCode = "ALL";
                        }
                        String status = parts.length > 5 ? parts[5].trim().toUpperCase() : "DRAFT";
                        if (!status.equals("PUBLISHED") && !status.equals("DRAFT")) {
                            status = "DRAFT";
                        }
                        String auditType = parts.length > 6 ? parts[6].trim().toUpperCase() : "ACADEMIC";
                        if (!auditType.equals("ANNUAL") && !auditType.equals("ACADEMIC")) {
                            auditType = "ACADEMIC";
                        }

                        AuditSchedule schedule = new AuditSchedule();
                        schedule.setTitle(title);
                        schedule.setAuditDate(parseDate(auditDateStr));
                        schedule.setDueDate(parseDate(dueDateStr));
                        schedule.setDescription(description);
                        schedule.setDepartmentCode(departmentCode);
                        schedule.setAuditType(auditType);

                        if ("ANNUAL".equals(auditType)) {
                            int year = schedule.getAuditDate().getYear();
                            String deptCode = schedule.getDepartmentCode();
                            List<AuditSchedule> all = auditScheduleRepository.findAll();
                            boolean exists = false;
                            for (AuditSchedule s : all) {
                                if ("ANNUAL".equalsIgnoreCase(s.getAuditType()) && s.getAuditDate().getYear() == year) {
                                    if (s.getDepartmentCode().equals("ALL") || deptCode.equals("ALL") || s.getDepartmentCode().equals(deptCode)) {
                                        exists = true;
                                        break;
                                    }
                                }
                            }
                            if (exists) {
                                continue; // skip creating duplicate Annual Audits
                            }
                        }

                        schedule.setStatus(status);
                        schedule.setCreatedAt(LocalDateTime.now());

                        AuditSchedule saved = auditScheduleRepository.save(schedule);
                        savedSchedules.add(saved);

                        if (status.equals("PUBLISHED")) {
                            // Notify + email target invigilator(s)
                            String deptCode = saved.getDepartmentCode();
                            List<IqacInvigilator> invigilators = new ArrayList<>();
                            if (deptCode == null || deptCode.equals("ALL") || deptCode.trim().isEmpty()) {
                                invigilators = iqacInvigilatorRepository.findAll();
                            } else {
                                Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByDepartmentCode(deptCode);
                                if (invOpt.isPresent()) {
                                    invigilators.add(invOpt.get());
                                }
                            }

                            for (IqacInvigilator inv : invigilators) {
                                notificationService.createNotification(inv.getUser(),
                                        "New audit schedule published: '" + saved.getTitle() + "' — Audit Date: " + saved.getAuditDate() + ", Due: " + saved.getDueDate(),
                                        "SCHEDULE", "New Audit Schedule");
                                String html = "<html><body>" +
                                        "<h3 style='color:#1A56DB;'>New Audit Schedule Published</h3>" +
                                        "<p>Dear " + inv.getName() + ",</p>" +
                                        "<p>The IQAC Director has published a new audit schedule:</p>" +
                                        "<ul><li><strong>Title:</strong> " + saved.getTitle() + "</li>" +
                                        "<li><strong>Audit Date:</strong> " + saved.getAuditDate() + "</li>" +
                                        "<li><strong>Due Date:</strong> " + saved.getDueDate() + "</li></ul>" +
                                        "<p>Please review and ensure all files are submitted before the due date.</p>" +
                                        "<p>Best regards,<br/>IQAC Director</p></body></html>";
                                emailService.sendHtmlEmail(inv.getUser().getEmail(), "New Audit Schedule: " + saved.getTitle(), html);
                            }
                        }
                    }
                }
            }
            return ResponseEntity.ok(savedSchedules);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ── Required Files endpoints ────────────────────────────────────────────

    @GetMapping("/required-files")
    public ResponseEntity<?> getRequiredFiles(@RequestParam(value = "stage", required = false) String stageStr) {
        List<RequiredFile> all = requiredFileRepository.findAll();
        if (stageStr == null || stageStr.trim().isEmpty() || "ALL".equalsIgnoreCase(stageStr)) {
            return ResponseEntity.ok(all);
        }
        
        AuditStage stageEnum = null;
        try {
            stageEnum = AuditStage.valueOf(stageStr.trim().toUpperCase());
        } catch (Exception ignored) {}
        
        if (stageEnum == null) return ResponseEntity.ok(all);
        
        List<RequiredFile> matched = new ArrayList<>();
        for (RequiredFile rf : all) {
            if (rf.getStages() != null && rf.getStages().contains(stageEnum)) {
                if (stageEnum == AuditStage.FPP) {
                    String fn = rf.getFileName().toLowerCase();
                    if (rf.isXFile() || fn.contains("(x)") || fn.contains("pec") || fn.contains("committee") || fn.contains("cat ") || fn.contains("assessment") || fn.contains("attainment") || fn.contains("fast learner") || fn.contains("cycle")) {
                        continue;
                    }
                }
                matched.add(rf);
            }
        }
        return ResponseEntity.ok(matched);
    }

    @PostMapping("/required-files")
    public ResponseEntity<?> createRequiredFile(@RequestBody Map<String, Object> payload) {
        RequiredFile rf = new RequiredFile();
        rf.setFileName(payload.get("fileName").toString());
        rf.setFileCategory(payload.get("fileCategory").toString());
        rf.setDescription(payload.getOrDefault("description", "").toString());
        rf.setMandatory(Boolean.parseBoolean(payload.getOrDefault("mandatory", "true").toString()));
        
        if (payload.containsKey("targetRoleId") && payload.get("targetRoleId") != null) {
            String roleIdStr = payload.get("targetRoleId").toString();
            if (!roleIdStr.trim().isEmpty() && !"Everyone".equalsIgnoreCase(roleIdStr)) {
                try {
                    Long roleId = Long.valueOf(roleIdStr);
                    Optional<FacultyRole> roleOpt = facultyRoleRepository.findById(roleId);
                    roleOpt.ifPresent(rf::setTargetRole);
                } catch (NumberFormatException e) {
                    // Fallback to resolving by name if they passed name instead of ID
                    Optional<FacultyRole> roleOpt = facultyRoleRepository.findByName(roleIdStr);
                    roleOpt.ifPresent(rf::setTargetRole);
                }
            }
        }

        rf.setCreatedAt(LocalDateTime.now());
        RequiredFile saved = requiredFileRepository.save(rf);

        // Notify all invigilators
        List<IqacInvigilator> invigilators = iqacInvigilatorRepository.findAll();
        for (IqacInvigilator inv : invigilators) {
            notificationService.createNotification(inv.getUser(),
                    "Director added a new required file: '" + rf.getFileName() + "' (" + rf.getFileCategory() + ")",
                    "REQUIRED_FILE", "New Required File");
            String html = "<html><body>" +
                    "<h3 style='color:#1A56DB;'>New Required File Added</h3>" +
                    "<p>Dear " + inv.getName() + ",</p>" +
                    "<p>The IQAC Director has added a new required audit file:</p>" +
                    "<ul><li><strong>File:</strong> " + rf.getFileName() + "</li>" +
                    "<li><strong>Category:</strong> " + rf.getFileCategory() + "</li>" +
                    "<li><strong>Mandatory:</strong> " + (rf.isMandatory() ? "Yes" : "No") + "</li>" +
                    "<li><strong>Target Role:</strong> " + (rf.getTargetRole() != null ? rf.getTargetRole().getName() : "Everyone") + "</li></ul>" +
                    "<p>Please ensure faculty submit this file before the audit deadline.</p>" +
                    "<p>Best regards,<br/>IQAC Director</p></body></html>";
            emailService.sendHtmlEmail(inv.getUser().getEmail(), "New Required File: " + rf.getFileName(), html);
        }
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/required-files/{id}")
    public ResponseEntity<?> deleteRequiredFile(@PathVariable Long id) {
        requiredFileRepository.deleteById(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Deleted"));
    }

    @PostMapping("/department-status/{deptCode}/complete")
    public ResponseEntity<?> completeDepartmentAudit(@PathVariable String deptCode) {
        Department dept = departmentRepository.findByCode(deptCode)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        AuditStatus status = auditStatusRepository.findByDepartmentCode(deptCode)
                .orElseGet(() -> {
                    AuditStatus s = new AuditStatus();
                    s.setDepartment(dept);
                    return s;
                });
        status.setStatus("AUDIT_COMPLETED");
        status.setLastUpdated(LocalDateTime.now());
        auditStatusRepository.save(status);
        return ResponseEntity.ok(Map.of("message", "Audit for department " + deptCode + " marked as COMPLETED. Uploads locked for " + deptCode + "."));
    }

    @PostMapping("/department-status/{deptCode}/reopen")
    public ResponseEntity<?> reopenDepartmentAudit(@PathVariable String deptCode) {
        Department dept = departmentRepository.findByCode(deptCode)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        AuditStatus status = auditStatusRepository.findByDepartmentCode(deptCode)
                .orElseGet(() -> {
                    AuditStatus s = new AuditStatus();
                    s.setDepartment(dept);
                    return s;
                });
        status.setStatus("IN_PROGRESS");
        status.setLastUpdated(LocalDateTime.now());
        auditStatusRepository.save(status);
        return ResponseEntity.ok(Map.of("message", "Audit for department " + deptCode + " RE-OPENED. Uploads enabled for " + deptCode + "."));
    }

    @PutMapping("/required-files/{id}")
    public ResponseEntity<?> updateRequiredFile(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        RequiredFile rf = requiredFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Required file not found"));
        
        rf.setFileName(payload.get("fileName").toString());
        rf.setFileCategory(payload.get("fileCategory").toString());
        rf.setDescription(payload.getOrDefault("description", "").toString());
        rf.setMandatory(Boolean.parseBoolean(payload.getOrDefault("mandatory", "true").toString()));
        
        if (payload.containsKey("targetRoleId")) {
            String roleIdStr = payload.get("targetRoleId") != null ? payload.get("targetRoleId").toString() : "";
            if (roleIdStr.trim().isEmpty() || "Everyone".equalsIgnoreCase(roleIdStr)) {
                rf.setTargetRole(null);
            } else {
                try {
                    Long roleId = Long.valueOf(roleIdStr);
                    Optional<FacultyRole> roleOpt = facultyRoleRepository.findById(roleId);
                    if (roleOpt.isPresent()) {
                        rf.setTargetRole(roleOpt.get());
                    } else {
                        rf.setTargetRole(null);
                    }
                } catch (NumberFormatException e) {
                    Optional<FacultyRole> roleOpt = facultyRoleRepository.findByName(roleIdStr);
                    if (roleOpt.isPresent()) {
                        rf.setTargetRole(roleOpt.get());
                    } else {
                        rf.setTargetRole(null);
                    }
                }
            }
        } else {
            rf.setTargetRole(null);
        }
        
        return ResponseEntity.ok(requiredFileRepository.save(rf));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().getName());
            map.put("enabled", u.isEnabled());

            // Try to find Name and Department from Profiles
            Optional<Faculty> fac = facultyRepository.findByUser(u);
            if (fac.isPresent()) {
                map.put("name", fac.get().getName());
                map.put("departmentCode", fac.get().getDepartment().getCode());
                map.put("department", fac.get().getDepartment().getName());
                map.put("designations", fac.get().getDesignations());
            } else {
                Optional<IqacInvigilator> inv = iqacInvigilatorRepository.findByUser(u);
                if (inv.isPresent()) {
                    map.put("name", inv.get().getName());
                    map.put("departmentCode", inv.get().getDepartment().getCode());
                    map.put("department", inv.get().getDepartment().getName());
                } else {
                    Optional<Hod> hod = hodRepository.findByUser(u);
                    if (hod.isPresent()) {
                        map.put("name", hod.get().getName());
                        map.put("departmentCode", hod.get().getDepartment().getCode());
                        map.put("department", hod.get().getDepartment().getName());
                    } else {
                        Optional<Director> dir = directorRepository.findByUser(u);
                        if (dir.isPresent()) {
                            map.put("name", dir.get().getName());
                            map.put("departmentCode", "ALL");
                            map.put("department", "All Departments");
                        } else {
                            map.put("name", "System Administrator");
                            map.put("departmentCode", "ALL");
                            map.put("department", "All Departments");
                        }
                    }
                }
            }
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/invigilators")
    public ResponseEntity<?> createInvigilatorEndpoint(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String departmentCode = payload.get("departmentCode");
            String profileImageBase64 = payload.get("profileImage");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username already exists."));
            }

            Department dept = departmentRepository.findByCode(departmentCode)
                    .orElseThrow(() -> new RuntimeException("Department not found."));

            Role invRole = roleRepository.findByName("ROLE_INVIGILATOR")
                    .orElseThrow(() -> new RuntimeException("Role not found."));

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(invRole);
            user.setEnabled(true);
            if (profileImageBase64 != null && !profileImageBase64.isEmpty()) {
                user.setProfileImageBase64(profileImageBase64);
            }

            IqacInvigilator inv = new IqacInvigilator();
            inv.setUser(user);
            inv.setName(name);
            inv.setDepartment(dept);

            iqacInvigilatorRepository.save(inv);
            return ResponseEntity.ok(Collections.singletonMap("message", "Invigilator account created successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/faculty")
    public ResponseEntity<?> createFaculty(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String departmentCode = payload.get("departmentCode");
            String designations = payload.get("designations");
            String profileImageBase64 = payload.get("profileImage");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username (Faculty Code) already exists."));
            }

            Department dept = departmentRepository.findByCode(departmentCode)
                    .orElseThrow(() -> new RuntimeException("Department not found."));

            Role facRole = roleRepository.findByName("ROLE_FACULTY")
                    .orElseThrow(() -> new RuntimeException("Role not found."));

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

    @PostMapping("/hod")
    public ResponseEntity<?> createHod(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String departmentCode = payload.get("departmentCode");
            String profileImageBase64 = payload.get("profileImage");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username already exists."));
            }

            Department dept = departmentRepository.findByCode(departmentCode)
                    .orElseThrow(() -> new RuntimeException("Department not found."));

            Role hodRole = roleRepository.findByName("ROLE_HOD")
                    .orElseThrow(() -> new RuntimeException("Role not found."));

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


    @PostMapping("/required-files/upload")
    public ResponseEntity<?> uploadRequiredFilesCsv(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "File is empty."));
            }
            List<RequiredFile> savedFiles = new ArrayList<>();
            try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream()))) {
                String line;
                boolean isFirstLine = true;
                while ((line = reader.readLine()) != null) {
                    if (isFirstLine) {
                        isFirstLine = false;
                        if (line.toLowerCase().contains("filename") || line.toLowerCase().contains("category")) {
                            continue;
                        }
                    }
                    String[] parts = line.split(",", -1);
                    if (parts.length >= 2) {
                        String name = parts[0].trim();
                        String category = parts[1].trim().toUpperCase();
                        if (name.isEmpty() || (!category.equals("ACADEMIC") && !category.equals("DEPARTMENT"))) {
                            continue;
                        }
                        String description = parts.length > 2 ? parts[2].trim() : "";
                        boolean mandatory = parts.length > 3 ? Boolean.parseBoolean(parts[3].trim()) : true;
                        String targetRoleName = parts.length > 4 ? parts[4].trim() : "";
                        
                        RequiredFile rf = new RequiredFile();
                        rf.setFileName(name);
                        rf.setFileCategory(category);
                        rf.setDescription(description);
                        rf.setMandatory(mandatory);
                        if (!targetRoleName.isEmpty() && !"Everyone".equalsIgnoreCase(targetRoleName)) {
                            Optional<FacultyRole> roleOpt = facultyRoleRepository.findByName(targetRoleName);
                            roleOpt.ifPresent(rf::setTargetRole);
                        }
                        rf.setCreatedAt(LocalDateTime.now());
                        
                        savedFiles.add(requiredFileRepository.save(rf));
                    }
                }
            }
            return ResponseEntity.ok(savedFiles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ── Faculty Roles CRUD & Progress Tracker Endpoints ─────────────────────

    @GetMapping("/faculties")
    public ResponseEntity<?> getFaculties() {
        return ResponseEntity.ok(facultyRepository.findAll());
    }

    @GetMapping("/faculty-roles")
    public ResponseEntity<?> getFacultyRoles() {
        return ResponseEntity.ok(facultyRoleRepository.findAll());
    }

    @PostMapping("/faculty-roles")
    public ResponseEntity<?> createFacultyRole(@RequestBody Map<String, Object> payload) {
        String name = payload.get("name").toString().trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Role name cannot be empty."));
        }
        if (facultyRoleRepository.findByName(name).isPresent()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Role already exists."));
        }
        FacultyRole fr = new FacultyRole();
        fr.setName(name);
        return ResponseEntity.ok(facultyRoleRepository.save(fr));
    }

    @PutMapping("/faculty-roles/{id}")
    public ResponseEntity<?> updateFacultyRole(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String name = payload.get("name").toString().trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Role name cannot be empty."));
        }
        FacultyRole fr = facultyRoleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        Optional<FacultyRole> existing = facultyRoleRepository.findByName(name);
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Another role with this name already exists."));
        }
        
        fr.setName(name);
        return ResponseEntity.ok(facultyRoleRepository.save(fr));
    }

    @DeleteMapping("/faculty-roles/{id}")
    public ResponseEntity<?> deleteFacultyRole(@PathVariable Long id) {
        FacultyRole role = facultyRoleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        List<Faculty> faculties = facultyRepository.findAll();
        for (Faculty f : faculties) {
            if (f.getFacultyRoles() != null) {
                boolean removed = f.getFacultyRoles().removeIf(r -> r.getId().equals(id));
                if (removed) {
                    facultyRepository.save(f);
                }
            }
        }
        
        List<RequiredFile> reqFiles = requiredFileRepository.findAll();
        for (RequiredFile rf : reqFiles) {
            if (rf.getTargetRole() != null && rf.getTargetRole().getId().equals(id)) {
                rf.setTargetRole(null);
                requiredFileRepository.save(rf);
            }
        }

        facultyRoleRepository.delete(role);
        return ResponseEntity.ok(Collections.singletonMap("message", "Role deleted successfully."));
    }

    @PostMapping("/faculties/{id}/assign-role")
    public ResponseEntity<?> assignRoleToFaculty(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        
        faculty.getFacultyRoles().clear();
        if (payload.containsKey("roleIds") && payload.get("roleIds") != null) {
            List<?> roleIdsRaw = (List<?>) payload.get("roleIds");
            for (Object rid : roleIdsRaw) {
                if (rid == null || rid.toString().trim().isEmpty() || "Everyone".equalsIgnoreCase(rid.toString()) || "NONE".equalsIgnoreCase(rid.toString())) {
                    continue;
                }
                try {
                    Long roleId = Long.valueOf(rid.toString());
                    Optional<FacultyRole> roleOpt = facultyRoleRepository.findById(roleId);
                    roleOpt.ifPresent(faculty.getFacultyRoles()::add);
                } catch (NumberFormatException e) {
                    Optional<FacultyRole> roleOpt = facultyRoleRepository.findByName(rid.toString());
                    roleOpt.ifPresent(faculty.getFacultyRoles()::add);
                }
            }
        }
        
        return ResponseEntity.ok(facultyRepository.save(faculty));
    }

    @GetMapping("/faculty-invigilator-progress")
    public ResponseEntity<?> getFacultyInvigilatorProgress() {
        List<RequiredFile> requiredFiles = requiredFileRepository.findAll();
        List<Faculty> faculties = facultyRepository.findAll();
        List<IqacInvigilator> invigilators = iqacInvigilatorRepository.findAll();

        List<Map<String, Object>> facultyProgress = new ArrayList<>();
        for (Faculty f : faculties) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("name", f.getName());
            map.put("code", f.getFacultyCode());
            map.put("department", f.getDepartment().getCode());
            String roleName = "Faculty";
            if (f.getFacultyRoles() != null && !f.getFacultyRoles().isEmpty()) {
                List<String> names = new ArrayList<>();
                for (FacultyRole r : f.getFacultyRoles()) {
                    names.add(r.getName());
                }
                roleName = String.join(", ", names);
            }
            map.put("role", roleName);

            int expectedCount = 0;
            int submittedCount = 0;
            List<String> submittedDocTypes = new ArrayList<>();
            List<AcademicFile> academiaFiles = academicFileRepository.findByFacultyId(f.getId());
            List<DepartmentFile> deptFiles = departmentFileRepository.findByFacultyId(f.getId());
            for (AcademicFile cf : academiaFiles) {
                if (!submittedDocTypes.contains(cf.getDocumentType())) {
                    submittedDocTypes.add(cf.getDocumentType());
                }
            }
            for (DepartmentFile df : deptFiles) {
                if (!submittedDocTypes.contains(df.getDocumentType())) {
                    submittedDocTypes.add(df.getDocumentType());
                }
            }

            for (RequiredFile rf : requiredFiles) {
                if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                    expectedCount++;
                    if (submittedDocTypes.contains(rf.getFileName())) {
                        submittedCount++;
                    }
                }
            }

            map.put("expectedCount", expectedCount);
            map.put("submittedCount", submittedCount);
            map.put("progress", expectedCount > 0 ? Math.round((double) submittedCount / expectedCount * 100) : 100);
            facultyProgress.add(map);
        }

        List<Map<String, Object>> invigilatorProgress = new ArrayList<>();
        for (IqacInvigilator inv : invigilators) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", inv.getId());
            map.put("name", inv.getName());
            map.put("department", inv.getDepartment().getName());
            map.put("departmentCode", inv.getDepartment().getCode());
            map.put("role", "IQAC Invigilator");

            Department dept = inv.getDepartment();
            long academicExpectedDept = 0;
            List<Faculty> deptFaculties = facultyRepository.findByDepartmentCode(dept.getCode());
            for (Faculty f : deptFaculties) {
                for (RequiredFile rf : requiredFiles) {
                    if (rf.getFileCategory().equals("ACADEMIC")) {
                        if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                            academicExpectedDept++;
                        }
                    }
                }
            }

            long deptExpectedDept = 0;
            for (RequiredFile rf : requiredFiles) {
                if (rf.getFileCategory().equals("DEPARTMENT")) {
                    deptExpectedDept++;
                }
            }

            long totalExpectedDept = academicExpectedDept + deptExpectedDept;
            long academicSubmittedDept = academicFileRepository.countByDepartment(dept.getCode());
            long deptSubmittedDept = departmentFileRepository.countByDepartment(dept.getCode());
            long totalSubmittedDept = academicSubmittedDept + deptSubmittedDept;

            map.put("expectedCount", totalExpectedDept);
            map.put("submittedCount", totalSubmittedDept);
            map.put("progress", totalExpectedDept > 0 ? Math.round((double) totalSubmittedDept / totalExpectedDept * 100) : 100);
            invigilatorProgress.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("faculty", facultyProgress);
        response.put("invigilators", invigilatorProgress);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/late-upload-requests")
    public ResponseEntity<?> getLateUploadRequests() {
        return ResponseEntity.ok(lateUploadRequestRepository.findAll());
    }

    @PostMapping("/late-upload-requests/{id}/approve")
    public ResponseEntity<?> approveLateUploadRequest(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            LateUploadRequest req = lateUploadRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
            req.setStatus("APPROVED");
            req.setApprovedTime(LocalDateTime.now());
            String extendedDeadlineStr = payload.get("extendedDeadline"); 
            LocalDateTime extendedDeadline = LocalDateTime.parse(extendedDeadlineStr);
            req.setExtendedDeadline(extendedDeadline);
            lateUploadRequestRepository.save(req);
            
            notificationService.createNotification(req.getFaculty().getUser(), 
                "Your request for late upload on schedule '" + req.getSchedule().getTitle() + "' has been approved. Extended deadline: " + extendedDeadlineStr,
                "REMINDER", "Late Upload Request Approved");

            return ResponseEntity.ok(Collections.singletonMap("message", "Request approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/late-upload-requests/{id}/reject")
    public ResponseEntity<?> rejectLateUploadRequest(@PathVariable Long id) {
        try {
            LateUploadRequest req = lateUploadRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
            req.setStatus("REJECTED");
            lateUploadRequestRepository.save(req);

            notificationService.createNotification(req.getFaculty().getUser(), 
                "Your request for late upload on schedule '" + req.getSchedule().getTitle() + "' has been rejected.",
                "REMINDER", "Late Upload Request Rejected");

            return ResponseEntity.ok(Collections.singletonMap("message", "Request rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ── Dynamic Academic Years ─────────────────────────────────────────────

    @GetMapping("/academic-years")
    public ResponseEntity<?> getAcademicYears() {
        List<com.iqac.audit.entity.academic.AcademicYear> list = academicYearRepository.findAll();
        if (list.isEmpty()) {
            // seed defaults if empty
            String[] defaults = {"2024–2025", "2025–2026", "2026–2027"};
            for (String code : defaults) {
                com.iqac.audit.entity.academic.AcademicYear ay = new com.iqac.audit.entity.academic.AcademicYear(code, code.contains("2026"));
                academicYearRepository.save(ay);
                list.add(ay);
            }
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping("/academic-years")
    public ResponseEntity<?> createAcademicYear(@RequestBody Map<String, String> payload) {
        try {
            String yearCode = payload.get("yearCode");
            if (yearCode == null || yearCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Academic year code required"));
            }
            cleanStr(yearCode);
            Optional<com.iqac.audit.entity.academic.AcademicYear> opt = academicYearRepository.findByYearCode(yearCode.trim());
            if (opt.isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Academic year already exists"));
            }
            com.iqac.audit.entity.academic.AcademicYear ay = new com.iqac.audit.entity.academic.AcademicYear(yearCode.trim(), true);
            academicYearRepository.save(ay);
            auditLogService.log("CREATE_ACADEMIC_YEAR", yearCode.trim(), null, "Created active academic year " + yearCode.trim());
            return ResponseEntity.ok(ay);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ── Dynamic Audits Management (Single & Batch Creation) ─────────────────────

    @GetMapping("/audits")
    public ResponseEntity<?> getAudits(
            @RequestParam(value = "academicYear", required = false) String academicYear,
            @RequestParam(value = "departmentCode", required = false) String departmentCode,
            @RequestParam(value = "yearLevel", required = false) String yearLevel) {
        List<com.iqac.audit.entity.audit.Audit> audits = auditRepository.findByArchivedFalse();
        if (academicYear != null && !academicYear.trim().isEmpty() && !"ALL".equalsIgnoreCase(academicYear)) {
            audits = audits.stream().filter(a -> academicYear.equalsIgnoreCase(a.getAcademicYear())).collect(Collectors.toList());
        }
        if (departmentCode != null && !departmentCode.trim().isEmpty() && !"ALL".equalsIgnoreCase(departmentCode)) {
            audits = audits.stream().filter(a -> a.getDepartment() != null && departmentCode.equalsIgnoreCase(a.getDepartment().getCode())).collect(Collectors.toList());
        }
        if (yearLevel != null && !yearLevel.trim().isEmpty() && !"ALL".equalsIgnoreCase(yearLevel)) {
            audits = audits.stream().filter(a -> yearLevel.equalsIgnoreCase(a.getYearLevel())).collect(Collectors.toList());
        }
        return ResponseEntity.ok(audits);
    }

    @PostMapping("/audits")
    public ResponseEntity<?> createSingleAudit(@RequestBody Map<String, Object> payload) {
        try {
            List<com.iqac.audit.entity.audit.Audit> auditsToSave = buildAuditsForPayload(payload);
            List<com.iqac.audit.entity.audit.Audit> savedAudits = new ArrayList<>();
            
            for (com.iqac.audit.entity.audit.Audit audit : auditsToSave) {
                com.iqac.audit.entity.audit.Audit saved = auditRepository.save(audit);
                savedAudits.add(saved);
                auditLogService.log("CREATE_AUDIT", saved.getName(), null, "Single Audit created for " + saved.getDepartment().getCode());
                
                // Map Audit to AuditSchedule automatically
                AuditSchedule schedule = new AuditSchedule();
                schedule.setTitle(saved.getName());
                schedule.setAuditDate(saved.getStartDate());
                schedule.setDueDate(saved.getEndDate());
                schedule.setDepartmentCode(saved.getDepartment().getCode());
                schedule.setYear(saved.getYearLevel());
                schedule.setAuditType(saved.getAuditType());
                schedule.setDescription(saved.getDescription());
                schedule.setStatus("PUBLISHED");
                schedule.setCreatedAt(LocalDateTime.now());
                auditScheduleRepository.save(schedule);

                // Ensure required files are mapped for this academic year, dept and year level
                ensureRequiredFilesMapped(saved.getAcademicYear(), saved.getDepartment().getCode(), saved.getYearLevel());

                notifyAuditCreated(saved);
            }
            return ResponseEntity.ok(savedAudits.size() == 1 ? savedAudits.get(0) : savedAudits);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/audits/batch")
    public ResponseEntity<?> createBatchAudits(@RequestBody List<Map<String, Object>> payloads) {
        try {
            if (payloads == null || payloads.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "At least one audit payload is required"));
            }
            List<com.iqac.audit.entity.audit.Audit> createdAudits = new ArrayList<>();
            for (Map<String, Object> payload : payloads) {
                List<com.iqac.audit.entity.audit.Audit> auditsToSave = buildAuditsForPayload(payload);
                for (com.iqac.audit.entity.audit.Audit audit : auditsToSave) {
                    com.iqac.audit.entity.audit.Audit saved = auditRepository.save(audit);
                    createdAudits.add(saved);

                    // Map Audit to AuditSchedule automatically
                    AuditSchedule schedule = new AuditSchedule();
                    schedule.setTitle(saved.getName());
                    schedule.setAuditDate(saved.getStartDate());
                    schedule.setDueDate(saved.getEndDate());
                    schedule.setDepartmentCode(saved.getDepartment().getCode());
                    schedule.setYear(saved.getYearLevel());
                    schedule.setAuditType(saved.getAuditType());
                    schedule.setDescription(saved.getDescription());
                    schedule.setStatus("PUBLISHED");
                    schedule.setCreatedAt(LocalDateTime.now());
                    auditScheduleRepository.save(schedule);

                    // Ensure required files are mapped for this academic year, dept and year level
                    ensureRequiredFilesMapped(saved.getAcademicYear(), saved.getDepartment().getCode(), saved.getYearLevel());

                    auditLogService.log("CREATE_AUDIT_BATCH", saved.getName(), null, "Batch Audit created for " + saved.getDepartment().getCode());
                    notifyAuditCreated(saved);
                }
            }
            return ResponseEntity.ok(createdAudits);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    private List<com.iqac.audit.entity.audit.Audit> buildAuditsForPayload(Map<String, Object> payload) {
        String departmentCode = (String) payload.get("departmentCode");
        List<com.iqac.audit.entity.audit.Audit> result = new ArrayList<>();

        if ("ALL".equalsIgnoreCase(departmentCode)) {
            List<Department> allDepts = departmentRepository.findAll();
            for (Department dept : allDepts) {
                Map<String, Object> singlePayload = new HashMap<>(payload);
                singlePayload.put("departmentCode", dept.getCode());
                try {
                    result.add(validateAndBuildAudit(singlePayload));
                } catch (RuntimeException ignored) {
                    // Skip department if overlap exists for that department
                }
            }
            if (result.isEmpty()) {
                throw new RuntimeException("No audits could be created for ALL departments. Check if audits already exist for the selected period.");
            }
        } else {
            result.add(validateAndBuildAudit(payload));
        }

        return result;
    }

    private void ensureRequiredFilesMapped(String academicYear, String departmentCode, String yearLevel) {
        String[] standardFiles = {
            "Curriculum", "Syllabus", "CO, PO, PSO Mapping", "Lesson Planning", 
            "Pedagogy / Reports", "Assignment Details", "Course PPT", 
            "Question Bank", "Internal Assessment Test Papers", "Answer Keys", 
            "Sample Answer Scripts", "Course End Survey", "Attainment Sheet"
        };
        for (String fName : standardFiles) {
            Optional<RequiredFile> existing = requiredFileRepository.findByFileName(fName);
            if (existing.isEmpty()) {
                RequiredFile rf = new RequiredFile();
                rf.setFileName(fName);
                rf.setFileCategory("ACADEMIC");
                rf.setAcademicYear(academicYear != null ? academicYear : "ALL");
                rf.setYear(yearLevel != null ? yearLevel : "ALL");
                rf.setDescription("Required audit file: " + fName);
                rf.setMandatory(true);
                rf.setCreatedAt(LocalDateTime.now());
                requiredFileRepository.save(rf);
            } else {
                RequiredFile rf = existing.get();
                if (rf.getAcademicYear() == null || rf.getAcademicYear().equals("ALL")) {
                    rf.setAcademicYear(academicYear);
                    requiredFileRepository.save(rf);
                }
            }
        }
    }

    private com.iqac.audit.entity.audit.Audit validateAndBuildAudit(Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String academicYear = (String) payload.get("academicYear");
        String departmentCode = (String) payload.get("departmentCode");
        String yearLevel = (String) payload.get("yearLevel");
        String auditType = payload.getOrDefault("auditType", "ACADEMIC").toString();
        String startDateStr = (String) payload.get("startDate");
        String endDateStr = (String) payload.get("endDate");
        String description = (String) payload.getOrDefault("description", "");
        String notes = (String) payload.getOrDefault("additionalNotes", "");

        if (name == null || name.trim().isEmpty()) throw new RuntimeException("Audit name is required");
        if (academicYear == null || academicYear.trim().isEmpty()) throw new RuntimeException("Academic year is required");
        if (departmentCode == null || departmentCode.trim().isEmpty()) throw new RuntimeException("Department is required");
        if (yearLevel == null || yearLevel.trim().isEmpty()) throw new RuntimeException("Year level is required");
        if (startDateStr == null || endDateStr == null || startDateStr.trim().isEmpty() || endDateStr.trim().isEmpty()) {
            throw new RuntimeException("Audit start date and end date are required");
        }

        LocalDate startDate = parseDate(startDateStr);
        LocalDate endDate = parseDate(endDateStr);

        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("End date cannot be before start date");
        }

        Department dept = departmentRepository.findByCode(departmentCode)
                .orElseThrow(() -> new RuntimeException("Department not found: " + departmentCode));

        // Conflict check: Check overlapping audits for same department / year
        List<com.iqac.audit.entity.audit.Audit> existing = auditRepository.findByAcademicYearAndDepartmentCodeAndYearLevelAndArchivedFalse(academicYear, departmentCode, yearLevel);
        for (com.iqac.audit.entity.audit.Audit a : existing) {
            if (!(endDate.isBefore(a.getStartDate()) || startDate.isAfter(a.getEndDate()))) {
                throw new RuntimeException("An audit already exists for department " + departmentCode + " / " + yearLevel + " during the selected period (" + a.getStartDate() + " to " + a.getEndDate() + ")");
            }
        }

        com.iqac.audit.entity.audit.Audit audit = new com.iqac.audit.entity.audit.Audit();
        audit.setName(name);
        audit.setAcademicYear(academicYear);
        audit.setDepartment(dept);
        audit.setYearLevel(yearLevel);
        audit.setAuditType(auditType);
        audit.setDescription(description);
        audit.setStartDate(startDate);
        audit.setEndDate(endDate);
        audit.setStatus("DRAFT");
        audit.setAdditionalNotes(notes);

        if (payload.containsKey("invigilatorId") && payload.get("invigilatorId") != null) {
            String invIdStr = payload.get("invigilatorId").toString().trim();
            if (!invIdStr.isEmpty() && !"null".equalsIgnoreCase(invIdStr)) {
                try {
                    Long invId = Long.valueOf(invIdStr);
                    iqacInvigilatorRepository.findById(invId).ifPresent(audit::setAssignedInvigilator);
                } catch (NumberFormatException ignored) {}
            }
        }

        return audit;
    }

    private void notifyAuditCreated(com.iqac.audit.entity.audit.Audit audit) {
        Optional<Hod> hodOpt = hodRepository.findByDepartmentCode(audit.getDepartment().getCode());
        hodOpt.ifPresent(hod -> {
            notificationService.createNotification(hod.getUser(),
                    "New Audit Created: '" + audit.getName() + "' for " + audit.getDepartment().getCode() + " (" + audit.getYearLevel() + ")",
                    "AUDIT", "New Audit Scheduled");
        });
    }

    @DeleteMapping("/audits/{id}")
    public ResponseEntity<?> archiveAudit(@PathVariable Long id) {
        try {
            com.iqac.audit.entity.audit.Audit audit = auditRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Audit not found"));
            
            audit.setArchived(true);
            auditRepository.save(audit);
            auditLogService.log("ARCHIVE_AUDIT", audit.getName(), "ACTIVE", "ARCHIVED");
            return ResponseEntity.ok(Collections.singletonMap("message", "Audit archived successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ── Audit Pre-Closure Verification & Controlled State Machine ─────────────────────

    @PostMapping("/audits/{id}/verify-closure")
    public ResponseEntity<?> verifyAuditClosure(@PathVariable Long id) {
        try {
            com.iqac.audit.entity.audit.Audit audit = auditRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Audit not found"));

            List<String> pendingItems = new ArrayList<>();

            // 1. Verify required files submitted
            List<RequiredFile> reqFiles = requiredFileRepository.findAll();
            List<Faculty> deptFaculty = facultyRepository.findByDepartmentCode(audit.getDepartment().getCode());
            
            for (RequiredFile rf : reqFiles) {
                if (rf.isMandatory()) {
                    boolean submitted = false;
                    if ("ACADEMIC".equalsIgnoreCase(rf.getFileCategory())) {
                        for (Faculty f : deptFaculty) {
                            List<AcademicFile> files = academicFileRepository.findByFacultyId(f.getId());
                            if (files.stream().anyMatch(af -> rf.getFileName().equalsIgnoreCase(af.getDocumentType()) && "APPROVED".equalsIgnoreCase(af.getStatus()))) {
                                submitted = true;
                                break;
                            }
                        }
                    } else {
                        List<DepartmentFile> dfiles = departmentFileRepository.findByDepartment(audit.getDepartment().getCode());
                        if (dfiles.stream().anyMatch(df -> rf.getFileName().equalsIgnoreCase(df.getDocumentType()) && "APPROVED".equalsIgnoreCase(df.getStatus()))) {
                            submitted = true;
                        }
                    }
                    if (!submitted) {
                        pendingItems.add("Mandatory Required File pending approval: " + rf.getFileName());
                    }
                }
            }

            if (!pendingItems.isEmpty()) {
                Map<String, Object> err = new HashMap<>();
                err.put("canComplete", false);
                err.put("message", "Audit cannot be completed because required items are pending.");
                err.put("pendingItems", pendingItems);
                return ResponseEntity.badRequest().body(err);
            }

            audit.setStatus("COMPLETED");
            auditRepository.save(audit);
            auditLogService.log("COMPLETE_AUDIT", audit.getName(), "IN_PROGRESS", "COMPLETED");

            return ResponseEntity.ok(Collections.singletonMap("message", "Audit successfully completed! All requirements verified."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // ── Audit Logs ─────────────────────────────────────────────────────────────

    @GetMapping("/logs")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    private String cleanStr(String str) {
        return str == null ? "" : str.trim();
    }

    private LocalDate parseDate(String dateStr) {
        String cleanStr = dateStr.trim();
        List<String> patterns = Arrays.asList(
            "yyyy-MM-dd", "dd-MM-yyyy", "yyyy/MM/dd", "dd/MM/yyyy",
            "yyyy.MM.dd", "dd.MM.yyyy", "d-M-yyyy", "yyyy-M-d",
            "d/M/yyyy", "d.M.yyyy", "yyyy/M/d", "yyyy.M.d"
        );
        for (String pattern : patterns) {
            try {
                return LocalDate.parse(cleanStr, java.time.format.DateTimeFormatter.ofPattern(pattern));
            } catch (Exception e) {
                // try next pattern
            }
        }
        throw new IllegalArgumentException("Unsupported date format: '" + dateStr + "'");
    }
}