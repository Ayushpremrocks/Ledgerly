package com.bankapp.dto;

import java.time.LocalDateTime;

public record NotificationResponse(Long id, String kind, String title, String message, boolean read, LocalDateTime createdAt) {}
