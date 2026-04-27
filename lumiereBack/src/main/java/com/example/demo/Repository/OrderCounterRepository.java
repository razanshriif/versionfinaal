package com.example.demo.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.Entity.OrderCounter;

public interface OrderCounterRepository extends JpaRepository<OrderCounter, Long> {
}