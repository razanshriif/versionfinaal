package com.example.demo.Service;

import com.example.demo.Entity.*;
import com.example.demo.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpStatusCodeException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ChatbotService {
    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);

    @Autowired
    private OrdreRepository ordreRepository;

    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private ArticleRepository articleRepository;
    @Autowired
    private TranckRepository tranckRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model}")
    private String geminiModel;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.model:}")
    private String groqModel;

    @Value("${chatbot.provider:gemini}")
    private String provider;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    public String getChatResponse(String userMessage, String userEmail, String platform) {
        return getChatResponseWithHistory(userMessage, null, userEmail, platform);
    }

    public String getChatResponseWithHistory(String userMessage, List<Map<String, String>> history, String userEmail, String platform) {
        String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String systemPrompt = "Tu es 'Otflow Smart Assist', une IA conversationnelle d'élite de niveau GPT-4. " +
                             "IMPORTANT: Tu es un humain professionnel, pas un robot. " +
                             "RÈGLE CRITIQUE #1 (SALUTATIONS): Si l'utilisateur te dit 'Bonjour', 'Salut', 'Aslema', ou toute autre salutation sans demande précise, réponds UNIQUEMENT par une salutation chaleureuse (ex: 'Bonjour ! Comment puis-je vous aider dans vos transports aujourd'hui ?'). NE DÉCLENCHE AUCUN OUTIL. Ne liste pas les ordres. Ne donne pas de stats. C'est une faute grave de donner des infos non demandées. " +
                             "RÈGLE CRITIQUE #2 (PAS DE CODE): Ne mentionne JAMAIS de balises comme <function> ou des noms d'outils dans ton texte. " +
                             "CONNAISSANCE DE L'APP: Tu connais les onglets ACCUEIL (stats), ORDRES (Brouillons, En attente, Confirmés), SUIVI (Carte), et PROFIL. " +
                             "LANGUE: Parle la langue de l'utilisateur. S'il parle Darija tunisienne, réponds chaleureusement en Darija. " +
                             "OUTILS: list_my_orders, get_order_details, create_reminder, create_order_draft, find_orders_by_client_name, get_fleet_stats, search_article. " +
                             "RESTE DISCRET: Tu es un expert. Un expert n'étale pas sa science sans qu'on lui demande.";

        if ("groq".equalsIgnoreCase(provider)) {
            return callGroq(userMessage, history, systemPrompt, userEmail, platform);
        } else {
            return callGemini(userMessage, history, systemPrompt, userEmail, platform);
        }
    }

    private String callGemini(String userMessage, List<Map<String, String>> history, String systemPrompt, String userEmail, String platform) {
        String url = String.format(GEMINI_API_URL, geminiModel, geminiApiKey);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();

        // Add history if present
        if (history != null) {
            for (Map<String, String> msg : history) {
                Map<String, Object> turn = new HashMap<>();
                turn.put("role", "user".equals(msg.get("role")) ? "user" : "model");
                turn.put("parts", Collections.singletonList(Collections.singletonMap("text", msg.get("content"))));
                contents.add(turn);
            }
        }

        Map<String, Object> userContent = new HashMap<>();
        userContent.put("role", "user");
        userContent.put("parts", Collections.singletonList(Collections.singletonMap("text", systemPrompt + "\n\nMessage: " + userMessage)));
        contents.add(userContent);
        requestBody.put("contents", contents);
        requestBody.put("tools", getGeminiTools(platform));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
            Map<String, Object> firstCandidate = (Map<String, Object>) ((List) response.get("candidates")).get(0);
            Map<String, Object> modelContent = (Map<String, Object>) firstCandidate.get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) modelContent.get("parts");

            if (parts != null && !parts.isEmpty() && parts.get(0).containsKey("functionCall")) {
                Map<String, Object> functionCall = (Map<String, Object>) parts.get(0).get("functionCall");
                String functionName = (String) functionCall.get("name");
                Map<String, Object> args = (Map<String, Object>) functionCall.get("args");

                log.info("Gemini requested tool: {} with args: {}", functionName, args);
                Object result = executeTool(functionName, args, userEmail, platform);
                log.info("Tool result: {}", result);

                // Si c'est un message de refus (web), on le retourne directement sans 2ème tour
                if (result instanceof String && ((String) result).startsWith("D\u00e9sol\u00e9")) {
                    return (String) result;
                }

                List<Map<String, Object>> followUpContents = new ArrayList<>(contents);
                followUpContents.add(modelContent);

                Map<String, Object> functionResponseTurn = new HashMap<>();
                functionResponseTurn.put("role", "function");
                Map<String, Object> functionPart = new HashMap<>();
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("name", functionName);
                responseData.put("response", Collections.singletonMap("content", result));
                functionPart.put("functionResponse", responseData);
                functionResponseTurn.put("parts", Collections.singletonList(functionPart));
                followUpContents.add(functionResponseTurn);

                requestBody.put("contents", followUpContents);
                HttpEntity<Map<String, Object>> followUpRequest = new HttpEntity<>(requestBody, headers);
                
                log.info("Sending follow-up turn to Gemini...");
                Map<String, Object> finalResponse = restTemplate.postForObject(url, followUpRequest, Map.class);
                return extractTextFromGemini(finalResponse);
            }

            return extractTextFromGemini(response);
        } catch (HttpStatusCodeException e) {
            log.error("Gemini API Error ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                return "Désolé, la limite de messages gratuite a été atteinte (Quota Gemini).";
            }
            return "Erreur Gemini : " + e.getResponseBodyAsString();
        } catch (Exception e) {
            log.error("General error in Gemini call: ", e);
            return "Désolé, erreur technique avec Gemini : " + e.getMessage();
        }
    }

    private String callGroq(String userMessage, List<Map<String, String>> history, String systemPrompt, String userEmail, String platform) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", groqModel);
        
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        
        // Add history if present
        if (history != null) {
            for (Map<String, String> msg : history) {
                messages.add(Map.of("role", msg.get("role"), "content", msg.get("content")));
            }
        }

        messages.add(Map.of("role", "user", "content", userMessage));
        requestBody.put("messages", messages);
        requestBody.put("tools", getGroqTools(platform));
        requestBody.put("tool_choice", "auto");
        requestBody.put("temperature", 0.1); // Lower temperature for more consistent tool calling

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(GROQ_API_URL, request, Map.class);
            List choices = (List) response.get("choices");
            Map firstChoice = (Map) choices.get(0);
            Map message = (Map) firstChoice.get("message");

            if (message.containsKey("tool_calls")) {
                List toolCalls = (List) message.get("tool_calls");
                Map firstCall = (Map) toolCalls.get(0);
                Map function = (Map) firstCall.get("function");
                String functionName = (String) function.get("name");
                
                // Parse args from JSON string (Groq/OpenAI format)
                String argsJson = (String) function.get("arguments");
                Map<String, Object> args = new HashMap<>();
                if (argsJson != null && !argsJson.trim().isEmpty() && !argsJson.equals("{}")) {
                    try {
                        args = new com.fasterxml.jackson.databind.ObjectMapper().readValue(argsJson, Map.class);
                    } catch (Exception e) {
                        log.error("Error parsing Groq tool arguments: {}", argsJson, e);
                    }
                }
                if (args == null) args = new HashMap<>();

                log.info("Groq requested tool: {} with args: {}", functionName, args);
                Object result = executeTool(functionName, args, userEmail, platform);
                log.info("Tool result: {}", result);

                // Si c'est un message de refus (web), on le retourne directement sans 2ème tour
                if (result instanceof String && ((String) result).startsWith("D\u00e9sol\u00e9")) {
                    return (String) result;
                }

                // Second Turn for Groq
                List<Map<String, Object>> followUpMessages = new ArrayList<>(messages);
                followUpMessages.add(message);
                
                Map<String, Object> toolResponse = new HashMap<>();
                toolResponse.put("role", "tool");
                toolResponse.put("tool_call_id", firstCall.get("id"));
                toolResponse.put("name", functionName);
                toolResponse.put("content", String.valueOf(result));
                followUpMessages.add(toolResponse);

                requestBody.put("messages", followUpMessages);
                HttpEntity<Map<String, Object>> followUpRequest = new HttpEntity<>(requestBody, headers);
                
                log.info("Sending follow-up turn to Groq...");
                Map<String, Object> finalResponse = restTemplate.postForObject(GROQ_API_URL, followUpRequest, Map.class);
                String finalResult = extractTextFromGroq(finalResponse);
                
                if (finalResult == null || finalResult.trim().isEmpty() || finalResult.contains("pas pu générer")) {
                    return "Voici les informations trouvées :\n" + result;
                }
                return finalResult;
            }

            return extractTextFromGroq(response);
        } catch (HttpStatusCodeException e) {
            log.error("Groq API Error ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "Erreur Groq : " + e.getResponseBodyAsString();
        } catch (Exception e) {
            log.error("General error in Groq call: ", e);
            return "Désolé, erreur technique avec Groq : " + e.getMessage();
        }
    }

    private List<Map<String, Object>> getGeminiTools(String platform) {
        List<Map<String, Object>> tools = new ArrayList<>();
        // Note: Gemini uses function_declarations wrapper
        tools.add(Map.of("function_declarations", getBaseTools(platform)));
        return tools;
    }
 
    private List<Map<String, Object>> getGroqTools(String platform) {
        List<Map<String, Object>> tools = new ArrayList<>();
        // Note: Groq/OpenAI uses a list of tool objects with type "function"
        for (Map<String, Object> tool : getBaseTools(platform)) {
            tools.add(Map.of("type", "function", "function", tool));
        }
        return tools;
    }
 
    private List<Map<String, Object>> getBaseTools(String platform) {
        List<Map<String, Object>> tools = new ArrayList<>();
 
        // Tool: get_order_details
        Map<String, Object> getOrder = new HashMap<>();
        getOrder.put("name", "get_order_details");
        getOrder.put("description", "Suivre un ORDRE DE TRANSPORT précis via une référence technique/numérique.");
        getOrder.put("parameters", Map.of(
            "type", "object",
            "properties", Map.of("order_ref", Map.of("type", "string")),
            "required", List.of("order_ref")
        ));
        tools.add(getOrder);

        // Tool: list_my_clients
        Map<String, Object> listClients = new HashMap<>();
        listClients.put("name", "list_my_clients");
        listClients.put("description", "Lister tous les clients que je gère");
        listClients.put("parameters", Map.of("type", "object", "properties", new HashMap<>()));
        tools.add(listClients);
 
        // Tool: list_my_orders
        Map<String, Object> listOrders = new HashMap<>();
        listOrders.put("name", "list_my_orders");
        listOrders.put("description", "Lister mes ordres de transport récents. Peut filtrer par statut.");
        listOrders.put("parameters", Map.of(
            "type", "object",
            "properties", Map.of("status", Map.of("type", "string", "description", "Statut à filtrer (ex: NON_PLANIFIE, NON_CONFIRME)")),
            "required", List.of()
        ));
        tools.add(listOrders);

        // Tool: find_orders_by_client_name
        Map<String, Object> searchByClient = new HashMap<>();
        searchByClient.put("name", "find_orders_by_client_name");
        searchByClient.put("description", "Rechercher des ordres via le NOM d'un client (ex: Gias, Tunis Air).");
        searchByClient.put("parameters", Map.of(
            "type", "object",
            "properties", Map.of("client_name", Map.of("type", "string")),
            "required", List.of("client_name")
        ));
        tools.add(searchByClient);

        // Tool: get_fleet_stats
        Map<String, Object> stats = new HashMap<>();
        stats.put("name", "get_fleet_stats");
        stats.put("description", "Obtenir les statistiques globales (combien d'ordres par statut).");
        stats.put("parameters", Map.of("type", "object", "properties", new HashMap<>()));
        tools.add(stats);

        // Tool: search_clients_by_location
        Map<String, Object> searchLoc = new HashMap<>();
        searchLoc.put("name", "search_clients_by_location");
        searchLoc.put("description", "Rechercher mes clients dans une ville spécifique.");
        searchLoc.put("parameters", Map.of(
            "type", "object",
            "properties", Map.of("location", Map.of("type", "string")),
            "required", List.of("location")
        ));
        tools.add(searchLoc);

        // Tool: search_article
        Map<String, Object> searchArt = new HashMap<>();
        searchArt.put("name", "search_article");
        searchArt.put("description", "Rechercher un article. Laisse la requête vide pour tout lister.");
        searchArt.put("parameters", Map.of(
            "type", "object",
            "properties", Map.of("query", Map.of("type", "string", "description", "Nom ou code de l'article (optionnel)")),
            "required", List.of()
        ));
        tools.add(searchArt);

        // Tool: get_tracking_history
        Map<String, Object> trackHist = new HashMap<>();
        trackHist.put("name", "get_tracking_history");
        trackHist.put("description", "Obtenir l'historique détaillé des événements d'un ordre.");
        trackHist.put("parameters", Map.of(
            "type", "object",
            "properties", Map.of("order_ref", Map.of("type", "string")),
            "required", List.of("order_ref")
        ));
        tools.add(trackHist);

        // Tool: get_my_data_summary
        Map<String, Object> summary = new HashMap<>();
        summary.put("name", "get_my_data_summary");
        summary.put("description", "Obtenir un résumé global de mes données (Clients, Ordres, Articles).");
        summary.put("parameters", Map.of("type", "object", "properties", new HashMap<>()));
        tools.add(summary);

        // Tool: create_reminder
        Map<String, Object> createReminder = new HashMap<>();
        createReminder.put("name", "create_reminder");
        createReminder.put("description", "Créer un rappel personnel, une note ou une tâche (ex: Rappelle moi de charger demain).");
        createReminder.put("parameters", Map.of(
            "type", "object",
            "properties", Map.of(
                "text", Map.of("type", "string", "description", "Le contenu du rappel"),
                "time", Map.of("type", "string", "description", "L'heure ou date du rappel (ex: demain à 10h)")
            ),
            "required", List.of("text", "time")
        ));
        tools.add(createReminder);

        // Tool: create_order_draft
        Map<String, Object> createDraft = new HashMap<>();
        createDraft.put("name", "create_order_draft");
        createDraft.put("description", "Créer un brouillon d'ordre de transport.");
        createDraft.put("parameters", Map.of(
            "type", "object",
            "properties", Map.of(
                "client", Map.of("type", "string"),
                "destination", Map.of("type", "string"),
                "quantity", Map.of("type", "string"),
                "details", Map.of("type", "string")
            ),
            "required", List.of("client", "destination", "quantity")
        ));
        tools.add(createDraft);

        return tools;
    }

    private Object executeTool(String name, Map<String, Object> args, String userEmail, String platform) {
        if (args == null) args = new HashMap<>();
        if (userEmail == null) return "User unidentified.";
        Optional<User> userOpt = userRepository.findFirstByEmailOrderByIdAsc(userEmail);
        if (userOpt.isEmpty()) return "User not found in DB.";
        User user = userOpt.get();

        switch (name) {
            case "get_order_details":
                String ref = (String) args.get("order_ref");
                List<Ordre> ordersByVoycle = ordreRepository.findByVoycle(ref);
                Optional<Ordre> order = ordersByVoycle.isEmpty() ? Optional.empty() : Optional.of(ordersByVoycle.get(0));
                if (order.isEmpty()) order = ordreRepository.findByOrderNumber(ref);
                
                if (order.isPresent()) {
                    Ordre o = order.get();
                    return String.format("Détails Ordre %s:\n" +
                           "• Statut: %s\n" +
                           "• Client: %s\n" +
                           "• Trajet: %s → %s\n" +
                           "• Marchandise: %s (%s)\n" +
                           "• Quantité: %d colis, %d palettes, %.2f kg\n" +
                           "• Transport: Camion %s, Chauffeur %s (%s)",
                           o.getOrderNumber(), o.getStatut(), o.getNomclient(),
                           o.getChargementVille(), o.getLivraisonVille(),
                           o.getDesignation(), o.getCodeArticle(),
                           o.getNombreColis() != null ? o.getNombreColis() : 0,
                           o.getNombrePalettes() != null ? o.getNombrePalettes() : 0,
                           o.getPoids() != null ? o.getPoids() : 0.0,
                           o.getCamion() != null ? o.getCamion() : "N/A",
                           o.getChauffeur() != null ? o.getChauffeur() : "N/A",
                           o.getTelchauffeur() != null ? o.getTelchauffeur() : "N/A");
                }
                return "Référence '" + ref + "' introuvable.";

            case "list_my_clients":
                List<Client> clients = clientRepository.findByOwner(user);
                if (clients.isEmpty()) return "No clients found for you.";
                StringBuilder res = new StringBuilder("Voici vos clients actifs :\n");
                for (Client c : clients) res.append("• ").append(c.getNom()).append("\n");
                return res.toString();
 
            case "list_my_orders":
                List<Client> myClients = clientRepository.findByOwner(user);
                List<String> codes = myClients.stream().map(Client::getCodeclient).filter(Objects::nonNull).toList();
                
                String statusFilter = (String) args.get("status");
                List<Ordre> orders;

                if (user.isStaff() || codes.isEmpty()) {
                    // Accès global pour le staff ou si aucun client lié (permission étendue)
                    if (statusFilter != null && !statusFilter.isEmpty()) {
                        orders = ordreRepository.findAll((root, query, cb) -> 
                            cb.equal(root.get("statut"), Statut.valueOf(statusFilter.toUpperCase()))
                        );
                    } else {
                        orders = ordreRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
                    }
                } else {
                    // Filtrage par clients rattachés
                    if (statusFilter != null && !statusFilter.isEmpty()) {
                        orders = ordreRepository.findAll((root, query, cb) -> 
                            cb.and(root.get("client").in(codes), cb.equal(root.get("statut"), Statut.valueOf(statusFilter.toUpperCase())))
                        );
                    } else {
                        orders = ordreRepository.findRecentOrdersByClientCodes(codes, org.springframework.data.domain.PageRequest.of(0, 10));
                    }
                }

                if (orders.isEmpty()) return "Aucun ordre trouvé" + (statusFilter != null ? " avec le statut " + statusFilter : "") + ".";
                
                StringBuilder ordersRes = new StringBuilder("Voici les ordres trouvés :\n");
                for (Ordre o : orders.stream().limit(10).toList()) {
                    ordersRes.append("• ").append(o.getOrderNumber())
                             .append(" (").append(o.getStatut()).append(")")
                             .append(" - ").append(o.getChargementNom() != null ? o.getChargementNom() : o.getClient())
                             .append(" vers ").append(o.getLivraisonVille()).append("\n");
                }
                return ordersRes.toString();

            case "find_orders_by_client_name":
                String clientNameSearch = (String) args.get("client_name");
                List<Ordre> found = ordreRepository.findAll((root, query, cb) -> 
                    cb.or(
                        cb.like(cb.lower(root.get("chargementNom")), "%" + clientNameSearch.toLowerCase() + "%"),
                        cb.like(cb.lower(root.get("livraisonNom")), "%" + clientNameSearch.toLowerCase() + "%"),
                        cb.like(cb.lower(root.get("nomclient")), "%" + clientNameSearch.toLowerCase() + "%")
                    )
                );
                if (found.isEmpty()) return "Aucun ordre trouvé pour le client '" + clientNameSearch + "'.";
                StringBuilder searchRes = new StringBuilder("Ordres trouvés pour '" + clientNameSearch + "' :\n");
                for (Ordre o : found.stream().limit(10).toList()) {
                    searchRes.append("• ").append(o.getOrderNumber()).append(" (").append(o.getStatut()).append(") - Vers: ").append(o.getLivraisonVille()).append("\n");
                }
                return searchRes.toString();

            case "get_fleet_stats":
                List<Client> statsClients = clientRepository.findByOwner(user);
                List<String> statsCodes = statsClients.stream().map(Client::getCodeclient).filter(Objects::nonNull).toList();
                
                StringBuilder statsSb = new StringBuilder("Tableau de bord actuel :\n");
                for (Statut s : Statut.values()) {
                    long count;
                    if (user.isStaff() || statsCodes.isEmpty()) {
                        count = ordreRepository.countByStatut(s);
                    } else {
                        count = ordreRepository.countByClientCodesAndStatut(statsCodes, s);
                    }
                    if (count > 0) statsSb.append("• ").append(s).append(" : ").append(count).append("\n");
                }
                return statsSb.toString();

            case "search_clients_by_location":
                String loc = (String) args.get("location");
                List<Client> locClients = clientRepository.findByOwner(user).stream()
                    .filter(c -> (c.getVille() != null && c.getVille().equalsIgnoreCase(loc)) || 
                                 (c.getPays() != null && c.getPays().equalsIgnoreCase(loc)))
                    .toList();
                if (locClients.isEmpty()) return "Aucun client trouvé à " + loc + ".";
                StringBuilder locSb = new StringBuilder("Clients à " + loc + " :\n");
                for (Client c : locClients) locSb.append("• ").append(c.getNom()).append(" (").append(c.getCodeclient()).append(")\n");
                return locSb.toString();

            case "search_article":
                String artQuery = (String) args.get("query");
                List<Article> articles;
                if (artQuery == null || artQuery.trim().isEmpty() || artQuery.toLowerCase().contains("tous") || artQuery.toLowerCase().contains("liste")) {
                    articles = articleRepository.findAll().stream().limit(15).toList();
                } else {
                    articles = articleRepository.findAll().stream()
                        .filter(a -> (a.getLabel() != null && a.getLabel().toLowerCase().contains(artQuery.toLowerCase())) ||
                                     (a.getCodeArticle() != null && a.getCodeArticle().toLowerCase().contains(artQuery.toLowerCase())))
                        .limit(10).toList();
                }
                if (articles.isEmpty()) return "Aucun article trouvé pour '" + (artQuery != null ? artQuery : "votre requête") + "'.";
                StringBuilder artSb = new StringBuilder("Voici les articles disponibles :\n");
                for (Article a : articles) artSb.append("• ").append(a.getLabel()).append(" (").append(a.getCodeArticle()).append(") - ").append(a.getUnite()).append("\n");
                return artSb.toString();

            case "get_tracking_history":
                String tRef = (String) args.get("order_ref");
                Optional<Ordre> tOrder = ordreRepository.findByOrderNumber(tRef);
                if (tOrder.isEmpty()) return "Ordre introuvable.";
                Set<String> events = tOrder.get().getEvents();
                if (events == null || events.isEmpty()) return "Aucun événement de suivi pour cet ordre.";
                StringBuilder trackSb = new StringBuilder("Historique de suivi pour " + tRef + " :\n");
                for (String e : events) trackSb.append("• ").append(e).append("\n");
                return trackSb.toString();

            case "get_my_data_summary":
                List<Client> sumClients = clientRepository.findByOwner(user);
                List<String> sumCodes = sumClients.stream().map(Client::getCodeclient).filter(Objects::nonNull).toList();
                long orderCount = sumCodes.isEmpty() ? 0 : ordreRepository.countByClientCodes(sumCodes);
                long artCount = articleRepository.count();
                return String.format("Résumé de votre compte :\n" +
                       "• Clients: %d actifs\n" +
                       "• Ordres: %d au total\n" +
                       "• Articles: %d référencés",
                       sumClients.size(), orderCount, artCount);

            case "create_reminder":
                String text = (String) args.get("text");
                String timeStr = (String) args.get("time");
                Notification note = new Notification();
                note.setType("RAPPEL");
                note.setMessage("📅 Rappel: " + text + " (Prévu pour: " + timeStr + ")");
                notificationRepository.save(note);
                return "Rappel créé avec succès: '" + text + "' pour " + timeStr;

            case "create_order_draft":
                Ordre draft = new Ordre();
                draft.setChargementNom((String) args.get("client"));
                draft.setLivraisonNom((String) args.get("destination"));
                draft.setDesignation((String) args.get("details"));
                try {
                    String qty = (String) args.get("quantity");
                    if (qty != null) draft.setNombrePalettes(Integer.parseInt(qty.replaceAll("[^0-9]", "")));
                } catch (Exception e) {}
                draft.setStatut(Statut.NON_CONFIRME);
                draft.setOrderNumber("IA-" + System.currentTimeMillis() / 1000);
                ordreRepository.save(draft);
                return "Brouillon créé avec succès: ID " + draft.getOrderNumber() + " (" + draft.getChargementNom() + " vers " + draft.getLivraisonNom() + ")";

            default: return "Unknown tool";
        }
    }

    private String extractTextFromGemini(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (parts != null && !parts.isEmpty()) return (String) parts.get(0).get("text");
            }
        } catch (Exception e) {}
        return "Je n'ai pas pu générer de réponse Gemini.";
    }

    private String extractTextFromGroq(Map<String, Object> response) {
        try {
            List choices = (List) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map choice = (Map) choices.get(0);
                Map message = (Map) choice.get("message");
                String content = (String) message.get("content");
                return (content != null) ? content : "";
            }
        } catch (Exception e) {
            log.error("Error extracting Groq text", e);
        }
        return "";
    }
}
