package com.iqac.audit.repository.file;

import com.iqac.audit.entity.file.AcademicFile;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicFileRepository extends JpaRepository<AcademicFile, Long> {
    List<AcademicFile> findByFacultyId(Long facultyId);
    List<AcademicFile> findByDepartment(String department);
    List<AcademicFile> findByFacultyIdAndCourseNameAndDocumentType(Long facultyId, String courseName, String documentType);
    Optional<AcademicFile> findByDepartmentAndFacultyIdAndCourseNameAndDocumentType(String department, Long facultyId, String courseName, String documentType);
    long countByDepartment(String department);
    long countByDepartmentAndStatus(String department, String status);
}