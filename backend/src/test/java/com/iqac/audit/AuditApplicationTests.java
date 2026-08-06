package com.iqac.audit;

import com.iqac.audit.entity.audit.AuditSchedule;
import com.iqac.audit.entity.audit.AuditStage;
import com.iqac.audit.entity.audit.RequiredFile;
import com.iqac.audit.entity.file.AcademicCalendar;
import com.iqac.audit.repository.audit.AuditScheduleRepository;
import com.iqac.audit.repository.audit.RequiredFileRepository;
import com.iqac.audit.repository.file.AcademicCalendarRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuditApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AcademicCalendarRepository academicCalendarRepository;

    @Autowired
    private AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private RequiredFileRepository requiredFileRepository;

    @BeforeEach
    void setUp() {
        requiredFileRepository.deleteAll();
    }

    @Test
    @DisplayName("Test Initial Run Starts With Empty Required Files")
    void testInitialRunStartsEmpty() {
        assertEquals(0, requiredFileRepository.count(), "Required files should be empty on clean startup.");
    }

    @Test
    @WithMockUser(username = "director", roles = {"DIRECTOR"})
    @DisplayName("Test Trigger FPP Audit Stage Excludes (X) Files")
    void testTriggerFppAuditStageExcludesXFiles() throws Exception {
        mockMvc.perform(post("/api/director/trigger-audit-stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"stage\":\"FPP\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        long fppFiles = requiredFileRepository.findAll().stream()
                .filter(rf -> rf.getStages() != null && rf.getStages().contains(AuditStage.FPP))
                .filter(rf -> !rf.isXFile() && !rf.getFileName().contains("(X)"))
                .count();

        assertTrue(fppFiles > 0, "FPP stage should load non-(X) academic criteria.");

        long xFilesInFpp = requiredFileRepository.findAll().stream()
                .filter(rf -> rf.getStages() != null && rf.getStages().contains(AuditStage.FPP))
                .filter(rf -> rf.isXFile() || rf.getFileName().contains("(X)"))
                .count();

        assertEquals(0, xFilesInFpp, "FPP stage MUST NOT contain any (X) marked files.");
    }

    @Test
    @WithMockUser(username = "director", roles = {"DIRECTOR"})
    @DisplayName("Test Trigger Post CAT 1 Audit Stage")
    void testTriggerPostCat1AuditStage() throws Exception {
        mockMvc.perform(post("/api/director/trigger-audit-stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"stage\":\"POST_CAT_1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").exists());

        assertTrue(requiredFileRepository.count() > 0, "Required files master list should be populated.");
    }

    @Test
    @WithMockUser(username = "director", roles = {"DIRECTOR"})
    @DisplayName("Test Create Academic Calendar Auto-Generates Schedules")
    void testCreateAcademicCalendarAutoGeneratesSchedules() throws Exception {
        String payload = "{"
                + "\"academicYear\":\"2026-27 ODD SEM\","
                + "\"reopeningDate\":\"2026-06-09\","
                + "\"cat1Date\":\"2026-07-13\","
                + "\"cat2Date\":\"2026-08-05\","
                + "\"cat3Date\":\"2026-09-01\","
                + "\"lastWorkingDay\":\"2026-09-07\","
                + "\"practicalExamDate\":\"2026-09-10\","
                + "\"theoryExamDate\":\"2026-09-20\""
                + "}";

        mockMvc.perform(post("/api/director/academic-calendar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calendar.status").value("ACTIVE"));

        Optional<AcademicCalendar> activeCal = academicCalendarRepository.findFirstByStatusOrderByCreatedAtDesc("ACTIVE");
        assertTrue(activeCal.isPresent(), "Active Academic Calendar should exist.");
        assertEquals("2026-27 ODD SEM", activeCal.get().getAcademicYear());
    }

    @Test
    @WithMockUser(username = "director", roles = {"DIRECTOR"})
    @DisplayName("Test Audit Complete Saves DB Records with Year & Sem and Clears Required Files")
    void testAuditCompleteSavesDbAndClearsRequiredFiles() throws Exception {
        // Setup dummy schedule
        AuditSchedule schedule = new AuditSchedule();
        schedule.setTitle("Test Audit Schedule");
        schedule.setAuditDate(LocalDate.now());
        schedule.setDueDate(LocalDate.now().plusDays(1));
        schedule.setStatus("PUBLISHED");
        schedule.setDepartmentCode("CSE");
        schedule.setAuditType("ACADEMIC");
        schedule.setCreatedAt(LocalDateTime.now());
        auditScheduleRepository.save(schedule);

        mockMvc.perform(post("/api/director/clear-required-files")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"year\":\"2nd Year\",\"semester\":\"Sem 3\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        assertEquals(0, requiredFileRepository.count(), "Active required files list should be cleared after audit completion.");

        AuditSchedule updatedSchedule = auditScheduleRepository.findById(schedule.getId()).orElseThrow();
        assertEquals("AUDIT_COMPLETED", updatedSchedule.getStatus());
        assertEquals("2nd Year", updatedSchedule.getYear());
        assertEquals("Sem 3", updatedSchedule.getSemester());
    }
}
