package com.iqac.audit.service.file;

import com.iqac.audit.dto.file.AcademicCalendarResponse;
import com.iqac.audit.entity.file.AcademicCalendar;
import com.iqac.audit.exception.CalendarProcessingException;
import com.iqac.audit.repository.file.AcademicCalendarRepository;
import com.iqac.audit.validation.CalendarDateValidator;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AcademicCalendarService {

    private static final Logger log = LoggerFactory.getLogger(AcademicCalendarService.class);

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    @Autowired
    private AcademicCalendarRepository calendarRepository;

    @Autowired
    private OcrService ocrService;

    @Autowired
    private CalendarDateExtractor dateExtractor;

    @Autowired
    private CalendarDateValidator dateValidator;

    /**
     * Process an uploaded academic calendar PDF.
     * Extracts text (with OCR fallback for scanned PDFs), parses dates,
     * validates chronological order, saves to DB.
     */
    public AcademicCalendarResponse processUpload(MultipartFile file) {
        // 1. Validate file
        validateFile(file);

        String fileName = file.getOriginalFilename();
        log.info("Processing academic calendar upload: {}", fileName);

        // 2. Extract text from PDF
        String extractedText = extractText(file);

        if (extractedText == null || extractedText.isBlank()) {
            // Save failed extraction
            AcademicCalendar calendar = new AcademicCalendar();
            calendar.setFileName(fileName);
            calendar.setExtractionStatus("FAILED");
            calendar.setExtractedText("");
            calendar.setStatus("ACTIVE");
            calendar.setCreatedAt(LocalDateTime.now());
            // Set a default academic year to satisfy NOT NULL constraint
            calendar.setAcademicYear("UNKNOWN");
            calendarRepository.save(calendar);
            throw new CalendarProcessingException("Failed to extract any text from the uploaded PDF. The file may be corrupt or contain no readable content.");
        }

        // 3. Extract dates from text
        CalendarDateExtractor.ExtractionResult extraction = dateExtractor.extract(extractedText);
        int datesFound = dateExtractor.countExtractedDates(extraction);
        log.info("Extracted {}/7 dates from PDF", datesFound);

        // 4. Determine extraction status
        String extractionStatus;
        if (datesFound == 0) {
            extractionStatus = "FAILED";
        } else if (datesFound < 7) {
            extractionStatus = "PARTIAL";
        } else {
            // 5. Validate chronological order
            CalendarDateValidator.ValidationResult validation = dateValidator.validate(
                extraction.getReopeningDate(),
                extraction.getCat1Date(),
                extraction.getCat2Date(),
                extraction.getCat3Date(),
                extraction.getLastWorkingDay(),
                extraction.getPracticalExamDate(),
                extraction.getTheoryExamDate()
            );
            if (validation.isValid()) {
                extractionStatus = "COMPLETE";
            } else {
                extractionStatus = "INVALID";
                log.warn("Date validation failed: {}", validation.getViolations());
            }
        }

        // 6. Build and save entity
        AcademicCalendar calendar = new AcademicCalendar();
        calendar.setFileName(fileName);
        calendar.setAcademicYear(extraction.getAcademicYear() != null ? extraction.getAcademicYear() : "UNKNOWN");
        calendar.setSemester(extraction.getSemester());
        calendar.setYear(extraction.getYear());
        calendar.setReopeningDate(extraction.getReopeningDate());
        calendar.setCat1Date(extraction.getCat1Date());
        calendar.setCat2Date(extraction.getCat2Date());
        calendar.setCat3Date(extraction.getCat3Date());
        calendar.setLastWorkingDay(extraction.getLastWorkingDay());
        calendar.setPracticalExamDate(extraction.getPracticalExamDate());
        calendar.setTheoryExamDate(extraction.getTheoryExamDate());
        calendar.setExtractedText(extractedText.length() > 50000 ? extractedText.substring(0, 50000) : extractedText);
        calendar.setExtractionStatus(extractionStatus);
        calendar.setStatus("ACTIVE");
        calendar.setCreatedAt(LocalDateTime.now());

        AcademicCalendar saved = calendarRepository.save(calendar);
        log.info("Academic calendar saved with ID: {}, status: {}", saved.getId(), extractionStatus);

        return toResponse(saved);
    }

    /**
     * Get calendar by ID.
     */
    public AcademicCalendarResponse getById(Long id) {
        AcademicCalendar calendar = calendarRepository.findById(id)
            .orElseThrow(() -> new CalendarProcessingException("Academic calendar not found with id: " + id));
        return toResponse(calendar);
    }

    /**
     * Get all calendars.
     */
    public List<AcademicCalendarResponse> getAll() {
        return calendarRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Delete calendar by ID.
     */
    public void deleteById(Long id) {
        if (!calendarRepository.existsById(id)) {
            throw new CalendarProcessingException("Academic calendar not found with id: " + id);
        }
        calendarRepository.deleteById(id);
        log.info("Deleted academic calendar with ID: {}", id);
    }

    // ============================================================
    // Private methods
    // ============================================================

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CalendarProcessingException("Uploaded file is empty. Please upload a valid Academic Calendar file.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new CalendarProcessingException("Invalid filename.");
        }

        String lowerName = originalFilename.toLowerCase();
        boolean isValidExtension = lowerName.endsWith(".pdf") || lowerName.endsWith(".jpg")
                || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png")
                || lowerName.endsWith(".bmp") || lowerName.endsWith(".webp");

        if (!isValidExtension) {
            throw new CalendarProcessingException("Only PDF and image files (.jpg, .jpeg, .png, .webp) are allowed. Received: " + originalFilename);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CalendarProcessingException(
                "File size exceeds the maximum allowed size of 20MB. File size: " + (file.getSize() / (1024 * 1024)) + "MB");
        }
    }

    /**
     * Extract text from file. First tries PDFBox text extraction for PDFs.
     * Falls back to OCR service (local Tesseract / OCR API) for image-based PDFs and image files.
     */
    private String extractText(MultipartFile file) {
        String text = "";
        String fileName = file.getOriginalFilename();
        String lowerName = fileName != null ? fileName.toLowerCase() : "";

        // If PDF, try PDFBox text extraction first
        if (lowerName.endsWith(".pdf")) {
            try {
                byte[] pdfBytes = file.getBytes();
                try (PDDocument document = Loader.loadPDF(pdfBytes)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    text = stripper.getText(document);
                    int pages = document.getNumberOfPages();
                    log.info("PDFBox extracted {} chars from {} page(s) of '{}'", 
                        text != null ? text.length() : 0, pages, fileName);
                }
            } catch (Exception e) {
                log.warn("PDFBox text extraction failed for '{}': {}", fileName, e.getMessage());
            }
        }

        // If text is empty or insufficient (less than 50 chars), or if file is an image, try OCR
        if (text == null || text.trim().length() < 50) {
            log.info("Insufficient text from PDFBox. Calling OCR service for '{}'...", fileName);
            try {
                text = ocrService.performOcr(file);
            } catch (Exception e) {
                log.error("OCR failed for '{}': {}", fileName, e.getMessage());
                return text != null ? text : "";
            }
        }

        return text;
    }

    /**
     * Convert entity to response DTO.
     */
    private AcademicCalendarResponse toResponse(AcademicCalendar entity) {
        AcademicCalendarResponse response = new AcademicCalendarResponse();
        response.setId(entity.getId());
        response.setFileName(entity.getFileName());
        response.setAcademicYear(entity.getAcademicYear());
        response.setSemester(entity.getSemester());
        response.setYear(entity.getYear());
        response.setReopeningDate(entity.getReopeningDate());
        response.setCat1Date(entity.getCat1Date());
        response.setCat2Date(entity.getCat2Date());
        response.setCat3Date(entity.getCat3Date());
        response.setLastWorkingDay(entity.getLastWorkingDay());
        response.setPracticalExamDate(entity.getPracticalExamDate());
        response.setTheoryExamDate(entity.getTheoryExamDate());
        response.setExtractionStatus(entity.getExtractionStatus());
        return response;
    }
}
