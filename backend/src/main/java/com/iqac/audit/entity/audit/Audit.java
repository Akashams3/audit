package com.iqac.audit.entity.audit;

import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.user.IqacInvigilator;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "audits")
public class Audit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "year_level", nullable = false)
    private String yearLevel; // First Year, Second Year, Third Year, Fourth Year

    @Column(name = "audit_type", nullable = false)
    private String auditType; // ACADEMIC, DEPARTMENTAL, ANNUAL

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "audit_time")
    private LocalTime auditTime;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_invigilator_id")
    private IqacInvigilator assignedInvigilator;

    @Column(columnDefinition = "TEXT")
    private String requiredFilesConfig;

    @Column(columnDefinition = "TEXT")
    private String additionalNotes;

    @Column(nullable = false)
    private String status = "DRAFT"; // DRAFT, SCHEDULED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, REQUIRES_CORRECTION, APPROVED, COMPLETED

    @Column(name = "archived", nullable = false)
    private boolean archived = false;

    @Version
    private Long version;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Audit() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getYearLevel() {
        return yearLevel;
    }

    public void setYearLevel(String yearLevel) {
        this.yearLevel = yearLevel;
    }

    public String getAuditType() {
        return auditType;
    }

    public void setAuditType(String auditType) {
        this.auditType = auditType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalTime getAuditTime() {
        return auditTime;
    }

    public void setAuditTime(LocalTime auditTime) {
        this.auditTime = auditTime;
    }

    public IqacInvigilator getAssignedInvigilator() {
        return assignedInvigilator;
    }

    public void setAssignedInvigilator(IqacInvigilator assignedInvigilator) {
        this.assignedInvigilator = assignedInvigilator;
    }

    public String getRequiredFilesConfig() {
        return requiredFilesConfig;
    }

    public void setRequiredFilesConfig(String requiredFilesConfig) {
        this.requiredFilesConfig = requiredFilesConfig;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
