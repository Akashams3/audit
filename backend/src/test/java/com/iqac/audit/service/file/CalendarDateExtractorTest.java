package com.iqac.audit.service.file;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

class CalendarDateExtractorTest {
    private CalendarDateExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new CalendarDateExtractor();
    }

    @Test
    void testExtractDatesFromInlineText() {
        String text = "Reopening Date 05-02-2025\nCAT I 14-03-2025\nCAT II 04-04-2025\nCAT III 16-05-2025\nLast Working Day 23-05-2025\nPractical Exam 26-05-2025\nTheory Exam 27-05-2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 2, 5), result.getReopeningDate());
        assertEquals(LocalDate.of(2025, 3, 14), result.getCat1Date());
        assertEquals(LocalDate.of(2025, 4, 4), result.getCat2Date());
        assertEquals(LocalDate.of(2025, 5, 16), result.getCat3Date());
        assertEquals(LocalDate.of(2025, 5, 23), result.getLastWorkingDay());
        assertEquals(LocalDate.of(2025, 5, 26), result.getPracticalExamDate());
        assertEquals(LocalDate.of(2025, 5, 27), result.getTheoryExamDate());
        assertEquals(7, extractor.countExtractedDates(result));
    }

    @Test
    void testDateFormatDDSlashMMSlashYYYY() {
        String text = "CAT I 14/03/2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 3, 14), result.getCat1Date());
    }

    @Test
    void testDateFormatDDDotMMDotYYYY() {
        String text = "CAT II 04.04.2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 4, 4), result.getCat2Date());
    }

    @Test
    void testDateFormatWithMonthName() {
        String text = "CAT III 16 May 2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 5, 16), result.getCat3Date());
    }

    @Test
    void testDateFormatWithFullMonthName() {
        String text = "LWD 23 February 2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 2, 23), result.getLastWorkingDay());
    }

    @Test
    void testDateFormatDDDashMMMDashYYYY() {
        String text = "Theory Exam 27-May-2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 5, 27), result.getTheoryExamDate());
    }

    @Test
    void testCatDisambiguation() {
        String text = "CAT I 10-10-2025\nCAT II 20-10-2025\nCAT III 30-10-2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 10, 10), result.getCat1Date());
        assertEquals(LocalDate.of(2025, 10, 20), result.getCat2Date());
        assertEquals(LocalDate.of(2025, 10, 30), result.getCat3Date());
    }

    @Test
    void testFppMinusTenDays() {
        String text = "FPP 15-02-2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 2, 5), result.getReopeningDate());
    }

    @Test
    void testAcademicYearExtraction() {
        String text = "2024-25";
        var result = extractor.extract(text);
        assertEquals("2024-25", result.getAcademicYear());
    }

    @Test
    void testSemesterExtraction() {
        String text = "EVEN SEMESTER";
        var result = extractor.extract(text);
        assertEquals("EVEN", result.getSemester());
    }

    @Test
    void testYearExtraction() {
        String text = "I YEAR";
        var result = extractor.extract(text);
        assertEquals("I YEAR", result.getYear());
    }

    @Test
    void testEmptyText() {
        var result = extractor.extract("");
        assertNull(result.getReopeningDate());
        assertNull(result.getCat1Date());
        assertNull(result.getCat2Date());
        assertNull(result.getCat3Date());
        assertNull(result.getLastWorkingDay());
        assertNull(result.getPracticalExamDate());
        assertNull(result.getTheoryExamDate());
        assertEquals(0, extractor.countExtractedDates(result));
    }

    @Test
    void testNoMatchingLabels() {
        String text = "Random date 01-01-2025";
        var result = extractor.extract(text);
        assertNull(result.getReopeningDate());
        assertNull(result.getCat1Date());
    }

    @Test
    void testMultipleDateFormats() {
        String text = "CAT I 10/10/2025\nCAT II 20.10.2025\nCAT III 30-Oct-2025";
        var result = extractor.extract(text);
        assertEquals(LocalDate.of(2025, 10, 10), result.getCat1Date());
        assertEquals(LocalDate.of(2025, 10, 20), result.getCat2Date());
        assertEquals(LocalDate.of(2025, 10, 30), result.getCat3Date());
        assertEquals(3, extractor.countExtractedDates(result));
    }

    @Test
    void testCountExtractedDates() {
        String text = "CAT I 10/10/2025\nCAT II 20.10.2025";
        var result = extractor.extract(text);
        assertEquals(2, extractor.countExtractedDates(result));
    }
}
