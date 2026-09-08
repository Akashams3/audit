package com.iqac.audit.repository.audit;

import com.iqac.audit.entity.audit.RequiredFile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequiredFileRepository extends JpaRepository<RequiredFile, Long> {
    List<RequiredFile> findByFileCategory(String fileCategory);
    Optional<RequiredFile> findByFileName(String fileName);
}