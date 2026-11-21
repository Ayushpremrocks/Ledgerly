package com.bankapp.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Body for deposit and withdraw: one account, one amount. */
public record MoneyRequest(
        @NotBlank(message = "Choose an account")
        String accountNumber,

        @NotNull(message = "Enter an amount")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 13, fraction = 2, message = "Amount can have at most 2 decimal places")
        BigDecimal amount,

        @Size(max = 255, message = "Note can be at most 255 characters")
        String description,

        String category
) {}
