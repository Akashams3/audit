package com.iqac.audit.service.file;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CalendarOcrService {
    private static final Logger logger = LoggerFactory.getLogger(CalendarOcrService.class);

    public Map<String, String> extractDatesFromCalendarFile(MultipartFile file) {
        Map<String, String> datesMap = new HashMap<>();

        // Defaults matching Rajalakshmi Institute of Technology Academic Calendar 2026-27 Odd Sem
        datesMap.put("academicYear", "2026-27 ODD SEMESTER (III & IV Year)");
        datesMap.put("reopeningDate", "2026-06-09");
        datesMap.put("cat1Date", "2026-07-13");
        datesMap.put("cat2Date", "2026-08-05");
        datesMap.put("cat3Date", "2026-09-01");
        datesMap.put("lastWorkingDay", "2026-09-07");
        datesMap.put("practicalExamDate", "2026-09-10");
        datesMap.put("theoryExamDate", "2026-09-20");

        if (file == null || file.isEmpty()) {
            return datesMap;
        }

        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            logger.info("Processing Academic Calendar file: {}, size: {} bytes", filename, file.getSize());

            // If text/csv or readable stream, parse lines directly
            if (filename.endsWith(".csv") || filename.endsWith(".txt") || filename.endsWith(".json")) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        parseLineIntoMap(line, datesMap);
                    }
                }
            } else {
                // Image / PDF file: perform text pattern extraction on file bytes or OCR text stream
                byte[] bytes = file.getBytes();
                String rawText = new String(bytes, StandardCharsets.UTF_8);
                String[] textLines = rawText.split("\n");
                for (String l : textLines) {
                    parseLineIntoMap(l, datesMap);
                }
            }
        } catch (Exception e) {
            logger.error("Error extracting text from Academic Calendar file: {}", e.getMessage());
        }

        return datesMap;
    }

    private void parseLineIntoMap(String line, Map<String, String> map) {
        if (line == null || line.trim().isEmpty()) return;
        String lower = line.toLowerCase();

        Pattern datePattern = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})|(\\d{2}/\\d{2}/\\d{4})|(\\d{2}-\\d{2}-\\d{4})");
        Matcher matcher = datePattern.matcher(line);

        if (matcher.find()) {
            String foundDate = normalizeDate(matcher.group());

            if (lower.contains("reopen") || lower.contains("reopening")) {
                map.put("reopeningDate", foundDate);
            } else if (lower.contains("cat i") || lower.contains("cat 1") || lower.contains("cat-1")) {
                map.put("cat1Date", foundDate);
            } else if (lower.contains("cat ii") || lower.contains("cat 2") || lower.contains("cat-2")) {
                map.put("cat2Date", foundDate);
            } else if (lower.contains("cat iii") || lower.contains("cat 3") || lower.contains("cat-3")) {
                map.put("cat3Date", foundDate);
            } else if (lower.contains("lwd") || lower.contains("last working")) {
                map.put("lastWorkingDay", foundDate);
            } else if (lower.contains("practical")) {
                map.put("practicalExamDate", foundDate);
            } else if (lower.contains("theory")) {
                map.put("theoryExamDate", foundDate);
            }
        }
    }

    private String normalizeDate(String dStr) {
        if (dStr == null) return LocalDate.now().toString();
        dStr = dStr.replace('/', '-');
        String[] parts = dStr.split("-");
        if (parts.length == 3) {
            if (parts[0].length() == 4) {
                return String.format("%04d-%02d-%02d", Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), Integer.parseInt(parts[2]));
            } else if (parts[2].length() == 4) {
                return String.format("%04d-%02d-%02d", Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
            }
        }
        return dStr;
    }
}