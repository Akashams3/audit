package com.iqac.audit.controller.audit;

import com.iqac.audit.entity.audit.AuditSchedule;
import com.iqac.audit.entity.department.Department;
import com.iqac.audit.entity.file.AcademicCalendar;
import com.iqac.audit.entity.user.Hod;
import com.iqac.audit.entity.user.IqacInvigilator;
import com.iqac.audit.repository.audit.AuditScheduleRepository;
import com.iqac.audit.repository.department.DepartmentRepository;
import com.iqac.audit.repository.file.AcademicCalendarRepository;
import com.iqac.audit.repository.user.HodRepository;
import com.iqac.audit.repository.user.IqacInvigilatorRepository;
import com.iqac.audit.service.file.CalendarOcrService;
import com.iqac.audit.service.notification.EmailService;
import com.iqac.audit.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/director")
public class DirectorScheduleController {

    @Autowired
    private AuditScheduleRepository auditScheduleRepository;
    @Autowired
    private AcademicCalendarRepository academicCalendarRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private IqacInvigilatorRepository iqacInvigilatorRepository;
    @Autowired
    private HodRepository hodRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private CalendarOcrService calendarOcrService;

    private LocalDate parseDate(String dateStr) {
        String cleanStr = dateStr.trim();
        List<String> patterns = Arrays.asList(
            "yyyy-MM-dd", "dd-MM-yyyy", "yyyy/MM/dd", "dd/MM/yyyy",
            "yyyy.MM.dd", "dd.MM.yyyy", "d-M-yyyy", "yyyy-M-d",
            "d/M/yyyy", "d.M.yyyy", "yyyy/M/d", "yyyy.M.d"
        );
        for (String pattern : patterns) {
            try {
                return LocalDate.parse(cleanStr, java.time.format.DateTimeFormatter.ofPattern(pattern));
            } catch (Exception e) {
            }
        }
        throw new IllegalArgumentException("Unsupported date format: '" + dateStr + "'");
    }

    private List<Map<String, String>> generateWorkingDaysBefore(LocalDate baseDate, int count, String type) {
        List<Map<String, String>> days = new ArrayList<>();
        if (baseDate == null) return days;
        LocalDate current = baseDate.minusDays(1);
        int toCollect = count;
        while (toCollect > 0) {
            if (current.getDayOfWeek().getValue() < 6) {
                Map<String, String> map = new HashMap<>();
                map.put("date", current.toString());
                map.put("type", type);
                days.add(map);
                toCollect--;
            }
            current = current.minusDays(1);
        }
        Collections.reverse(days);
        return days;
    }

    private List<Map<String, String>> generateWorkingDaysAfter(LocalDate baseDate, int count, String type) {
        List<Map<String, String>> days = new ArrayList<>();
        if (baseDate == null) return days;
        LocalDate current = baseDate.plusDays(1);
        int toCollect = count;
        while (toCollect > 0) {
            if (current.getDayOfWeek().getValue() < 6) {
                Map<String, String> map = new HashMap<>();
                map.put("date", current.toString());
                map.put("type", type);
                days.add(map);
                toCollect--;
            }
            current = current.plusDays(1);
        }
        return days;
    }

    private List<Map<String, String>> generateFollowUpMeetings(LocalDate lastAuditDate) {
        List<Map<String, String>> days = new ArrayList<>();
        LocalDate current = lastAuditDate.plusDays(1);
        
        String[] meetingTypes = {"N.C Closing", "Meeting with Deans", "Meeting with IQAC Coordinator"};
        for (String type : meetingTypes) {
            while (current.getDayOfWeek().getValue() >= 6) {
                current = current.plusDays(1);
            }
            Map<String, String> map = new HashMap<>();
            map.put("date", current.toString());
            map.put("type", type);
            days.add(map);
            current = current.plusDays(1);
        }
        return days;
    }

    private void createAutoScheduleIfMissing(String phase, String title, List<Map<String, String>> dateList, List<AuditSchedule> existingSchedules, String year, String semester, List<Department> depts) {
        if (dateList.isEmpty() || depts.isEmpty()) return;
        
        boolean exists = existingSchedules.stream().anyMatch(s -> 
            !"ARCHIVED".equals(s.getStatus()) && !"AUDIT_COMPLETED".equals(s.getStatus()) &&
            phase.equals(s.getAcademicPhase()) && 
            (year.equalsIgnoreCase(s.getYear()) || s.getYear() == null)
        );
        
        if (!exists) {
            int i = 0;
            for (Department dept : depts) {
                int dateIndex = i < dateList.size() ? i : (i % dateList.size());
                LocalDate assignedDate = LocalDate.parse(dateList.get(dateIndex).get("date"));

                AuditSchedule s = new AuditSchedule();
                s.setTitle(dept.getCode() + " " + title);
                s.setAuditDate(assignedDate);
                s.setDueDate(assignedDate);
                s.setDueTime(LocalTime.of(23, 59));
                s.setDescription("Auto-generated schedule based on Academic Calendar grid for " + dept.getCode());
                s.setStatus("PUBLISHED");
                s.setDepartmentCode(dept.getCode());
                s.setAuditType("ACADEMIC");
                s.setAcademicPhase(phase);
                s.setYear(year);
                s.setSemester(semester);
                s.setAcademicType("Assigned Individual");
                s.setCreatedAt(LocalDateTime.now());
                auditScheduleRepository.save(s);
                existingSchedules.add(s);
                i++;
            }
        }
    }

