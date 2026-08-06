package com.iqac.audit.entity.audit;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "audit_schedules")
public class AuditSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate auditDate;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(name = "due_time")
    private LocalTime dueTime;

    @Column
    private String description;

    @Column(nullable = false)
    private String status; // DRAFT, PUBLISHED, AUDIT_COMPLETED

    @Column(name = "department_code")
    private String departmentCode; // ALL or specific code (e.g. CSE)

    @Column(name = "audit_type", nullable = false)
    private String auditType; // ACADEMIC, ANNUAL

    @Column(name = "academic_phase")
    private String academicPhase; // FPP, POST_CAT, END_SEM

    @Column(name = "year_name")
    private String year; // e.g. "1st Year", "2nd Year", "3rd Year", "4th Year", "ALL"

    @Column(name = "semester_name")
    private String semester; // e.g. "Sem 1", "Sem 2", ..., "Sem 8", "ALL"

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public AuditSchedule() {}

    public AuditSchedule(Long id, String title, LocalDate auditDate, LocalDate dueDate, LocalTime dueTime, String description, String status, String departmentCode, String auditType, String academicPhase, String year, String semester, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.auditDate = auditDate;
        this.dueDate = dueDate;
        this.dueTime = dueTime;
        this.description = description;
        this.status = status;
        this.departmentCode = departmentCode;
        this.auditType = auditType;
        this.academicPhase = academicPhase;
        this.year = year;
        this.semester = semester;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDate getAuditDate() {
        return auditDate;
    }

    public void setAuditDate(LocalDate auditDate) {
        this.auditDate = auditDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }

    public String getAuditType() {
        return auditType;
    }

    public void setAuditType(String auditType) {
        this.auditType = auditType;
    }

    public String getAcademicPhase() {
        return academicPhase;
    }

    public void setAcademicPhase(String academicPhase) {
        this.academicPhase = academicPhase;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalTime getDueTime() {
        return dueTime;
    }

    public void setDueTime(LocalTime dueTime) {
        this.dueTime = dueTime;
    }
}