package com.bankapp.controller;

import com.bankapp.dto.MoneyRequest;
import com.bankapp.dto.TransactionResponse;
import com.bankapp.dto.TransferRequest;
import com.bankapp.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/transfer")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse transfer(@Valid @RequestBody TransferRequest request) {
        return transactionService.transferFunds(request);
    }

    @PostMapping("/deposit")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse deposit(@Valid @RequestBody MoneyRequest request) {
        return transactionService.deposit(request);
    }

    @PostMapping("/withdraw")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse withdraw(@Valid @RequestBody MoneyRequest request) {
        return transactionService.withdraw(request);
    }

    /** All of the signed-in user's transactions. Every filter is optional. */
    @GetMapping("/my")
    public List<TransactionResponse> mine(
            @RequestParam(required = false) String account,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q) {
        return transactionService.getMyTransactions(account, type, direction, category, from, to, q);
    }

    @GetMapping("/account/{accountNumber}")
    public List<TransactionResponse> byAccount(@PathVariable String accountNumber) {
        return transactionService.getAccountTransactions(accountNumber);
    }

    /** Downloadable CSV statement, e.g. /account/ACC123/statement?from=2026-01-01&to=2026-01-31 */
    @GetMapping("/account/{accountNumber}/statement")
    public ResponseEntity<byte[]> statement(
            @PathVariable String accountNumber,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        String csv = transactionService.statementCsv(accountNumber, from, to);
        String fileName = "ledgerly-statement-" + accountNumber + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping("/{transactionId}")
    public TransactionResponse byId(@PathVariable String transactionId) {
        return transactionService.getTransactionById(transactionId);
    }
}
