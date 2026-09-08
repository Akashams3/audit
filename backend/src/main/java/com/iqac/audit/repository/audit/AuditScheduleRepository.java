package com.iqac.audit.repository.audit;

import com.iqac.audit.entity.audit.AuditSchedule;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditScheduleRepository extends JpaRepository<AuditSchedule, Long> {
}