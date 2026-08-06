package com.iqac.audit.repository.user;

import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.User;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HodRepository extends JpaRepository<Hod, Long> {
    Optional<Hod> findByUser(User user);
    Optional<Hod> findByUserUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT h FROM Hod h WHERE h.user.username = :principal OR h.user.email = :principal")
    Optional<Hod> findByUsernameOrEmail(@org.springframework.data.repository.query.Param("principal") String principal);

    Optional<Hod> findByUserUsernameOrUserEmail(String username, String email);
    Optional<Hod> findByDepartment(Department department);
    Optional<Hod> findByDepartmentCode(String departmentCode);
}