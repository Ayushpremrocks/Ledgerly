package com.bankapp.dto;

import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id, String username, String email, String fullName, String phoneNumber,
        String role, LocalDateTime createdAt, LocalDateTime lastLoginAt
) {}
