package com.example.demo.securityjwt.controller;

import com.example.demo.securityjwt.controller.dto.AuthenticationRequest;
import com.example.demo.securityjwt.controller.dto.AuthenticationResponse;
import com.example.demo.securityjwt.service.AuthenticationService;
import com.example.demo.securityjwt.controller.dto.RegisterRequest;
import com.example.demo.Entity.User;
import com.example.demo.Repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.example.demo.Service.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin("*")
public record AuthController(AuthenticationService authenticationService, UserRepository userRepository, EmailService emailService, PasswordEncoder passwordEncoder) {

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(authenticationService.authenticate(request));
    }

    @PutMapping("/update")
    public ResponseEntity<User> updateUser(@RequestBody RegisterRequest request) {

        User user = userRepository.findById(request.id()).orElseThrow(() -> new RuntimeException("User not found"));

        // Mettre à jour les informations de l'utilisateur
        user.setFirstname(request.firstname());
        user.setLastname(request.lastname());
        user.setEmail(request.email());

        // Sauvegarder les changements
        userRepository.save(user);

        return ResponseEntity.ok(user);
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        if (email == null || email.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        return userRepository.findFirstByEmailOrderByIdAsc(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());

    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email est requis"));
        }
        
        User user = userRepository.findFirstByEmailOrderByIdAsc(email).orElse(null);
        if (user == null) {
            // Pour des raisons de sécurité, nous ne révélons pas si l'utilisateur existe ou non
            return ResponseEntity.ok(Map.of("message", "Si cette adresse existe, un code vous a été envoyé."));
        }

        // generate 6 digit code
        String code = String.format("%06d", new Random().nextInt(999999));
        user.setResetPasswordCode(code);
        userRepository.save(user);

        emailService.sendPasswordResetEmail(email, code);

        return ResponseEntity.ok(Map.of("message", "Si cette adresse existe, un code vous a été envoyé."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email, code et nouveau mot de passe sont requis."));
        }

        User user = userRepository.findFirstByEmailOrderByIdAsc(email).orElse(null);
        if (user == null || user.getResetPasswordCode() == null || !user.getResetPasswordCode().equals(code)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Code invalide."));
        }

        // reset the password
        user.setPasswd(passwordEncoder.encode(newPassword));
        user.setResetPasswordCode(null); // clear the code
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès."));
    }

    @GetMapping("/profileALL")
    public List<User> getALLProfile() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> {
            if (!u.getOwnedClients().isEmpty()) {
                com.example.demo.Entity.Client firstClient = u.getOwnedClients().get(0);
                u.setRegistrationApproved(firstClient.isRegistrationApproved());
                u.setLinkedClientId(firstClient.getCode());
            }
        });
        return users;
    }
}
