package com.example.demo.securityjwt.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DatabaseAutoFixer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseAutoFixer.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseAutoFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // Fix 1: Add AUTO_INCREMENT to id column
        try {
            logger.info("Attempting to fix database schema: Adding AUTO_INCREMENT to _user.id");
            jdbcTemplate.execute("ALTER TABLE _user MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;");
            logger.info("Database schema fixed successfully.");
        } catch (Exception e) {
            logger.warn("Could not apply AUTO_INCREMENT fix (might already be applied): " + e.getMessage());
        }

        // Fix 2: Set existing users with null status to ACTIVE (migration)
        try {
            logger.info("Migrating existing users: Setting null status to ACTIVE");
            int updated = jdbcTemplate.update("UPDATE _user SET status = 'ACTIVE' WHERE status IS NULL;");
            logger.info("Migration completed: {} users updated to ACTIVE status", updated);
        } catch (Exception e) {
            logger.error("Could not migrate user statuses: " + e.getMessage());
        }
    }
}
