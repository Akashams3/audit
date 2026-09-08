package com.iqac.audit.controller.notification;

import com.iqac.audit.entity.notification.Notification;
import com.iqac.audit.entity.user.User;
import com.iqac.audit.repository.user.UserRepository;
import com.iqac.audit.service.notification.NotificationService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(principal)
                .or(() -> userRepository.findByEmail(principal))
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        User user = getAuthenticatedUser();
        List<Notification> list = notificationService.getNotificationsForUser(user.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        User user = getAuthenticatedUser();
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Collections.singletonMap("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        User user = getAuthenticatedUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Collections.singletonMap("message", "All notifications marked as read"));
    }
}