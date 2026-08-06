package com.iqac.audit.repository.audit;

import com.iqac.audit.entity.audit.AuditStatus;
import com.iqac.audit.entity.department.Department;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AuditStatusRepository extends JpaRepository<AuditStatus, Long> {
    Optional<AuditStatus> findByDepartment(Department department);
    Optional<AuditStatus> findByDepartmentId(Long departmentId);
    Optional<AuditStatus> findByDepartmentCode(String departmentCode);
}