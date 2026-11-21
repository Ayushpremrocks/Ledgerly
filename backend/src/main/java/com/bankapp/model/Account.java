package com.bankapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_number", nullable = false, unique = true, length = 20)
    private String accountNumber;

    @Column(name = "account_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AccountType accountType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(length = 3)
    private String currency = "INR";

    @Column(name = "is_active")
    private Boolean isActive = true; // false = closed by the owner

    // A friendly name the owner gives the account, e.g. "Rainy day fund"
    @Column(length = 40)
    private String nickname;

    // Frozen by an admin: no money can move in or out until unfrozen
    @Column(name = "is_frozen")
    private Boolean isFrozen = false;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Many Accounts belong to One User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // One Account can have Many Transactions (as sender)
    @OneToMany(mappedBy = "fromAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> sentTransactions;

    // One Account can have Many Transactions (as receiver)
    @OneToMany(mappedBy = "toAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> receivedTransactions;

    // Enum for account types
    public enum AccountType {
        SAVINGS, CURRENT, FIXED_DEPOSIT
    }
}
