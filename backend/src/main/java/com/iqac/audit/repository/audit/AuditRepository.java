package com.iqac.audit.repository.audit;

import com.iqac.audit.entity.audit.Audit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditRepository extends JpaRepository<Audit, Long> {
    List<Audit> findByArchivedFalse();
    List<Audit> findByAcademicYearAndArchivedFalse(String academicYear);
    List<Audit> findByDepartmentIdAndArchivedFalse(Long departmentId);
    List<Audit> findByDepartmentCodeAndArchivedFalse(String departmentCode);
    List<Audit> findByAcademicYearAndDepartmentCodeAndArchivedFalse(String academicYear, String departmentCode);
    List<Audit> findByAcademicYearAndDepartmentCodeAndYearLevelAndArchivedFalse(String academicYear, String departmentCode, String yearLevel);
    List<Audit> findByAcademicYearAndYearLevelAndArchivedFalse(String academicYear, String yearLevel);
}
