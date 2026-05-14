package com.example.demo.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import com.example.demo.Entity.Client;
import com.example.demo.Entity.User;

public interface ClientRepository extends JpaRepository<Client, Long> {

	Optional<Client> findByCodeclient(String codeclient);

	// Multi-tenancy: find clients by owner
	List<Client> findByOwner(@Param("owner") User owner);

	// Find specific client by owner and code
	Optional<Client> findByOwnerAndCodeclient(@Param("owner") User owner, @Param("codeclient") String codeclient);

}
