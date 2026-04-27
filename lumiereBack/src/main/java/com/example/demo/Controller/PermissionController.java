package com.example.demo.Controller;

import com.example.demo.Entity.Role;
import com.example.demo.Entity.RolePermission;
import com.example.demo.Entity.UserPermission;
import com.example.demo.Service.PermissionService;
import com.example.demo.Service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/permissions")
@CrossOrigin("*")
public class PermissionController {

    private final PermissionService permissionService;
    private final UserService userService;

    public PermissionController(PermissionService permissionService, UserService userService) {
        this.permissionService = permissionService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<RolePermission>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    @GetMapping("/{role}")
    public ResponseEntity<Map<String, Boolean>> getPermissionsByRole(@PathVariable Role role) {
        return ResponseEntity.ok(permissionService.getPermissionMapByRole(role));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Boolean>> getPermissionsByUser(@PathVariable Integer userId) {
        return userService.getUserById(userId)
                .map(user -> ResponseEntity.ok(permissionService.getPermissionMapByUser(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Void> updatePermissions(@RequestBody List<RolePermission> permissions) {
        permissionService.updatePermissions(permissions);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<Void> updateUserPermissions(@PathVariable Integer userId,
            @RequestBody List<UserPermission> permissions) {
        return userService.getUserById(userId)
                .map(user -> {
                    permissionService.updateUserPermissions(user, permissions);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
