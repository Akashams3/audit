package com.iqac.audit.service.audit;

import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.HodRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InvigilatorDashboardService {

    @Autowired private IqacInvigilatorRepository iqacInvigilatorRepository;
    @Autowired private HodRepository hodRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private RequiredFileRepository requiredFileRepository;
    @Autowired private AcademicFileRepository academicFileRepository;
    @Autowired private DepartmentFileRepository departmentFileRepository;

    public IqacInvigilator getAuthenticatedInvigilator() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByUsernameOrEmail(principal);
        if (invOpt.isPresent()) return invOpt.get();
        Optional<Hod> hodOpt = hodRepository.findByUsernameOrEmail(principal);
        if (hodOpt.isPresent()) {
            Hod hod = hodOpt.get();
            IqacInvigilator tempInv = new IqacInvigilator();
            tempInv.setName(hod.getName());
            tempInv.setDepartment(hod.getDepartment());
            tempInv.setUser(hod.getUser());
            return tempInv;
        }
        throw new RuntimeException("Logged in user is not a registered IQAC Invigilator or HOD");
    }

    public Map<String, Object> computeDashboardStats() {
        IqacInvigilator invigilator = getAuthenticatedInvigilator();
        String deptCode = invigilator.getDepartment().getCode();
        
        List<Faculty> faculties = facultyRepository.findByDepartmentCode(deptCode);
        List<RequiredFile> requiredFiles = requiredFileRepository.findAll();
        
        long totalExpectedAcademic = 0, totalSubmittedAcademic = 0;
        
        for (Faculty f : faculties) {
            Set<String> subAcd = new HashSet<>();
            academicFileRepository.findByFacultyId(f.getId()).forEach(cf -> subAcd.add(cf.getDocumentType()));
            for (RequiredFile rf : requiredFiles) {
                if ("ACADEMIC".equals(rf.getFileCategory())) {
                    if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                        totalExpectedAcademic++;
                        if (subAcd.contains(rf.getFileName())) totalSubmittedAcademic++;
                    }
                }
            }
        }

        long totalExpectedDept = 0, totalSubmittedDept = 0;
        Set<String> subDept = new HashSet<>();
        departmentFileRepository.findByDepartment(deptCode).forEach(df -> subDept.add(df.getDocumentType()));
        for (RequiredFile rf : requiredFiles) {
            if ("DEPARTMENT".equals(rf.getFileCategory())) {
                totalExpectedDept++;
                if (subDept.contains(rf.getFileName())) totalSubmittedDept++;
            }
        }
        
        long totalSubmitted = totalSubmittedAcademic + totalSubmittedDept;
        long totalExpected = totalExpectedAcademic + totalExpectedDept;
        double progress = totalExpected > 0 ? Math.round((double) totalSubmitted / totalExpected * 100) : 0.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("facultyCount", faculties.size());
        stats.put("academicSubmitted", totalSubmittedAcademic);
        stats.put("courseTotal", totalExpectedAcademic);
        stats.put("deptSubmitted", totalSubmittedDept);
        stats.put("deptTotal", totalExpectedDept);
        stats.put("overallProgress", progress);
        
        return stats;
    }

    public List<Map<String, Object>> computeFacultyStatus() {
        IqacInvigilator invigilator = getAuthenticatedInvigilator();
        String deptCode = invigilator.getDepartment().getCode();
        
        List<Faculty> faculties = facultyRepository.findByDepartmentCode(deptCode);
        List<RequiredFile> requiredFiles = requiredFileRepository.findAll();
        List<Map<String, Object>> statusList = new ArrayList<>();
        
        for (Faculty f : faculties) {
            Map<String, Object> fMap = new HashMap<>();
            fMap.put("id", f.getId());
            fMap.put("name", f.getName());
            
            Set<String> subAcd = new HashSet<>();
            academicFileRepository.findByFacultyId(f.getId()).forEach(cf -> subAcd.add(cf.getDocumentType()));
            
            long fExpected = 0, fSubmitted = 0;
            for (RequiredFile rf : requiredFiles) {
                if ("ACADEMIC".equals(rf.getFileCategory())) {
                    if (rf.getTargetRole() == null || (f.getFacultyRoles() != null && f.getFacultyRoles().stream().anyMatch(r -> r.getId().equals(rf.getTargetRole().getId())))) {
                        fExpected++;
                        if (subAcd.contains(rf.getFileName())) fSubmitted++;
                    }
                }
            }
            
            fMap.put("submittedFiles", fSubmitted);
            fMap.put("totalFiles", fExpected);
            fMap.put("progress", fExpected > 0 ? Math.round((double) fSubmitted / fExpected * 100) : 0.0);
            fMap.put("status", fSubmitted >= fExpected && fExpected > 0 ? "Completed" : "In Progress");
            statusList.add(fMap);
        }
        return statusList;
    }
}
