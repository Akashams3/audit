package com.iqac.audit.repository.user;

import com.iqac.audit.entity.user.FacultyRole;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FacultyRoleRepository extends JpaRepository<FacultyRole, Long> {
    Optional<FacultyRole> findByName(String name);
}