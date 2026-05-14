package com.example.demo.Repository;

import com.example.demo.Entity.User;
import com.example.demo.Entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {
    List<UserPermission> findByUser(User user);

    Optional<UserPermission> findByUserAndFeatureKey(User user, String featureKey);
}
