package com.iqac.audit.repository.file;

import com.iqac.audit.entity.file.FileVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileVersionRepository extends JpaRepository<FileVersion, Long> {
    List<FileVersion> findByFileIdAndFileCategoryOrderByVersionNumberDesc(Long fileId, String fileCategory);
}
