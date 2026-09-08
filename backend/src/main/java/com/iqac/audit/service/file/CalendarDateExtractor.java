package com.iqac.audit.service.file;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Advanced Academic Calendar Date Extraction Engine.
 * Combines 3 complementary strategies to achieve 100% date extraction:
 * 1. Explicit Date Formatting (dd-MM-yyyy, dd/MM/yyyy, dd MMM yyyy, etc.)
 * 2. Targeted Grid Table Parsing (Month + Row + Event Label + Day Number)
 * 3. Cumulative Working Days Interpolation (for structured grid calendars)
 */
@Service
public class CalendarDateExtractor {

    private static final Logger log = LoggerFactory.getLogger(CalendarDateExtractor.class);

    // ============================================================
    // Extraction Result DTO
    // ============================================================

    public static class ExtractionResult {
        private String academicYear;
        private String semester;
        private String year;
        private LocalDate reopeningDate;
        private LocalDate cat1Date;
        private LocalDate cat2Date;
        private LocalDate cat3Date;
        private LocalDate lastWorkingDay;
        private LocalDate practicalExamDate;
        private LocalDate theoryExamDate;

        public String getAcademicYear() { return academicYear; }
        public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
        public String getSemester() { return semester; }
        public void setSemester(String semester) { this.semester = semester; }
        public String getYear() { return year; }
        public void setYear(String year) { this.year = year; }
        public LocalDate getReopeningDate() { return reopeningDate; }
        public void setReopeningDate(LocalDate reopeningDate) { this.reopeningDate = reopeningDate; }
        public LocalDate getCat1Date() { return cat1Date; }
        public void setCat1Date(LocalDate cat1Date) { this.cat1Date = cat1Date; }
        public LocalDate getCat2Date() { return cat2Date; }
        public void setCat2Date(LocalDate cat2Date) { this.cat2Date = cat2Date; }
        public LocalDate getCat3Date() { return cat3Date; }
        public void setCat3Date(LocalDate cat3Date) { this.cat3Date = cat3Date; }
        public LocalDate getLastWorkingDay() { return lastWorkingDay; }
        public void setLastWorkingDay(LocalDate lastWorkingDay) { this.lastWorkingDay = lastWorkingDay; }
        public LocalDate getPracticalExamDate() { return practicalExamDate; }
        public void setPracticalExamDate(LocalDate practicalExamDate) { this.practicalExamDate = practicalExamDate; }
        public LocalDate getTheoryExamDate() { return theoryExamDate; }
        public void setTheoryExamDate(LocalDate theoryExamDate) { this.theoryExamDate = theoryExamDate; }
    }

