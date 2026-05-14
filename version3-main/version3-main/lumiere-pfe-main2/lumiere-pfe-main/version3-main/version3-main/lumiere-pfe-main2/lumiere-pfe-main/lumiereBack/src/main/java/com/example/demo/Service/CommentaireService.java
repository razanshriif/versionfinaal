package com.example.demo.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.Commentaire;
import com.example.demo.Repository.CommentaireRepository;

@Service
public class CommentaireService {

    @Autowired
    private CommentaireRepository commentaireRepository;

    public List<Commentaire> findAll() {
        return commentaireRepository.findAll();
    }

    public Optional<Commentaire> findById(Long id) {
        return commentaireRepository.findById(id);
    }

    public Commentaire save(Commentaire commentaire) {
        return commentaireRepository.save(commentaire);
    }

    public void deleteById(Long id) {
        commentaireRepository.deleteById(id);
    }

    public Commentaire updateCommentaire(Long id, Commentaire commentaireDetails) {
        Optional<Commentaire> optionalCommentaire = commentaireRepository.findById(id);
        if (optionalCommentaire.isPresent()) {
            Commentaire commentaire = optionalCommentaire.get();
            commentaire.setContenue(commentaireDetails.getContenue());
            commentaire.setOrdre(commentaireDetails.getOrdre());
            return commentaireRepository.save(commentaire);
        } else {
            throw new RuntimeException("Commentaire not found with id " + id);
        }
    }
}