package com.bankapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email")
        String email,

        @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone number must be 10 digits")
        String phoneNumber
) {}
