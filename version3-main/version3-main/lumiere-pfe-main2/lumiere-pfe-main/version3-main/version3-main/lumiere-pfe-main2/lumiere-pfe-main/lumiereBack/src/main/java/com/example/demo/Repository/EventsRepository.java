package com.example.demo.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.Entity.Article;
import com.example.demo.Entity.Events;
import com.example.demo.Entity.Ordre;

public interface EventsRepository extends JpaRepository<Events, Long>{
	List<Events> findAllByVoycle(String voycle);
	Long countByVoycle(String voycle);
	 void deleteAllByVoycle(String voycle);
	

}
