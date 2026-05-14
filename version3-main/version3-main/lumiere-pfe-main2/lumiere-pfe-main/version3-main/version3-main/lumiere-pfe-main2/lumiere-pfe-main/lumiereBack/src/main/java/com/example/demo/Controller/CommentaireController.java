package com.example.demo.Controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.example.demo.Entity.Commentaire;
import com.example.demo.Service.CommentaireService;

@RestController
@RequestMapping("/api/v1/commentaires")
@CrossOrigin("*")
public class CommentaireController {

    @Autowired
    private CommentaireService commentaireService;

    @GetMapping
    public List<Commentaire> getAllCommentaires() {
        return commentaireService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Commentaire> getCommentaireById(@PathVariable Long id) {
        return commentaireService.findById(id);
    }

    @PostMapping
    public Commentaire createCommentaire(@RequestBody Commentaire commentaire) {
        return commentaireService.save(commentaire);
    }

    @PutMapping("/{id}")
    public Commentaire updateCommentaire(@PathVariable Long id, @RequestBody Commentaire commentaireDetails) {
        return commentaireService.updateCommentaire(id, commentaireDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteCommentaire(@PathVariable Long id) {
        commentaireService.deleteById(id);
    }
}