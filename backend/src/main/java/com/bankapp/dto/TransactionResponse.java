package com.bankapp.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * direction is from the viewer's point of view:
 * CREDIT = money in, DEBIT = money out, INTERNAL = between the viewer's own accounts.
 * balanceAfter is only filled in when viewing a single account's history.
 */
public record TransactionResponse(
        Long id,
        String transactionId,
        String transactionType,
        BigDecimal amount,
        String fromAccountNumber,
        String toAccountNumber,
        String fromName,
        String toName,
        String description,
        String category,
        String status,
        LocalDateTime transactionDate,
        String direction,
        BigDecimal balanceAfter
) {}
