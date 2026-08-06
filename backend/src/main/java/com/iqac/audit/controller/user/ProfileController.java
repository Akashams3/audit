package com.iqac.audit.controller.user;

import com.iqac.audit.entity.user.Director;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.entity.user.User;
import com.iqac.audit.repository.user.DirectorRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import com.iqac.audit.repository.user.UserRepository;
import com.iqac.audit.service.auth.UserDetailsImpl;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private IqacInvigilatorRepository iqacInvigilatorRepository;

    @Autowired
    private DirectorRepository directorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }
        
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().getName());

        Optional<Faculty> facOpt = facultyRepository.findByUser(user);
        if (facOpt.isPresent()) {
            Faculty faculty = facOpt.get();
            response.put("name", faculty.getName());
            response.put("facultyCode", faculty.getFacultyCode());
            response.put("department", faculty.getDepartment().getName());
            response.put("departmentCode", faculty.getDepartment().getCode());
            return ResponseEntity.ok(response);
        }

        Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByUser(user);
        if (invOpt.isPresent()) {
            IqacInvigilator inv = invOpt.get();
            response.put("name", inv.getName());
            response.put("department", inv.getDepartment().getName());
            response.put("departmentCode", inv.getDepartment().getCode());
            return ResponseEntity.ok(response);
        }

        Optional<Director> dirOpt = directorRepository.findByUser(user);
        if (dirOpt.isPresent()) {
            Director dir = dirOpt.get();
            response.put("name", dir.getName());
            return ResponseEntity.ok(response);
        }

        response.put("name", "System Admin / Unknown");
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetailsImpl userDetails, @RequestBody Map<String, String> request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }

        try {
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (request.containsKey("email")) {
                user.setEmail(request.get("email"));
            }
            if (request.containsKey("password") && !request.get("password").trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(request.get("password")));
            }
            userRepository.save(user);

            String newName = request.get("name");
            if (newName != null && !newName.trim().isEmpty()) {
                Optional<Faculty> facOpt = facultyRepository.findByUser(user);
                if (facOpt.isPresent()) {
                    Faculty faculty = facOpt.get();
                    faculty.setName(newName);
                    facultyRepository.save(faculty);
                }

                Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByUser(user);
                if (invOpt.isPresent()) {
                    IqacInvigilator inv = invOpt.get();
                    inv.setName(newName);
                    iqacInvigilatorRepository.save(inv);
                }

                Optional<Director> dirOpt = directorRepository.findByUser(user);
                if (dirOpt.isPresent()) {
                    Director dir = dirOpt.get();
                    dir.setName(newName);
                    directorRepository.save(dir);
                }
            }

            return ResponseEntity.ok(Collections.singletonMap("message", "Profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }
}