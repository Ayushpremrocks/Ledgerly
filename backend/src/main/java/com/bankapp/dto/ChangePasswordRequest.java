package com.bankapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Enter your current password")
        String currentPassword,

        @NotBlank(message = "Enter a new password")
        @Size(min = 8, message = "New password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$",
                 message = "New password needs an uppercase letter, a lowercase letter, a number and a symbol")
        String newPassword
) {}
