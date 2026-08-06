package com.iqac.audit.repository.user;

import com.iqac.audit.entity.user.Director;
import com.iqac.audit.entity.user.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DirectorRepository extends JpaRepository<Director, Long> {
    Optional<Director> findByUser(User user);
    Optional<Director> findByUserUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT d FROM Director d WHERE d.user.username = :principal OR d.user.email = :principal")
    Optional<Director> findByUsernameOrEmail(@org.springframework.data.repository.query.Param("principal") String principal);

    Optional<Director> findByUserUsernameOrUserEmail(String username, String email);
}