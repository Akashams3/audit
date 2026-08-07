package com.iqac.audit.service.audit;

import com.iqac.audit.entity.audit.AuditLog;
import com.iqac.audit.repository.audit.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String relatedRecord, String oldValue, String newValue) {
        String username = "SYSTEM";
        String role = "UNKNOWN";
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
            SecurityContextHolder.getContext().getAuthentication().isAuthenticated()) {
            username = SecurityContextHolder.getContext().getAuthentication().getName();
            role = SecurityContextHolder.getContext().getAuthentication().getAuthorities().toString();
        }

        AuditLog log = new AuditLog(username, role, action, relatedRecord, oldValue, newValue);
        auditLogRepository.save(log);
    }
}
