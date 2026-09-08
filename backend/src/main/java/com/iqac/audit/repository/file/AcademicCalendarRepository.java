package com.iqac.audit.repository.file;

import com.iqac.audit.entity.file.AcademicCalendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicCalendarRepository extends JpaRepository<AcademicCalendar, Long> {
    Optional<AcademicCalendar> findFirstByStatusOrderByCreatedAtDesc(String status);
    Optional<AcademicCalendar> findFirstByOrderByIdDesc();
}