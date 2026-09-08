package com.iqac.audit.controller.department;

import com.iqac.audit.entity.department.DepartmentAuditConfig;
import com.iqac.audit.repository.department.DepartmentAuditConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/director/audit-configs")
@CrossOrigin(origins = "*")
public class DepartmentAuditConfigController {

    @Autowired
    private DepartmentAuditConfigRepository repository;

    @GetMapping
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<List<DepartmentAuditConfig>> getAllConfigs() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<DepartmentAuditConfig> createConfig(@RequestBody DepartmentAuditConfig config) {
        return ResponseEntity.ok(repository.save(config));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<?> deleteConfig(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
