package com.iqac.audit.service.notification;

import com.iqac.audit.entity.audit.Feedback;
import com.iqac.audit.entity.notification.EmailLog;
import com.iqac.audit.entity.user.Director;
import com.iqac.audit.repository.notification.EmailLogRepository;


import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private EmailLogRepository emailLogRepository;

    @org.springframework.scheduling.annotation.Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        EmailLog log = new EmailLog();
        log.setRecipient(to);
        log.setSubject(subject);
        log.setBody(htmlContent);
        log.setSentAt(LocalDateTime.now());

        logger.info("Triggered email to: {}, Subject: {}", to, subject);

        try {
            if (mailSender != null) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                mailSender.send(message);
                log.setStatus("SENT");
                logger.info("Successfully sent email to {}", to);
            } else {
                logger.warn("JavaMailSender not configured or offline. Email logged to database only.");
                log.setStatus("MOCK_SENT");
            }
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
            log.setStatus("FAILED");
        }

        emailLogRepository.save(log);
    }

    public String buildReminderEmailHtml(String facultyName) {
        return "<html><body>" +
                "<h3 style='color: #a32a2a;'>IQAC Audit File Submission Reminder</h3>" +
                "<p>Dear " + facultyName + ",</p>" +
                "<p>This is a reminder from the IQAC Cell. Please upload your pending audit files before the deadline.</p>" +
                "<p>Best regards,<br/>IQAC Invigilator</p>" +
                "</body></html>";
    }

    public String buildSubmissionSuccessHtml(String facultyName, String fileName) {
        return "<html><body>" +
                "<h3 style='color: #4CAF50;'>IQAC File Submission Confirmation</h3>" +
                "<p>Dear " + facultyName + ",</p>" +
                "<p>Your file <strong>" + fileName + "</strong> has been successfully uploaded and registered in the system.</p>" +
                "<p>Best regards,<br/>IQAC System</p>" +
                "</body></html>";
    }

    public String buildFeedbackHtml(String facultyName, String fileName, String comment, String commentedBy) {
        return "<html><body>" +
                "<h3 style='color: #FF9800;'>New Director Feedback on File</h3>" +
                "<p>Dear " + facultyName + ",</p>" +
                "<p>You have received new feedback from <strong>" + commentedBy + "</strong> on your submitted file <strong>" + fileName + "</strong>:</p>" +
                "<blockquote style='border-left: 4px solid #a32a2a; padding-left: 10px; font-style: italic;'>" + comment + "</blockquote>" +
                "<p>Please review and take the necessary action.</p>" +
                "<p>Best regards,<br/>IQAC Cell</p>" +
                "</body></html>";
    }

    public String buildAuditorNotificationHtml(String departmentName) {
        return "<html><body>" +
                "<h3 style='color: #2196F3;'>IQAC Audit Submission Notice</h3>" +
                "<p>Dear Auditor,</p>" +
                "<p>All required files for the department <strong>" + departmentName + "</strong> have been submitted.</p>" +
                "<p>Please begin the audit process.</p>" +
                "<p>Best regards,<br/>IQAC Invigilator</p>" +
                "</body></html>";
    }
}