package com.example.demo.Controller;

import com.example.demo.Service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chatbot")
@CrossOrigin("*")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/message")
    public Map<String, String> getMessage(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            String userMessage = (String) request.get("message");
            String platform = (String) request.getOrDefault("platform", "unknown");
            List<Map<String, String>> history = (List<Map<String, String>>) request.get("history");
            String userEmail = (principal != null) ? principal.getName() : null;
            
            String botResponse = chatbotService.getChatResponseWithHistory(userMessage, history, userEmail, platform);
            
            Map<String, String> response = new HashMap<>();
            response.put("response", botResponse);
            return response;
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("response", "Assistant indisponible actuellement. Erreur: " + e.getMessage());
            return errorResponse;
        }
    }
}
