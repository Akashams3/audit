package com.iqac.audit.entity.audit;

import com.iqac.audit.entity.department.Department;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_status")
public class AuditStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false, unique = true)
    private Department department;

    @Column(nullable = false)
    private String status; // IN_PROGRESS, SUBMITTED_TO_AUDITOR, AUDIT_COMPLETED

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    public AuditStatus() {}

    public AuditStatus(Long id, Department department, String status, LocalDateTime lastUpdated) {
        this.id = id;
        this.department = department;
        this.status = status;
        this.lastUpdated = lastUpdated;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}