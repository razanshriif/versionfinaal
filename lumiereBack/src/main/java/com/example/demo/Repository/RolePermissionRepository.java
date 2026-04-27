package com.example.demo.Repository;

import com.example.demo.Entity.Role;
import com.example.demo.Entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRole(Role role);

    Optional<RolePermission> findByRoleAndFeatureKey(Role role, String featureKey);
}
