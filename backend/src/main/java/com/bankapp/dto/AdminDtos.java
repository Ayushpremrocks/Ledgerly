package com.bankapp.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Request/response shapes used only by the admin panel. */
public final class AdminDtos {

    private AdminDtos() {}

    public record Stats(
            long users, long activeUsers, long accounts, long frozenAccounts,
            BigDecimal totalDeposits, long transactionsToday, BigDecimal volumeToday,
            List<DayPoint> last14Days
    ) {}

    public record DayPoint(String date, long count, BigDecimal volume) {}

    public record UserRow(
            Long id, String username, String fullName, String email, String role, boolean active,
            boolean locked, int accounts, BigDecimal totalBalance,
            LocalDateTime createdAt, LocalDateTime lastLoginAt
    ) {}

    public record StatusRequest(@NotNull(message = "active is required") Boolean active) {}

    public record FreezeRequest(@NotNull(message = "frozen is required") Boolean frozen) {}
}
