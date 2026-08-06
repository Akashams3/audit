package com.iqac.audit.repository.audit;

import com.iqac.audit.entity.audit.Feedback;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByFacultyId(Long facultyId);
    List<Feedback> findByDepartment(String department);
    List<Feedback> findByFileIdAndFileType(Long fileId, String fileType);
}