package com.iqac.audit.entity.audit;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_id", nullable = false)
    private Long fileId;

    @Column(name = "file_type", nullable = false)
    private String fileType; // COURSE or DEPARTMENT

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Column(name = "commented_by", nullable = false)
    private String commentedBy;

    @Column(nullable = false)
    private String department;

    @Column(name = "faculty_id", nullable = false)
    private Long facultyId;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(nullable = false)
    private String status; // ACTIVE, RESOLVED

    public Feedback() {}

    public Feedback(Long id, Long fileId, String fileType, String fileName, String comment, String commentedBy, String department, Long facultyId, LocalDateTime date, String status) {
        this.id = id;
        this.fileId = fileId;
        this.fileType = fileType;
        this.fileName = fileName;
        this.comment = comment;
        this.commentedBy = commentedBy;
        this.department = department;
        this.facultyId = facultyId;
        this.date = date;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getCommentedBy() {
        return commentedBy;
    }

    public void setCommentedBy(String commentedBy) {
        this.commentedBy = commentedBy;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Long getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}