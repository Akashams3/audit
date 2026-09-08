package com.iqac.audit.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

class CalendarDateValidatorTest {
    private CalendarDateValidator validator;

    @BeforeEach
    void setUp() {
        validator = new CalendarDateValidator();
    }

    @Test
    void testValidChronologicalOrder() {
        var result = validator.validate(
            LocalDate.of(2025, 1, 1),
            LocalDate.of(2025, 2, 1),
            LocalDate.of(2025, 3, 1),
            LocalDate.of(2025, 4, 1),
            LocalDate.of(2025, 5, 1),
            LocalDate.of(2025, 6, 1),
            LocalDate.of(2025, 7, 1)
        );
        assertTrue(result.isValid());
        assertTrue(result.getViolations().isEmpty());
    }

    @Test
    void testReopeningAfterCat1() {
        var result = validator.validate(
            LocalDate.of(2025, 2, 1),
            LocalDate.of(2025, 1, 1),
            null, null, null, null, null
        );
        assertFalse(result.isValid());
        assertFalse(result.getViolations().isEmpty());
    }

    @Test
    void testCat1AfterCat2() {
        var result = validator.validate(
            null,
            LocalDate.of(2025, 3, 1),
            LocalDate.of(2025, 2, 1),
            null, null, null, null
        );
        assertFalse(result.isValid());
    }

    @Test
    void testCat2AfterCat3() {
        var result = validator.validate(
            null, null,
            LocalDate.of(2025, 4, 1),
            LocalDate.of(2025, 3, 1),
            null, null, null
        );
        assertFalse(result.isValid());
    }

    @Test
    void testCat3AfterLwd() {
        var result = validator.validate(
            null, null, null,
            LocalDate.of(2025, 5, 1),
            LocalDate.of(2025, 4, 1),
            null, null
        );
        assertFalse(result.isValid());
    }

    @Test
    void testPracticalBeforeLwd() {
        var result = validator.validate(
            null, null, null, null,
            LocalDate.of(2025, 6, 1),
            LocalDate.of(2025, 5, 1),
            null
        );
        assertFalse(result.isValid());
    }

    @Test
    void testTheoryBeforePractical() {
        var result = validator.validate(
            null, null, null, null, null,
            LocalDate.of(2025, 7, 1),
            LocalDate.of(2025, 6, 1)
        );
        assertFalse(result.isValid());
    }

    @Test
    void testAllNull() {
        var result = validator.validate(null, null, null, null, null, null, null);
        assertTrue(result.isValid());
    }

    @Test
    void testPartialDates() {
        var result = validator.validate(
            LocalDate.of(2025, 1, 1),
            null,
            LocalDate.of(2025, 3, 1),
            null,
            LocalDate.of(2025, 5, 1),
            null,
            null
        );
        assertTrue(result.isValid());
    }

    @Test
    void testEqualPracticalAndLwd() {
        var result = validator.validate(
            null, null, null, null,
            LocalDate.of(2025, 6, 1),
            LocalDate.of(2025, 6, 1),
            null
        );
        assertTrue(result.isValid());
    }

    @Test
    void testEqualTheoryAndPractical() {
        var result = validator.validate(
            null, null, null, null, null,
            LocalDate.of(2025, 7, 1),
            LocalDate.of(2025, 7, 1)
        );
        assertTrue(result.isValid());
    }

    @Test
    void testMultipleViolations() {
        var result = validator.validate(
            LocalDate.of(2025, 2, 1),
            LocalDate.of(2025, 1, 1),
            LocalDate.of(2025, 4, 1),
            LocalDate.of(2025, 3, 1),
            null, null, null
        );
        assertFalse(result.isValid());
        assertTrue(result.getViolations().size() >= 2);
    }
}
