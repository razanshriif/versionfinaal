package com.example.demo.securityjwt.controller.dto;

public record ResetPasswordRequest(String email, String code, String newPassword) {}
