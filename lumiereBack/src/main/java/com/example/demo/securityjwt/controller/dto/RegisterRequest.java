package com.example.demo.securityjwt.controller.dto;

import com.example.demo.Entity.Role;

public record RegisterRequest(
        Integer id,
        String firstname, 
        String lastname, 
        String email, 
        String password, 
        Role role,
        String civilite,
        String telephone,
        String adresse,
        String ville,
        String pays,
        Integer codepostal,
        String type,
        String societeFacturation
) {
}
