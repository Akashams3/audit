package com.iqac.audit.repository.user;

import com.iqac.audit.entity.user.FacultyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacultyAssignmentRepository extends JpaRepository<FacultyAssignment, Long> {
    List<FacultyAssignment> findByDepartmentCode(String departmentCode);
    List<FacultyAssignment> findByAcademicYearAndDepartmentCode(String academicYear, String departmentCode);
    List<FacultyAssignment> findByAcademicYearAndDepartmentCodeAndYearLevel(String academicYear, String departmentCode, String yearLevel);
    List<FacultyAssignment> findByFacultyId(Long facultyId);
}
