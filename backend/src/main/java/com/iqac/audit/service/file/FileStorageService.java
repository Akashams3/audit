package com.iqac.audit.service.file;

import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.file.DepartmentFile;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class FileStorageService {

    @Value("${iqac.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private AcademicFileRepository academicFileRepository;

    @Autowired
    private DepartmentFileRepository departmentFileRepository;

    public AcademicFile storeAcademicFile(MultipartFile file, String courseName, String documentType, Faculty faculty, String uploadedBy) throws IOException {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFileName);
        
        String deptCode = faculty.getDepartment().getCode();
        String facultyCode = faculty.getFacultyCode();
        String currentYear = String.valueOf(LocalDateTime.now().getYear());
        
        Path targetFolder = Paths.get(uploadDir, currentYear, deptCode, facultyCode, "Academic");
        Files.createDirectories(targetFolder);

        Optional<AcademicFile> existingFileOpt = academicFileRepository
                .findByDepartmentAndFacultyIdAndCourseNameAndDocumentType(deptCode, faculty.getId(), courseName, documentType);

        AcademicFile academicFile;
        if (existingFileOpt.isPresent()) {
            academicFile = existingFileOpt.get();
            Path oldPath = Paths.get(academicFile.getFilePath());
            Files.deleteIfExists(oldPath);
        } else {
            academicFile = new AcademicFile();
        }

        String storedName = originalFileName;
        Path targetPath = targetFolder.resolve(storedName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        academicFile.setFileName(originalFileName);
        academicFile.setStoredFileName(storedName);
        academicFile.setFilePath(targetPath.toString().replace("\\", "/"));
        academicFile.setFileSize(file.getSize());
        academicFile.setFileType(fileExtension);
        academicFile.setDepartment(deptCode);
        academicFile.setFaculty(faculty);
        academicFile.setUploadedBy(uploadedBy);
        academicFile.setUploadedDate(LocalDateTime.now());
        academicFile.setStatus("SUBMITTED");
        academicFile.setCourseName(courseName);
        academicFile.setDocumentType(documentType);

        AcademicFile saved = academicFileRepository.save(academicFile);
        saved.setFileUrl("/api/files/download/academic/" + saved.getId());
        return academicFileRepository.save(saved);
    }

    public DepartmentFile storeDepartmentFile(MultipartFile file, String documentType, Faculty faculty, String uploadedBy) throws IOException {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFileName);

        String deptCode = faculty.getDepartment().getCode();
        String facultyCode = faculty.getFacultyCode();
        String currentYear = String.valueOf(LocalDateTime.now().getYear());

        Path targetFolder = Paths.get(uploadDir, currentYear, deptCode, facultyCode, "Department");
        Files.createDirectories(targetFolder);

        Optional<DepartmentFile> existingFileOpt = departmentFileRepository
                .findByDepartmentAndFacultyIdAndDocumentType(deptCode, faculty.getId(), documentType);

        DepartmentFile departmentFile;
        if (existingFileOpt.isPresent()) {
            departmentFile = existingFileOpt.get();
            Path oldPath = Paths.get(departmentFile.getFilePath());
            Files.deleteIfExists(oldPath);
        } else {
            departmentFile = new DepartmentFile();
        }

        String storedName = originalFileName;
        Path targetPath = targetFolder.resolve(storedName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        departmentFile.setFileName(originalFileName);
        departmentFile.setStoredFileName(storedName);
        departmentFile.setFilePath(targetPath.toString().replace("\\", "/"));
        departmentFile.setFileSize(file.getSize());
        departmentFile.setFileType(fileExtension);
        departmentFile.setDepartment(deptCode);
        departmentFile.setFaculty(faculty);
        departmentFile.setUploadedBy(uploadedBy);
        departmentFile.setUploadedDate(LocalDateTime.now());
        departmentFile.setStatus("SUBMITTED");
        departmentFile.setDocumentType(documentType);

        DepartmentFile saved = departmentFileRepository.save(departmentFile);
        saved.setFileUrl("/api/files/download/department/" + saved.getId());
        return departmentFileRepository.save(saved);
    }

    public void deleteAcademicFile(AcademicFile academicFile) throws IOException {
        Path path = Paths.get(academicFile.getFilePath());
        Files.deleteIfExists(path);
        academicFileRepository.delete(academicFile);
    }

    public void deleteDepartmentFile(DepartmentFile departmentFile) throws IOException {
        Path path = Paths.get(departmentFile.getFilePath());
        Files.deleteIfExists(path);
        departmentFileRepository.delete(departmentFile);
    }

    public Path loadFile(String filePathString) {
        return Paths.get(filePathString);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf(".") == -1) {
            return "unknown";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toUpperCase();
    }
}