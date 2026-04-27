package com.example.demo.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.Tranck;
import com.example.demo.Repository.TranckRepository;

@Service
public class TranckService {

    @Autowired
    private TranckRepository tranckRepository;

    public List<Tranck> findAll() {
        return tranckRepository.findAll();
    }

    public Optional<Tranck> findById(Long id) {
        return tranckRepository.findById(id);
    }

    public Tranck save(Tranck tranck) {
        return tranckRepository.save(tranck);
    }

    public void deleteById(Long id) {
        tranckRepository.deleteById(id);
    }

  public Tranck updateTranck(Long id, Tranck tranckDetails) {
        Optional<Tranck> optionalTranck = tranckRepository.findById(id);
        if (optionalTranck.isPresent()) {
            Tranck tranck = optionalTranck.get();
            tranck.setDepartureDateTime(tranckDetails.getDepartureDateTime());
        
            
            tranck.setDepart(tranckDetails.getDepart());
            tranck.setChargement(tranckDetails.getChargement());
            tranck.setLivraison(tranckDetails.getLivraison());
            
            
            return tranckRepository.save(tranck);
        } else {
            throw new RuntimeException("Tranck not found with id " + id);
        }
    }
}