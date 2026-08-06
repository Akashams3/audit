package com.iqac.audit.controller.user;

import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.FacultyRole;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.Role;
import com.iqac.audit.entity.user.User;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.department.DepartmentRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.FacultyRoleRepository;
import com.iqac.audit.repository.user.HodRepository;
import com.iqac.audit.repository.user.RoleRepository;
import com.iqac.audit.repository.user.UserRepository;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/hod")
@PreAuthorize("hasRole('ROLE_HOD')")
public class HodUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private HodRepository hodRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private FacultyRoleRepository facultyRoleRepository;

    @Autowired
    private RequiredFileRepository requiredFileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Hod getAuthenticatedHod() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return hodRepository.findByUsernameOrEmail(principal)
                .orElseThrow(() -> new RuntimeException("Logged in user is not a registered HOD"));
    }

    @GetMapping("/faculties")
    public ResponseEntity<?> getFaculties() {
        try {
            Hod hod = getAuthenticatedHod();
            List<Faculty> faculties = facultyRepository.findByDepartmentCode(hod.getDepartment().getCode());
            return ResponseEntity.ok(faculties);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/faculty")
    public ResponseEntity<?> createFaculty(@RequestBody Map<String, String> payload) {
        try {
            Hod hod = getAuthenticatedHod();
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String designations = payload.get("designations");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username (Faculty Code) already exists."));
            }

            Role facRole = roleRepository.findByName("ROLE_FACULTY")
                    .orElseThrow(() -> new RuntimeException("Role ROLE_FACULTY not found."));

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(facRole);
            user.setEnabled(true);

            Faculty fac = new Faculty();
            fac.setUser(user);
            fac.setName(name);
            fac.setFacultyCode(username);
            fac.setDepartment(hod.getDepartment());
            fac.setDesignations(designations);

            facultyRepository.save(fac);
            return ResponseEntity.ok(Collections.singletonMap("message", "Faculty account created successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @GetMapping("/faculty-roles")
    public ResponseEntity<?> getFacultyRoles() {
        return ResponseEntity.ok(facultyRoleRepository.findAll());
    }

    @PostMapping("/faculty-roles")
    public ResponseEntity<?> createFacultyRole(@RequestBody Map<String, String> payload) {
        try {
            String name = payload.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Role name cannot be empty."));
            }
            String cleanName = name.trim();
            if (facultyRoleRepository.findByName(cleanName).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Role with name '" + cleanName + "' already exists."));
            }
            FacultyRole role = new FacultyRole();
            role.setName(cleanName);
            return ResponseEntity.ok(facultyRoleRepository.save(role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PutMapping("/faculty-roles/{id}")
    public ResponseEntity<?> updateFacultyRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String name = payload.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Role name cannot be empty."));
            }
            FacultyRole role = facultyRoleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            role.setName(name.trim());
            return ResponseEntity.ok(facultyRoleRepository.save(role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @DeleteMapping("/faculty-roles/{id}")
    public ResponseEntity<?> deleteFacultyRole(@PathVariable Long id) {
        try {
            FacultyRole role = facultyRoleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            
            // Remove reference from required files
            List<RequiredFile> reqFiles = requiredFileRepository.findAll();
            for (RequiredFile rf : reqFiles) {
                if (rf.getTargetRole() != null && rf.getTargetRole().getId().equals(id)) {
                    rf.setTargetRole(null);
                    requiredFileRepository.save(rf);
                }
            }

            // Remove reference from faculties
            List<Faculty> faculties = facultyRepository.findAll();
            for (Faculty f : faculties) {
                if (f.getFacultyRoles() != null) {
                    f.getFacultyRoles().removeIf(r -> r.getId().equals(id));
                    facultyRepository.save(f);
                }
            }

            facultyRoleRepository.delete(role);
            return ResponseEntity.ok(Collections.singletonMap("message", "Faculty role deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/faculties/{id}/assign-role")
    public ResponseEntity<?> assignRoleToFaculty(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Hod hod = getAuthenticatedHod();
            Faculty faculty = facultyRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));

            if (!faculty.getDepartment().getCode().equals(hod.getDepartment().getCode())) {
                return ResponseEntity.status(403).body(Collections.singletonMap("message", "You can only assign roles to faculty of your own department."));
            }

            faculty.getFacultyRoles().clear();
            if (payload.containsKey("roleIds") && payload.get("roleIds") != null) {
                List<?> roleIdsRaw = (List<?>) payload.get("roleIds");
                for (Object rid : roleIdsRaw) {
                    if (rid == null || rid.toString().trim().isEmpty() || "Everyone".equalsIgnoreCase(rid.toString()) || "NONE".equalsIgnoreCase(rid.toString())) {
                        continue;
                    }
                    try {
                        Long roleId = Long.valueOf(rid.toString());
                        Optional<FacultyRole> roleOpt = facultyRoleRepository.findById(roleId);
                        roleOpt.ifPresent(faculty.getFacultyRoles()::add);
                    } catch (NumberFormatException e) {
                        Optional<FacultyRole> roleOpt = facultyRoleRepository.findByName(rid.toString());
                        roleOpt.ifPresent(faculty.getFacultyRoles()::add);
                    }
                }
            }

            return ResponseEntity.ok(facultyRepository.save(faculty));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }
}