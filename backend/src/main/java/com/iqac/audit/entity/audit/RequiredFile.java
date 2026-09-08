package com.iqac.audit.entity.audit;

import com.iqac.audit.entity.user.FacultyRole;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "required_files")
public class RequiredFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileCategory; // ACADEMIC or DEPARTMENT

    @Column
    private String description;

    @Column(nullable = false)
    private boolean mandatory;

    @Column(name = "is_x_file", nullable = false)
    private boolean isXFile = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "required_file_stages", joinColumns = @JoinColumn(name = "required_file_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "stage")
    private Set<AuditStage> stages = new HashSet<>();

    @Column(name = "academic_year")
    private String academicYear = "ALL"; // e.g. "2026–2027", "ALL"

    @Column(name = "year_name")
    private String year = "ALL"; // e.g. "1st Year", "2nd Year", "3rd Year", "4th Year", "ALL"

    @Column(name = "semester_name")
    private String semester = "ALL"; // e.g. "Sem 1", "Sem 2", ..., "Sem 8", "ALL"

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_role_id")
    private FacultyRole targetRole; // null means Everyone

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public RequiredFile() {}

    public RequiredFile(Long id, String fileName, String fileCategory, String description, boolean mandatory, boolean isXFile, Set<AuditStage> stages, String year, String semester, FacultyRole targetRole, LocalDateTime createdAt) {
        this.id = id;
        this.fileName = fileName;
        this.fileCategory = fileCategory;
        this.description = description;
        this.mandatory = mandatory;
        this.isXFile = isXFile;
        if (stages != null) {
            this.stages = stages;
        }
        this.year = year != null ? year : "ALL";
        this.semester = semester != null ? semester : "ALL";
        this.targetRole = targetRole;
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

    public String getFileCategory() {
        return fileCategory;
    }

    public void setFileCategory(String fileCategory) {
        this.fileCategory = fileCategory;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isMandatory() {
        return mandatory;
    }

    public void setMandatory(boolean mandatory) {
        this.mandatory = mandatory;
    }

    public boolean isXFile() {
        return isXFile;
    }

    public void setXFile(boolean isXFile) {
        this.isXFile = isXFile;
    }

    public Set<AuditStage> getStages() {
        return stages;
    }

    public void setStages(Set<AuditStage> stages) {
        this.stages = stages;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
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

    public FacultyRole getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(FacultyRole targetRole) {
        this.targetRole = targetRole;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}