package com.iqac.audit.repository.audit;

import com.iqac.audit.entity.audit.LateUploadRequest;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LateUploadRequestRepository extends JpaRepository<LateUploadRequest, Long> {
    List<LateUploadRequest> findByFacultyId(Long facultyId);
    List<LateUploadRequest> findByFacultyIdAndScheduleId(Long facultyId, Long scheduleId);
    List<LateUploadRequest> findByStatus(String status);
    Optional<LateUploadRequest> findFirstByFacultyIdAndScheduleIdOrderByRequestTimeDesc(Long facultyId, Long scheduleId);
}