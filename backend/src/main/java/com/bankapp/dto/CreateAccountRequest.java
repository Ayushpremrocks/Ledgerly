package com.bankapp.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateAccountRequest(
        @NotBlank(message = "Choose an account type")
        String accountType, // SAVINGS, CURRENT, FIXED_DEPOSIT

        @Size(max = 40, message = "Nickname can be at most 40 characters")
        String nickname,

        @DecimalMin(value = "0.00", message = "Opening deposit can't be negative")
        @Digits(integer = 13, fraction = 2, message = "Amount can have at most 2 decimal places")
        BigDecimal openingDeposit
) {}
