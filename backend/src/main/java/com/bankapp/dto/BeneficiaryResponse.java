package com.bankapp.dto;

import java.time.LocalDateTime;

public record BeneficiaryResponse(Long id, String nickname, String accountNumber, String ownerName, LocalDateTime createdAt) {}
