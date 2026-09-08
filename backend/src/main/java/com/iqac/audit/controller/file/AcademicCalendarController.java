package com.iqac.audit.controller.file;

import com.iqac.audit.dto.ApiResponse;
import com.iqac.audit.dto.file.AcademicCalendarResponse;
import com.iqac.audit.service.file.AcademicCalendarService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/academic-calendar")
public class AcademicCalendarController {

    private static final Logger log = LoggerFactory.getLogger(AcademicCalendarController.class);

    @Autowired
    private AcademicCalendarService calendarService;

    /**
     * POST /api/academic-calendar/upload
     * Upload and process an academic calendar PDF.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<AcademicCalendarResponse>> uploadCalendar(
            @RequestParam("file") MultipartFile file) {
        log.info("Received academic calendar upload request: {}", file.getOriginalFilename());
        AcademicCalendarResponse response = calendarService.processUpload(file);
        
        String message;
        switch (response.getExtractionStatus()) {
            case "COMPLETE":
                message = "Academic calendar processed successfully. All dates extracted and validated.";
                break;
            case "PARTIAL":
                message = "Academic calendar partially processed. Some dates could not be extracted. Please review.";
                break;
            case "INVALID":
                message = "Academic calendar processed but date validation failed. Dates may be in incorrect chronological order.";
                break;
            default:
                message = "Academic calendar processing completed with status: " + response.getExtractionStatus();
        }
        
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    /**
     * GET /api/academic-calendar
     * Get all academic calendars.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AcademicCalendarResponse>>> getAllCalendars() {
        List<AcademicCalendarResponse> calendars = calendarService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Retrieved " + calendars.size() + " academic calendar(s)", calendars));
    }

    /**
     * GET /api/academic-calendar/{id}
     * Get academic calendar by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AcademicCalendarResponse>> getCalendarById(@PathVariable Long id) {
        AcademicCalendarResponse calendar = calendarService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Academic calendar retrieved successfully", calendar));
    }

    /**
     * DELETE /api/academic-calendar/{id}
     * Delete academic calendar by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCalendar(@PathVariable Long id) {
        calendarService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Academic calendar deleted successfully", null));
    }
}
