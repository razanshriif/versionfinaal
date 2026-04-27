package com.example.demo.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.Entity.Tranck;

public interface TranckRepository extends JpaRepository<Tranck, Long> {

}
