package com.example.demo.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.Ordre;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.text.SimpleDateFormat;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            // Note: Gmail may ignore this if it doesn't match the authenticated user
            message.setFrom("commercial.lumiere@lumiere.tn");
            mailSender.send(message);
            System.out.println("Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("Error sending email to " + to + ": " + e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendRegistrationEmail(String to, String name) {
        String subject = "Confirmation d'inscription";
        String title = "Confirmation d'inscription";
        String message = "Bonjour <b>" + name + "</b>,<br><br>" +
                "Votre demande d'inscription a bien été reçue. Elle est actuellement en attente de validation par un administrateur.<br>"
                +
                "Vous recevrez un email dès que votre compte sera activé.";

        String htmlContent = generateGenericHtml(title, message, "Accéder au site");
        try {
            sendHtmlEmailWithLogo(to, subject, htmlContent);
        } catch (MessagingException e) {
            System.err.println("Failed to send registration email to " + to + ": " + e.getMessage());
        }
    }

    public void sendAccountActivatedEmail(String to, String name) {
        String subject = "Compte activé";
        String title = "Félicitations ! Votre compte est actif";
        String message = "Bonjour <b>" + name + "</b>,<br><br>" +
                "Votre compte a été activé par un administrateur.<br>" +
                "Vous pouvez désormais vous connecter à l'application.";

        String htmlContent = generateGenericHtml(title, message, "Se connecter");
        try {
            sendHtmlEmailWithLogo(to, subject, htmlContent);
        } catch (MessagingException e) {
            System.err.println("Failed to send activation email to " + to + ": " + e.getMessage());
        }
    }

    public void sendRegistrationAcceptedEmail(String to, String name) {
        String subject = "Inscription acceptée";
        String title = "Bonne nouvelle ! Inscription acceptée";
        String message = "Bonjour <b>" + name + "</b>,<br><br>" +
                "Votre demande d'inscription a été acceptée par notre équipe commerciale.<br>" +
                "Un administrateur ou un commercial va maintenant compléter votre profil client pour activer définitivement votre accès.";

        String htmlContent = generateGenericHtml(title, message, "Voir mon profil");
        try {
            sendHtmlEmailWithLogo(to, subject, htmlContent);
        } catch (MessagingException e) {
            System.err.println("Failed to send acceptance email to " + to + ": " + e.getMessage());
        }
    }

    public void sendAccountRejectedEmail(String to, String name) {
        String subject = "Inscription refusée";
        String title = "Information sur votre demande";
        String message = "Bonjour <b>" + name + "</b>,<br><br>" +
                "Nous avons le regret de vous informer que votre demande d'inscription n'a pas pu être retenue pour le moment.";

        String htmlContent = generateGenericHtml(title, message, "Nous contacter");
        try {
            sendHtmlEmailWithLogo(to, subject, htmlContent);
        } catch (MessagingException e) {
            System.err.println("Failed to send rejection email to " + to + ": " + e.getMessage());
        }
    }

    public void sendNewRegistrationNotificationToAdmins(String newUserName, String newUserEmail) {
        String[] adminEmails = { "admin@lumiere.tn", "commercial@lumiere.tn" };
        String subject = "🔔 Nouvelle demande d'inscription";
        String title = "Action requise : Nouvelle inscription";
        String message = "Une nouvelle demande d'inscription a été reçue :<br><br>" +
                "📝 <b>Nom :</b> " + newUserName + "<br>" +
                "📧 <b>Email :</b> " + newUserEmail + "<br><br>" +
                "Veuillez vous connecter au panneau d'administration pour approuver ou rejeter cette demande.";

        String htmlContent = generateGenericHtml(title, message, "Gérer les utilisateurs");

        for (String adminEmail : adminEmails) {
            try {
                sendHtmlEmailWithLogo(adminEmail, subject, htmlContent);
            } catch (MessagingException e) {
                System.err.println("Failed to send notification to " + adminEmail + ": " + e.getMessage());
            }
        }
    }

    public void sendOrderCreatedEmail(Ordre ordre) {
        String subject = "🔔 Nouvelle Demande de Livraison - " + ordre.getOrderNumber();
        String title = "Nouvelle Demande de Livraison";
        String message = "Une nouvelle demande de livraison a été soumise par le client <b>" + ordre.getNomclient() + "</b>.";

        String htmlContent = generateOrderHtml(ordre, title, message, "Consulter l'ordre");

        // Send to admins/commercials
        String[] adminEmails = { "admin@lumiere.tn", "commercial@lumiere.tn" };
        for (String email : adminEmails) {
            try {
                sendHtmlEmailWithLogo(email, subject, htmlContent);
            } catch (MessagingException e) {
                System.err.println("Failed to send order created email to " + email + ": " + e.getMessage());
            }
        }
    }

    public void sendOrderConfirmedEmail(Ordre ordre, String clientEmail) {
        if (clientEmail == null || clientEmail.isEmpty()) {
            System.err.println("Cannot send order confirmation: client email is missing for order " + ordre.getOrderNumber());
            return;
        }

        String subject = "✅ Confirmation de votre Livraison - " + ordre.getOrderNumber();
        String title = "Votre Livraison est Confirmée";
        String message = "Bonjour <b>" + ordre.getNomclient() + "</b>,<br><br>" +
                "Nous avons le plaisir de vous informer que votre demande de livraison a été acceptée et planifiée.";

        String htmlContent = generateOrderHtml(ordre, title, message, "Suivre ma livraison");

        try {
            sendHtmlEmailWithLogo(clientEmail, subject, htmlContent);
        } catch (MessagingException e) {
            System.err.println("Failed to send order confirmation email to " + clientEmail + ": " + e.getMessage());
        }
    }

    private void sendHtmlEmailWithLogo(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setFrom("commercial.lumiere@lumiere.tn");
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        // Add Logo
        ClassPathResource res = new ClassPathResource("lum.jpg");
        if (res.exists()) {
            helper.addInline("lumiereLogo", res);
        }

        mailSender.send(message);
        System.out.println("HTML Email with logo sent successfully to: " + to);
    }

    private String generateOrderHtml(Ordre ordre, String title, String message, String buttonText) {
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
        String chargementDate = ordre.getChargementDate() != null ? sdf.format(ordre.getChargementDate()) : "N/A";
        String livraisonDate = ordre.getLivraisonDate() != null ? sdf.format(ordre.getLivraisonDate()) : "N/A";

        String detailsTable = "<div class='details'>" +
                "<h3>Détails de la livraison</h3>" +
                "<table>" +
                "<tr><td class='label'>Numéro d'ordre:</td><td>" + ordre.getOrderNumber() + "</td></tr>" +
                "<tr><td class='label'>Client:</td><td>" + ordre.getNomclient() + "</td></tr>" +
                "<tr><td class='label'>Lieu de chargement:</td><td>" + ordre.getChargementNom() + " ("
                + ordre.getChargementVille() + ")</td></tr>" +
                "<tr><td class='label'>Date chargement:</td><td>" + chargementDate + "</td></tr>" +
                "<tr><td class='label'>Lieu de livraison:</td><td>" + ordre.getLivraisonNom() + " ("
                + ordre.getLivraisonVille() + ")</td></tr>" +
                "<tr><td class='label'>Date livraison:</td><td>" + livraisonDate + "</td></tr>" +
                "<tr><td class='label'>Désignation:</td><td>" + ordre.getDesignation() + "</td></tr>" +
                "<tr><td class='label'>Poids:</td><td>" + (ordre.getPoids() != null ? ordre.getPoids() + " kg" : "N/A")
                + "</td></tr>" +
                "</table>" +
                "</div>";

        return buildHtmlLayout(title, message, detailsTable, buttonText);
    }

    private String generateGenericHtml(String title, String message, String buttonText) {
        return buildHtmlLayout(title, message, "", buttonText);
    }

    private String buildHtmlLayout(String title, String message, String customContent, String buttonText) {
        return "<!DOCTYPE html>" +
                "<html><head><style>" +
                ".container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }"
                +
                ".header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0056b3; }"
                +
                ".content { padding: 30px; line-height: 1.6; color: #333; }" +
                ".details { background-color: #f1f3f5; padding: 20px; border-radius: 5px; margin-top: 20px; }" +
                ".details table { width: 100%; border-collapse: collapse; }" +
                ".details td { padding: 8px 0; border-bottom: 1px solid #dee2e6; }" +
                ".details td.label { font-weight: bold; color: #555; width: 40%; }" +
                ".footer { background-color: #343a40; color: #ffffff; padding: 20px; text-align: center; font-size: 12px; }"
                +
                ".btn { display: inline-block; padding: 12px 25px; background-color: #0056b3; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 25px; font-weight: bold; }"
                +
                "</style></head><body>" +
                "<div class='container'>" +
                "<div class='header'><img src='cid:lumiereLogo' alt='Logo' style='max-height: 80px;' /></div>" +
                "<div class='content'>" +
                "<h2 style='color: #0056b3;'>" + title + "</h2>" +
                "<p>" + message + "</p>" +
                customContent +
                "<center><a href='http://localhost:4200' class='btn'>" + buttonText + "</a></center>" +
                "</div>" +
                "<div class='footer'>" +
                "<b>Lumière Transport & Logistique</b><br>" +
                "Zone Industrielle, Tunis, Tunisie<br>" +
                "Tél: +216 71 000 000 | Email: contact@lumiere.tn" +
                "</div>" +
                "</div>" +
                "</body></html>";
    }
}