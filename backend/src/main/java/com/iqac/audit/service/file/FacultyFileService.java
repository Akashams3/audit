package com.iqac.audit.service.file;

import com.iqac.audit.entity.audit.AuditSchedule;
import com.iqac.audit.entity.audit.AuditStatus;
import com.iqac.audit.entity.audit.LateUploadRequest;
import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.file.ByteArrayMultipartFile;
import com.iqac.audit.repository.file.FileVersionRepository;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.repository.audit.AuditScheduleRepository;
import com.iqac.audit.repository.audit.AuditStatusRepository;
import com.iqac.audit.repository.audit.LateUploadRequestRepository;
import com.iqac.audit.repository.department.DepartmentRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.UserRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Business logic for faculty file operations:
 * - Authenticate & resolve Faculty from security context
 * - Check audit lock/late-upload status
 * - Generate PDF from text content
 */
@Service
public class FacultyFileService {

    @Autowired private FacultyRepository facultyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private AuditStatusRepository auditStatusRepository;
    @Autowired private AuditScheduleRepository auditScheduleRepository;
    @Autowired private LateUploadRequestRepository lateUploadRequestRepository;

    private static final List<String> ALLOWED_EXT = List.of("pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx");
    private static final long MAX_SIZE = 50L * 1024 * 1024; // 50 MB

    /** Resolve the currently authenticated Faculty entity. */
    public Faculty getAuthenticatedFaculty() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Faculty> facOpt = facultyRepository.findByUsernameOrEmail(principal);
        if (facOpt.isPresent()) return facOpt.get();

        Optional<com.iqac.audit.entity.user.User> userOpt =
                userRepository.findByEmail(principal).or(() -> userRepository.findByUsername(principal));
        if (userOpt.isPresent()) {
            com.iqac.audit.entity.user.User user = userOpt.get();
            Optional<Faculty> facByUser = facultyRepository.findByUser(user);
            if (facByUser.isPresent()) return facByUser.get();

            Department dept = departmentRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No department found"));
            Faculty f = new Faculty();
            f.setUser(user);
            f.setName(user.getUsername());
            f.setFacultyCode(user.getUsername());
            f.setDepartment(dept);
            return facultyRepository.save(f);
        }
        throw new RuntimeException("Logged in user is not a registered Faculty member");
    }

    /** Returns true if the department's audit is completed (locked). */
    public boolean isAuditLocked(String deptCode) {
        return auditStatusRepository.findByDepartmentCode(deptCode)
                .map(s -> "AUDIT_COMPLETED".equalsIgnoreCase(s.getStatus()))
                .orElse(false);
    }

    /**
     * Returns the blocking AuditSchedule if upload is NOT permitted, or null if upload is allowed.
     * Also sets isLate[0] = true and originalDeadline[0] if this is a late (approved) upload.
     */
    public AuditSchedule getBlockedSchedule(Faculty faculty, boolean[] isLate, LocalDateTime[] originalDeadline) {
        List<AuditSchedule> schedules = auditScheduleRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        String deptCode = faculty.getDepartment().getCode();

        // Any open (unexpired) schedule → allow upload
        for (AuditSchedule s : schedules) {
            if (!"PUBLISHED".equalsIgnoreCase(s.getStatus())) continue;
            if (!"ALL".equalsIgnoreCase(s.getDepartmentCode()) && !s.getDepartmentCode().equalsIgnoreCase(deptCode)) continue;
            LocalDateTime deadline = LocalDateTime.of(s.getDueDate(),
                    s.getDueTime() != null ? s.getDueTime() : LocalTime.MAX);
            if (!now.isAfter(deadline)) return null; // open window found
        }

        // All schedules expired → check late-upload approvals
        for (AuditSchedule s : schedules) {
            if (!"PUBLISHED".equalsIgnoreCase(s.getStatus())) continue;
            if (!"ALL".equalsIgnoreCase(s.getDepartmentCode()) && !s.getDepartmentCode().equalsIgnoreCase(deptCode)) continue;
            LocalDateTime deadline = LocalDateTime.of(s.getDueDate(),
                    s.getDueTime() != null ? s.getDueTime() : LocalTime.MAX);
            if (now.isAfter(deadline)) {
                Optional<LateUploadRequest> req = lateUploadRequestRepository
                        .findFirstByFacultyIdAndScheduleIdOrderByRequestTimeDesc(faculty.getId(), s.getId());
                if (req.isPresent() && "APPROVED".equalsIgnoreCase(req.get().getStatus())) {
                    if (req.get().getExtendedDeadline() == null || now.isBefore(req.get().getExtendedDeadline())) {
                        isLate[0] = true;
                        originalDeadline[0] = deadline;
                        continue; // late-approved: allow but mark as late
                    }
                }
                return s; // blocked
            }
        }
        return null;
    }

    /** Validates file extension and size. */
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new RuntimeException("Please select a file or enter text content.");
        if (file.getSize() > MAX_SIZE)
            throw new RuntimeException("File exceeds the maximum allowed size of 50 MB.");
        String name = file.getOriginalFilename();
        if (name != null && name.contains(".")) {
            String ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
            if (!ALLOWED_EXT.contains(ext))
                throw new RuntimeException("Unsupported file type. Allowed: " + ALLOWED_EXT);
        }
    }

    /** Saves current academic file as a version before replacement. */
    public void saveVersionIfAcademicExists(List<AcademicFile> files, String docType, FileVersionRepository versionRepo) {
        files.stream().filter(f -> docType.equalsIgnoreCase(f.getDocumentType())).findFirst().ifPresent(existing -> {
            var history = versionRepo.findByFileIdAndFileCategoryOrderByVersionNumberDesc(existing.getId(), "ACADEMIC");
            int ver = history.isEmpty() ? 1 : history.get(0).getVersionNumber() + 1;
            versionRepo.save(new com.iqac.audit.entity.file.FileVersion(
                existing.getId(), "ACADEMIC", existing.getFileName(), existing.getFilePath(),
                existing.getFileSize(), ver, existing.getUploadedBy(), existing.getStatus()));
        });
    }

    /** Saves current department file as a version before replacement. */
    public void saveDeptVersionIfExists(List<DepartmentFile> files, String docType, FileVersionRepository versionRepo) {
        files.stream().filter(f -> docType.equalsIgnoreCase(f.getDocumentType())).findFirst().ifPresent(existing -> {
            var history = versionRepo.findByFileIdAndFileCategoryOrderByVersionNumberDesc(existing.getId(), "DEPARTMENT");
            int ver = history.isEmpty() ? 1 : history.get(0).getVersionNumber() + 1;
            versionRepo.save(new com.iqac.audit.entity.file.FileVersion(
                existing.getId(), "DEPARTMENT", existing.getFileName(), existing.getFilePath(),
                existing.getFileSize(), ver, existing.getUploadedBy(), existing.getStatus()));
        });
    }

    /** Generates an in-memory PDF from plain text and wraps it as a MultipartFile. */
    public MultipartFile generatePdfFromText(String title, String content, String documentType) throws Exception {
        Document doc = new Document();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, baos);
        doc.open();
        doc.add(new Paragraph(title, new Font(Font.HELVETICA, 16, Font.BOLD)));
        doc.add(new Paragraph(" "));
        doc.add(new Paragraph(content, new Font(Font.HELVETICA, 11, Font.NORMAL)));
        doc.close();
        return new ByteArrayMultipartFile(baos.toByteArray(), "file", documentType + ".pdf", "application/pdf");
    }
}

