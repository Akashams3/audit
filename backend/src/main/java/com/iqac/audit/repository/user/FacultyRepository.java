package com.iqac.audit.repository.user;

import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.entity.user.User;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByUser(User user);
    Optional<Faculty> findByUserUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT f FROM Faculty f WHERE f.user.username = :principal OR f.user.email = :principal")
    Optional<Faculty> findByUsernameOrEmail(@org.springframework.data.repository.query.Param("principal") String principal);

    Optional<Faculty> findByUserUsernameOrUserEmail(String username, String email);
    List<Faculty> findByDepartment(Department department);
    List<Faculty> findByDepartmentCode(String departmentCode);
    Optional<Faculty> findByFacultyCode(String facultyCode);
}