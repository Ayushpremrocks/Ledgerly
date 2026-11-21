package com.bankapp.config;

import com.bankapp.model.User;
import com.bankapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first admin on startup, but only when ADMIN_PASSWORD is set.
 * There is no built-in default password, so a deployment never ships with a known admin login.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String username;

    @Value("${app.admin.password:}")
    private String password;

    @Value("${app.admin.email:admin@ledgerly.local}")
    private String email;

    public AdminBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (password == null || password.isBlank()) {
            return;
        }
        if (userRepository.existsByUsername(username)) {
            return;
        }
        User admin = new User();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setFullName("Ledgerly Admin");
        admin.setRole(User.Role.ADMIN);
        admin.setIsActive(true);
        admin.setFailedLoginAttempts(0);
        userRepository.save(admin);
        log.info("Created admin user '{}'", username);
    }
}
