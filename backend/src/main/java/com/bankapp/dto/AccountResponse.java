package com.bankapp.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        String accountNumber,
        String accountType,
        String nickname,
        BigDecimal balance,
        String currency,
        boolean active,
        boolean frozen,
        String ownerUsername,
        String ownerFullName,
        LocalDateTime createdAt,
        LocalDateTime closedAt
) {}
