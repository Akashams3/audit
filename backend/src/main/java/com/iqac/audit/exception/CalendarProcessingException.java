package com.iqac.audit.exception;

public class CalendarProcessingException extends RuntimeException {
    public CalendarProcessingException(String message) {
        super(message);
    }
    public CalendarProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
