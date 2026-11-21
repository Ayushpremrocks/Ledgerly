package com.bankapp.service;

import com.bankapp.dto.MoneyRequest;
import com.bankapp.dto.TransactionResponse;
import com.bankapp.dto.TransferRequest;
import com.bankapp.exception.ApiException;
import com.bankapp.model.Account;
import com.bankapp.model.Notification;
import com.bankapp.model.Transaction;
import com.bankapp.model.User;
import com.bankapp.repository.AccountRepository;
import com.bankapp.repository.TransactionRepository;
import com.bankapp.service.support.BankLimits;
import com.bankapp.service.support.CurrentUser;
import com.bankapp.service.support.Mappers;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final XmlTransactionService xmlTransactionService;
    private final NotificationService notificationService;
    private final CurrentUser currentUser;
    private final BankLimits limits;

    public TransactionService(TransactionRepository transactionRepository,
                              AccountRepository accountRepository,
                              XmlTransactionService xmlTransactionService,
                              NotificationService notificationService,
                              CurrentUser currentUser,
                              BankLimits limits) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.xmlTransactionService = xmlTransactionService;
        this.notificationService = notificationService;
        this.currentUser = currentUser;
        this.limits = limits;
    }

    // ------------------------------------------------------------------ moving money

    @Transactional
    public TransactionResponse transferFunds(TransferRequest request) {
        User user = currentUser.get();
        String fromNo = normalize(request.fromAccountNumber());
        String toNo = normalize(request.toAccountNumber());
        BigDecimal amount = checkAmount(request.amount());

        if (fromNo.equals(toNo)) {
            throw ApiException.badRequest("You can't send money to the same account");
        }

        // Lock both rows, always in the same order (by account number). If two transfers
        // between A and B run at once, both try A first, so they can't deadlock each other.
        boolean fromFirst = fromNo.compareTo(toNo) < 0;
        Account first = lock(fromFirst ? fromNo : toNo);
        Account second = lock(fromFirst ? toNo : fromNo);
        Account from = fromFirst ? first : second;
        Account to = fromFirst ? second : first;

        if (from == null || !from.getUser().getId().equals(user.getId())) {
            throw ApiException.forbidden("You can only send money from your own accounts");
        }
        if (to == null) {
            throw ApiException.notFound("We couldn't find an account with that number");
        }
        ensureUsable(from);
        if (!Mappers.isOpen(to) || Mappers.isFrozen(to)) {
            throw ApiException.badRequest("The receiving account can't accept payments right now");
        }

        boolean internal = to.getUser().getId().equals(user.getId());
        if (!internal) {
            BigDecimal sentToday = transactionRepository.sumOutgoingTransfersSince(
                    user.getId(), LocalDate.now().atStartOfDay());
            BigDecimal left = limits.dailyTransfer().subtract(sentToday).max(BigDecimal.ZERO);
            if (amount.compareTo(left) > 0) {
                throw ApiException.badRequest("This would go over your daily limit of "
                        + Mappers.money(limits.dailyTransfer()) + ". You can send "
                        + Mappers.money(left) + " more today.");
            }
        }
        ensureFunds(from, amount);

        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));

        Transaction t = newTransaction(Transaction.TransactionType.TRANSFER, amount, from, to,
                request.description(),
                Mappers.parseCategory(request.category(), internal ? Transaction.Category.SAVINGS : Transaction.Category.GENERAL));
        t = transactionRepository.save(t);
        xmlTransactionService.saveTransaction(t);

        if (!internal) {
            notificationService.notify(user, Notification.Kind.DEBIT,
                    "Sent " + Mappers.money(amount) + " to " + to.getUser().getFullName(),
                    noteOr(request.description(), "From account " + from.getAccountNumber()));
            notificationService.notify(to.getUser(), Notification.Kind.CREDIT,
                    "Received " + Mappers.money(amount) + " from " + user.getFullName(),
                    noteOr(request.description(), "Into account " + to.getAccountNumber()));
        }

        Set<Long> mine = Set.of(from.getId(), internal ? to.getId() : -1L);
        return Mappers.toTransaction(t, a -> mine.contains(a.getId()), null);
    }

    @Transactional
    public TransactionResponse deposit(MoneyRequest request) {
        User user = currentUser.get();
        BigDecimal amount = checkAmount(request.amount());
        if (amount.compareTo(limits.maxDeposit()) > 0) {
            throw ApiException.badRequest("You can deposit at most " + Mappers.money(limits.maxDeposit()) + " at a time");
        }
        Account account = lockOwned(normalize(request.accountNumber()), user);
        ensureUsable(account);

        Transaction t = recordDeposit(account, amount,
                noteOr(request.description(), "Cash deposit"),
                Mappers.parseCategory(request.category(), Transaction.Category.OTHER));
        notificationService.notify(user, Notification.Kind.CREDIT,
                "Deposited " + Mappers.money(amount),
                "Into account " + account.getAccountNumber());
        return Mappers.toTransaction(t, a -> a.getId().equals(account.getId()), null);
    }

    @Transactional
    public TransactionResponse withdraw(MoneyRequest request) {
        User user = currentUser.get();
        BigDecimal amount = checkAmount(request.amount());
        Account account = lockOwned(normalize(request.accountNumber()), user);
        ensureUsable(account);
        ensureFunds(account, amount);

        account.setBalance(account.getBalance().subtract(amount));
        Transaction t = transactionRepository.save(newTransaction(Transaction.TransactionType.WITHDRAWAL, amount,
                account, null, noteOr(request.description(), "Cash withdrawal"),
                Mappers.parseCategory(request.category(), Transaction.Category.OTHER)));
        xmlTransactionService.saveTransaction(t);

        notificationService.notify(user, Notification.Kind.DEBIT,
                "Withdrew " + Mappers.money(amount),
                "From account " + account.getAccountNumber());
        return Mappers.toTransaction(t, a -> a.getId().equals(account.getId()), null);
    }

    /** Adds money to an account and records it. Caller must hold the account's row lock or own a fresh account. */
    Transaction recordDeposit(Account account, BigDecimal amount, String description, Transaction.Category category) {
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);
        Transaction t = transactionRepository.save(newTransaction(Transaction.TransactionType.DEPOSIT, amount,
                null, account, description, category));
        xmlTransactionService.saveTransaction(t);
        return t;
    }

    // ------------------------------------------------------------------ reading history

    /** One account's history, newest first, with the balance after each transaction. */
    public List<TransactionResponse> getAccountTransactions(String accountNumber) {
        Account account = getOwned(normalize(accountNumber), currentUser.get());
        return withRunningBalance(account);
    }

    /**
     * All of the user's transactions across accounts, with optional filters.
     * All parameters may be null. Dates are inclusive.
     */
    public List<TransactionResponse> getMyTransactions(String accountNumber, String type, String direction,
                                                       String category, LocalDate fromDate, LocalDate toDate,
                                                       String query) {
        User user = currentUser.get();
        Predicate<Account> isMine = a -> a.getUser().getId().equals(user.getId());

        String q = query == null ? null : query.trim().toLowerCase(Locale.ROOT);
        return transactionRepository.findByUserId(user.getId()).stream()
                .filter(t -> accountNumber == null || accountNumber.isBlank()
                        || matchesAccount(t, normalize(accountNumber)))
                .filter(t -> type == null || type.isBlank() || t.getTransactionType().name().equalsIgnoreCase(type))
                .filter(t -> fromDate == null || !t.getTransactionDate().toLocalDate().isBefore(fromDate))
                .filter(t -> toDate == null || !t.getTransactionDate().toLocalDate().isAfter(toDate))
                .map(t -> Mappers.toTransaction(t, isMine, null))
                .filter(r -> direction == null || direction.isBlank() || r.direction().equalsIgnoreCase(direction))
                .filter(r -> category == null || category.isBlank() || r.category().equalsIgnoreCase(category))
                .filter(r -> q == null || q.isEmpty() || matchesQuery(r, q))
                .toList();
    }

    public TransactionResponse getTransactionById(String transactionId) {
        User user = currentUser.get();
        Transaction t = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> ApiException.notFound("Transaction not found"));
        Predicate<Account> isMine = a -> a.getUser().getId().equals(user.getId());
        boolean visible = (t.getFromAccount() != null && isMine.test(t.getFromAccount()))
                || (t.getToAccount() != null && isMine.test(t.getToAccount()));
        if (!visible) {
            throw ApiException.notFound("Transaction not found");
        }
        return Mappers.toTransaction(t, isMine, null);
    }

    /** CSV statement for one account between two dates (inclusive). Opens in Excel / Sheets. */
    public String statementCsv(String accountNumber, LocalDate fromDate, LocalDate toDate) {
        Account account = getOwned(normalize(accountNumber), currentUser.get());
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        List<TransactionResponse> rows = new ArrayList<>(withRunningBalance(account));
        rows.removeIf(r -> (fromDate != null && r.transactionDate().toLocalDate().isBefore(fromDate))
                || (toDate != null && r.transactionDate().toLocalDate().isAfter(toDate)));
        java.util.Collections.reverse(rows); // statements read oldest -> newest

        StringBuilder csv = new StringBuilder();
        csv.append("Date,Transaction ID,Type,Description,Category,Counterparty,Debit,Credit,Balance\n");
        for (TransactionResponse r : rows) {
            boolean credit = "CREDIT".equals(r.direction());
            String counterparty = credit
                    ? (r.fromName() != null ? r.fromName() + " (" + r.fromAccountNumber() + ")" : "Cash")
                    : (r.toName() != null ? r.toName() + " (" + r.toAccountNumber() + ")" : "Cash");
            csv.append(r.transactionDate().format(fmt)).append(',')
               .append(r.transactionId()).append(',')
               .append(r.transactionType()).append(',')
               .append(csvField(r.description())).append(',')
               .append(r.category()).append(',')
               .append(csvField(counterparty)).append(',')
               .append(credit ? "" : r.amount().toPlainString()).append(',')
               .append(credit ? r.amount().toPlainString() : "").append(',')
               .append(r.balanceAfter().toPlainString()).append('\n');
        }
        return csv.toString();
    }

    // ------------------------------------------------------------------ helpers

    private List<TransactionResponse> withRunningBalance(Account account) {
        // Walk from newest to oldest: the newest row ends at today's balance, and each
        // older row ends at (that balance minus the newer row's effect).
        BigDecimal running = account.getBalance();
        List<TransactionResponse> out = new ArrayList<>();
        for (Transaction t : transactionRepository.findByAccountId(account.getId())) {
            TransactionResponse r = Mappers.toTransaction(t, a -> a.getId().equals(account.getId()), running);
            out.add(r);
            running = "CREDIT".equals(r.direction()) ? running.subtract(t.getAmount()) : running.add(t.getAmount());
        }
        return out;
    }

    private Transaction newTransaction(Transaction.TransactionType type, BigDecimal amount, Account from, Account to,
                                       String description, Transaction.Category category) {
        Transaction t = new Transaction();
        t.setTransactionId("TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 13).toUpperCase());
        t.setTransactionType(type);
        t.setAmount(amount);
        t.setFromAccount(from);
        t.setToAccount(to);
        t.setDescription(description == null || description.isBlank() ? null : description.trim());
        t.setCategory(category);
        t.setStatus(Transaction.TransactionStatus.COMPLETED);
        t.setTransactionDate(LocalDateTime.now());
        return t;
    }

    private BigDecimal checkAmount(BigDecimal raw) {
        BigDecimal amount = raw.setScale(2, RoundingMode.HALF_UP);
        if (amount.compareTo(limits.minAmount()) < 0) {
            throw ApiException.badRequest("The minimum amount is " + Mappers.money(limits.minAmount()));
        }
        if (amount.compareTo(limits.maxPerTransaction()) > 0) {
            throw ApiException.badRequest("The maximum per transaction is " + Mappers.money(limits.maxPerTransaction()));
        }
        return amount;
    }

    private void ensureUsable(Account a) {
        if (!Mappers.isOpen(a)) throw ApiException.badRequest("This account is closed");
        if (Mappers.isFrozen(a)) throw ApiException.badRequest("This account is frozen. Contact support to unfreeze it.");
    }

    private void ensureFunds(Account a, BigDecimal amount) {
        if (a.getBalance().compareTo(amount) < 0) {
            throw ApiException.badRequest("Not enough money. Available: " + Mappers.money(a.getBalance()));
        }
    }

    private Account lock(String accountNumber) {
        return accountRepository.findByAccountNumberForUpdate(accountNumber).orElse(null);
    }

    private Account lockOwned(String accountNumber, User user) {
        Account a = lock(accountNumber);
        if (a == null || !a.getUser().getId().equals(user.getId())) {
            throw ApiException.notFound("Account not found");
        }
        return a;
    }

    private Account getOwned(String accountNumber, User user) {
        Account a = accountRepository.findByAccountNumber(accountNumber).orElse(null);
        if (a == null || !a.getUser().getId().equals(user.getId())) {
            throw ApiException.notFound("Account not found");
        }
        return a;
    }

    private static boolean matchesAccount(Transaction t, String accountNumber) {
        return (t.getFromAccount() != null && t.getFromAccount().getAccountNumber().equals(accountNumber))
                || (t.getToAccount() != null && t.getToAccount().getAccountNumber().equals(accountNumber));
    }

    private static boolean matchesQuery(TransactionResponse r, String q) {
        return java.util.stream.Stream.of(r.description(), r.fromName(), r.toName(), r.transactionId(),
                        r.fromAccountNumber(), r.toAccountNumber(), r.category())
                .filter(java.util.Objects::nonNull)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .anyMatch(s -> s.contains(q));
    }

    private static String normalize(String accountNumber) {
        return accountNumber == null ? "" : accountNumber.trim().toUpperCase(Locale.ROOT);
    }

    private static String noteOr(String note, String fallback) {
        return note == null || note.isBlank() ? fallback : note.trim();
    }

    private static String csvField(String s) {
        if (s == null) return "";
        String escaped = s.replace("\"", "\"\"");
        // Prefix formula-looking cells so spreadsheets don't execute them.
        if (!escaped.isEmpty() && "=+-@".indexOf(escaped.charAt(0)) >= 0) escaped = "'" + escaped;
        return "\"" + escaped + "\"";
    }

    /** Used by InsightsService: every transaction of the user, already mapped from their point of view. */
    List<TransactionResponse> allForUser(User user) {
        Predicate<Account> isMine = a -> a.getUser().getId().equals(user.getId());
        return transactionRepository.findByUserId(user.getId()).stream()
                .map(t -> Mappers.toTransaction(t, isMine, null))
                .collect(Collectors.toList());
    }
}
