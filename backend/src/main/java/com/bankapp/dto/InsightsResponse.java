package com.bankapp.dto;

import java.math.BigDecimal;
import java.util.List;

public record InsightsResponse(
        BigDecimal totalBalance,
        BigDecimal moneyInThisMonth,
        BigDecimal moneyOutThisMonth,
        BigDecimal moneyOutLastMonth,
        long transactionsThisMonth,
        List<MonthPoint> months,                // oldest first
        List<CategoryShare> spendingByCategory, // this month, biggest first
        List<Counterparty> topPayees            // last 90 days
) {
    public record MonthPoint(String month, BigDecimal moneyIn, BigDecimal moneyOut) {}
    public record CategoryShare(String category, BigDecimal amount, long count) {}
    public record Counterparty(String name, String accountNumber, BigDecimal amount, long count) {}
}