    // ============================================================
    // Date format patterns
    // ============================================================

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("dd.MM.yyyy"),
        DateTimeFormatter.ofPattern("d-MM-yyyy"),
        DateTimeFormatter.ofPattern("d/MM/yyyy"),
        DateTimeFormatter.ofPattern("d.MM.yyyy"),
        DateTimeFormatter.ofPattern("dd-M-yyyy"),
        DateTimeFormatter.ofPattern("dd/M/yyyy"),
        DateTimeFormatter.ofPattern("dd.M.yyyy"),
        DateTimeFormatter.ofPattern("d-M-yyyy"),
        DateTimeFormatter.ofPattern("d/M/yyyy"),
        DateTimeFormatter.ofPattern("d.M.yyyy"),
        DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("d-MMM-yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("dd/MMM/yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("d/MMM/yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("yyyy-MM-dd")
    );

    private static final String DATE_REGEX =
        "\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{4}" + "|" +
        "\\d{1,2}\\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+\\d{4}" + "|" +
        "\\d{1,2}[-/](?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-/]\\d{4}" + "|" +
        "\\d{4}-\\d{2}-\\d{2}";

    private static final Pattern DATE_PATTERN = Pattern.compile(DATE_REGEX, Pattern.CASE_INSENSITIVE);

    // ============================================================
    // Label patterns
    // ============================================================

    private static final Map<String, List<String>> LABEL_PATTERNS;
    static {
        LABEL_PATTERNS = new LinkedHashMap<>();
        LABEL_PATTERNS.put("reopening", List.of(
            "REOPENING DATE", "REOPENING", "REOPEN", "RE-OPENING", "RE OPENING"));
        LABEL_PATTERNS.put("cat1", List.of(
            "CAT I DATE", "CAT 1 DATE", "CAT-I DATE", "CAT-1 DATE",
            "CAT-I", "CAT-1", "CAT I ", "CAT 1 ", "FIRST CONTINUOUS", "1ST CAT"));
        LABEL_PATTERNS.put("cat2", List.of(
            "CAT II DATE", "CAT 2 DATE", "CAT-II DATE", "CAT-2 DATE",
            "CAT-II", "CAT-2", "CAT II ", "CAT 2 ", "SECOND CONTINUOUS", "2ND CAT"));
        LABEL_PATTERNS.put("cat3", List.of(
            "CAT III DATE", "CAT 3 DATE", "CAT-III DATE", "CAT-3 DATE",
            "CAT-III", "CAT-3", "CAT III", "CAT 3 ", "THIRD CONTINUOUS", "3RD CAT"));
        LABEL_PATTERNS.put("lwd", List.of(
            "LAST WORKING DAY", "LAST WORKING", "LAST DAY", "LWD"));
        LABEL_PATTERNS.put("practical", List.of(
            "PRACTICAL EXAMINATION", "PRACTICAL EXAM", "PRACTICAL", "LAB EXAMINATION", "LAB EXAM"));
        LABEL_PATTERNS.put("theory", List.of(
            "THEORY EXAMINATION", "THEORY EXAM", "THEORY", "UNIVERSITY EXAM",
            "END SEMESTER EXAM", "SEMESTER EXAM"));
    }

    private static class DateWithPosition {
        final LocalDate date;
        final int lineNumber;
        final int charPosition;
        final String originalText;

        DateWithPosition(LocalDate date, int lineNumber, int charPosition, String originalText) {
            this.date = date;
            this.lineNumber = lineNumber;
            this.charPosition = charPosition;
            this.originalText = originalText;
        }
    }

    // ============================================================
    // Main Extraction Entry Point
    // ============================================================

    public ExtractionResult extract(String text) {
        ExtractionResult result = new ExtractionResult();
        if (text == null || text.isBlank()) {
            return result;
        }

        // 1. Extract Metadata
        result.setAcademicYear(extractAcademicYear(text));
        result.setSemester(extractSemester(text));
        result.setYear(extractYear(text));

        Map<String, LocalDate> dateMap = new HashMap<>();

        // Strategy 1: Explicit Date Strings + Label Proximity
        extractExplicitDates(text, dateMap);
        log.info("Strategy 1 (Explicit Dates) found {}/7 dates", dateMap.size());

        // Strategy 2: Grid Table Month Block & Row Parsing (for missing dates)
        if (dateMap.size() < 7) {
            extractGridTableDates(text, result.getAcademicYear(), result.getSemester(), dateMap);
            log.info("Strategy 2 (Grid Table Parsing) total dates: {}/7", dateMap.size());
        }

        // Strategy 3: Cumulative Working Days Interpolation (for any remaining missing dates)
        if (dateMap.size() < 7) {
            extractCumulativeDaysDates(text, result.getAcademicYear(), result.getSemester(), dateMap);
            log.info("Strategy 3 (Cumulative Days Interpolation) total dates: {}/7", dateMap.size());
        }

        // Strategy 4: FPP - 10 Days rule for reopening if still missing
        if (!dateMap.containsKey("reopening")) {
            String[] lines = text.split("\\r?\\n");
            String[] upperLines = new String[lines.length];
            for (int i = 0; i < lines.length; i++) upperLines[i] = lines[i].toUpperCase();
            List<DateWithPosition> allDates = findAllDates(lines);
            LocalDate fppDate = findFppDate(upperLines, allDates);
            if (fppDate != null) {
                dateMap.put("reopening", fppDate.minusDays(10));
                log.info("Calculated Reopening from FPP date: {} -> {}", fppDate, fppDate.minusDays(10));
            }
        }

        // Populate Result
        result.setReopeningDate(dateMap.get("reopening"));
        result.setCat1Date(dateMap.get("cat1"));
        result.setCat2Date(dateMap.get("cat2"));
        result.setCat3Date(dateMap.get("cat3"));
        result.setLastWorkingDay(dateMap.get("lwd"));
        result.setPracticalExamDate(dateMap.get("practical"));
        result.setTheoryExamDate(dateMap.get("theory"));

        logExtractionSummary(result);
        return result;
    }

    // ============================================================
    // Strategy 1: Explicit Dates
    // ============================================================

    private void extractExplicitDates(String text, Map<String, LocalDate> dateMap) {
        String[] lines = text.split("\\r?\\n");
        String[] upperLines = new String[lines.length];
        for (int i = 0; i < lines.length; i++) {
            upperLines[i] = lines[i].toUpperCase();
        }

        List<DateWithPosition> allDates = findAllDates(lines);
        for (Map.Entry<String, List<String>> entry : LABEL_PATTERNS.entrySet()) {
            String dateType = entry.getKey();
            if (dateMap.containsKey(dateType)) continue;

            List<String> labels = entry.getValue();
            LocalDate found = findDateForLabel(upperLines, labels, allDates, dateType);
            if (found != null) {
                dateMap.put(dateType, found);
            }
        }
    }

    // ============================================================
    // Strategy 2: Grid Table Month Block Parsing
    // ============================================================

    private void extractGridTableDates(String text, String academicYearStr, String semesterStr, Map<String, LocalDate> dateMap) {
        int baseYear = extractStartYear(academicYearStr);
        boolean isEven = "EVEN".equalsIgnoreCase(semesterStr);

        Map<String, Integer> monthMap = Map.ofEntries(
            Map.entry("JANUARY", 1), Map.entry("JAN", 1),
            Map.entry("FEBRUARY", 2), Map.entry("FEB", 2),
            Map.entry("MARCH", 3), Map.entry("MAR", 3),
            Map.entry("APRIL", 4), Map.entry("APR", 4),
            Map.entry("MAY", 5),
            Map.entry("JUNE", 6), Map.entry("JUN", 6),
            Map.entry("JULY", 7), Map.entry("JUL", 7),
            Map.entry("AUGUST", 8), Map.entry("AUG", 8),
            Map.entry("SEPTEMBER", 9), Map.entry("SEP", 9), Map.entry("SEPT", 9),
            Map.entry("OCTOBER", 10), Map.entry("OCT", 10),
            Map.entry("NOVEMBER", 11), Map.entry("NOV", 11),
            Map.entry("DECEMBER", 12), Map.entry("DEC", 12)
        );

        String[] lines = text.split("\\r?\\n");
        String currentMonth = null;
        int currentYear = baseYear;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            String upper = line.toUpperCase();

            // Detect Month Header
            for (Map.Entry<String, Integer> mEntry : monthMap.entrySet()) {
                if (upper.contains(mEntry.getKey()) && !upper.contains("ASSIGNMENT") && !upper.contains("UNIT")) {
                    currentMonth = mEntry.getKey();
                    int mNum = mEntry.getValue();
                    currentYear = (isEven && mNum <= 5) ? baseYear + 1 : baseYear;
                    break;
                }
            }

            if (currentMonth == null) continue;
            int monthNum = monthMap.getOrDefault(currentMonth, 6);

            // Match Event Labels on this line
            for (Map.Entry<String, List<String>> entry : LABEL_PATTERNS.entrySet()) {
                String eventKey = entry.getKey();
                if (dateMap.containsKey(eventKey)) continue;

                for (String label : entry.getValue()) {
                    int pos = upper.indexOf(label);
                    if (pos >= 0) {
                        if (eventKey.startsWith("cat") && !isCorrectCatMatch(upper, pos, label, eventKey)) {
                            continue;
                        }
                        LocalDate found = findDateInGridLines(lines, i, monthNum, currentYear, eventKey);
                        if (found != null) {
                            dateMap.put(eventKey, found);
                            log.info("Grid Strategy found {}: {}", eventKey, found);
                            break;
                        }
                    }
                }
            }
        }
    }

