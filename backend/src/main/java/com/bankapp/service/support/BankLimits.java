package com.bankapp.service.support;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Business rules in one place. Each can be overridden in application.properties. */
@Component
public class BankLimits {

    @Value("${app.limits.min-amount:1.00}")
    private BigDecimal minAmount;

    @Value("${app.limits.max-per-transaction:100000}")
    private BigDecimal maxPerTransaction;

    @Value("${app.limits.daily-transfer:200000}")
    private BigDecimal dailyTransfer;

    @Value("${app.limits.max-deposit:100000}")
    private BigDecimal maxDeposit;

    @Value("${app.limits.max-accounts:5}")
    private int maxAccounts;

    @Value("${app.security.max-failed-logins:5}")
    private int maxFailedLogins;

    @Value("${app.security.lock-minutes:15}")
    private int lockMinutes;

    public BigDecimal minAmount() { return minAmount; }
    public BigDecimal maxPerTransaction() { return maxPerTransaction; }
    public BigDecimal dailyTransfer() { return dailyTransfer; }
    public BigDecimal maxDeposit() { return maxDeposit; }
    public int maxAccounts() { return maxAccounts; }
    public int maxFailedLogins() { return maxFailedLogins; }
    public int lockMinutes() { return lockMinutes; }
}
