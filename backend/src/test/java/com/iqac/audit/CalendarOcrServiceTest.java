package com.iqac.audit;

import com.iqac.audit.service.file.CalendarOcrService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CalendarOcrService — covers EVEN/ODD semester detection,
 * date normalization, and PDF filename heuristics.
 */
public class CalendarOcrServiceTest {

    private CalendarOcrService service;

    @BeforeEach
    void setUp() {
        service = new CalendarOcrService();
    }

    @Test
    @DisplayName("Returns EVEN defaults when filename contains 'even'")
    void testEvenSemesterDetectedFromFilename() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "2024-25_even_semester_calendar.pdf",
            "application/pdf", new byte[0]
        );
        Map<String, String> result = service.extractDatesFromCalendarFile(file);

        assertNotNull(result, "Result map should not be null");
        assertTrue(result.get("reopeningDate").startsWith("2025-02"),
            "EVEN semester reopening should be in February, got: " + result.get("reopeningDate"));
        assertTrue(result.get("cat1Date").startsWith("2025-03"),
            "EVEN CAT1 should be in March, got: " + result.get("cat1Date"));
        assertTrue(result.get("lastWorkingDay").startsWith("2025-05"),
            "EVEN LWD should be in May, got: " + result.get("lastWorkingDay"));
        assertTrue(result.get("theoryExamDate").startsWith("2025-06"),
            "EVEN Theory Exam should be in June, got: " + result.get("theoryExamDate"));
    }

    @Test
    @DisplayName("Returns ODD defaults when filename contains 'odd'")
    void testOddSemesterDetectedFromFilename() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "2025-26_odd_semester_calendar.pdf",
            "application/pdf", new byte[0]
        );
        Map<String, String> result = service.extractDatesFromCalendarFile(file);

        assertNotNull(result);
        assertTrue(result.get("reopeningDate").startsWith("2025-06"),
            "ODD semester reopening should be in June, got: " + result.get("reopeningDate"));
        assertTrue(result.get("cat3Date").startsWith("2025-09"),
            "ODD CAT3 should be in September, got: " + result.get("cat3Date"));
    }

    @Test
    @DisplayName("Returns ODD defaults when file is empty/null")
    void testNullFileReturnsOddDefaults() {
        Map<String, String> result = service.extractDatesFromCalendarFile(null);
        assertNotNull(result, "Should return defaults even for null file");
        assertFalse(result.isEmpty(), "Defaults map should not be empty");
    }

    @Test
    @DisplayName("Extracts dates from plain text content with DD-MM-YYYY format")
    void testParsesDatesFromTextContent() {
        String textContent = "Reopening Date: 09-06-2025\nCAT I Date: 13-07-2025\nLast Working Day: 07-09-2025";
        MockMultipartFile file = new MockMultipartFile(
            "file", "calendar.txt",
            "text/plain", textContent.getBytes()
        );
        Map<String, String> result = service.extractDatesFromCalendarFile(file);

        assertNotNull(result);
        assertEquals("2025-06-09", result.get("reopeningDate"),
            "Should parse DD-MM-YYYY and convert to YYYY-MM-DD");
        assertEquals("2025-07-13", result.get("cat1Date"),
            "CAT1 date should be correctly parsed");
    }

    @Test
    @DisplayName("Detects EVEN semester from text content with 'even' keyword")
    void testDetectsEvenFromTextContent() {
        String textContent = "EVEN SEMESTER ACADEMIC CALENDAR 2024-25\nReopening: 03-02-2025";
        MockMultipartFile file = new MockMultipartFile(
            "file", "calendar.txt",
            "text/plain", textContent.getBytes()
        );
        Map<String, String> result = service.extractDatesFromCalendarFile(file);

        assertNotNull(result);
        assertTrue(result.containsKey("academicYear"),
            "Result should contain academicYear key");
        assertTrue(result.get("academicYear").toUpperCase().contains("EVEN"),
            "Academic year label should say EVEN, got: " + result.get("academicYear"));
    }

    @Test
    @DisplayName("All 7 required date keys are always present in result")
    void testAllRequiredKeysPresent() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.txt", "text/plain", new byte[0]
        );
        Map<String, String> result = service.extractDatesFromCalendarFile(file);

        assertTrue(result.containsKey("reopeningDate"), "Missing reopeningDate");
        assertTrue(result.containsKey("cat1Date"), "Missing cat1Date");
        assertTrue(result.containsKey("cat2Date"), "Missing cat2Date");
        assertTrue(result.containsKey("cat3Date"), "Missing cat3Date");
        assertTrue(result.containsKey("lastWorkingDay"), "Missing lastWorkingDay");
        assertTrue(result.containsKey("practicalExamDate"), "Missing practicalExamDate");
        assertTrue(result.containsKey("theoryExamDate"), "Missing theoryExamDate");
    }

    @Test
    @DisplayName("Date values are in ISO YYYY-MM-DD format")
    void testDateValuesAreIsoFormat() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "odd_sem.txt", "text/plain", new byte[0]
        );
        Map<String, String> result = service.extractDatesFromCalendarFile(file);

        for (Map.Entry<String, String> entry : result.entrySet()) {
            if (!entry.getKey().equals("academicYear")) {
                String val = entry.getValue();
                assertTrue(val.matches("\\d{4}-\\d{2}-\\d{2}"),
                    "Date value for '" + entry.getKey() + "' is not in YYYY-MM-DD format: " + val);
            }
        }
    }
}
