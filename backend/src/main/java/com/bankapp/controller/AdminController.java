package com.bankapp.controller;

import com.bankapp.dto.AccountResponse;
import com.bankapp.dto.AdminDtos;
import com.bankapp.dto.TransactionResponse;
import com.bankapp.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin-only (enforced for /api/admin/** in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public AdminDtos.Stats stats() {
        return adminService.stats();
    }

    @GetMapping("/users")
    public List<AdminDtos.UserRow> users() {
        return adminService.users();
    }

    @PatchMapping("/users/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setUserStatus(@PathVariable Long id, @Valid @RequestBody AdminDtos.StatusRequest request) {
        adminService.setUserActive(id, request.active());
    }

    @GetMapping("/accounts")
    public List<AccountResponse> accounts() {
        return adminService.accounts();
    }

    @PatchMapping("/accounts/{accountNumber}/freeze")
    public AccountResponse freeze(@PathVariable String accountNumber,
                                  @Valid @RequestBody AdminDtos.FreezeRequest request) {
        return adminService.setFrozen(accountNumber, request.frozen());
    }

    @GetMapping("/transactions")
    public List<TransactionResponse> transactions() {
        return adminService.recentTransactions();
    }
}
