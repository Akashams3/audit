package com.iqac.audit.controller.auth;

import com.iqac.audit.dto.auth.JwtResponse;
import com.iqac.audit.dto.auth.LoginRequest;
import com.iqac.audit.entity.user.Director;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.repository.user.DirectorRepository;
import com.iqac.audit.repository.user.FacultyRepository;
import com.iqac.audit.repository.user.HodRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import com.iqac.audit.repository.user.UserRepository;
import com.iqac.audit.service.auth.JwtUtils;
import com.iqac.audit.service.auth.UserDetailsImpl;


import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    FacultyRepository facultyRepository;

    @Autowired
    IqacInvigilatorRepository iqacInvigilatorRepository;

    @Autowired
    DirectorRepository directorRepository;

    @Autowired
    HodRepository hodRepository;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();        
        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        
        String name = "";
        String department = "";

        if (role.equals("ROLE_FACULTY")) {
            Optional<Faculty> facOpt = facultyRepository.findByUsernameOrEmail(userDetails.getUsername()).or(() -> facultyRepository.findByUsernameOrEmail(userDetails.getEmail()));
            if (facOpt.isPresent()) {
                name = facOpt.get().getName();
                department = facOpt.get().getDepartment().getCode();
            }
        } else if (role.equals("ROLE_INVIGILATOR")) {
            Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByUsernameOrEmail(userDetails.getUsername()).or(() -> iqacInvigilatorRepository.findByUsernameOrEmail(userDetails.getEmail()));
            if (invOpt.isPresent()) {
                name = invOpt.get().getName();
                department = invOpt.get().getDepartment().getCode();
            }
        } else if (role.equals("ROLE_DIRECTOR")) {
            Optional<Director> dirOpt = directorRepository.findByUsernameOrEmail(userDetails.getUsername()).or(() -> directorRepository.findByUsernameOrEmail(userDetails.getEmail()));
            if (dirOpt.isPresent()) {
                name = dirOpt.get().getName();
                department = "ALL";
            }
        } else if (role.equals("ROLE_HOD")) {
            Optional<Hod> hodOpt = hodRepository.findByUsernameOrEmail(userDetails.getUsername()).or(() -> hodRepository.findByUsernameOrEmail(userDetails.getEmail()));
            if (hodOpt.isPresent()) {
                name = hodOpt.get().getName();
                department = hodOpt.get().getDepartment().getCode();
            }
        }

        return ResponseEntity.ok(new JwtResponse(jwt, 
                                                 userDetails.getId(), 
                                                 userDetails.getUsername(), 
                                                 userDetails.getEmail(), 
                                                 role,
                                                 name,
                                                 department));
    }
}