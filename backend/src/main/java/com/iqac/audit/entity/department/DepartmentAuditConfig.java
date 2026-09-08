package com.iqac.audit.entity.department;

import jakarta.persistence.*;

@Entity
@Table(name = "department_audit_configs")
public class DepartmentAuditConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department_code", nullable = false)
    private String departmentCode; // e.g. CSE, IT, ALL

    @Column(name = "audit_type", nullable = false)
    private String auditType; // ACADEMIC

    @Column(name = "academic_phase", nullable = false)
    private String academicPhase; // FPP, POST_CAT1, POST_CAT2, POST_CAT3, END_SEM

    @Column(name = "days_offset", nullable = false)
    private Integer daysOffset; // e.g., -10 for FPP, +2 for POST_CAT

    public DepartmentAuditConfig() {}

    public DepartmentAuditConfig(String departmentCode, String auditType, String academicPhase, Integer daysOffset) {
        this.departmentCode = departmentCode;
        this.auditType = auditType;
        this.academicPhase = academicPhase;
        this.daysOffset = daysOffset;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Integer getDaysOffset() {
        return daysOffset;
    }

    public void setDaysOffset(Integer daysOffset) {
        this.daysOffset = daysOffset;
    }
}
