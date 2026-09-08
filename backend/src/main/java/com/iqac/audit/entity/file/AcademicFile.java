package com.iqac.audit.entity.file;

import com.iqac.audit.entity.audit.AuditStage;
import com.iqac.audit.entity.user.Faculty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "academic_files")
public class AcademicFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "stored_file_name", nullable = false)
    private String storedFileName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type")
    private String fileType;

    @Column(nullable = false)
    private String department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;

    @Column(name = "uploaded_date", nullable = false)
    private LocalDateTime uploadedDate;

    @Column(nullable = false)
    private String status; // PENDING, SUBMITTED, APPROVED, REJECTED

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(name = "document_type", nullable = false)
    private String documentType; // Lesson Plan, CO-PO Mapping, Attendance, etc.

    @Enumerated(EnumType.STRING)
    @Column(name = "stage")
    private AuditStage stage;

    @Column(name = "year_name")
    private String year; // e.g., "1st Year", "2nd Year", etc.

    @Column(name = "semester_name")
    private String semester; // e.g., "Sem 1", "Sem 2", etc.

    @Column(name = "is_late")
    private Boolean isLate = false;

    @Column(name = "actual_submission_time")
    private LocalDateTime actualSubmissionTime;

    @Column(name = "original_deadline")
    private LocalDateTime originalDeadline;

    public AcademicFile() {}

    public AcademicFile(Long id, String fileName, String storedFileName, String filePath, String fileUrl, Long fileSize, String fileType, String department, Faculty faculty, String uploadedBy, LocalDateTime uploadedDate, String status, String courseName, String documentType, AuditStage stage, String year, String semester, Boolean isLate, LocalDateTime actualSubmissionTime) {
        this.id = id;
        this.fileName = fileName;
        this.storedFileName = storedFileName;
        this.filePath = filePath;
        this.fileUrl = fileUrl;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.department = department;
        this.faculty = faculty;
        this.uploadedBy = uploadedBy;
        this.uploadedDate = uploadedDate;
        this.status = status;
        this.courseName = courseName;
        this.documentType = documentType;
        this.stage = stage;
        this.year = year;
        this.semester = semester;
        this.isLate = isLate;
        this.actualSubmissionTime = actualSubmissionTime;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getStoredFileName() {
        return storedFileName;
    }

    public void setStoredFileName(String storedFileName) {
        this.storedFileName = storedFileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Faculty getFaculty() {
        return faculty;
    }

    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public LocalDateTime getUploadedDate() {
        return uploadedDate;
    }

    public void setUploadedDate(LocalDateTime uploadedDate) {
        this.uploadedDate = uploadedDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public AuditStage getStage() {
        return stage;
    }

    public void setStage(AuditStage stage) {
        this.stage = stage;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public Boolean getIsLate() {
        return isLate;
    }

    public void setIsLate(Boolean late) {
        isLate = late;
    }

    public LocalDateTime getActualSubmissionTime() {
        return actualSubmissionTime;
    }

    public void setActualSubmissionTime(LocalDateTime actualSubmissionTime) {
        this.actualSubmissionTime = actualSubmissionTime;
    }

    public LocalDateTime getOriginalDeadline() {
        return originalDeadline;
    }

    public void setOriginalDeadline(LocalDateTime originalDeadline) {
        this.originalDeadline = originalDeadline;
    }
}