    private void notifyInvigilatorsAndHods(AuditSchedule schedule) {
        String deptCode = schedule.getDepartmentCode();

        List<IqacInvigilator> invigilators = new ArrayList<>();
        if (deptCode == null || deptCode.equals("ALL") || deptCode.trim().isEmpty()) {
            invigilators = iqacInvigilatorRepository.findAll();
        } else {
            Optional<IqacInvigilator> invOpt = iqacInvigilatorRepository.findByDepartmentCode(deptCode);
            invOpt.ifPresent(invigilators::add);
        }

        for (IqacInvigilator inv : invigilators) {
            if (inv == null || inv.getUser() == null) continue;
            try {
                notificationService.createNotification(inv.getUser(),
                        "New audit schedule published: '" + schedule.getTitle() + "' — Audit Date: " + schedule.getAuditDate() + ", Due: " + schedule.getDueDate(),
                        "SCHEDULE", "New Audit Schedule");
                String html = "<html><body>" +
                        "<h3 style='color:#1A56DB;'>New Audit Schedule Published</h3>" +
                        "<p>Dear " + inv.getName() + ",</p>" +
                        "<p>The IQAC Director has published a new audit schedule:</p>" +
                        "<ul><li><strong>Title:</strong> " + schedule.getTitle() + "</li>" +
                        "<li><strong>Audit Date:</strong> " + schedule.getAuditDate() + "</li>" +
                        "<li><strong>Due Date:</strong> " + schedule.getDueDate() + "</li></ul>" +
                        "<p>Please review and ensure all files are submitted before the due date.</p>" +
                        "<p>Best regards,<br/>IQAC Director</p></body></html>";
                if (inv.getUser().getEmail() != null) {
                    emailService.sendHtmlEmail(inv.getUser().getEmail(), "New Audit Schedule: " + schedule.getTitle(), html);
                }
            } catch (Exception e) {}
        }

        List<Hod> hods = new ArrayList<>();
        if (deptCode == null || deptCode.equals("ALL") || deptCode.trim().isEmpty()) {
            hods = hodRepository.findAll();
        } else {
            Optional<Hod> hodOpt = hodRepository.findByDepartmentCode(deptCode);
            hodOpt.ifPresent(hods::add);
        }

        for (Hod hod : hods) {
            if (hod == null || hod.getUser() == null) continue;
            try {
                notificationService.createNotification(hod.getUser(),
                        "New audit schedule published for department " + ("ALL".equals(deptCode) ? "All" : deptCode) + ": '" + schedule.getTitle() + "' — Audit Date: " + schedule.getAuditDate() + ", Due: " + schedule.getDueDate(),
                        "SCHEDULE", "New Audit Schedule");
                String html = "<html><body>" +
                        "<h3 style='color:#1A56DB;'>New Audit Schedule Published</h3>" +
                        "<p>Dear HOD " + hod.getName() + ",</p>" +
                        "<p>The IQAC Director has published a new audit schedule for " + ("ALL".equals(deptCode) ? "All Departments" : deptCode) + ":</p>" +
                        "<ul><li><strong>Title:</strong> " + schedule.getTitle() + "</li>" +
                        "<li><strong>Audit Date:</strong> " + schedule.getAuditDate() + "</li>" +
                        "<li><strong>Due Date:</strong> " + schedule.getDueDate() + "</li></ul>" +
                        "<p>Best regards,<br/>IQAC Director</p></body></html>";
                if (hod.getUser().getEmail() != null) {
                    emailService.sendHtmlEmail(hod.getUser().getEmail(), "New Audit Schedule: " + schedule.getTitle(), html);
                }
            } catch (Exception e) {}
        }
    }

