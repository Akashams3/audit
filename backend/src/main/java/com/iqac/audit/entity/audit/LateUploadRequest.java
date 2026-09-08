package com.iqac.audit.entity.audit;

import com.iqac.audit.entity.user.Faculty;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "late_upload_requests")
public class LateUploadRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "schedule_id", nullable = false)
    private AuditSchedule schedule;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "request_time", nullable = false)
    private LocalDateTime requestTime;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "approved_time")
    private LocalDateTime approvedTime;

    @Column(name = "extended_deadline")
    private LocalDateTime extendedDeadline;

    public LateUploadRequest() {}

    public LateUploadRequest(Long id, Faculty faculty, AuditSchedule schedule, String reason, LocalDateTime requestTime, String status, LocalDateTime approvedTime, LocalDateTime extendedDeadline) {
        this.id = id;
        this.faculty = faculty;
        this.schedule = schedule;
        this.reason = reason;
        this.requestTime = requestTime;
        this.status = status;
        this.approvedTime = approvedTime;
        this.extendedDeadline = extendedDeadline;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Faculty getFaculty() {
        return faculty;
    }

    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }

    public AuditSchedule getSchedule() {
        return schedule;
    }

    public void setSchedule(AuditSchedule schedule) {
        this.schedule = schedule;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getRequestTime() {
        return requestTime;
    }

    public void setRequestTime(LocalDateTime requestTime) {
        this.requestTime = requestTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getApprovedTime() {
        return approvedTime;
    }

    public void setApprovedTime(LocalDateTime approvedTime) {
        this.approvedTime = approvedTime;
    }

    public LocalDateTime getExtendedDeadline() {
        return extendedDeadline;
    }

    public void setExtendedDeadline(LocalDateTime extendedDeadline) {
        this.extendedDeadline = extendedDeadline;
    }
}