package com.bankapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** An in-app message shown in the bell menu (money received, account frozen, ...). */
@Entity
@Table(name = "notifications", indexes = @Index(columnList = "user_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Kind kind;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 255)
    private String message;

    @Column(name = "is_read", nullable = false)
    private Boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Kind {
        CREDIT, DEBIT, SECURITY, ACCOUNT, INFO
    }
}
