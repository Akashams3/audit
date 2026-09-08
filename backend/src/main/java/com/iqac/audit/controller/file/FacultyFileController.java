package com.iqac.audit.controller.file;

import com.iqac.audit.entity.audit.AuditSchedule;
import com.iqac.audit.entity.audit.AuditStage;
import com.iqac.audit.entity.audit.LateUploadRequest;
import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.FacultyRole;
import com.iqac.audit.repository.audit.LateUploadRequestRepository;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.file.AcademicCalendarRepository;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.repository.file.FileVersionRepository;
import com.iqac.audit.service.file.FacultyFileService;
import com.iqac.audit.service.file.FileStorageService;
import com.iqac.audit.service.notification.EmailService;
import com.iqac.audit.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/faculty")
public class FacultyFileController {

    @Autowired private FacultyFileService facultyFileService;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private AcademicFileRepository academicFileRepository;
    @Autowired private DepartmentFileRepository departmentFileRepository;
    @Autowired private RequiredFileRepository requiredFileRepository;
    @Autowired private LateUploadRequestRepository lateUploadRequestRepository;
    @Autowired private com.iqac.audit.repository.audit.AuditScheduleRepository auditScheduleRepository;
    @Autowired private AcademicCalendarRepository academicCalendarRepository;
    @Autowired private FileVersionRepository fileVersionRepository;
    @Autowired private EmailService emailService;
    @Autowired private NotificationService notificationService;

    // ----------------------------- Calendar -----------------------------

