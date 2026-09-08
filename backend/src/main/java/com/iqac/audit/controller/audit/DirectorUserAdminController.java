package com.iqac.audit.controller.audit;

import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.user.Director;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.entity.user.Role;
import com.iqac.audit.entity.user.User;
import com.iqac.audit.repository.department.DepartmentRepository;
import com.iqac.audit.repository.user.DirectorRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.HodRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import com.iqac.audit.repository.user.RoleRepository;
import com.iqac.audit.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/director")
public class DirectorUserAdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private IqacInvigilatorRepository iqacInvigilatorRepository;

    @Autowired
    private HodRepository hodRepository;

    @Autowired
    private DirectorRepository directorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().getName());
            map.put("enabled", u.isEnabled());

            Optional<Faculty> fac = facultyRepository.findByUser(u);
            if (fac.isPresent()) {
                map.put("name", fac.get().getName());
                map.put("departmentCode", fac.get().getDepartment().getCode());
                map.put("department", fac.get().getDepartment().getName());
                map.put("designations", fac.get().getDesignations());
            } else {
                Optional<IqacInvigilator> inv = iqacInvigilatorRepository.findByUser(u);
                if (inv.isPresent()) {
                    map.put("name", inv.get().getName());
                    map.put("departmentCode", inv.get().getDepartment().getCode());
                    map.put("department", inv.get().getDepartment().getName());
                } else {
                    Optional<Hod> hod = hodRepository.findByUser(u);
                    if (hod.isPresent()) {
                        map.put("name", hod.get().getName());
                        map.put("departmentCode", hod.get().getDepartment().getCode());
                        map.put("department", hod.get().getDepartment().getName());
                    } else {
                        Optional<Director> dir = directorRepository.findByUser(u);
                        if (dir.isPresent()) {
                            map.put("name", dir.get().getName());
                            map.put("departmentCode", "ALL");
                            map.put("department", "All Departments");
                        } else {
                            map.put("name", "System Administrator");
                            map.put("departmentCode", "ALL");
                            map.put("department", "All Departments");
                        }
                    }
                }
            }
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-invigilator")
    public ResponseEntity<?> createInvigilator(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            String email = payload.get("email");
            String name = payload.get("name");
            String password = payload.get("password");
            String departmentCode = payload.get("departmentCode");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Username already exists."));
            }

            Department dept = departmentRepository.findByCode(departmentCode)
                    .orElseThrow(() -> new RuntimeException("Department not found: " + departmentCode));

            Role invRole = roleRepository.findByName("ROLE_IQAC_INVIGILATOR")
                    .orElseThrow(() -> new RuntimeException("Role ROLE_IQAC_INVIGILATOR not found."));

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(invRole);
            user.setEnabled(true);

            IqacInvigilator inv = new IqacInvigilator();
            inv.setUser(user);
            inv.setName(name);
            inv.setDepartment(dept);

            iqacInvigilatorRepository.save(inv);
            return ResponseEntity.ok(Collections.singletonMap("message", "IQAC Invigilator account created successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }
}
