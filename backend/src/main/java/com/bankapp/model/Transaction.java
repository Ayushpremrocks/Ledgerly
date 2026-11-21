package com.bankapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false, unique = true, length = 50)
    private String transactionId;

    @Column(name = "transaction_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(name = "transaction_date", nullable = false)
    @CreationTimestamp
    private LocalDateTime transactionDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Many Transactions come from One Account (sender)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_account_id")
    private Account fromAccount;

    // Many Transactions go to One Account (receiver)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_account_id")
    private Account toAccount;

    // What the money was for; drives the spending breakdown in Insights
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Category category;

    public enum Category {
        GENERAL, FOOD, SHOPPING, BILLS, RENT, TRAVEL, ENTERTAINMENT, HEALTH, EDUCATION, SALARY, SAVINGS, OTHER
    }

    // Enum for transaction types
    public enum TransactionType {
        DEPOSIT, WITHDRAWAL, TRANSFER, BILL_PAYMENT
    }

    // Enum for transaction status
    public enum TransactionStatus {
        PENDING, COMPLETED, FAILED, CANCELLED
    }
}
