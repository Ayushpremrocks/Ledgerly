package com.bankapp.controller;

import com.bankapp.model.Transaction;
import com.bankapp.repository.TransactionRepository;
import com.bankapp.service.XmlTransactionService;
import com.bankapp.xml.TransactionListXml;
import com.bankapp.xml.TransactionXml;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/xml")
public class XmlController {

    private final XmlTransactionService xmlTransactionService;
    private final TransactionRepository transactionRepository;

    public XmlController(XmlTransactionService xmlTransactionService,
                        TransactionRepository transactionRepository) {
        this.xmlTransactionService = xmlTransactionService;
        this.transactionRepository = transactionRepository;
    }

    @GetMapping("/transactions/list")
    public ResponseEntity<?> listXmlFiles() {
        try {
            List<String> files = xmlTransactionService.listXmlFiles();
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/transactions/read/{fileName}")
    public ResponseEntity<?> readXmlFile(@PathVariable String fileName) {
        try {
            if (fileName.contains("transaction_list")) {
                TransactionListXml data = xmlTransactionService.readTransactionList(fileName);
                return ResponseEntity.ok(data);
            } else {
                TransactionXml data = xmlTransactionService.readTransaction(fileName);
                return ResponseEntity.ok(data);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/transactions/export-all")
    public ResponseEntity<?> exportAllTransactions() {
        try {
            List<Transaction> transactions = transactionRepository.findAll();
            String fileName = "transaction_list_" + 
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xml";
            
            xmlTransactionService.saveTransactionList(transactions, fileName);
            
            return ResponseEntity.ok(new SuccessResponse("All transactions exported to: " + fileName));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    record ErrorResponse(String message) {}
    record SuccessResponse(String message) {}
}
