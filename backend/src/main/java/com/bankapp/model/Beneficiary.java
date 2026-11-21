package com.bankapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** A saved payee: an account the user sends money to often. */
@Entity
@Table(name = "beneficiaries",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "account_number"}))
@Getter
@Setter
@NoArgsConstructor
public class Beneficiary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "account_number", nullable = false, length = 20)
    private String accountNumber;

    @Column(nullable = false, length = 40)
    private String nickname;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
