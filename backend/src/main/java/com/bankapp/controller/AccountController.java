package com.bankapp.controller;

import com.bankapp.dto.AccountLookupResponse;
import com.bankapp.dto.AccountResponse;
import com.bankapp.dto.BalanceResponse;
import com.bankapp.dto.CreateAccountRequest;
import com.bankapp.service.AccountService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    public record TotalBalanceResponse(BigDecimal totalBalance, String currency) {}

    public record RenameRequest(@Size(max = 40, message = "Nickname can be at most 40 characters") String nickname) {}

    @PostMapping({"", "/create"})
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(@Valid @RequestBody CreateAccountRequest request) {
        return accountService.createAccount(request);
    }

    @GetMapping("/my-accounts")
    public List<AccountResponse> myAccounts() {
        return accountService.getMyAccounts();
    }

    @GetMapping("/total-balance")
    public TotalBalanceResponse totalBalance() {
        return new TotalBalanceResponse(accountService.getTotalBalance(), "INR");
    }

    /** Confirms who owns an account number before paying it (name is partly hidden). */
    @GetMapping("/lookup/{accountNumber}")
    public AccountLookupResponse lookup(@PathVariable String accountNumber) {
        return accountService.lookup(accountNumber);
    }

    @GetMapping("/{accountNumber}")
    public AccountResponse get(@PathVariable String accountNumber) {
        return accountService.getAccountByNumber(accountNumber);
    }

    @GetMapping("/{accountNumber}/balance")
    public BalanceResponse balance(@PathVariable String accountNumber) {
        return accountService.getBalance(accountNumber);
    }

    @PatchMapping("/{accountNumber}")
    public AccountResponse rename(@PathVariable String accountNumber, @Valid @RequestBody RenameRequest request) {
        return accountService.rename(accountNumber, request.nickname());
    }

    @PostMapping("/{accountNumber}/close")
    public AccountResponse close(@PathVariable String accountNumber) {
        return accountService.close(accountNumber);
    }
}
