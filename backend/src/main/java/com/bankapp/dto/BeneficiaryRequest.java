package com.bankapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BeneficiaryRequest(
        @NotBlank(message = "Enter the account number")
        String accountNumber,

        @NotBlank(message = "Give this payee a name")
        @Size(max = 40, message = "Name can be at most 40 characters")
        String nickname
) {}
