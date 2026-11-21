package com.bankapp.service;

import com.bankapp.dto.AccountResponse;
import com.bankapp.dto.AdminDtos;
import com.bankapp.dto.TransactionResponse;
import com.bankapp.exception.ApiException;
import com.bankapp.model.Account;
import com.bankapp.model.Notification;
import com.bankapp.model.Transaction;
import com.bankapp.model.User;
import com.bankapp.repository.AccountRepository;
import com.bankapp.repository.TransactionRepository;
import com.bankapp.repository.UserRepository;
import com.bankapp.service.support.CurrentUser;
import com.bankapp.service.support.Mappers;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Back-office operations. Every endpoint using this is restricted to ROLE_ADMIN in SecurityConfig. */
@Service
public class AdminService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    public AdminService(UserRepository userRepository, AccountRepository accountRepository,
                        TransactionRepository transactionRepository, NotificationService notificationService,
                        CurrentUser currentUser) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
        this.currentUser = currentUser;
    }

    public AdminDtos.Stats stats() {
        List<User> users = userRepository.findAll();
        long activeUsers = users.stream().filter(u -> !Boolean.FALSE.equals(u.getIsActive())).count();

        LocalDate today = LocalDate.now();
        List<Transaction> recent = transactionRepository.findByTransactionDateGreaterThanEqual(
                today.minusDays(13).atStartOfDay());
        Map<LocalDate, List<Transaction>> byDay = recent.stream()
                .collect(Collectors.groupingBy(t -> t.getTransactionDate().toLocalDate()));

        List<AdminDtos.DayPoint> days = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            List<Transaction> list = byDay.getOrDefault(d, List.of());
            days.add(new AdminDtos.DayPoint(d.toString(), list.size(), sum(list)));
        }
        AdminDtos.DayPoint todayPoint = days.get(days.size() - 1);

        return new AdminDtos.Stats(
                users.size(), activeUsers,
                accountRepository.countByIsActiveTrue(), accountRepository.countByIsFrozenTrue(),
                accountRepository.getTotalDeposits(),
                todayPoint.count(), todayPoint.volume(),
                days);
    }

    public List<AdminDtos.UserRow> users() {
        LocalDateTime now = LocalDateTime.now();
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(u -> new AdminDtos.UserRow(
                        u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getRole().name(),
                        !Boolean.FALSE.equals(u.getIsActive()),
                        u.getLockedUntil() != null && u.getLockedUntil().isAfter(now),
                        (int) accountRepository.countByUserIdAndIsActiveTrue(u.getId()),
                        accountRepository.getTotalBalanceByUserId(u.getId()),
                        u.getCreatedAt(), u.getLastLoginAt()))
                .toList();
    }

    @Transactional
    public void setUserActive(Long userId, boolean active) {
        User me = currentUser.get();
        if (me.getId().equals(userId)) {
            throw ApiException.badRequest("You can't change your own status");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setIsActive(active);
        if (active) {
            // Reactivating also clears any sign-in lock
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
        }
        notificationService.notify(user, Notification.Kind.SECURITY,
                active ? "Profile reactivated" : "Profile deactivated",
                active ? "You can sign in and use your accounts again." : "Contact support for help.");
    }

    public List<AccountResponse> accounts() {
        return accountRepository.findAllWithUser().stream().map(Mappers::toAccount).toList();
    }

    @Transactional
    public AccountResponse setFrozen(String accountNumber, boolean frozen) {
        Account a = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> ApiException.notFound("Account not found"));
        if (!Mappers.isOpen(a)) {
            throw ApiException.badRequest("Closed accounts can't be frozen or unfrozen");
        }
        a.setIsFrozen(frozen);
        notificationService.notify(a.getUser(), Notification.Kind.ACCOUNT,
                frozen ? "Account frozen" : "Account unfrozen",
                frozen ? "Account " + a.getAccountNumber() + " is on hold. Contact support for details."
                       : "Account " + a.getAccountNumber() + " can be used again.");
        return Mappers.toAccount(a);
    }

    public List<TransactionResponse> recentTransactions() {
        return transactionRepository.findTop50ByOrderByTransactionDateDesc().stream()
                .map(t -> Mappers.toTransaction(t, null, null))
                .toList();
    }

    private static BigDecimal sum(List<Transaction> list) {
        return list.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
