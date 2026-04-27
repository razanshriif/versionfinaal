package com.example.demo.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import com.example.demo.Entity.Ordre;

@Service
public class PlaFileService {

    public void generatePlaFile(Ordre ordre) throws IOException {
        String content = buildOrderRecord(ordre);
        saveFile(content);
    }

    public void generatePlaFileForOrders(List<Ordre> ordres) throws IOException {
        StringBuilder sb = new StringBuilder();
        for (Ordre ordre : ordres) {
            sb.append(buildOrderRecord(ordre));
        }

        if (sb.length() > 0) {
            saveFile(sb.toString());
        }
    }

    private String buildOrderRecord(Ordre ordre) {
        StringBuilder sb = new StringBuilder();

        String dateSaisie = formatDate(ordre.getDateSaisie());
        String livraisonDate = formatDate(ordre.getLivraisonDate());
        String chargementDate = formatDate(ordre.getChargementDate());

        Set<String> commentaires = ordre.getCommentaires();
        List<String> comments = (commentaires != null) ? new ArrayList<>(commentaires) : new ArrayList<>();
        StringBuilder comment = new StringBuilder();
        for (int i = 0; i < comments.size(); i++) {
            if (i == (comments.size() - 1)) {
                comment.append(comments.get(i));
            } else {
                comment.append(comments.get(i)).append("-");
            }
        }

        sb.append("1|DISPRO|").append(ordre.getClient()).append("|").append(ordre.getNomclient()).append("|")
                .append(ordre.getIdedi()).append("|").append(ordre.getIdedi()).append("|||")
                .append("LUMIERETRSP").append("|")
                .append(ordre.getSiteclient()).append("|").append(ordre.getSiteclient()).append("|LUMIERETRSP|")
                .append(ordre.getCodeclientcharg()).append("|").append(ordre.getCodeclientcharg()).append("|||")
                .append(ordre.getLivraisonNom()).append("|").append(ordre.getCodeclientliv()).append("|")
                .append(ordre.getLivraisonAdr1()).append("| ").append("||||")
                .append(ordre.getCodepostalliv()).append("|").append(ordre.getLivraisonVille())
                .append("||55||||||||||||||||||")
                .append(ordre.getOrderNumber()).append("|").append(dateSaisie).append("||||")
                .append(ordre.getSiteclient())
                .append(ordre.getOrderNumber()).append("|||").append(ordre.getNombrePalettes()).append("|")
                .append(ordre.getNombrePalettes()).append("|").append(ordre.getNombreColis()).append("|")
                .append(ordre.getNombrePalettes()).append("||")
                .append(ordre.getVolume() != null ? ordre.getVolume().intValue() : 0).append("|")
                .append(ordre.getVolume() != null ? ordre.getVolume().intValue() : 0).append("|||1||")
                .append(ordre.getCodeArticle()).append("|||||||||||").append(livraisonDate).append("|||")
                .append(chargementDate)
                .append("||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||")
                .append(ordre.getNombrePalettes()).append("|||||||").append(comment)
                .append("||||||||||||||||||||||||||||||||");
        sb.append(System.lineSeparator());

        return sb.toString();       
        //Files.write(Paths.get("\\\\172.18.3.70\\tmsv14\\EDI\\AZIZA\\EDIDIVERS_"+new Date().getTime() +".txt"), sb.toString().getBytes());

    }

    private void saveFile(String content) throws IOException {
        String filename = "\\\\172.18.3.70\\tmsv14\\EDI\\AZIZA\\EDIDIVERS_" + new Date().getTime() + ".txt";
        Files.write(Paths.get(filename), content.getBytes());
    }

    private static String formatDate(Date date) {
        if (date == null)
            return "000000000000";
        return String.format("%1$tY%1$tm%1$td%1$tH%1$tM", date);
    }
}