    @GetMapping("/schedules")
    public ResponseEntity<?> getSchedules() {
        List<AuditSchedule> all = auditScheduleRepository.findAll();
        List<AuditSchedule> activeList = all; // Keep all schedules on the calendar permanently
        return ResponseEntity.ok(activeList);
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PostMapping("/schedules")
    public ResponseEntity<?> createSchedule(@RequestBody Map<String, Object> payload) {
        AuditSchedule schedule = new AuditSchedule();
        schedule.setTitle(payload.get("title").toString());
        schedule.setAuditDate(parseDate(payload.get("auditDate").toString()));
        schedule.setDueDate(parseDate(payload.get("dueDate").toString()));
        schedule.setDescription(payload.getOrDefault("description", "").toString());
        schedule.setDepartmentCode(payload.getOrDefault("departmentCode", "ALL").toString());
        schedule.setAcademicPhase(payload.getOrDefault("academicPhase", "").toString());
        schedule.setYear(payload.getOrDefault("year", "").toString());
        schedule.setSemester(payload.getOrDefault("semester", "").toString());
        schedule.setAcademicType(payload.getOrDefault("academicType", "").toString());
        
        String auditType = payload.getOrDefault("auditType", "ACADEMIC").toString().toUpperCase();
        schedule.setAuditType(auditType);

        if ("ANNUAL".equals(auditType)) {
            int year = schedule.getAuditDate().getYear();
            String deptCode = schedule.getDepartmentCode();
            List<AuditSchedule> all = auditScheduleRepository.findAll();
            for (AuditSchedule s : all) {
                if ("ANNUAL".equalsIgnoreCase(s.getAuditType()) && s.getAuditDate().getYear() == year) {
                    if (s.getDepartmentCode().equals("ALL") || deptCode.equals("ALL") || s.getDepartmentCode().equals(deptCode)) {
                        return ResponseEntity.badRequest().body(Collections.singletonMap("message", 
                            "An Annual Audit has already been scheduled for department " + s.getDepartmentCode() + " in the year " + year));
                    }
                }
            }
        }

        schedule.setStatus("DRAFT");
        schedule.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(auditScheduleRepository.save(schedule));
    }

    @PostMapping("/schedules/{id}/publish")
    public ResponseEntity<?> publishSchedule(@PathVariable Long id) {
        AuditSchedule schedule = auditScheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus("PUBLISHED");
        auditScheduleRepository.save(schedule);
        notifyInvigilatorsAndHods(schedule);
        return ResponseEntity.ok(Collections.singletonMap("message", "Schedule published and invigilator(s) and HOD(s) notified."));
    }

    @GetMapping("/academic-calendar")
    public ResponseEntity<?> getActiveAcademicCalendar() {
        Optional<AcademicCalendar> calOpt = academicCalendarRepository.findFirstByStatusOrderByCreatedAtDesc("ACTIVE");
        if (calOpt.isPresent()) {
            return ResponseEntity.ok(calOpt.get());
        }
        Optional<AcademicCalendar> latestOpt = academicCalendarRepository.findFirstByOrderByIdDesc();
        if (latestOpt.isPresent()) {
            return ResponseEntity.ok(latestOpt.get());
        }
        return ResponseEntity.ok(Collections.emptyMap());
    }

    @PostMapping("/academic-calendar")
    public ResponseEntity<?> createAcademicCalendar(@RequestBody Map<String, Object> payload) {
        try {
            if (payload == null || payload.get("reopeningDate") == null || payload.get("cat1Date") == null
                    || payload.get("cat2Date") == null || payload.get("cat3Date") == null
                    || payload.get("lastWorkingDay") == null || payload.get("practicalExamDate") == null
                    || payload.get("theoryExamDate") == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "All key semester dates are required."));
            }

            String academicYear = payload.getOrDefault("academicYear", "2026-27 ODD SEM").toString();
            String year = payload.getOrDefault("year", "1st Year").toString();
            String semester = payload.getOrDefault("semester", "ODD").toString();

            LocalDate reopeningDate = parseDate(payload.get("reopeningDate").toString());
            LocalDate cat1Date = parseDate(payload.get("cat1Date").toString());
            LocalDate cat1EndDate = payload.get("cat1EndDate") != null ? parseDate(payload.get("cat1EndDate").toString()) : cat1Date;
            LocalDate cat2Date = parseDate(payload.get("cat2Date").toString());
            LocalDate cat2EndDate = payload.get("cat2EndDate") != null ? parseDate(payload.get("cat2EndDate").toString()) : cat2Date;
            LocalDate cat3Date = parseDate(payload.get("cat3Date").toString());
            LocalDate cat3EndDate = payload.get("cat3EndDate") != null ? parseDate(payload.get("cat3EndDate").toString()) : cat3Date;
            LocalDate lastWorkingDay = parseDate(payload.get("lastWorkingDay").toString());
            LocalDate practicalExamDate = parseDate(payload.get("practicalExamDate").toString());
            LocalDate theoryExamDate = parseDate(payload.get("theoryExamDate").toString());

            List<AcademicCalendar> existing = academicCalendarRepository.findAll();
            for (AcademicCalendar c : existing) {
                c.setStatus("ARCHIVED");
                academicCalendarRepository.save(c);
            }

            AcademicCalendar calendar = new AcademicCalendar();
            calendar.setAcademicYear(academicYear);
            calendar.setYear(year);
            calendar.setSemester(semester);
            calendar.setReopeningDate(reopeningDate);
            calendar.setCat1Date(cat1Date);
            calendar.setCat1EndDate(cat1EndDate);
            calendar.setCat2Date(cat2Date);
            calendar.setCat2EndDate(cat2EndDate);
            calendar.setCat3Date(cat3Date);
            calendar.setCat3EndDate(cat3EndDate);
            calendar.setLastWorkingDay(lastWorkingDay);
            calendar.setPracticalExamDate(practicalExamDate);
            calendar.setTheoryExamDate(theoryExamDate);
            calendar.setStatus("ACTIVE");
            calendar.setCreatedAt(LocalDateTime.now());
            
            // Generate grid dates automatically
            List<Map<String, String>> generatedDates = new ArrayList<>();
            List<Map<String, String>> fppDates = generateWorkingDaysBefore(reopeningDate, 10, "FPP");
            List<Map<String, String>> postCat1Dates = generateWorkingDaysAfter(cat1EndDate, 10, "Post-CAT 1");
            List<Map<String, String>> postCat2Dates = generateWorkingDaysAfter(cat2EndDate, 10, "Post-CAT 2");
            List<Map<String, String>> endSemDates = generateWorkingDaysAfter(cat3EndDate, 10, "End Semester");
            
            generatedDates.addAll(fppDates);
            if (!fppDates.isEmpty()) {
                generatedDates.addAll(generateFollowUpMeetings(LocalDate.parse(fppDates.get(fppDates.size()-1).get("date"))));
            }
            
            generatedDates.addAll(postCat1Dates);
            if (!postCat1Dates.isEmpty()) {
                generatedDates.addAll(generateFollowUpMeetings(LocalDate.parse(postCat1Dates.get(postCat1Dates.size()-1).get("date"))));
            }
            
            generatedDates.addAll(postCat2Dates);
            if (!postCat2Dates.isEmpty()) {
                generatedDates.addAll(generateFollowUpMeetings(LocalDate.parse(postCat2Dates.get(postCat2Dates.size()-1).get("date"))));
            }
            
            generatedDates.addAll(endSemDates);
            if (!endSemDates.isEmpty()) {
                generatedDates.addAll(generateFollowUpMeetings(LocalDate.parse(endSemDates.get(endSemDates.size()-1).get("date"))));
            }
            
            ObjectMapper mapper = new ObjectMapper();
            calendar.setGridDataJson(mapper.writeValueAsString(generatedDates));

            academicCalendarRepository.save(calendar);
            
            List<Department> depts = departmentRepository.findAll();
            if (depts.isEmpty()) {
                String[] defaultCodes = {"CCE", "CSBS", "CSE", "AIDS", "AIML", "VLSI", "ECE", "MECH", "BIOTECH", "H&S"};
                for (String code : defaultCodes) {
                    Department d = new Department();
                    d.setCode(code);
                    d.setName(code);
                    depts.add(d);
                }
            }

            // Dynamically create AuditSchedule entries for these phases
            List<AuditSchedule> allSchedules = auditScheduleRepository.findAll();
            createAutoScheduleIfMissing("FPP", "FPP Audit", fppDates, allSchedules, year, semester, depts);
            createAutoScheduleIfMissing("POST_CAT_1", "Post CAT 1 Audit", postCat1Dates, allSchedules, year, semester, depts);
            createAutoScheduleIfMissing("POST_CAT_2", "Post CAT 2 Audit", postCat2Dates, allSchedules, year, semester, depts);
            createAutoScheduleIfMissing("POST_CAT_3", "Post CAT 3 / End Sem Audit", endSemDates, allSchedules, year, semester, depts);
            return ResponseEntity.ok(Map.of(
                "message", "Academic Calendar published successfully!",
                "calendar", calendar
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Failed to publish Academic Calendar: " + e.getMessage()));
        }
    }

    @PostMapping("/academic-calendar/extract-dates")
    public ResponseEntity<?> extractCalendarDates(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> extracted = calendarOcrService.extractDatesFromCalendarFile(file);
            return ResponseEntity.ok(extracted);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Failed to extract dates: " + e.getMessage()));
        }
    }

    @PostMapping("/academic-calendar/upload-image")
    public ResponseEntity<?> uploadAcademicCalendarImage(@RequestParam("file") MultipartFile file) {
        return extractCalendarDates(file);
    }
}
