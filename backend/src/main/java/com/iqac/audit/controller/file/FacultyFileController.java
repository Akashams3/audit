package com.iqac.audit.controller.file;

import com.iqac.audit.entity.audit.AuditSchedule;
import com.iqac.audit.entity.audit.AuditStage;
import com.iqac.audit.entity.audit.AuditStatus;
import com.iqac.audit.entity.audit.LateUploadRequest;
import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.ByteArrayMultipartFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.FacultyRole;
import com.iqac.audit.repository.audit.AuditScheduleRepository;
import com.iqac.audit.repository.audit.AuditStatusRepository;
import com.iqac.audit.repository.audit.LateUploadRequestRepository;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.service.file.FileStorageService;
import com.iqac.audit.service.notification.EmailService;
import com.iqac.audit.service.notification.NotificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.Font;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/faculty")
public class FacultyFileController {

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private AcademicFileRepository academicFileRepository;

    @Autowired
    private DepartmentFileRepository departmentFileRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditStatusRepository auditStatusRepository;

    @Autowired
    private RequiredFileRepository requiredFileRepository;

    @Autowired
    private AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private LateUploadRequestRepository lateUploadRequestRepository;

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
    private com.iqac.audit.repository.user.UserRepository userRepository;

    @Autowired
    private com.iqac.audit.repository.department.DepartmentRepository departmentRepository;

