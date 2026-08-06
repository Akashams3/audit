package com.iqac.audit.repository.user;

import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.entity.user.User;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface IqacInvigilatorRepository extends JpaRepository<IqacInvigilator, Long> {
    Optional<IqacInvigilator> findByUser(User user);
    Optional<IqacInvigilator> findByUserUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT i FROM IqacInvigilator i WHERE i.user.username = :principal OR i.user.email = :principal")
    Optional<IqacInvigilator> findByUsernameOrEmail(@org.springframework.data.repository.query.Param("principal") String principal);

    Optional<IqacInvigilator> findByUserUsernameOrUserEmail(String username, String email);
    Optional<IqacInvigilator> findByDepartment(Department department);
    Optional<IqacInvigilator> findByDepartmentCode(String departmentCode);
}