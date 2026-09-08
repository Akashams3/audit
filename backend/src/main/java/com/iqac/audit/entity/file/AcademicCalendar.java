package com.iqac.audit.entity.file;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "academic_calendars")
public class AcademicCalendar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name")
    private String fileName;

    @Lob
    @Column(name = "extracted_text", columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(name = "extraction_status")
    private String extractionStatus;

    @Column(nullable = false)
    private String academicYear; // e.g. "2026-27 ODD SEM"

    @Column(name = "department_code")
    private String departmentCode; // e.g. "CSE", "ECE", "ALL"

    @Column(name = "year_name")
    private String year; // e.g. "1st Year", "2nd Year", "3rd Year", "4th Year", "ALL"

    @Column(name = "semester_name")
    private String semester; // e.g. "Sem 1", "Sem 2", ..., "Sem 8", "ALL"

    @Column
    private LocalDate reopeningDate;

    @Column
    private LocalDate cat1Date;

    @Column
    private LocalDate cat1EndDate;

    @Column
    private LocalDate cat2Date;

    @Column
    private LocalDate cat2EndDate;

    @Column
    private LocalDate cat3Date;

    @Column
    private LocalDate cat3EndDate;

    @Column
    private LocalDate lastWorkingDay;

    @Column
    private LocalDate practicalExamDate;

    @Column
    private LocalDate theoryExamDate;

    @Column(nullable = false)
    private String status; // ACTIVE, ARCHIVED, AUDIT_COMPLETED

    @Column(name = "audit_completed_at")
    private LocalDateTime auditCompletedAt;

    @Lob
    @Column(name = "grid_data_json", length = 10000)
    private String gridDataJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public AcademicCalendar() {}

    public AcademicCalendar(Long id, String fileName, String extractedText, String extractionStatus, String academicYear, String departmentCode, String year, String semester, LocalDate reopeningDate, LocalDate cat1Date, LocalDate cat1EndDate, LocalDate cat2Date, LocalDate cat2EndDate, LocalDate cat3Date, LocalDate cat3EndDate, LocalDate lastWorkingDay, LocalDate practicalExamDate, LocalDate theoryExamDate, String status, LocalDateTime auditCompletedAt, String gridDataJson, LocalDateTime createdAt) {
        this.id = id;
        this.fileName = fileName;
        this.extractedText = extractedText;
        this.extractionStatus = extractionStatus;
        this.academicYear = academicYear;
        this.departmentCode = departmentCode;
        this.year = year;
        this.semester = semester;
        this.reopeningDate = reopeningDate;
        this.cat1Date = cat1Date;
        this.cat1EndDate = cat1EndDate;
        this.cat2Date = cat2Date;
        this.cat2EndDate = cat2EndDate;
        this.cat3Date = cat3Date;
        this.cat3EndDate = cat3EndDate;
        this.lastWorkingDay = lastWorkingDay;
        this.practicalExamDate = practicalExamDate;
        this.theoryExamDate = theoryExamDate;
        this.status = status;
        this.auditCompletedAt = auditCompletedAt;
        this.gridDataJson = gridDataJson;
        this.createdAt = createdAt;
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

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public String getExtractionStatus() {
        return extractionStatus;
    }

    public void setExtractionStatus(String extractionStatus) {
        this.extractionStatus = extractionStatus;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
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

    public LocalDate getReopeningDate() {
        return reopeningDate;
    }

    public void setReopeningDate(LocalDate reopeningDate) {
        this.reopeningDate = reopeningDate;
    }

    public LocalDate getCat1Date() {
        return cat1Date;
    }

    public void setCat1Date(LocalDate cat1Date) {
        this.cat1Date = cat1Date;
    }

    public LocalDate getCat1EndDate() {
        return cat1EndDate;
    }

    public void setCat1EndDate(LocalDate cat1EndDate) {
        this.cat1EndDate = cat1EndDate;
    }

    public LocalDate getCat2Date() {
        return cat2Date;
    }

    public void setCat2Date(LocalDate cat2Date) {
        this.cat2Date = cat2Date;
    }

    public LocalDate getCat2EndDate() {
        return cat2EndDate;
    }

    public void setCat2EndDate(LocalDate cat2EndDate) {
        this.cat2EndDate = cat2EndDate;
    }

    public LocalDate getCat3Date() {
        return cat3Date;
    }

    public void setCat3Date(LocalDate cat3Date) {
        this.cat3Date = cat3Date;
    }

    public LocalDate getCat3EndDate() {
        return cat3EndDate;
    }

    public void setCat3EndDate(LocalDate cat3EndDate) {
        this.cat3EndDate = cat3EndDate;
    }

    public LocalDate getLastWorkingDay() {
        return lastWorkingDay;
    }

    public void setLastWorkingDay(LocalDate lastWorkingDay) {
        this.lastWorkingDay = lastWorkingDay;
    }

    public LocalDate getPracticalExamDate() {
        return practicalExamDate;
    }

    public void setPracticalExamDate(LocalDate practicalExamDate) {
        this.practicalExamDate = practicalExamDate;
    }

    public LocalDate getTheoryExamDate() {
        return theoryExamDate;
    }

    public void setTheoryExamDate(LocalDate theoryExamDate) {
        this.theoryExamDate = theoryExamDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getAuditCompletedAt() {
        return auditCompletedAt;
    }

    public void setAuditCompletedAt(LocalDateTime auditCompletedAt) {
        this.auditCompletedAt = auditCompletedAt;
    }

    public String getGridDataJson() {
        return gridDataJson;
    }

    public void setGridDataJson(String gridDataJson) {
        this.gridDataJson = gridDataJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}