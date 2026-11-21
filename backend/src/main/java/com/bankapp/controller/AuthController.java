package com.bankapp.controller;

import com.bankapp.dto.LoginRequest;
import com.bankapp.dto.LoginResponse;
import com.bankapp.dto.RegisterRequest;
import com.bankapp.dto.RegisterResponse;
import com.bankapp.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Used by Render's health check and the frontend's "is the server up" check. */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "ledgerly-backend");
    }
}