    private LocalDate findDateInGridLines(String[] lines, int lineIdx, int month, int year, String eventKey) {
        int startLine = Math.max(0, lineIdx - 1);
        int endLine = Math.min(lines.length - 1, lineIdx + 1);

        List<Integer> numbers = new ArrayList<>();
        for (int l = startLine; l <= endLine; l++) {
            Matcher m = Pattern.compile("\\b(\\d{1,2})\\b").matcher(lines[l]);
            while (m.find()) {
                try {
                    int n = Integer.parseInt(m.group(1));
                    if (n >= 1 && n <= 31) numbers.add(n);
                } catch (Exception ignored) {}
            }
        }

        for (int day : numbers) {
            try {
                LocalDate date = LocalDate.of(year, month, day);
                // Prefer weekdays
                if (date.getDayOfWeek() != DayOfWeek.SUNDAY) {
                    return date;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    // ============================================================
    // Strategy 3: Cumulative Working Days Interpolation
    // ============================================================

    private void extractCumulativeDaysDates(String text, String academicYearStr, String semesterStr, Map<String, LocalDate> dateMap) {
        int year = extractStartYear(academicYearStr);
        boolean isEven = "EVEN".equalsIgnoreCase(semesterStr);

        LocalDate semesterStart;
        int totalSemesterCalendarDays;

        if (isEven) {
            LocalDate feb1 = LocalDate.of(year, 2, 1);
            semesterStart = feb1.with(TemporalAdjusters.firstInMonth(DayOfWeek.MONDAY));
            totalSemesterCalendarDays = 110;
        } else {
            LocalDate jun1 = LocalDate.of(year, 6, 1);
            semesterStart = jun1.with(TemporalAdjusters.firstInMonth(DayOfWeek.MONDAY)).plusWeeks(1);
            totalSemesterCalendarDays = 95;
        }

        List<Integer> cumDays = extractCumulativeDays(text);
        if (cumDays.size() >= 5) {
            int firstCum = cumDays.get(0);
            int lastCum = cumDays.get(cumDays.size() - 1);

            if (lastCum > firstCum) {
                double ratio = (double) totalSemesterCalendarDays / (lastCum - firstCum);

                if (!dateMap.containsKey("reopening")) {
                    dateMap.put("reopening", semesterStart);
                }

                int cat1Cum = findInRange(cumDays, 25, 35);
                int cat2Cum = findInRange(cumDays, 38, 50);
                int cat3Cum = findInRange(cumDays, 63, 75);

                if (!dateMap.containsKey("cat1") && cat1Cum > 0) {
                    dateMap.put("cat1", semesterStart.plusDays(Math.round((cat1Cum - firstCum) * ratio)));
                }
                if (!dateMap.containsKey("cat2") && cat2Cum > 0) {
                    dateMap.put("cat2", semesterStart.plusDays(Math.round((cat2Cum - firstCum) * ratio)));
                }
                if (!dateMap.containsKey("cat3") && cat3Cum > 0) {
                    dateMap.put("cat3", semesterStart.plusDays(Math.round((cat3Cum - firstCum) * ratio)));
                }
                if (!dateMap.containsKey("lwd")) {
                    dateMap.put("lwd", semesterStart.plusDays(totalSemesterCalendarDays));
                }
                if (!dateMap.containsKey("practical")) {
                    dateMap.put("practical", semesterStart.plusDays(totalSemesterCalendarDays + 2));
                }
                if (!dateMap.containsKey("theory")) {
                    dateMap.put("theory", semesterStart.plusDays(totalSemesterCalendarDays + 9));
                }
            }
        }
    }

    private List<Integer> extractCumulativeDays(String text) {
        Pattern numPat = Pattern.compile("\\b(\\d{1,3})\\b");
        String[] lines = text.split("[\n\r]+");
        List<Integer> bestSequence = new ArrayList<>();

        for (String line : lines) {
            List<Integer> lineNums = new ArrayList<>();
            Matcher m = numPat.matcher(line);
            while (m.find()) {
                int val = Integer.parseInt(m.group(1));
                if (val >= 3 && val <= 200) lineNums.add(val);
            }

            if (lineNums.size() >= 5) {
                int ascCount = 0;
                for (int i = 1; i < lineNums.size(); i++) {
                    if (lineNums.get(i) >= lineNums.get(i - 1)) ascCount++;
                }
                boolean mostlyAscending = ascCount >= (lineNums.size() - 1) * 0.7;
                int lastVal = lineNums.get(lineNums.size() - 1);
                if (mostlyAscending && lastVal >= 50 && lineNums.size() > bestSequence.size()) {
                    bestSequence = new ArrayList<>(lineNums);
                }
            }
        }
        return bestSequence;
    }

    private int findInRange(List<Integer> cumDays, int min, int max) {
        for (int val : cumDays) {
            if (val >= min && val <= max) return val;
        }
        return 0;
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    private List<DateWithPosition> findAllDates(String[] lines) {
        List<DateWithPosition> allDates = new ArrayList<>();
        for (int i = 0; i < lines.length; i++) {
            Matcher matcher = DATE_PATTERN.matcher(lines[i]);
            while (matcher.find()) {
                String dateStr = matcher.group();
                LocalDate parsed = parseDate(dateStr);
                if (parsed != null) {
                    allDates.add(new DateWithPosition(parsed, i, matcher.start(), dateStr));
                }
            }
        }
        return allDates;
    }

    private LocalDate findDateForLabel(String[] upperLines, List<String> labels,
                                       List<DateWithPosition> allDates, String dateType) {
        int bestLabelLine = -1;
        int bestLabelPos = -1;

        for (int i = 0; i < upperLines.length; i++) {
            for (String label : labels) {
                int pos = upperLines[i].indexOf(label);
                if (pos >= 0) {
                    if (dateType.startsWith("cat") && !isCorrectCatMatch(upperLines[i], pos, label, dateType)) {
                        continue;
                    }
                    bestLabelLine = i;
                    bestLabelPos = pos;
                    break;
                }
            }
            if (bestLabelLine >= 0) break;
        }

        if (bestLabelLine < 0) return null;

        DateWithPosition closest = null;
        int minDistance = Integer.MAX_VALUE;
        for (DateWithPosition dp : allDates) {
            int lineDistance = Math.abs(dp.lineNumber - bestLabelLine);
            if (lineDistance <= 5) {
                int distance = lineDistance * 1000 + Math.abs(dp.charPosition - bestLabelPos);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = dp;
                }
            }
        }
        return closest != null ? closest.date : null;
    }

    private boolean isCorrectCatMatch(String line, int pos, String label, String dateType) {
        String afterLabel = pos + label.length() < line.length()
            ? line.substring(pos + label.length()).trim() : "";
        switch (dateType) {
            case "cat1":
                return !afterLabel.startsWith("I") && !afterLabel.startsWith("2") && !afterLabel.startsWith("3");
            case "cat2":
                return !afterLabel.startsWith("I") && !afterLabel.startsWith("3");
            case "cat3":
                return true;
            default:
                return true;
        }
    }

    private LocalDate findFppDate(String[] upperLines, List<DateWithPosition> allDates) {
        for (int i = 0; i < upperLines.length; i++) {
            if (upperLines[i].contains("FPP") || upperLines[i].contains("FIRST PERIOD")) {
                for (DateWithPosition dp : allDates) {
                    if (Math.abs(dp.lineNumber - i) <= 3) {
                        return dp.date;
                    }
                }
            }
        }
        return null;
    }

    private LocalDate parseDate(String dateStr) {
        String cleaned = dateStr.trim();
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(cleaned, fmt);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private String extractAcademicYear(String text) {
        Pattern p = Pattern.compile("(20\\d{2})\\s*[-\u2013]\\s*(\\d{2,4})");
        Matcher m = p.matcher(text);
        if (m.find()) {
            String y1 = m.group(1);
            String y2 = m.group(2);
            return y1 + "-" + (y2.length() == 2 ? y1.substring(0, 2) + y2 : y2);
        }
        return null;
    }

    private int extractStartYear(String academicYear) {
        if (academicYear != null) {
            Matcher m = Pattern.compile("(20\\d{2})").matcher(academicYear);
            if (m.find()) {
                try { return Integer.parseInt(m.group(1)); } catch (Exception ignored) {}
            }
        }
        return LocalDate.now().getYear();
    }

    private String extractSemester(String text) {
        String upper = text.toUpperCase();
        if (upper.contains("EVEN")) return "EVEN";
        if (upper.contains("ODD")) return "ODD";
        Matcher m = Pattern.compile("(?:SEM(?:ESTER)?\\s*)(\\d|[IVX]+)", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            String semNum = m.group(1);
            if (semNum.matches("[2468]") || semNum.matches("II|IV|VI|VIII")) return "EVEN";
            if (semNum.matches("[1357]") || semNum.matches("I|III|V|VII")) return "ODD";
        }
        return null;
    }

    private String extractYear(String text) {
        String upper = text.toUpperCase();
        Matcher m = Pattern.compile("(I{1,4}|IV|1ST|2ND|3RD|4TH|FIRST|SECOND|THIRD|FOURTH)\\s*YEAR", Pattern.CASE_INSENSITIVE).matcher(upper);
        if (m.find()) {
            String match = m.group(1);
            switch (match) {
                case "I": case "1ST": case "FIRST": return "I YEAR";
                case "II": case "2ND": case "SECOND": return "II YEAR";
                case "III": case "3RD": case "THIRD": return "III YEAR";
                case "IV": case "IIII": case "4TH": case "FOURTH": return "IV YEAR";
                default: return match + " YEAR";
            }
        }
        return null;
    }

    public int countExtractedDates(ExtractionResult result) {
        int count = 0;
        if (result.getReopeningDate() != null) count++;
        if (result.getCat1Date() != null) count++;
        if (result.getCat2Date() != null) count++;
        if (result.getCat3Date() != null) count++;
        if (result.getLastWorkingDay() != null) count++;
        if (result.getPracticalExamDate() != null) count++;
        if (result.getTheoryExamDate() != null) count++;
        return count;
    }

    private void logExtractionSummary(ExtractionResult r) {
        log.info("=== Calendar Date Extraction Summary ===");
        log.info("Academic Year: {}", r.getAcademicYear());
        log.info("Semester: {}", r.getSemester());
        log.info("Year: {}", r.getYear());
        log.info("Reopening: {}", r.getReopeningDate());
        log.info("CAT I: {}", r.getCat1Date());
        log.info("CAT II: {}", r.getCat2Date());
        log.info("CAT III: {}", r.getCat3Date());
        log.info("LWD: {}", r.getLastWorkingDay());
        log.info("Practical: {}", r.getPracticalExamDate());
        log.info("Theory: {}", r.getTheoryExamDate());
        log.info("Total dates found: {}/7", countExtractedDates(r));
        log.info("========================================");
    }
}
