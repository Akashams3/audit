package com.iqac.audit.controller.file;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iqac.audit.dto.file.AcademicCalendarResponse;
import com.iqac.audit.exception.CalendarProcessingException;
import com.iqac.audit.service.file.AcademicCalendarService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AcademicCalendarController.class)
@AutoConfigureMockMvc(addFilters = false)
class AcademicCalendarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AcademicCalendarService calendarService;

    @MockBean
    private MessageSource messageSource;

    @Test
    void testUploadPdfSuccess() throws Exception {
        AcademicCalendarResponse mockResponse = new AcademicCalendarResponse();
        when(calendarService.processUpload(any())).thenReturn(mockResponse);

        MockMultipartFile file = new MockMultipartFile("file", "calendar.pdf", "application/pdf", "dummy content".getBytes());

        mockMvc.perform(multipart("/api/v1/academic-calendar/upload").file(file))
                .andExpect(status().isOk());
    }

    @Test
    void testUploadEmptyFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "", "application/pdf", new byte[0]);

        mockMvc.perform(multipart("/api/v1/academic-calendar/upload").file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUploadNonPdfFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "dummy".getBytes());
        when(calendarService.processUpload(any())).thenThrow(new CalendarProcessingException("Only PDF files are allowed"));

        mockMvc.perform(multipart("/api/v1/academic-calendar/upload").file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetAllCalendars() throws Exception {
        AcademicCalendarResponse mockResponse = new AcademicCalendarResponse();
        when(calendarService.getAll()).thenReturn(Arrays.asList(mockResponse));
        
        mockMvc.perform(get("/api/v1/academic-calendar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetCalendarById() throws Exception {
        AcademicCalendarResponse mockResponse = new AcademicCalendarResponse();
        when(calendarService.getById(1L)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/academic-calendar/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetCalendarByIdNotFound() throws Exception {
        when(calendarService.getById(1L)).thenThrow(new CalendarProcessingException("Calendar not found"));

        mockMvc.perform(get("/api/v1/academic-calendar/1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testDeleteCalendar() throws Exception {
        doNothing().when(calendarService).deleteById(1L);

        mockMvc.perform(delete("/api/v1/academic-calendar/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testDeleteCalendarNotFound() throws Exception {
        doThrow(new CalendarProcessingException("Not found")).when(calendarService).deleteById(1L);

        mockMvc.perform(delete("/api/v1/academic-calendar/1"))
                .andExpect(status().isBadRequest());
    }
}
