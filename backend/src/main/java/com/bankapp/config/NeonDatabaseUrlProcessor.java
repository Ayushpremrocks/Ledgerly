package com.bankapp.config;

import org.apache.commons.logging.Log;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Lets the app use the connection strings Neon provides (via `neon env pull`,
 * `neon-env run`, or a hosting provider's env vars).
 *
 * Neon gives libpq-style URLs: postgresql://user:password@host/db?sslmode=require
 * JDBC needs: jdbc:postgresql://host/db?sslmode=require, with the user and password
 * passed separately. This converts one into the other before the DataSource is built.
 *
 * DATABASE_URL_UNPOOLED (direct) is preferred over DATABASE_URL (pooled). This app is a
 * long-running server with its own HikariCP pool, and Hibernate runs schema updates
 * (ddl-auto=update) at startup, which Neon recommends doing over a direct connection.
 *
 * If neither variable holds a postgres:// or postgresql:// URL (for example a
 * jdbc:mysql:// URL, or nothing), this does nothing and application.properties applies.
 */
public class NeonDatabaseUrlProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String[] SOURCE_VARS = {"DATABASE_URL_UNPOOLED", "DATABASE_URL"};

    private final Log log;

    public NeonDatabaseUrlProcessor(DeferredLogFactory logFactory) {
        this.log = logFactory.getLog(NeonDatabaseUrlProcessor.class);
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        for (String var : SOURCE_VARS) {
            String value = environment.getProperty(var);
            if (value != null && (value.startsWith("postgres://") || value.startsWith("postgresql://"))) {
                Map<String, Object> props = toJdbcProperties(value);
                environment.getPropertySources().addFirst(new MapPropertySource("neonDatabaseUrl", props));
                // Log the host only; never the password.
                log.info("Using Postgres from " + var + ": " + URI.create(value).getHost());
                return;
            }
        }
    }

    static Map<String, Object> toJdbcProperties(String url) {
        URI uri = URI.create(url);

        StringBuilder jdbc = new StringBuilder("jdbc:postgresql://").append(uri.getHost());
        if (uri.getPort() != -1) {
            jdbc.append(':').append(uri.getPort());
        }
        jdbc.append(uri.getRawPath() == null || uri.getRawPath().isEmpty() ? "/" : uri.getRawPath());
        if (uri.getRawQuery() != null) {
            jdbc.append('?').append(uri.getRawQuery());
        }

        Map<String, Object> props = new HashMap<>();
        props.put("spring.datasource.url", jdbc.toString());

        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            int colon = userInfo.indexOf(':');
            String user = colon >= 0 ? userInfo.substring(0, colon) : userInfo;
            props.put("spring.datasource.username", URLDecoder.decode(user, StandardCharsets.UTF_8));
            if (colon >= 0) {
                props.put("spring.datasource.password",
                        URLDecoder.decode(userInfo.substring(colon + 1), StandardCharsets.UTF_8));
            }
        }
        return props;
    }

    @Override
    public int getOrder() {
        // Run after application.properties is loaded so these values take precedence.
        return Ordered.LOWEST_PRECEDENCE;
    }
}
