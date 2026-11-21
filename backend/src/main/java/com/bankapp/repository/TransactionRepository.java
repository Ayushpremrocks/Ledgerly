package com.bankapp.repository;

import com.bankapp.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionId(String transactionId);

    /** Every transaction that touched this account (sent or received), newest first. */
    @Query("SELECT t FROM Transaction t WHERE t.fromAccount.id = :accountId OR t.toAccount.id = :accountId " +
           "ORDER BY t.transactionDate DESC, t.id DESC")
    List<Transaction> findByAccountId(@Param("accountId") Long accountId);

    /**
     * Every transaction touching any of the user's accounts. LEFT JOINs matter here:
     * deposits have no "from" account and withdrawals have no "to" account.
     */
    @Query("SELECT t FROM Transaction t LEFT JOIN t.fromAccount fa LEFT JOIN t.toAccount ta " +
           "WHERE fa.user.id = :userId OR ta.user.id = :userId " +
           "ORDER BY t.transactionDate DESC, t.id DESC")
    List<Transaction> findByUserId(@Param("userId") Long userId);

    /** Money this user sent to other people since a point in time (for the daily limit). */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.fromAccount.user.id = :userId AND t.toAccount.user.id <> :userId " +
           "AND t.transactionType = 'TRANSFER' AND t.status = 'COMPLETED' " +
           "AND t.transactionDate >= :since")
    BigDecimal sumOutgoingTransfersSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    // ---- Admin ----
    List<Transaction> findTop50ByOrderByTransactionDateDesc();

    List<Transaction> findByTransactionDateGreaterThanEqual(LocalDateTime since);
}
