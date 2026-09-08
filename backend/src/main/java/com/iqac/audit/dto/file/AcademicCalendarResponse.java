package com.iqac.audit.dto.file;

import java.time.LocalDate;

public class AcademicCalendarResponse {
    private Long id;
    private String fileName;
    private String academicYear;
    private String semester;
    private String year;
    private LocalDate reopeningDate;
    private LocalDate cat1Date;
    private LocalDate cat2Date;
    private LocalDate cat3Date;
    private LocalDate lastWorkingDay;
    private LocalDate practicalExamDate;
    private LocalDate theoryExamDate;
    private String extractionStatus;

    public AcademicCalendarResponse() {}

    // All getters and setters for each field
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    public LocalDate getReopeningDate() { return reopeningDate; }
    public void setReopeningDate(LocalDate reopeningDate) { this.reopeningDate = reopeningDate; }
    public LocalDate getCat1Date() { return cat1Date; }
    public void setCat1Date(LocalDate cat1Date) { this.cat1Date = cat1Date; }
    public LocalDate getCat2Date() { return cat2Date; }
    public void setCat2Date(LocalDate cat2Date) { this.cat2Date = cat2Date; }
    public LocalDate getCat3Date() { return cat3Date; }
    public void setCat3Date(LocalDate cat3Date) { this.cat3Date = cat3Date; }
    public LocalDate getLastWorkingDay() { return lastWorkingDay; }
    public void setLastWorkingDay(LocalDate lastWorkingDay) { this.lastWorkingDay = lastWorkingDay; }
    public LocalDate getPracticalExamDate() { return practicalExamDate; }
    public void setPracticalExamDate(LocalDate practicalExamDate) { this.practicalExamDate = practicalExamDate; }
    public LocalDate getTheoryExamDate() { return theoryExamDate; }
    public void setTheoryExamDate(LocalDate theoryExamDate) { this.theoryExamDate = theoryExamDate; }
    public String getExtractionStatus() { return extractionStatus; }
    public void setExtractionStatus(String extractionStatus) { this.extractionStatus = extractionStatus; }
}