    private Faculty getAuthenticatedFaculty() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Faculty> facOpt = facultyRepository.findByUsernameOrEmail(principal);
        if (facOpt.isPresent()) {
            return facOpt.get();
        }
        Optional<com.iqac.audit.entity.user.User> userOpt = userRepository.findByEmail(principal).or(() -> userRepository.findByUsername(principal));
        if (userOpt.isPresent()) {
            com.iqac.audit.entity.user.User user = userOpt.get();
            Optional<Faculty> facByUser = facultyRepository.findByUser(user);
            if (facByUser.isPresent()) {
                return facByUser.get();
            }
            Department defaultDept = departmentRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No department found"));
            Faculty newFac = new Faculty();
            newFac.setUser(user);
            newFac.setName(user.getUsername());
            newFac.setFacultyCode(user.getUsername());
            newFac.setDepartment(defaultDept);
            return facultyRepository.save(newFac);
        }
        throw new RuntimeException("Logged in user is not a registered Faculty member");
    }

    private boolean isAuditLocked(String deptCode) {
        Optional<AuditStatus> statusOpt = auditStatusRepository.findByDepartmentCode(deptCode);
        if (statusOpt.isPresent()) {
            String status = statusOpt.get().getStatus();
            return status.equals("SUBMITTED_TO_AUDITOR") || status.equals("AUDIT_COMPLETED");
        }
        return false;
    }

    private boolean isAuditCompleted(String deptCode) {
        Optional<AuditStatus> statusOpt = auditStatusRepository.findByDepartmentCode(deptCode);
        return statusOpt.isPresent() && "AUDIT_COMPLETED".equalsIgnoreCase(statusOpt.get().getStatus());
    }

    // Faculty: view required files (filtered by stage, year, sem, role, designations, and audit status)
    @GetMapping("/required-files")
    public ResponseEntity<?> getRequiredFiles(
            @RequestParam(value = "stage", required = false) String stageStr,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "semester", required = false) String semester) {
        Faculty faculty = getAuthenticatedFaculty();

        // If audit is completed, required files are removed from active frontend view (preserved in DB)
        if (isAuditCompleted(faculty.getDepartment().getCode())) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        Set<FacultyRole> roles = faculty.getFacultyRoles();
        String designations = faculty.getDesignations();

        Set<String> designationNames = new HashSet<>();
        if (designations != null && !designations.trim().isEmpty()) {
            for (String d : designations.split(",")) {
                designationNames.add(d.trim().toLowerCase());
            }
        }

        AuditStage stageEnum = null;
        if (stageStr != null && !stageStr.trim().isEmpty()) {
            try {
                stageEnum = AuditStage.valueOf(stageStr.trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        List<RequiredFile> allFiles = requiredFileRepository.findAll();
        List<RequiredFile> filtered = new ArrayList<>();

        for (RequiredFile rf : allFiles) {
            // Stage filter check
            if (stageEnum != null) {
                if (rf.getStages() != null && !rf.getStages().isEmpty() && !rf.getStages().contains(stageEnum)) {
                    continue;
                }
                // (X) rule: X files should NOT have FPP
                if (stageEnum == AuditStage.FPP && (rf.isXFile() || rf.getFileName().toLowerCase().contains("(x)"))) {
                    continue;
                }
            }

            // Year filter check
            if (year != null && !year.trim().isEmpty() && !"ALL".equalsIgnoreCase(year)) {
                if (!"ALL".equalsIgnoreCase(rf.getYear()) && !rf.getYear().equalsIgnoreCase(year)) {
                    continue;
                }
            }

            // Semester filter check
            if (semester != null && !semester.trim().isEmpty() && !"ALL".equalsIgnoreCase(semester)) {
                if (!"ALL".equalsIgnoreCase(rf.getSemester()) && !rf.getSemester().equalsIgnoreCase(semester)) {
                    continue;
                }
            }

            // Role / Designation check
            if (rf.getTargetRole() == null) {
                filtered.add(rf);
            } else {
                String targetRoleName = rf.getTargetRole().getName().trim().toLowerCase();
                boolean matchesRole = roles != null && roles.stream()
                        .anyMatch(r -> r.getId().equals(rf.getTargetRole().getId()));
                boolean matchesDesignation = designationNames.contains(targetRoleName);

                if (matchesRole || matchesDesignation) {
                    filtered.add(rf);
                }
            }
        }
        return ResponseEntity.ok(filtered);
    }

    private AuditSchedule getBlockedSchedule(Faculty faculty, boolean[] isLate, LocalDateTime[] originalDeadline) {
        List<AuditSchedule> schedules = auditScheduleRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        for (AuditSchedule s : schedules) {
            if ("PUBLISHED".equals(s.getStatus())) {
                if ("ALL".equals(s.getDepartmentCode()) || s.getDepartmentCode().equalsIgnoreCase(faculty.getDepartment().getCode())) {
                    LocalTime dueTime = s.getDueTime() != null ? s.getDueTime() : LocalTime.MAX;
                    LocalDateTime deadline = LocalDateTime.of(s.getDueDate(), dueTime);
                    if (now.isAfter(deadline)) {
                        Optional<LateUploadRequest> reqOpt = lateUploadRequestRepository
                                .findFirstByFacultyIdAndScheduleIdOrderByRequestTimeDesc(faculty.getId(), s.getId());
                        if (reqOpt.isPresent()) {
                            LateUploadRequest req = reqOpt.get();
                            if ("APPROVED".equals(req.getStatus()) && req.getExtendedDeadline() != null && now.isBefore(req.getExtendedDeadline())) {
                                isLate[0] = true;
                                originalDeadline[0] = deadline;
                                continue;
                            }
                        }
                        return s;
                    }
                }
            }
        }
        return null;
    }

    @GetMapping("/upload-status")
    public ResponseEntity<?> getUploadStatus() {
        try {
            Faculty faculty = getAuthenticatedFaculty();
            boolean[] isLate = {false};
            LocalDateTime[] originalDeadline = {null};
            AuditSchedule blocked = getBlockedSchedule(faculty, isLate, originalDeadline);

            Map<String, Object> map = new HashMap<>();
            if (blocked != null) {
                map.put("blocked", true);
                map.put("scheduleId", blocked.getId());
                map.put("scheduleTitle", blocked.getTitle());
                map.put("dueDate", blocked.getDueDate());
                map.put("dueTime", blocked.getDueTime());
                Optional<LateUploadRequest> req = lateUploadRequestRepository
                    .findFirstByFacultyIdAndScheduleIdOrderByRequestTimeDesc(faculty.getId(), blocked.getId());
                if (req.isPresent()) {
                    map.put("requestStatus", req.get().getStatus());
                    map.put("reason", req.get().getReason());
                } else {
                    map.put("requestStatus", "NONE");
                }
            } else {
                map.put("blocked", false);
            }
            return ResponseEntity.ok(map);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/late-upload-request")
    public ResponseEntity<?> submitLateRequest(@RequestBody Map<String, Object> payload) {
        try {
            Faculty faculty = getAuthenticatedFaculty();
            Long scheduleId = Long.valueOf(payload.get("scheduleId").toString());
            String reason = payload.get("reason").toString();

            AuditSchedule schedule = auditScheduleRepository.findById(scheduleId)
                    .orElseThrow(() -> new RuntimeException("Schedule not found"));

            LateUploadRequest request = new LateUploadRequest();
            request.setFaculty(faculty);
            request.setSchedule(schedule);
            request.setReason(reason);
            request.setRequestTime(LocalDateTime.now());
            request.setStatus("PENDING");

            lateUploadRequestRepository.save(request);

            return ResponseEntity.ok(Collections.singletonMap("message", "Late submission request submitted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping({"/academic-files"})
    public ResponseEntity<?> uploadAcademicFile(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "textContent", required = false) String textContent,
            @RequestParam("courseName") String courseName,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "stage", required = false) String stageStr,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "semester", required = false) String semester) {
        try {
            Faculty faculty = getAuthenticatedFaculty();
            if (isAuditLocked(faculty.getDepartment().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "Cannot upload files: Department audit process has already started or completed."));
            }

            boolean[] isLate = {false};
            LocalDateTime[] originalDeadline = {null};
            AuditSchedule blocked = getBlockedSchedule(faculty, isLate, originalDeadline);
            if (blocked != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "Upload blocked: Deadline passed for schedule '" + blocked.getTitle() + "'. Please request permission."));
            }

            MultipartFile uploadFile = file;
            if (textContent != null && !textContent.trim().isEmpty()) {
                byte[] pdfBytes = generatePdfFromText(courseName + " - " + documentType, textContent);
                uploadFile = new ByteArrayMultipartFile(pdfBytes, "file", documentType + ".pdf", "application/pdf");
            }

            if (uploadFile == null || uploadFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Please select a file or enter text content."));
            }

            AcademicFile savedFile = fileStorageService.storeAcademicFile(uploadFile, courseName, documentType, faculty, faculty.getUser().getUsername());

            if (stageStr != null && !stageStr.trim().isEmpty()) {
                try {
                    savedFile.setStage(AuditStage.valueOf(stageStr.trim().toUpperCase()));
                } catch (Exception ignored) {}
            }
            if (year != null) savedFile.setYear(year);
            if (semester != null) savedFile.setSemester(semester);

            savedFile.setIsLate(isLate[0]);
            if (isLate[0]) {
                savedFile.setActualSubmissionTime(LocalDateTime.now());
                savedFile.setOriginalDeadline(originalDeadline[0]);
            } else {
                savedFile.setActualSubmissionTime(LocalDateTime.now());
            }
            academicFileRepository.save(savedFile);

            String htmlContent = emailService.buildSubmissionSuccessHtml(faculty.getName(), savedFile.getFileName());
            emailService.sendHtmlEmail(faculty.getUser().getEmail(), "File Upload Confirmation", htmlContent);

            notificationService.createNotification(faculty.getUser(), "Academic file '" + savedFile.getFileName() + "' uploaded successfully.",
                    "UPLOAD", "Academic File Uploaded");

            return ResponseEntity.ok(savedFile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/department-files")
    public ResponseEntity<?> uploadDepartmentFile(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "textContent", required = false) String textContent,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "stage", required = false) String stageStr,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "semester", required = false) String semester) {
        try {
            Faculty faculty = getAuthenticatedFaculty();
            if (isAuditLocked(faculty.getDepartment().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "Cannot upload files: Department audit process has already started or completed."));
            }

            boolean[] isLate = {false};
            LocalDateTime[] originalDeadline = {null};
            AuditSchedule blocked = getBlockedSchedule(faculty, isLate, originalDeadline);
            if (blocked != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "Upload blocked: Deadline passed for schedule '" + blocked.getTitle() + "'. Please request permission."));
            }

            MultipartFile uploadFile = file;
            if (textContent != null && !textContent.trim().isEmpty()) {
                byte[] pdfBytes = generatePdfFromText(faculty.getDepartment().getName() + " - " + documentType, textContent);
                uploadFile = new ByteArrayMultipartFile(pdfBytes, "file", documentType + ".pdf", "application/pdf");
            }

            if (uploadFile == null || uploadFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Please select a file or enter text content."));
            }

            DepartmentFile savedFile = fileStorageService.storeDepartmentFile(uploadFile, documentType, faculty, faculty.getUser().getUsername());

            if (stageStr != null && !stageStr.trim().isEmpty()) {
                try {
                    savedFile.setStage(AuditStage.valueOf(stageStr.trim().toUpperCase()));
                } catch (Exception ignored) {}
            }
            if (year != null) savedFile.setYear(year);
            if (semester != null) savedFile.setSemester(semester);

            savedFile.setIsLate(isLate[0]);
            if (isLate[0]) {
                savedFile.setActualSubmissionTime(LocalDateTime.now());
                savedFile.setOriginalDeadline(originalDeadline[0]);
            } else {
                savedFile.setActualSubmissionTime(LocalDateTime.now());
            }
            departmentFileRepository.save(savedFile);

            String htmlContent = emailService.buildSubmissionSuccessHtml(faculty.getName(), savedFile.getFileName());
            emailService.sendHtmlEmail(faculty.getUser().getEmail(), "File Upload Confirmation", htmlContent);

            notificationService.createNotification(faculty.getUser(), "Department file '" + savedFile.getFileName() + "' uploaded successfully.",
                    "UPLOAD", "Department File Uploaded");

            return ResponseEntity.ok(savedFile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    private byte[] generatePdfFromText(String title, String content) throws Exception {
        Document document = new Document();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        document.open();

        Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
        document.add(new Paragraph(title, titleFont));
        document.add(new Paragraph(" "));

        Font bodyFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
        document.add(new Paragraph(content, bodyFont));

        document.close();
        return baos.toByteArray();
    }

    @GetMapping({"/academic-files"})
    public ResponseEntity<List<AcademicFile>> getMyAcademiaFiles(
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "semester", required = false) String semester) {
        Faculty faculty = getAuthenticatedFaculty();
        List<AcademicFile> files = academicFileRepository.findByFacultyId(faculty.getId());
        if (year != null && !year.trim().isEmpty() && !"ALL".equalsIgnoreCase(year)) {
            files = files.stream().filter(f -> year.equalsIgnoreCase(f.getYear())).collect(Collectors.toList());
        }
        if (semester != null && !semester.trim().isEmpty() && !"ALL".equalsIgnoreCase(semester)) {
            files = files.stream().filter(f -> semester.equalsIgnoreCase(f.getSemester())).collect(Collectors.toList());
        }
        return ResponseEntity.ok(files);
    }

    @GetMapping("/department-files")
    public ResponseEntity<List<DepartmentFile>> getMyDepartmentFiles(
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "semester", required = false) String semester) {
        Faculty faculty = getAuthenticatedFaculty();
        List<DepartmentFile> files = departmentFileRepository.findByFacultyId(faculty.getId());
        if (year != null && !year.trim().isEmpty() && !"ALL".equalsIgnoreCase(year)) {
            files = files.stream().filter(f -> year.equalsIgnoreCase(f.getYear())).collect(Collectors.toList());
        }
        if (semester != null && !semester.trim().isEmpty() && !"ALL".equalsIgnoreCase(semester)) {
            files = files.stream().filter(f -> semester.equalsIgnoreCase(f.getSemester())).collect(Collectors.toList());
        }
        return ResponseEntity.ok(files);
    }

    @DeleteMapping({"/academic-files/{id}"})
    public ResponseEntity<?> deleteAcademicFile(@PathVariable Long id) {
        try {
            Faculty faculty = getAuthenticatedFaculty();
            if (isAuditLocked(faculty.getDepartment().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "Cannot delete files: Audit process has already started or completed."));
            }

            Optional<AcademicFile> fileOpt = academicFileRepository.findById(id);
            if (fileOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            AcademicFile academicFile = fileOpt.get();
            if (!academicFile.getFaculty().getId().equals(faculty.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "You can only delete your own uploaded files."));
            }

            fileStorageService.deleteAcademicFile(academicFile);
            notificationService.createNotification(faculty.getUser(), "Academic file '" + academicFile.getFileName() + "' was deleted.",
                    "UPLOAD", "Academic File Deleted");

            return ResponseEntity.ok(Collections.singletonMap("message", "File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @DeleteMapping("/department-files/{id}")
    public ResponseEntity<?> deleteDepartmentFile(@PathVariable Long id) {
        try {
            Faculty faculty = getAuthenticatedFaculty();
            if (isAuditLocked(faculty.getDepartment().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "Cannot delete files: Audit process has already started or completed."));
            }

            Optional<DepartmentFile> fileOpt = departmentFileRepository.findById(id);
            if (fileOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            DepartmentFile deptFile = fileOpt.get();
            if (!deptFile.getFaculty().getId().equals(faculty.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "You can only delete your own uploaded files."));
            }

            fileStorageService.deleteDepartmentFile(deptFile);
            notificationService.createNotification(faculty.getUser(), "Department file '" + deptFile.getFileName() + "' was deleted.",
                    "UPLOAD", "Department File Deleted");

            return ResponseEntity.ok(Collections.singletonMap("message", "File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }
}