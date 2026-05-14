package com.example.demo.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.Entity.Commentaire;

public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {

}
