package com.bankapp.service;

import com.bankapp.dto.AccountLookupResponse;
import com.bankapp.dto.AccountResponse;
import com.bankapp.dto.BalanceResponse;
import com.bankapp.dto.CreateAccountRequest;
import com.bankapp.exception.ApiException;
import com.bankapp.model.Account;
import com.bankapp.model.Notification;
import com.bankapp.model.Transaction;
import com.bankapp.model.User;
import com.bankapp.repository.AccountRepository;
import com.bankapp.service.support.BankLimits;
import com.bankapp.service.support.CurrentUser;
import com.bankapp.service.support.Mappers;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class AccountService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;
    private final CurrentUser currentUser;
    private final BankLimits limits;
    private final TransactionService transactionService;
    private final NotificationService notificationService;

    public AccountService(AccountRepository accountRepository, CurrentUser currentUser, BankLimits limits,
                          TransactionService transactionService, NotificationService notificationService) {
        this.accountRepository = accountRepository;
        this.currentUser = currentUser;
        this.limits = limits;
        this.transactionService = transactionService;
        this.notificationService = notificationService;
    }

    /** "ACC" + 13 random digits, retried until unused. */
    private String generateAccountNumber() {
        String number;
        do {
            StringBuilder sb = new StringBuilder("ACC");
            for (int i = 0; i < 13; i++) sb.append(RANDOM.nextInt(10));
            number = sb.toString();
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }

    /** Loads an account and checks it belongs to the logged-in user. */
    Account getOwnedAccount(String accountNumber, User user) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> ApiException.notFound("Account not found"));
        if (!account.getUser().getId().equals(user.getId())) {
            // Same message as "not found" so nobody can probe other people's accounts.
            throw ApiException.notFound("Account not found");
        }
        return account;
    }

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        User user = currentUser.get();

        Account.AccountType type;
        try {
            type = Account.AccountType.valueOf(request.accountType().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Account type must be SAVINGS, CURRENT or FIXED_DEPOSIT");
        }

        if (accountRepository.countByUserIdAndIsActiveTrue(user.getId()) >= limits.maxAccounts()) {
            throw ApiException.badRequest("You can have up to " + limits.maxAccounts() + " open accounts");
        }

        BigDecimal opening = request.openingDeposit() == null
                ? BigDecimal.ZERO
                : request.openingDeposit().setScale(2, RoundingMode.HALF_UP);
        if (opening.compareTo(limits.maxDeposit()) > 0) {
            throw ApiException.badRequest("Opening deposit can be at most " + Mappers.money(limits.maxDeposit()));
        }

        Account account = new Account();
        account.setAccountNumber(generateAccountNumber());
        account.setAccountType(type);
        account.setNickname(blankToNull(request.nickname()));
        account.setBalance(BigDecimal.ZERO);
        account.setCurrency("INR");
        account.setUser(user);
        account.setIsActive(true);
        account.setIsFrozen(false);
        account = accountRepository.save(account);

        // The opening deposit goes through the normal deposit path, so it shows up in history
        // and the balance always equals the sum of the account's transactions.
        if (opening.signum() > 0) {
            transactionService.recordDeposit(account, opening, "Opening deposit", Transaction.Category.SAVINGS);
        }

        notificationService.notify(user, Notification.Kind.ACCOUNT,
                "New " + prettyType(type) + " account opened",
                "Account " + account.getAccountNumber() + " is ready to use.");

        return Mappers.toAccount(account);
    }

    public List<AccountResponse> getMyAccounts() {
        User user = currentUser.get();
        return accountRepository.findByUserIdOrderByCreatedAtAsc(user.getId()).stream()
                .map(Mappers::toAccount)
                .toList();
    }

    public AccountResponse getAccountByNumber(String accountNumber) {
        return Mappers.toAccount(getOwnedAccount(accountNumber, currentUser.get()));
    }

    public BalanceResponse getBalance(String accountNumber) {
        Account a = getOwnedAccount(accountNumber, currentUser.get());
        return new BalanceResponse(a.getAccountNumber(), a.getBalance(), a.getCurrency());
    }

    public BigDecimal getTotalBalance() {
        return accountRepository.getTotalBalanceByUserId(currentUser.get().getId());
    }

    @Transactional
    public AccountResponse rename(String accountNumber, String nickname) {
        Account a = getOwnedAccount(accountNumber, currentUser.get());
        a.setNickname(blankToNull(nickname));
        return Mappers.toAccount(a);
    }

    @Transactional
    public AccountResponse close(String accountNumber) {
        User user = currentUser.get();
        Account a = getOwnedAccount(accountNumber, user);
        if (!Mappers.isOpen(a)) {
            throw ApiException.badRequest("This account is already closed");
        }
        if (Mappers.isFrozen(a)) {
            throw ApiException.badRequest("A frozen account can't be closed. Contact support.");
        }
        if (a.getBalance().signum() != 0) {
            throw ApiException.badRequest("Move the remaining " + Mappers.money(a.getBalance())
                    + " out of this account before closing it");
        }
        a.setIsActive(false);
        a.setClosedAt(LocalDateTime.now());
        notificationService.notify(user, Notification.Kind.ACCOUNT, "Account closed",
                "Account " + a.getAccountNumber() + " has been closed.");
        return Mappers.toAccount(a);
    }

    /** Lets a sender confirm who they're paying before they pay. */
    public AccountLookupResponse lookup(String accountNumber) {
        currentUser.get(); // must be signed in
        Account a = accountRepository.findByAccountNumber(accountNumber.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> ApiException.notFound("No account found with that number"));
        return new AccountLookupResponse(
                a.getAccountNumber(),
                Mappers.maskName(a.getUser().getFullName()),
                a.getAccountType().name(),
                Mappers.isOpen(a) && !Mappers.isFrozen(a));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String prettyType(Account.AccountType t) {
        return switch (t) {
            case SAVINGS -> "savings";
            case CURRENT -> "current";
            case FIXED_DEPOSIT -> "fixed deposit";
        };
    }
}
