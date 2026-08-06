package com.iqac.audit.repository.notification;

import com.iqac.audit.entity.notification.EmailLog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
}