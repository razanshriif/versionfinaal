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

import com.example.demo.Entity.Tranck;
import com.example.demo.Service.TranckService;

@RestController
@RequestMapping("/api/v1/trancks")
public class TranckController {

    @Autowired
    private TranckService tranckService;

    @GetMapping
    public List<Tranck> getAllTrancks() {
        return tranckService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Tranck> getTranckById(@PathVariable Long id) {
        return tranckService.findById(id);
    }

    @PostMapping
    public Tranck createTranck(@RequestBody Tranck tranck) {
        return tranckService.save(tranck);
    }

    @PutMapping("/{id}")
    public Tranck updateTranck(@PathVariable Long id, @RequestBody Tranck tranckDetails) {
        return tranckService.updateTranck(id, tranckDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteTranck(@PathVariable Long id) {
        tranckService.deleteById(id);
    }
}