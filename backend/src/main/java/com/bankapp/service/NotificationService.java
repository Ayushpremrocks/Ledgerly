package com.bankapp.service;

import com.bankapp.dto.NotificationResponse;
import com.bankapp.exception.ApiException;
import com.bankapp.model.Notification;
import com.bankapp.model.User;
import com.bankapp.repository.NotificationRepository;
import com.bankapp.service.support.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CurrentUser currentUser;

    public NotificationService(NotificationRepository notificationRepository, CurrentUser currentUser) {
        this.notificationRepository = notificationRepository;
        this.currentUser = currentUser;
    }

    /** Called by other services whenever something worth telling the user happens. */
    public void notify(User user, Notification.Kind kind, String title, String message) {
        Notification n = new Notification();
        n.setUser(user);
        n.setKind(kind);
        n.setTitle(title);
        n.setMessage(message);
        n.setRead(false);
        notificationRepository.save(n);
    }

    public List<NotificationResponse> list() {
        User user = currentUser.get();
        return notificationRepository.findTop30ByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(n -> new NotificationResponse(n.getId(), n.getKind().name(), n.getTitle(),
                        n.getMessage(), Boolean.TRUE.equals(n.getRead()), n.getCreatedAt()))
                .toList();
    }

    public long unreadCount() {
        return notificationRepository.countByUserIdAndReadFalse(currentUser.get().getId());
    }

    @Transactional
    public void markRead(Long id) {
        Notification n = notificationRepository.findByIdAndUserId(id, currentUser.get().getId())
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        n.setRead(true);
    }

    @Transactional
    public void markAllRead() {
        notificationRepository.markAllRead(currentUser.get().getId());
    }
}
