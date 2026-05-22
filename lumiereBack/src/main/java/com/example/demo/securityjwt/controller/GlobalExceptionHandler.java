package com.example.demo.securityjwt.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        String msg = e.getMessage();
        if (msg != null && (
                msg.contains("ACCES_REFUSE") ||
                msg.contains("ACCOUNT_PENDING") ||
                msg.contains("ACCOUNT_REJECTED") ||
                msg.contains("Utilisateur non trouvé") ||
                msg.contains("Aucun compte n'est associé") ||
                msg.contains("Code de vérification invalide")
           )) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", msg));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", msg != null ? msg : "Internal Server Error"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentialsException(BadCredentialsException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Email ou mot de passe incorrect"));
    }
}
