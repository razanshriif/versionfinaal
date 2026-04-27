package com.example.demo.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.Notification;
import com.example.demo.Repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getAllNotifications(Integer userId, com.example.demo.Entity.Role role) {
        if (userId != null && role != null) {
            return notificationRepository.findForUser(userId, role);
        }
        return notificationRepository.findAll();
    }

    public Optional<Notification> getNotificationById(Long id) {
        return notificationRepository.findById(id);
    }

    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }

    public Notification updateNotification(Long id, Notification updatedNotification) {
        Optional<Notification> optionalNotification = notificationRepository.findById(id);
        if (optionalNotification.isPresent()) {
            Notification existingNotification = optionalNotification.get();
            existingNotification.setMessage(updatedNotification.getMessage());
            existingNotification.setType(updatedNotification.getType());
            existingNotification.setRead(updatedNotification.isRead());
            return notificationRepository.save(existingNotification);
        }
        return null;
    }

    public List<Notification> getUnreadNotifications(Integer userId, com.example.demo.Entity.Role role) {
        if (userId != null && role != null) {
            List<Notification> targeted = notificationRepository.findForUser(userId, role);
            return targeted.stream().filter(n -> !n.isRead()).toList();
        }
        return notificationRepository.findByIsReadFalse();
    }

    public long getUnreadCount(Integer userId, com.example.demo.Entity.Role role) {
        return getUnreadNotifications(userId, role).size();
    }

    public boolean markAsRead(Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification notification = opt.get();
            notification.setRead(true);
            notificationRepository.save(notification);
            return true;
        }
        return false;
    }

    public void markAllAsRead() {
        List<Notification> unread = notificationRepository.findByIsReadFalse();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void deleteAllRead() {
        List<Notification> all = notificationRepository.findAll();
        List<Notification> read = all.stream().filter(Notification::isRead).toList();
        notificationRepository.deleteAll(read);
    }

    public boolean deleteNotification(Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            notificationRepository.delete(opt.get());
            return true;
        }
        return false;
    }
}