    @GetMapping("/academic-calendar")
    public ResponseEntity<?> getAcademicCalendar() {
        return academicCalendarRepository.findFirstByStatusOrderByCreatedAtDesc("ACTIVE")
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> academicCalendarRepository.findFirstByOrderByIdDesc()
                        .<ResponseEntity<?>>map(ResponseEntity::ok)
                        .orElse(ResponseEntity.ok(Collections.emptyMap())));
    }

    // ---------------------------- Required Files ----------------------------

    @GetMapping("/required-files")
    public ResponseEntity<?> getRequiredFiles(
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String semester) {
        Faculty faculty = facultyFileService.getAuthenticatedFaculty();
        if (facultyFileService.isAuditLocked(faculty.getDepartment().getCode()))
            return ResponseEntity.ok(Collections.emptyList());

        Set<FacultyRole> roles = faculty.getFacultyRoles();
        Set<String> designationNames = new HashSet<>();
        if (faculty.getDesignations() != null) {
            for (String d : faculty.getDesignations().split(",")) designationNames.add(d.trim().toLowerCase());
        }

        AuditStage stageEnum = null;
        try { if (stage != null) stageEnum = AuditStage.valueOf(stage.trim().toUpperCase()); } catch (Exception ignored) {}
        final AuditStage finalStage = stageEnum;

        List<RequiredFile> all = requiredFileRepository.findAll();
        List<RequiredFile> filtered = new ArrayList<>();
        for (RequiredFile rf : all) {
            if (finalStage != null) {
                if (rf.getStages() != null && !rf.getStages().isEmpty() && !rf.getStages().contains(finalStage)) continue;
                if (finalStage == AuditStage.FPP) {
                    String fn = rf.getFileName().toLowerCase();
                    if (rf.isXFile() || fn.contains("(x)") || fn.contains("cat ") || fn.contains("attainment")) continue;
                }
            }
            if (year != null && !year.isBlank() && !"ALL".equalsIgnoreCase(year))
                if (!"ALL".equalsIgnoreCase(rf.getYear()) && !rf.getYear().equalsIgnoreCase(year)) continue;
            if (semester != null && !semester.isBlank() && !"ALL".equalsIgnoreCase(semester))
                if (!"ALL".equalsIgnoreCase(rf.getSemester()) && !rf.getSemester().equalsIgnoreCase(semester)) continue;
            if (rf.getTargetRole() == null) { filtered.add(rf); continue; }
            String tRole = rf.getTargetRole().getName().trim().toLowerCase();
            boolean matchRole = roles != null && roles.stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId()));
            if (matchRole || designationNames.contains(tRole)) filtered.add(rf);
        }
        return ResponseEntity.ok(filtered);
    }

    // --------------------------- Upload Status / Late Request ----------------------------

    @GetMapping("/upload-status")
    public ResponseEntity<?> getUploadStatus() {
        try {
            Faculty faculty = facultyFileService.getAuthenticatedFaculty();
            boolean[] isLate = {false};
            LocalDateTime[] deadline = {null};
            AuditSchedule blocked = facultyFileService.getBlockedSchedule(faculty, isLate, deadline);
            Map<String, Object> map = new LinkedHashMap<>();
            if (blocked != null) {
                map.put("blocked", true);
                map.put("scheduleId", blocked.getId());
                map.put("scheduleTitle", blocked.getTitle());
                map.put("dueDate", blocked.getDueDate());
                lateUploadRequestRepository.findFirstByFacultyIdAndScheduleIdOrderByRequestTimeDesc(faculty.getId(), blocked.getId())
                        .ifPresentOrElse(r -> { map.put("requestStatus", r.getStatus()); map.put("reason", r.getReason()); },
                                () -> map.put("requestStatus", "NONE"));
            } else { map.put("blocked", false); }
            return ResponseEntity.ok(map);
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @PostMapping("/late-upload-request")
    public ResponseEntity<?> submitLateRequest(@RequestBody Map<String, Object> payload) {
        try {
            Faculty faculty = facultyFileService.getAuthenticatedFaculty();
            Long scheduleId = Long.valueOf(payload.get("scheduleId").toString());
            String reason = payload.get("reason").toString();
            com.iqac.audit.entity.audit.AuditSchedule schedule = auditScheduleRepository.findById(scheduleId)
                    .orElseThrow(() -> new RuntimeException("Schedule not found: " + scheduleId));
            LateUploadRequest req = new LateUploadRequest();
            req.setFaculty(faculty);
            req.setSchedule(schedule);
            req.setReason(reason);
            req.setRequestTime(LocalDateTime.now());
            req.setStatus("PENDING");
            lateUploadRequestRepository.save(req);
            return ResponseEntity.ok(Map.of("message", "Late submission request submitted successfully."));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    // --------------------------------- File Lists ---------------------------------

    @GetMapping("/academic-files")
    public ResponseEntity<List<AcademicFile>> getMyAcademicFiles(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String semester) {
        Faculty faculty = facultyFileService.getAuthenticatedFaculty();
        List<AcademicFile> files = academicFileRepository.findByFacultyId(faculty.getId());
        if (year != null && !year.isBlank() && !"ALL".equalsIgnoreCase(year))
            files = files.stream().filter(f -> year.equalsIgnoreCase(f.getYear())).collect(Collectors.toList());
        if (semester != null && !semester.isBlank() && !"ALL".equalsIgnoreCase(semester))
            files = files.stream().filter(f -> semester.equalsIgnoreCase(f.getSemester())).collect(Collectors.toList());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/department-files")
    public ResponseEntity<List<DepartmentFile>> getMyDepartmentFiles(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String semester) {
        Faculty faculty = facultyFileService.getAuthenticatedFaculty();
        List<DepartmentFile> files = departmentFileRepository.findByFacultyId(faculty.getId());
        if (year != null && !year.isBlank() && !"ALL".equalsIgnoreCase(year))
            files = files.stream().filter(f -> year.equalsIgnoreCase(f.getYear())).collect(Collectors.toList());
        if (semester != null && !semester.isBlank() && !"ALL".equalsIgnoreCase(semester))
            files = files.stream().filter(f -> semester.equalsIgnoreCase(f.getSemester())).collect(Collectors.toList());
        return ResponseEntity.ok(files);
    }

    // -------------------------------- Uploads --------------------------------

    @PostMapping("/academic-files")
    public ResponseEntity<?> uploadAcademicFile(
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) String textContent,
            @RequestParam String courseName,
            @RequestParam String documentType,
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String semester) {
        try {
            Faculty faculty = facultyFileService.getAuthenticatedFaculty();
            if (facultyFileService.isAuditLocked(faculty.getDepartment().getCode()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Audit is closed."));
            boolean[] isLate = {false}; LocalDateTime[] deadline = {null};
            if (facultyFileService.getBlockedSchedule(faculty, isLate, deadline) != null)
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Upload deadline has passed."));
            MultipartFile upload = (textContent != null && !textContent.isBlank())
                    ? facultyFileService.generatePdfFromText(courseName + " - " + documentType, textContent, documentType) : file;
            facultyFileService.validateFile(upload);
            facultyFileService.saveVersionIfAcademicExists(academicFileRepository.findByFacultyId(faculty.getId()), documentType, fileVersionRepository);
            AcademicFile saved = fileStorageService.storeAcademicFile(upload, courseName, documentType, faculty, faculty.getUser().getUsername());
            applyMeta(saved, stage, year, semester, isLate, deadline);
            academicFileRepository.save(saved);
            notify(faculty, saved.getFileName(), "Academic", "uploaded");
            return ResponseEntity.ok(saved);
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @PostMapping("/department-files")
    public ResponseEntity<?> uploadDepartmentFile(
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) String textContent,
            @RequestParam String documentType,
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String semester) {
        try {
            Faculty faculty = facultyFileService.getAuthenticatedFaculty();
            if (facultyFileService.isAuditLocked(faculty.getDepartment().getCode()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Audit is closed."));
            boolean[] isLate = {false}; LocalDateTime[] deadline = {null};
            if (facultyFileService.getBlockedSchedule(faculty, isLate, deadline) != null)
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Upload deadline has passed."));
            MultipartFile upload = (textContent != null && !textContent.isBlank())
                    ? facultyFileService.generatePdfFromText(faculty.getDepartment().getName() + " - " + documentType, textContent, documentType) : file;
            facultyFileService.validateFile(upload);
            facultyFileService.saveDeptVersionIfExists(departmentFileRepository.findByFacultyId(faculty.getId()), documentType, fileVersionRepository);
            DepartmentFile saved = fileStorageService.storeDepartmentFile(upload, documentType, faculty, faculty.getUser().getUsername());
            applyMeta(saved, stage, year, semester, isLate, deadline);
            departmentFileRepository.save(saved);
            notify(faculty, saved.getFileName(), "Department", "uploaded");
            return ResponseEntity.ok(saved);
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    // -------------------------------- Delete --------------------------------

    @DeleteMapping("/academic-files/{id}")
    public ResponseEntity<?> deleteAcademicFile(@PathVariable Long id) {
        try {
            Faculty faculty = facultyFileService.getAuthenticatedFaculty();
            if (facultyFileService.isAuditLocked(faculty.getDepartment().getCode()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Cannot delete: audit completed."));
            AcademicFile f = academicFileRepository.findById(id).orElseThrow();
            if (!f.getFaculty().getId().equals(faculty.getId()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only delete your own files."));
            fileStorageService.deleteAcademicFile(f);
            notificationService.createNotification(faculty.getUser(), "Academic file '" + f.getFileName() + "' deleted.", "UPLOAD", "File Deleted");
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @DeleteMapping("/department-files/{id}")
    public ResponseEntity<?> deleteDepartmentFile(@PathVariable Long id) {
        try {
            Faculty faculty = facultyFileService.getAuthenticatedFaculty();
            if (facultyFileService.isAuditLocked(faculty.getDepartment().getCode()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Cannot delete: audit completed."));
            DepartmentFile f = departmentFileRepository.findById(id).orElseThrow();
            if (!f.getFaculty().getId().equals(faculty.getId()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only delete your own files."));
            fileStorageService.deleteDepartmentFile(f);
            notificationService.createNotification(faculty.getUser(), "Department file '" + f.getFileName() + "' deleted.", "UPLOAD", "File Deleted");
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @GetMapping("/files/{fileCategory}/{fileId}/versions")
    public ResponseEntity<?> getFileVersions(@PathVariable String fileCategory, @PathVariable Long fileId) {
        try {
            return ResponseEntity.ok(fileVersionRepository.findByFileIdAndFileCategoryOrderByVersionNumberDesc(fileId, fileCategory.toUpperCase()));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    // ---- tiny helpers (kept in controller as they touch both repo + service) ----

    private <F extends com.iqac.audit.entity.file.AcademicFile> void applyMeta(
            F f, String stage, String year, String semester, boolean[] isLate, LocalDateTime[] deadline) {
        if (stage != null) try { f.setStage(AuditStage.valueOf(stage.toUpperCase())); } catch (Exception ignored) {}
        if (year != null) f.setYear(year);
        if (semester != null) f.setSemester(semester);
        f.setIsLate(isLate[0]); f.setActualSubmissionTime(LocalDateTime.now());
        if (isLate[0]) f.setOriginalDeadline(deadline[0]);
    }

    private void applyMeta(DepartmentFile f, String stage, String year, String semester, boolean[] isLate, LocalDateTime[] deadline) {
        if (stage != null) try { f.setStage(AuditStage.valueOf(stage.toUpperCase())); } catch (Exception ignored) {}
        if (year != null) f.setYear(year);
        if (semester != null) f.setSemester(semester);
        f.setIsLate(isLate[0]); f.setActualSubmissionTime(LocalDateTime.now());
        if (isLate[0]) f.setOriginalDeadline(deadline[0]);
    }

    private void notify(Faculty faculty, String fileName, String type, String action) {
        try {
            emailService.sendHtmlEmail(faculty.getUser().getEmail(), "File " + action + " Confirmation",
                    emailService.buildSubmissionSuccessHtml(faculty.getName(), fileName));
            notificationService.createNotification(faculty.getUser(), type + " file '" + fileName + "' " + action + ".", "UPLOAD", "File " + action);
        } catch (Exception ignored) {}
    }
}