package com.iqac.audit.controller.file;

import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.service.file.FileStorageService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.nio.file.Path;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/files")
public class FileDownloadController {

    @Autowired
    private AcademicFileRepository academicFileRepository;

    @Autowired
    private DepartmentFileRepository departmentFileRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/download/academic/{id}")
    public ResponseEntity<?> downloadAcademicFile(@PathVariable Long id) {
        Optional<AcademicFile> fileOpt = academicFileRepository.findById(id);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            AcademicFile cf = fileOpt.get();
            Path path = fileStorageService.loadFile(cf.getFilePath());
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + cf.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/download/department/{id}")
    public ResponseEntity<?> downloadDepartmentFile(@PathVariable Long id) {
        Optional<DepartmentFile> fileOpt = departmentFileRepository.findById(id);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            DepartmentFile df = fileOpt.get();
            Path path = fileStorageService.loadFile(df.getFilePath());
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + df.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/view/academic/{id}")
    public ResponseEntity<?> viewAcademicFile(@PathVariable Long id) {
        Optional<AcademicFile> fileOpt = academicFileRepository.findById(id);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            AcademicFile cf = fileOpt.get();
            Path path = fileStorageService.loadFile(cf.getFilePath());
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
                if ("PDF".equalsIgnoreCase(cf.getFileType())) {
                    mediaType = MediaType.APPLICATION_PDF;
                }
                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + cf.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/view/department/{id}")
    public ResponseEntity<?> viewDepartmentFile(@PathVariable Long id) {
        Optional<DepartmentFile> fileOpt = departmentFileRepository.findById(id);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            DepartmentFile df = fileOpt.get();
            Path path = fileStorageService.loadFile(df.getFilePath());
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
                if ("PDF".equalsIgnoreCase(df.getFileType())) {
                    mediaType = MediaType.APPLICATION_PDF;
                }
                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + df.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}