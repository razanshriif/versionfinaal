package com.example.demo.Controller;

import java.util.List;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.example.demo.Entity.Client;
import com.example.demo.Service.ClientService;
import com.example.demo.Entity.User;

@RestController
@RequestMapping("/api/v1/clients")
@CrossOrigin("*")
public class ClientController {

    @Autowired
    private ClientService clientService;

    @GetMapping
    public List<Client> getAllClients(@AuthenticationPrincipal User currentUser) {
        // Multi-tenancy: ADMIN and COMMERCIAL see all clients, CLIENT sees only their
        // own
        if (currentUser.isStaff()) {
            return clientService.findAll();
        } else {
            return clientService.findAllByOwner(currentUser);
        }
    }

    @GetMapping("/email/{id}")
    public String afficheremail(@PathVariable String id) {
        return clientService.afficheremail(id);
    }

    @GetMapping("/telephone/{id}")
    public String affichertelephone(@PathVariable String id) {
        return clientService.affichertelephone(id);
    }

    @GetMapping("/{id}")
    public Optional<Client> getClientById(@PathVariable Long id) {
        return clientService.findById(id);
    }

    @GetMapping("/code/{id}")
    public Optional<Client> getClientBycode(@PathVariable String id) {
        return clientService.findbycode(id);
    }

    @PostMapping
    public Client createClient(@RequestBody Client client, @AuthenticationPrincipal User currentUser) {
        // Multi-tenancy: assign owner to the current user
        return clientService.saveForOwner(client, currentUser);
    }

    @PutMapping("/{id}")
    public Client updateClient(@PathVariable Long id, @RequestBody Client clientDetails,
            @AuthenticationPrincipal User currentUser) {
        // Multi-tenancy: ADMIN and COMMERCIAL can update any client, CLIENT can only
        // update their own
        if (currentUser.isStaff()) {
            return clientService.updateClient(id, clientDetails);
        } else {
            return clientService.updateClientForOwner(id, clientDetails, currentUser);
        }
    }

    @DeleteMapping("/{id}")
    public void deleteClient(@PathVariable Long id) {
        clientService.deleteById(id);
    }

    @GetMapping("/count")
    public long countOrders() {
        return clientService.countAllclients();
    }
}