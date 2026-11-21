package com.bankapp.service;

import com.bankapp.dto.InsightsResponse;
import com.bankapp.dto.InsightsResponse.CategoryShare;
import com.bankapp.dto.InsightsResponse.Counterparty;
import com.bankapp.dto.InsightsResponse.MonthPoint;
import com.bankapp.dto.TransactionResponse;
import com.bankapp.model.User;
import com.bankapp.repository.AccountRepository;
import com.bankapp.service.support.CurrentUser;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Spending summaries for the Insights page. Money moved between the user's own
 * accounts (INTERNAL) is ignored: it isn't really money in or out.
 */
@Service
public class InsightsService {

    private static final int MONTHS = 6;

    private final TransactionService transactionService;
    private final AccountRepository accountRepository;
    private final CurrentUser currentUser;

    public InsightsService(TransactionService transactionService, AccountRepository accountRepository,
                           CurrentUser currentUser) {
        this.transactionService = transactionService;
        this.accountRepository = accountRepository;
        this.currentUser = currentUser;
    }

    public InsightsResponse getInsights() {
        User user = currentUser.get();
        List<TransactionResponse> all = transactionService.allForUser(user);
        YearMonth thisMonth = YearMonth.now();

        // Monthly money in / out for the last 6 months (oldest first)
        Map<YearMonth, BigDecimal[]> byMonth = new LinkedHashMap<>();
        for (int i = MONTHS - 1; i >= 0; i--) {
            byMonth.put(thisMonth.minusMonths(i), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }
        for (TransactionResponse t : all) {
            BigDecimal[] slot = byMonth.get(YearMonth.from(t.transactionDate()));
            if (slot == null) continue;
            if ("CREDIT".equals(t.direction())) slot[0] = slot[0].add(t.amount());
            if ("DEBIT".equals(t.direction())) slot[1] = slot[1].add(t.amount());
        }
        List<MonthPoint> months = new ArrayList<>();
        byMonth.forEach((ym, v) -> months.add(new MonthPoint(ym.toString(), v[0], v[1])));

        // Spending by category this month
        List<TransactionResponse> spentThisMonth = all.stream()
                .filter(t -> "DEBIT".equals(t.direction()))
                .filter(t -> YearMonth.from(t.transactionDate()).equals(thisMonth))
                .toList();
        List<CategoryShare> categories = spentThisMonth.stream()
                .collect(Collectors.groupingBy(TransactionResponse::category))
                .entrySet().stream()
                .map(e -> new CategoryShare(e.getKey(), sum(e.getValue()), e.getValue().size()))
                .sorted(Comparator.comparing(CategoryShare::amount).reversed())
                .toList();

        // Who the user paid most in the last 90 days
        LocalDate since = LocalDate.now().minusDays(90);
        List<Counterparty> topPayees = all.stream()
                .filter(t -> "DEBIT".equals(t.direction()) && "TRANSFER".equals(t.transactionType()))
                .filter(t -> !t.transactionDate().toLocalDate().isBefore(since))
                .collect(Collectors.groupingBy(TransactionResponse::toAccountNumber))
                .values().stream()
                .map(list -> new Counterparty(list.get(0).toName(), list.get(0).toAccountNumber(), sum(list), list.size()))
                .sorted(Comparator.comparing(Counterparty::amount).reversed())
                .limit(5)
                .toList();

        MonthPoint current = months.get(months.size() - 1);
        MonthPoint previous = months.get(months.size() - 2);
        long countThisMonth = all.stream()
                .filter(t -> YearMonth.from(t.transactionDate()).equals(thisMonth))
                .count();

        return new InsightsResponse(
                accountRepository.getTotalBalanceByUserId(user.getId()),
                current.moneyIn(),
                current.moneyOut(),
                previous.moneyOut(),
                countThisMonth,
                months,
                categories,
                topPayees);
    }

    private static BigDecimal sum(List<TransactionResponse> list) {
        return list.stream().map(TransactionResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
