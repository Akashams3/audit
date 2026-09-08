package com.iqac.audit.validation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Validates that extracted academic calendar dates are in the expected
 * chronological order:
 *   Reopening < CAT I < CAT II < CAT III < LWD <= Practical <= Theory
 */
@Component
public class CalendarDateValidator {

    private static final Logger log = LoggerFactory.getLogger(CalendarDateValidator.class);

    public static class ValidationResult {
        private final boolean valid;
        private final List<String> violations;

        public ValidationResult(boolean valid, List<String> violations) {
            this.valid = valid;
            this.violations = violations;
        }

        public boolean isValid() { return valid; }
        public List<String> getViolations() { return violations; }
    }

    /**
     * Validate chronological order of extracted dates.
     * Only validates dates that are present (non-null).
     *
     * @return ValidationResult with isValid() and getViolations()
     */
    public ValidationResult validate(LocalDate reopening, LocalDate cat1, LocalDate cat2,
                                      LocalDate cat3, LocalDate lwd,
                                      LocalDate practical, LocalDate theory) {
        List<String> violations = new ArrayList<>();

        // Reopening < CAT I
        if (reopening != null && cat1 != null && !reopening.isBefore(cat1)) {
            violations.add("Reopening date (" + reopening + ") must be before CAT I date (" + cat1 + ")");
        }

        // CAT I < CAT II
        if (cat1 != null && cat2 != null && !cat1.isBefore(cat2)) {
            violations.add("CAT I date (" + cat1 + ") must be before CAT II date (" + cat2 + ")");
        }

        // CAT II < CAT III
        if (cat2 != null && cat3 != null && !cat2.isBefore(cat3)) {
            violations.add("CAT II date (" + cat2 + ") must be before CAT III date (" + cat3 + ")");
        }

        // CAT III < LWD
        if (cat3 != null && lwd != null && !cat3.isBefore(lwd)) {
            violations.add("CAT III date (" + cat3 + ") must be before Last Working Day (" + lwd + ")");
        }

        // LWD <= Practical
        if (lwd != null && practical != null && practical.isBefore(lwd)) {
            violations.add("Practical Exam date (" + practical + ") must not be before Last Working Day (" + lwd + ")");
        }

        // Practical <= Theory
        if (practical != null && theory != null && theory.isBefore(practical)) {
            violations.add("Theory Exam date (" + theory + ") must not be before Practical Exam date (" + practical + ")");
        }

        boolean valid = violations.isEmpty();
        if (!valid) {
            log.warn("Date validation failed with {} violation(s): {}", violations.size(), violations);
        } else {
            log.info("Date validation passed.");
        }

        return new ValidationResult(valid, violations);
    }
}
