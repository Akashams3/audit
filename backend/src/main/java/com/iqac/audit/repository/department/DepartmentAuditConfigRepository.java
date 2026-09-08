package com.iqac.audit.repository.department;

import com.iqac.audit.entity.department.DepartmentAuditConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentAuditConfigRepository extends JpaRepository<DepartmentAuditConfig, Long> {
    List<DepartmentAuditConfig> findByDepartmentCode(String departmentCode);
}
