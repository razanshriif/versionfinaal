package com.example.demo.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.Article;
import com.example.demo.Entity.Client;
import com.example.demo.Repository.ArticleRepository;

@Service
public class ArticleService {

    @Autowired
    private ArticleRepository articleRepository;

    public List<Article> findAll() {
        return articleRepository.findAll();
    }

    public Optional<Article> findById(Long id) {
        return articleRepository.findById(id);
    }

    public Article save(Article article) {
        return articleRepository.save(article);
    }

    public List<Article> saveAll(List<Article> articles) {
        return articleRepository.saveAll(articles);
    }

    public void deleteById(Long id) {
        articleRepository.deleteById(id);

    }

    public Article findByCodeArticle(String codeArticle) {
        return articleRepository.findByCodeArticle(codeArticle);
    }

    public Article updateArticle(Long id, Article articleDetails) {
        Optional<Article> optionalArticle = articleRepository.findById(id);
        if (optionalArticle.isPresent()) {
            Article article = optionalArticle.get();

            article.setPrixUnitaire(articleDetails.getPrixUnitaire());
            return articleRepository.save(article);
        } else {
            throw new RuntimeException("Article not found with id " + id);
        }
    }

    public long countAllarticles() {
        return articleRepository.count(); // Or ordreRepository.countAllOrders();
    }

}
