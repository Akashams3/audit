package com.iqac.audit.repository.file;

import com.iqac.audit.entity.file.DepartmentFile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentFileRepository extends JpaRepository<DepartmentFile, Long> {
    List<DepartmentFile> findByFacultyId(Long facultyId);
    List<DepartmentFile> findByDepartment(String department);
    List<DepartmentFile> findByFacultyIdAndDocumentType(Long facultyId, String documentType);
    Optional<DepartmentFile> findByDepartmentAndFacultyIdAndDocumentType(String department, Long facultyId, String documentType);
    long countByDepartment(String department);
    long countByDepartmentAndStatus(String department, String status);
}