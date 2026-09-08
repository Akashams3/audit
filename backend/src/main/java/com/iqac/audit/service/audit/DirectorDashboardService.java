package com.iqac.audit.service.audit;

import com.iqac.audit.entity.audit.AuditSchedule;
import com.iqac.audit.entity.audit.AuditStatus;
import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.repository.audit.AuditScheduleRepository;
import com.iqac.audit.repository.audit.AuditStatusRepository;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.department.DepartmentRepository;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class DirectorDashboardService {

    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private AcademicFileRepository academicFileRepository;
    @Autowired private DepartmentFileRepository departmentFileRepository;
    @Autowired private AuditStatusRepository auditStatusRepository;
    @Autowired private RequiredFileRepository requiredFileRepository;
    @Autowired private AuditScheduleRepository auditScheduleRepository;

    public Map<String, Object> computeDashboard(String year, String academicYear) {
        List<Department> departments = departmentRepository.findAll();
        List<RequiredFile> requiredFiles = filterRequiredFiles(year, academicYear);

        long globalExpectedAcademic = 0, globalSubmittedAcademic = 0;
        long globalExpectedDept = 0, globalSubmittedDept = 0;

        for (Department d : departments) {
            List<Faculty> deptFaculties = facultyRepository.findByDepartmentCode(d.getCode());
            for (Faculty f : deptFaculties) {
                Set<String> subAcd = new HashSet<>();
                academicFileRepository.findByFacultyId(f.getId()).forEach(cf -> subAcd.add(cf.getDocumentType()));
                for (RequiredFile rf : requiredFiles) {
                    if (rf.getFileCategory().equals("ACADEMIC")) {
                        if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                            globalExpectedAcademic++;
                            if (subAcd.contains(rf.getFileName())) globalSubmittedAcademic++;
                        }
                    }
                }
            }
            Set<String> subDept = new HashSet<>();
            departmentFileRepository.findByDepartment(d.getCode()).forEach(df -> subDept.add(df.getDocumentType()));
            for (RequiredFile rf : requiredFiles) {
                if (rf.getFileCategory().equals("DEPARTMENT")) {
                    globalExpectedDept++;
                    if (subDept.contains(rf.getFileName())) globalSubmittedDept++;
                }
            }
        }
        
        long totalSubmitted = globalSubmittedAcademic + globalSubmittedDept;
        long totalExpected = globalExpectedAcademic + globalExpectedDept;
        double progress = totalExpected > 0 ? Math.round((double) totalSubmitted / totalExpected * 100) : 0.0;

        long pendingDepts = 0, completedDepts = 0;
        for (Department d : departments) {
            Optional<AuditStatus> statusOpt = auditStatusRepository.findByDepartmentId(d.getId());
            if (statusOpt.isPresent() && "AUDIT_COMPLETED".equals(statusOpt.get().getStatus())) completedDepts++;
            else pendingDepts++;
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDepartments", (long) departments.size());
        stats.put("academicSubmitted", globalSubmittedAcademic);
        stats.put("courseTotal", globalExpectedAcademic);
        stats.put("deptSubmitted", globalSubmittedDept);
        stats.put("deptTotal", globalExpectedDept);
        stats.put("overallProgress", progress);
        stats.put("pendingDepartments", pendingDepts);
        stats.put("completedDepartments", completedDepts);
        return stats;
    }

    public List<Map<String, Object>> computeDepartmentSummary(String year, String academicYear) {
        List<Department> departments = departmentRepository.findAll();
        List<RequiredFile> requiredFiles = filterRequiredFiles(year, academicYear);
        List<Map<String, Object>> summaryList = new ArrayList<>();
        List<AuditSchedule> schedules = auditScheduleRepository.findAll();

        for (Department d : departments) {
            Map<String, Object> map = new HashMap<>();
            map.put("departmentId", d.getId());
            map.put("name", d.getName());
            map.put("code", d.getCode());

            long expectedAcd = 0, submittedAcd = 0;
            for (Faculty f : facultyRepository.findByDepartmentCode(d.getCode())) {
                Set<String> subAcd = new HashSet<>();
                academicFileRepository.findByFacultyId(f.getId()).forEach(cf -> subAcd.add(cf.getDocumentType()));
                for (RequiredFile rf : requiredFiles) {
                    if ("ACADEMIC".equals(rf.getFileCategory())) {
                        if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                            expectedAcd++;
                            if (subAcd.contains(rf.getFileName())) submittedAcd++;
                        }
                    }
                }
            }

            long expectedDept = 0, submittedDept = 0;
            Set<String> subDept = new HashSet<>();
            departmentFileRepository.findByDepartment(d.getCode()).forEach(df -> subDept.add(df.getDocumentType()));
            for (RequiredFile rf : requiredFiles) {
                if ("DEPARTMENT".equals(rf.getFileCategory())) {
                    expectedDept++;
                    if (subDept.contains(rf.getFileName())) submittedDept++;
                }
            }

            map.put("academicSubmitted", submittedAcd);
            map.put("courseTotal", expectedAcd);
            map.put("deptSubmitted", submittedDept);
            map.put("deptTotal", expectedDept);
            
            long tSub = submittedAcd + submittedDept;
            long tExp = expectedAcd + expectedDept;
            map.put("progress", tExp > 0 ? Math.round((double) tSub / tExp * 100) : 0.0);

            Optional<AuditStatus> sOpt = auditStatusRepository.findByDepartmentId(d.getId());
            map.put("status", sOpt.isPresent() ? sOpt.get().getStatus() : "IN_PROGRESS");

            LocalDateTime lastUpdated = null;
            for (AcademicFile f : academicFileRepository.findByDepartment(d.getCode())) 
                if (lastUpdated == null || f.getUploadedDate().isAfter(lastUpdated)) lastUpdated = f.getUploadedDate();
            for (DepartmentFile f : departmentFileRepository.findByDepartment(d.getCode())) 
                if (lastUpdated == null || f.getUploadedDate().isAfter(lastUpdated)) lastUpdated = f.getUploadedDate();
            
            boolean deadlineExpired = true, hasPublishedSchedule = false;
            LocalDate activeDueDate = null;
            for (AuditSchedule s : schedules) {
                if ("PUBLISHED".equalsIgnoreCase(s.getStatus()) && (s.getDepartmentCode().equalsIgnoreCase("ALL") || s.getDepartmentCode().equalsIgnoreCase(d.getCode()))) {
                    hasPublishedSchedule = true;
                    LocalDateTime deadline = LocalDateTime.of(s.getDueDate(), s.getDueTime() != null ? s.getDueTime() : LocalTime.MAX);
                    if (!LocalDateTime.now().isAfter(deadline)) {
                        deadlineExpired = false;
                        activeDueDate = s.getDueDate();
                        break;
                    }
                }
            }
            if (!hasPublishedSchedule) deadlineExpired = false;
            
            map.put("activeDueDate", activeDueDate);
            map.put("deadlineExpired", deadlineExpired);
            map.put("lastUpdated", lastUpdated);
            summaryList.add(map);
        }
        return summaryList;
    }

    private List<RequiredFile> filterRequiredFiles(String year, String academicYear) {
        List<RequiredFile> requiredFiles = new ArrayList<>();
        for (RequiredFile rf : requiredFileRepository.findAll()) {
            if (year != null && !year.trim().isEmpty() && !"ALL".equalsIgnoreCase(year) && !"ALL".equalsIgnoreCase(rf.getYear()) && !rf.getYear().equalsIgnoreCase(year)) continue;
            if (academicYear != null && !academicYear.trim().isEmpty() && !"ALL".equalsIgnoreCase(academicYear) && !"ALL".equalsIgnoreCase(rf.getAcademicYear()) && !rf.getAcademicYear().equalsIgnoreCase(academicYear)) continue;
            requiredFiles.add(rf);
        }
        return requiredFiles;
    }
}
