package com.iqac.audit.controller.audit;

import com.iqac.audit.service.audit.DirectorDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/director")
public class DirectorDashboardController {

    @Autowired
    private DirectorDashboardService directorDashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        return ResponseEntity.ok(directorDashboardService.computeDashboard(year, academicYear));
    }

    @GetMapping("/department-summary")
    public ResponseEntity<?> getDepartmentSummary(
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        return ResponseEntity.ok(directorDashboardService.computeDepartmentSummary(year, academicYear));
    }

    @GetMapping("/progress")
    public ResponseEntity<?> getProgress(
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        return ResponseEntity.ok(directorDashboardService.computeDepartmentSummary(year, academicYear));
    }
}
