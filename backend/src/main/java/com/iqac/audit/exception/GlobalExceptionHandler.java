package com.iqac.audit.exception;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private MessageSource messageSource;

    private String getMessage(String code, Object[] args, String defaultMessage) {
        try {
            Locale locale = LocaleContextHolder.getLocale();
            return messageSource.getMessage(code, args, defaultMessage, locale);
        } catch (Exception e) {
            return defaultMessage;
        }
    }

    @ExceptionHandler(CalendarProcessingException.class)
    public ResponseEntity<?> handleCalendarProcessingException(CalendarProcessingException ex) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("success", false);
        errorMap.put("timestamp", LocalDateTime.now());
        errorMap.put("status", HttpStatus.BAD_REQUEST.value());
        errorMap.put("message", ex.getMessage());
        return new ResponseEntity<>(errorMap, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("success", false);
        errorMap.put("timestamp", LocalDateTime.now());
        errorMap.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
        errorMap.put("message", "File size exceeds the maximum allowed upload size.");
        return new ResponseEntity<>(errorMap, HttpStatus.PAYLOAD_TOO_LARGE);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("timestamp", LocalDateTime.now());
        errorMap.put("status", HttpStatus.BAD_REQUEST.value());
        
        String msg = ex.getMessage();
        if (msg == null || msg.trim().isEmpty()) {
            msg = getMessage("error.general", null, "An unexpected error occurred.");
        }
        errorMap.put("message", msg);
        return new ResponseEntity<>(errorMap, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception ex) {
        ex.printStackTrace();
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("timestamp", LocalDateTime.now());
        errorMap.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        String msg = (ex.getMessage() != null && !ex.getMessage().trim().isEmpty()) ? ex.getMessage() : ex.toString();
        errorMap.put("message", msg);
        return new ResponseEntity<>(errorMap, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
