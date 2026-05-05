package com.example.demo.Config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class RimtrackConfig {

    // --- BASE PRINCIPALE (MySQL Local) ---
    @Primary
    @Bean(name = "dataSource")
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }

    // --- BASE GPS RIMTRACK ---
    @Bean(name = "rimtrackDataSource")
    @ConfigurationProperties(prefix = "rimtrack.datasource")
    public DataSource rimtrackDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Primary
    @Bean(name = "jdbcTemplate")
    public JdbcTemplate jdbcTemplate(@Qualifier("dataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean(name = "rimtrackJdbcTemplate")
    public JdbcTemplate rimtrackJdbcTemplate(@Qualifier("rimtrackDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
