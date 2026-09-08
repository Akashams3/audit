package com.iqac.audit;

import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.file.AcademicFile;
import com.iqac.audit.entity.user.Faculty;
import com.iqac.audit.repository.file.AcademicFileRepository;
import com.iqac.audit.repository.file.DepartmentFileRepository;
import com.iqac.audit.service.file.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class FileStorageServiceTest {

    @Mock
    private AcademicFileRepository academicFileRepository;

    @Mock
    private DepartmentFileRepository departmentFileRepository;

    @InjectMocks
    private FileStorageService fileStorageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(fileStorageService, "uploadDir", tempDir.toString());
    }

    @Test
    public void testStoreAcademicFileSuccess() throws Exception {
        Department dept = new Department(1L, "Computer Science", "CSE");
        Faculty faculty = new Faculty();
        faculty.setId(10L);
        faculty.setFacultyCode("CSE001");
        faculty.setDepartment(dept);

        MockMultipartFile file = new MockMultipartFile("file", "lesson_plan.pdf", "application/pdf", "Test PDF Content".getBytes());

        when(academicFileRepository.findByDepartmentAndFacultyIdAndCourseNameAndDocumentTypeAndFileName(any(), any(), any(), any(), any()))
                .thenReturn(Optional.empty());
        
        AcademicFile mockSaved = new AcademicFile();
        mockSaved.setId(100L);
        when(academicFileRepository.save(any(AcademicFile.class))).thenReturn(mockSaved);

        AcademicFile result = fileStorageService.storeAcademicFile(file, "CS101", "Lesson Plan", faculty, "faculty01");

        assertNotNull(result);
        verify(academicFileRepository, times(2)).save(any(AcademicFile.class));
    }
}
