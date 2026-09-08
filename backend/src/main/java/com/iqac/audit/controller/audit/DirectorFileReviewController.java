package com.iqac.audit.controller.audit;

import com.iqac.audit.entity.audit.Feedback;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.repository.audit.FeedbackRepository;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import com.iqac.audit.service.notification.EmailService;
import com.iqac.audit.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/director")
public class DirectorFileReviewController {

    @Autowired
    private AcademicFileRepository academicFileRepository;

    @Autowired
    private DepartmentFileRepository departmentFileRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private IqacInvigilatorRepository iqacInvigilatorRepository;

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
}
