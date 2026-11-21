package com.bankapp.service;

import com.bankapp.dto.LoginRequest;
import com.bankapp.dto.LoginResponse;
import com.bankapp.dto.RegisterRequest;
import com.bankapp.dto.RegisterResponse;
import com.bankapp.exception.ApiException;
import com.bankapp.model.Notification;
import com.bankapp.model.User;
import com.bankapp.repository.UserRepository;
import com.bankapp.security.JwtUtil;
import com.bankapp.service.support.BankLimits;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;
    private final BankLimits limits;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager, NotificationService notificationService,
                       BankLimits limits) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.notificationService = notificationService;
        this.limits = limits;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw ApiException.conflict("That username is taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("That email is already registered");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(User.Role.USER);
        user.setIsActive(true);
        user.setFailedLoginAttempts(0);
        User saved = userRepository.save(user);

        notificationService.notify(saved, Notification.Kind.INFO, "Welcome to Ledgerly",
                "Open your first account to start moving money.");

        return new RegisterResponse("Account created", saved.getId(), saved.getUsername(), saved.getEmail());
    }

    /**
     * Signs a user in. After too many wrong passwords in a row the profile is locked for a
     * few minutes, which makes guessing passwords impractical.
     */
    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername().trim();
        User user = userRepository.findByUsername(username).orElse(null);
        LocalDateTime now = LocalDateTime.now();

        if (user != null && user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            long minutes = Math.max(1, Duration.between(now, user.getLockedUntil()).toMinutes() + 1);
            throw new ApiException(HttpStatus.LOCKED,
                    "Too many failed attempts. Try again in " + minutes + " minute" + (minutes == 1 ? "" : "s") + ".");
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, request.getPassword()));
        } catch (DisabledException e) {
            throw ApiException.forbidden("This profile has been deactivated. Contact support.");
        } catch (AuthenticationException e) {
            throw failedAttempt(user, now);
        }

        // Success: clear the failure counter and remember when they last signed in
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(now);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), Map.of("role", user.getRole().name()));
        return new LoginResponse(token, "Bearer", user.getId(), user.getUsername(), user.getEmail(),
                user.getFullName(), user.getRole().name());
    }

    private ApiException failedAttempt(User user, LocalDateTime now) {
        String generic = "Invalid username or password";
        if (user == null) {
            return new ApiException(HttpStatus.UNAUTHORIZED, generic);
        }
        int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
        if (attempts >= limits.maxFailedLogins()) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(now.plusMinutes(limits.lockMinutes()));
            userRepository.save(user);
            notificationService.notify(user, Notification.Kind.SECURITY, "Sign-in locked",
                    "Too many wrong passwords. Sign-in was paused for " + limits.lockMinutes() + " minutes.");
            return new ApiException(HttpStatus.LOCKED,
                    "Too many failed attempts. Try again in " + limits.lockMinutes() + " minutes.");
        }
        user.setFailedLoginAttempts(attempts);
        userRepository.save(user);
        int left = limits.maxFailedLogins() - attempts;
        return new ApiException(HttpStatus.UNAUTHORIZED,
                left <= 2 ? generic + ". " + left + " attempt" + (left == 1 ? "" : "s") + " left." : generic);
    }
}
