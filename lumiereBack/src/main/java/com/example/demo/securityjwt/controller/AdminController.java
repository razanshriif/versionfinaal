package com.example.demo.securityjwt.controller;

import com.example.demo.Entity.Notification;
import com.example.demo.Entity.Client;
import com.example.demo.Repository.NotificationRepository;
import com.example.demo.Service.EmailService;

import com.example.demo.Repository.UserRepository;
import com.example.demo.Entity.Status;
import com.example.demo.Entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin("*")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    private final UserRepository userRepository;
    private final com.example.demo.Repository.ClientRepository clientRepository;
    private final EmailService emailService;
    private final NotificationRepository notificationRepository;

    public AdminController(UserRepository userRepository,
            com.example.demo.Repository.ClientRepository clientRepository,
            EmailService emailService,
            NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.emailService = emailService;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(
            @org.springframework.security.core.annotation.AuthenticationPrincipal User currentUser) {
        logger.info("getAllUsers called by user: {} with role: {}", currentUser.getEmail(), currentUser.getRole());

        // ADMIN sees all users, COMMERCIAL sees only CLIENT users
        List<User> users;
        if (currentUser.isAdmin()) {
            users = userRepository.findAll();
            logger.info("ADMIN user - returning all {} users", users.size());
        } else if (currentUser.isCommercial()) {
            users = userRepository.findByRole(com.example.demo.Entity.Role.CLIENT);
            logger.info("COMMERCIAL user - returning {} CLIENT users", users.size());
        } else {
            // CLIENT users should not access this endpoint
            logger.warn("CLIENT user {} attempted to access admin endpoint", currentUser.getEmail());
            return ResponseEntity.status(403).build();
        }

        // Populate registrationApproved flag from the associated Client entity
        for (User u : users) {
            if (u.getRole() == com.example.demo.Entity.Role.CLIENT) {
                List<Client> clients = userRepository.findClientsByUserId(u.getId());
                if (clients != null && !clients.isEmpty()) {
                    Client c = clients.get(0);
                    u.setRegistrationApproved(c.isRegistrationApproved());
                    u.setLinkedClientId(c.getCode());
                }
            }
        }

        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/count/pending")
    public ResponseEntity<Long> countPendingUsers() {
        return ResponseEntity.ok(userRepository.countByStatus(Status.PENDING));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<User> updateUserStatus(@PathVariable Integer id, @RequestParam Status status) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        // Custom logic for CLIENT role: "Accepting" registration doesn't activate the
        // user yet
        if (user.getRole() == com.example.demo.Entity.Role.CLIENT && status == Status.ACTIVE) {
            List<Client> clients = userRepository.findClientsByUserId(id);
            if (clients != null && !clients.isEmpty()) {
                Client client = clients.get(0);
                client.setRegistrationApproved(true);
                clientRepository.save(client); // FIX: Save the client!
                // We keep User status as PENDING until profile is completed
                user.setStatus(Status.PENDING);
            }
        } else {
            user.setStatus(status);
        }

        userRepository.save(user);

        String fullName = user.getFirstname() + " " + user.getLastname();

        // Send email notification (non-blocking)
        try {
            if (status == Status.ACTIVE) {
                // If it's a client, the email should say "Registration Accepted" instead of
                // "Activated"
                if (user.getRole() == com.example.demo.Entity.Role.CLIENT) {
                    emailService.sendRegistrationAcceptedEmail(user.getEmail(), fullName);
                } else {
                    emailService.sendAccountActivatedEmail(user.getEmail(), fullName);
                }

                // Create in-app notification
                Notification notification = new Notification();
                notification.setType("ACCOUNT_APPROVED");
                notification.setMessage(
                        "✅ Inscription acceptée pour " + fullName + ". Complétez son profil pour l'activer.");
                notification.setRead(false);
                notificationRepository.save(notification);
            } else if (status == Status.REJECTED) {
                emailService.sendAccountRejectedEmail(user.getEmail(), fullName);
            }
        } catch (Exception e) {
            logger.error("Failed to send status update email to {}: {}", user.getEmail(), e.getMessage());
        }

        return ResponseEntity.ok(user);
    }

    @GetMapping("/status")
    public ResponseEntity<?> checkStatus(@RequestParam String email) {
        return userRepository.findFirstByEmailOrderByIdAsc(email)
                .map(user -> ResponseEntity.ok().body(
                        java.util.Map.of("status", user.getStatus(), "email", user.getEmail())))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/approve-client")
    public ResponseEntity<User> approveClient(
            @PathVariable Integer id,
            @RequestParam String codeClient,
            @RequestParam String idEdi) {
        logger.info("Approving client user ID: {} with code: {} and edi: {}", id, codeClient, idEdi);
        
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        // Find associated client
        List<Client> clients = userRepository.findClientsByUserId(id);
        if (clients == null || clients.isEmpty()) {
            throw new RuntimeException("No client record found for this user");
        }
        
        Client client = clients.get(0);
        client.setCodeclient(codeClient);
        client.setIdEdi(idEdi);
        client.setRegistrationApproved(true);
        client.setProfileCompleted(true);
        clientRepository.save(client);
        
        // Activate user
        user.setStatus(Status.ACTIVE);
        userRepository.save(user);
        
        String fullName = user.getFirstname() + " " + user.getLastname();
        try {
            emailService.sendRegistrationAcceptedEmail(user.getEmail(), fullName);
        } catch (Exception e) {
            logger.error("Failed to send approval email: {}", e.getMessage());
        }
        
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        logger.info("deleteUser called for ID: {}", id);
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            logger.info("User deleted successfully");
            return ResponseEntity.noContent().build();
        }
        logger.warn("User with ID: {} not found for deletion", id);
        return ResponseEntity.notFound().build();
    }
}
