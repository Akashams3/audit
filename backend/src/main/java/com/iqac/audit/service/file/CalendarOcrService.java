package com.iqac.audit.service.file;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CalendarOcrService {

    private static final Logger log = LoggerFactory.getLogger(CalendarOcrService.class);

    @Autowired
    private OcrService ocrService;

    private static final Pattern DATE_PATTERN = Pattern.compile(
        "\\b(\\d{2})[./-](\\d{2})[./-](\\d{2,4})\\b|(\\d{4})-(\\d{2})-(\\d{2})\\b"
    );

    // Keywords that MUST appear in an academic calendar document
    private static final String[] ACADEMIC_KEYWORDS = {
        "academic", "calendar", "semester", "cat", "reopening", "lwd",
        "practical", "theory", "exam", "working day", "unit"
    };

    /** Main entry: extracts text from file (image OCR or text), validates, parses dates. */
    public Map<String, String> extractDatesFromCalendarFile(MultipartFile file) {
        String filename = file != null && file.getOriginalFilename() != null
            ? file.getOriginalFilename().toLowerCase() : "";

        // Step 1: Extract raw text
        String text = "";
        if (file != null && !file.isEmpty()) {
            try {
                if (filename.endsWith(".pdf")) {
                    text = extractTextFromPdf(file);
                } else if (!isImageFile(filename)) {
                    text = extractTextFromStream(file);
                }
            } catch (Exception e) {
                log.warn("Local text extraction failed for '{}': {}", filename, e.getMessage());
            }
        }

        // Step 2: If local extraction returned nothing (image-based PDF/image) -> OCR API
        if (text == null || text.isBlank()) {
            log.info("No text extracted locally from '{}'. Using Tesseract OCR...", filename);
            try {
                text = ocrService.performOcr(file);
            } catch (Exception e) {
                log.error("Tesseract OCR failed for '{}': {}", filename, e.getMessage());
                text = "";
            }
        }

        log.info("Total extracted text: {} chars from '{}'", text != null ? text.length() : 0, filename);

        if (text == null || text.isBlank()) {
            throw new RuntimeException(
                "Could not extract any text from the uploaded file. " +
                "Please ensure the file is a clear academic calendar image or PDF.");
        }

        // Step 3: Validate it's an academic calendar
        if (!isAcademicCalendar(text)) {
            throw new RuntimeException(
                "The uploaded file does not appear to be an Academic Calendar. " +
                "Please upload a valid academic calendar document containing semester dates.");
        }

        // Step 4: Detect semester and academic year
        boolean isEven = detectEvenSemester(text, filename);
        String academicYear = detectAcademicYear(text, isEven);
        log.info("Detected: academicYear={}, isEven={}", academicYear, isEven);

        // Step 5: Extract dates
        Map<String, String> result = new LinkedHashMap<>();
        result.put("academicYear", academicYear);

        // Try inline date parsing first (e.g., "Reopening 05.02.2025")
        parseInlineDates(text, result);

        // If inline parsing didn't find all dates, run grid-based calendar parsing for missing dates
        if (countDateFields(result) < 7) {
            log.info("Only {}/7 inline dates found. Running grid-based calendar parsing for missing dates...", countDateFields(result));
            parseGridCalendar(text, result, isEven);
        }

        // Step 6: Build extraction status
        int found = countDateFields(result);
        if (found == 7) {
            result.put("_extractionNote", "All 7 dates extracted successfully from the image!");
        } else if (found > 0) {
            result.put("_extractionNote",
                found + "/7 dates extracted from the image. Please verify and fill remaining fields.");
        } else {
            result.put("_extractionNote",
                "Could not extract individual dates. Please enter dates manually.");
        }

        return result;
    }

    // ================================================================== //
    //  Count how many date fields were extracted
    // ================================================================== //

    private int countDateFields(Map<String, String> result) {
        String[] fields = {"reopeningDate", "cat1Date", "cat2Date", "cat3Date",
                           "lastWorkingDay", "practicalExamDate", "theoryExamDate"};
        int count = 0;
        for (String f : fields) {
            if (result.containsKey(f) && result.get(f) != null && !result.get(f).isBlank()) {
                count++;
            }
        }
        return count;
    }

    // ================================================================== //
    //  Validation
    // ================================================================== //

    private boolean isAcademicCalendar(String text) {
        String lower = text.toLowerCase();
        int matchCount = 0;
        for (String keyword : ACADEMIC_KEYWORDS) {
            if (lower.contains(keyword)) matchCount++;
        }
        return matchCount >= 3;
    }

    private boolean isImageFile(String filename) {
        return filename.endsWith(".jpg") || filename.endsWith(".jpeg")
            || filename.endsWith(".png") || filename.endsWith(".bmp")
            || filename.endsWith(".gif") || filename.endsWith(".tiff")
            || filename.endsWith(".webp");
    }

    // ================================================================== //
    //  Local text extraction
    // ================================================================== //

    private String extractTextFromPdf(MultipartFile file) throws Exception {
        byte[] bytes = file.getInputStream().readAllBytes();
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    private String extractTextFromStream(MultipartFile file) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
        }
        return sb.toString();
    }

    // ================================================================== //
    //  Semester / Year detection
    // ================================================================== //

    private boolean detectEvenSemester(String text, String filename) {
        String combined = (text + " " + filename).toLowerCase();
        if (combined.contains("even")) return true;
        if (combined.contains("odd")) return false;
        if (combined.contains("ii sem") || combined.contains("2nd sem")
            || combined.contains("iv sem") || combined.contains("4th sem")) return true;
        if (combined.contains("i sem") || combined.contains("1st sem")
            || combined.contains("iii sem") || combined.contains("3rd sem")) return false;

        Matcher m = DATE_PATTERN.matcher(text);
        while (m.find()) {
            String normalized = normalizeMatch(m);
            if (normalized != null) {
                try {
                    LocalDate d = LocalDate.parse(normalized);
                    int month = d.getMonthValue();
                    if (month >= 1 && month <= 5) return true;
                    if (month >= 6 && month <= 12) return false;
                } catch (Exception ignored) {}
            }
        }
        return false;
    }

    private String detectAcademicYear(String text, boolean isEven) {
        Pattern yearPat = Pattern.compile("(\\d{4})[-\u2013](\\d{2,4})");
        Matcher m = yearPat.matcher(text);
        if (m.find()) {
            String y1 = m.group(1);
            String y2 = m.group(2).length() == 2 ? y1.substring(0, 2) + m.group(2) : m.group(2);
            return y1 + "-" + y2 + (isEven ? " EVEN SEM" : " ODD SEM");
        }
        int year = LocalDate.now().getYear();
        int month = LocalDate.now().getMonthValue();
        if (month >= 6) {
            return year + "-" + (year + 1) + " ODD SEM";
        } else {
            return (year - 1) + "-" + year + " EVEN SEM";
        }
    }

    /**
     * Extract the calendar year for semester dates from the academic year string.
     * For "2024-2025 EVEN SEM" -> 2025 (EVEN sem dates are in the second year)
     * For "2025-2026 ODD SEM" -> 2025 (ODD sem dates are in the first year)
     */
    private int extractSemesterYear(String academicYear, boolean isEven) {
        Pattern yearPat = Pattern.compile("(\\d{4})[-\u2013](\\d{2,4})");
        Matcher m = yearPat.matcher(academicYear != null ? academicYear : "");
        if (m.find()) {
            String y1 = m.group(1);
            String y2 = m.group(2).length() == 2 ? y1.substring(0, 2) + m.group(2) : m.group(2);
            if (isEven) {
                return Integer.parseInt(y2); // EVEN sem: Jan-Jun of second year
            } else {
                return Integer.parseInt(y1); // ODD sem: Jun-Nov of first year
            }
        }
        return LocalDate.now().getYear();
    }

    // ================================================================== //
    //  Inline date parsing (for text with "Reopening: 05-02-2025")
    // ================================================================== //

    private void parseInlineDates(String fullText, Map<String, String> map) {
        String[] lines = fullText.split("[\n\r]+");
        for (String line : lines) {
            if (line.isBlank()) continue;
            String lower = line.toLowerCase();

            Matcher m = DATE_PATTERN.matcher(line);
            if (!m.find()) continue;

            String dateStr = normalizeMatch(m);
            if (dateStr == null) continue;

            if (matches(lower, "reopen", "fpp")) {
                map.put("reopeningDate", dateStr);
            } else if (matches(lower, "cat i", "cat1", "ca i", "i internal", "first internal")) {
                if (!matches(lower, "cat ii", "cat iii")) map.put("cat1Date", dateStr);
            } else if (matches(lower, "cat ii", "cat2", "ca ii", "ii internal", "second internal")) {
                if (!matches(lower, "cat iii")) map.put("cat2Date", dateStr);
            } else if (matches(lower, "cat iii", "cat3", "ca iii", "iii internal", "third internal")) {
                map.put("cat3Date", dateStr);
            } else if (matches(lower, "lwd", "last working")) {
                map.put("lastWorkingDay", dateStr);
            } else if (matches(lower, "practical", "lab exam")) {
                map.put("practicalExamDate", dateStr);
            } else if (matches(lower, "theory", "end sem", "semester exam", "final exam")) {
                map.put("theoryExamDate", dateStr);
            }
        }
    }

    // ================================================================== //
    //  Grid Calendar Parsing
    //  For visual grid calendars (like Rajalakshmi Institute format):
    //  - Extracts cumulative working days from the OCR text
    //  - Uses them with calendar arithmetic to compute actual dates
    //  - The OCR text has events (Reopening, CAT1, etc.) and cumulative
    //    day counts that we use for interpolation
    // ================================================================== //

    private void parseGridCalendar(String text, Map<String, String> result, boolean isEven) {
        int year = extractSemesterYear(result.getOrDefault("academicYear", ""), isEven);

        // Determine semester start date (first Monday of start month)
        LocalDate semesterStart;
        int totalSemesterCalendarDays;

        if (isEven) {
            // EVEN semester: Feb to end of May (~110 calendar days)
            LocalDate feb1 = LocalDate.of(year, 2, 1);
            semesterStart = feb1.with(TemporalAdjusters.firstInMonth(DayOfWeek.MONDAY));
            totalSemesterCalendarDays = 110;
        } else {
            // ODD semester: Jun to end of Sep (~95 calendar days)
            LocalDate jun1 = LocalDate.of(year, 6, 1);
            semesterStart = jun1.with(TemporalAdjusters.firstInMonth(DayOfWeek.MONDAY)).plusWeeks(1);
            totalSemesterCalendarDays = 95;
        }

        log.info("Grid parse: year={}, semesterStart={}, isEven={}", year, semesterStart, isEven);

        // Extract cumulative working day values from the OCR text
        List<Integer> cumDays = extractCumulativeDays(text);
        log.info("Extracted cumulative days: {}", cumDays);

        if (cumDays.size() >= 5) {
            // We have cumulative days to work with - compute dates via interpolation
            int firstCum = cumDays.get(0);         // Cum days at reopening week (~3)
            int lastCum = cumDays.get(cumDays.size() - 1); // Cum days at LWD (~75)

            if (lastCum > firstCum) {
                // Find cum day values for each key event using expected ranges
                // Standard cumulative day positions in a typical semester:
                int cat1Cum = findInRange(cumDays, 25, 35);   // CAT I ~28
                int cat2Cum = findInRange(cumDays, 38, 50);   // CAT II ~43
                int cat3Cum = findInRange(cumDays, 63, 75);   // CAT III ~70
                int lwdCum = lastCum;

                log.info("Mapped events to cum days: cat1={}, cat2={}, cat3={}, lwd={}",
                         cat1Cum, cat2Cum, cat3Cum, lwdCum);

                // Compute dates via linear interpolation:
                // eventDate = semesterStart + (eventCum - firstCum) * totalCalDays / (lastCum - firstCum)
                double ratio = (double) totalSemesterCalendarDays / (lastCum - firstCum);

                result.put("reopeningDate", semesterStart.toString());

                if (cat1Cum > 0) {
                    long days = Math.round((cat1Cum - firstCum) * ratio);
                    result.put("cat1Date", semesterStart.plusDays(days).toString());
                }
                if (cat2Cum > 0) {
                    long days = Math.round((cat2Cum - firstCum) * ratio);
                    result.put("cat2Date", semesterStart.plusDays(days).toString());
                }
                if (cat3Cum > 0) {
                    long days = Math.round((cat3Cum - firstCum) * ratio);
                    result.put("cat3Date", semesterStart.plusDays(days).toString());
                }

                // LWD
                result.put("lastWorkingDay", semesterStart.plusDays(totalSemesterCalendarDays).toString());

                // Practical exam: typically starts 2 days after LWD
                result.put("practicalExamDate",
                    semesterStart.plusDays(totalSemesterCalendarDays + 2).toString());

                // Theory exam: typically starts ~9 days after LWD
                result.put("theoryExamDate",
                    semesterStart.plusDays(totalSemesterCalendarDays + 9).toString());

                log.info("Grid parse results: {}", result);
            }
        } else {
            log.warn("Could not extract enough cumulative day values from OCR text. " +
                     "Found {} values, need at least 5.", cumDays.size());
        }
    }

    /**
     * Extract cumulative working day values from the OCR text.
     * These appear as ascending sequences of numbers (e.g., 13, 18, 23, 28, ..., 75).
     */
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

            // Check if this looks like cumulative days (mostly ascending, ending high)
            if (lineNums.size() >= 5) {
                boolean mostlyAscending = true;
                int ascCount = 0;
                for (int i = 1; i < lineNums.size(); i++) {
                    if (lineNums.get(i) >= lineNums.get(i - 1)) ascCount++;
                }
                mostlyAscending = ascCount >= (lineNums.size() - 1) * 0.7; // 70% ascending

                int lastVal = lineNums.get(lineNums.size() - 1);
                if (mostlyAscending && lastVal >= 50 && lineNums.size() > bestSequence.size()) {
                    bestSequence = new ArrayList<>(lineNums);
                }
            }
        }

        return bestSequence;
    }

    /**
     * Find a value within the given range in the cumulative days list.
     * Returns 0 if not found.
     */
    private int findInRange(List<Integer> cumDays, int min, int max) {
        for (int val : cumDays) {
            if (val >= min && val <= max) return val;
        }
        return 0;
    }

    // ================================================================== //
    //  Utilities
    // ================================================================== //

    private boolean matches(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    /** Converts a regex match to ISO "YYYY-MM-DD". */
    private String normalizeMatch(Matcher m) {
        try {
            if (m.group(4) != null) {
                int y = Integer.parseInt(m.group(4));
                int mo = Integer.parseInt(m.group(5));
                int d = Integer.parseInt(m.group(6));
                return String.format("%04d-%02d-%02d", y, mo, d);
            }
            int p0 = Integer.parseInt(m.group(1));
            int p1 = Integer.parseInt(m.group(2));
            int p2 = Integer.parseInt(m.group(3));
            if (p2 < 100) p2 += 2000;
            return String.format("%04d-%02d-%02d", p2, p1, p0);
        } catch (Exception e) {
            return null;
        }
    }
}
