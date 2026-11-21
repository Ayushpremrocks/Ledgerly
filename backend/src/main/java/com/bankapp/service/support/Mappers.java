package com.bankapp.service.support;

import com.bankapp.dto.AccountResponse;
import com.bankapp.dto.TransactionResponse;
import com.bankapp.model.Account;
import com.bankapp.model.Transaction;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.function.Predicate;

/** Entity -> DTO conversion and small formatting helpers shared by the services. */
public final class Mappers {

    private Mappers() {}

    private static final Locale INDIA = Locale.forLanguageTag("en-IN");

    /** 125050.5 -> "₹1,25,050.50" (Indian digit grouping). */
    public static String money(BigDecimal amount) {
        NumberFormat f = NumberFormat.getCurrencyInstance(INDIA);
        return f.format(amount.setScale(2, RoundingMode.HALF_UP));
    }

    /** "Bob Test" -> "Bob T." so a lookup confirms the person without exposing the full name. */
    public static String maskName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Account holder";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) return parts[0];
        return parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
    }

    public static boolean isFrozen(Account a) {
        return Boolean.TRUE.equals(a.getIsFrozen());
    }

    public static boolean isOpen(Account a) {
        return !Boolean.FALSE.equals(a.getIsActive());
    }

    public static AccountResponse toAccount(Account a) {
        return new AccountResponse(
                a.getId(),
                a.getAccountNumber(),
                a.getAccountType().name(),
                a.getNickname(),
                a.getBalance(),
                a.getCurrency(),
                isOpen(a),
                isFrozen(a),
                a.getUser().getUsername(),
                a.getUser().getFullName(),
                a.getCreatedAt(),
                a.getClosedAt()
        );
    }

    /**
     * @param isMine     which accounts belong to the viewer; decides CREDIT / DEBIT / INTERNAL
     * @param balanceAfter running balance for single-account views, otherwise null
     */
    public static TransactionResponse toTransaction(Transaction t, Predicate<Account> isMine, BigDecimal balanceAfter) {
        return new TransactionResponse(
                t.getId(),
                t.getTransactionId(),
                t.getTransactionType().name(),
                t.getAmount(),
                t.getFromAccount() != null ? t.getFromAccount().getAccountNumber() : null,
                t.getToAccount() != null ? t.getToAccount().getAccountNumber() : null,
                t.getFromAccount() != null ? t.getFromAccount().getUser().getFullName() : null,
                t.getToAccount() != null ? t.getToAccount().getUser().getFullName() : null,
                t.getDescription(),
                t.getCategory() != null ? t.getCategory().name() : Transaction.Category.GENERAL.name(),
                t.getStatus().name(),
                t.getTransactionDate(),
                direction(t, isMine),
                balanceAfter
        );
    }

    public static String direction(Transaction t, Predicate<Account> isMine) {
        if (isMine == null) return null;
        boolean fromMine = t.getFromAccount() != null && isMine.test(t.getFromAccount());
        boolean toMine = t.getToAccount() != null && isMine.test(t.getToAccount());
        if (fromMine && toMine) return "INTERNAL";
        return toMine ? "CREDIT" : "DEBIT";
    }

    public static Transaction.Category parseCategory(String raw, Transaction.Category fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return Transaction.Category.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }
}
