package com.bankapp.repository;

import com.bankapp.model.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);

    List<Account> findByUserIdOrderByCreatedAtAsc(Long userId);

    long countByUserIdAndIsActiveTrue(Long userId);

    /**
     * Loads an account and locks its row (SELECT ... FOR UPDATE) until the surrounding
     * transaction ends. Two transfers touching the same account then run one after the
     * other instead of both reading the old balance and overwriting each other.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.accountNumber = :accountNumber")
    Optional<Account> findByAccountNumberForUpdate(@Param("accountNumber") String accountNumber);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.user.id = :userId AND a.isActive = true")
    BigDecimal getTotalBalanceByUserId(@Param("userId") Long userId);

    // ---- Admin ----
    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.isActive = true")
    BigDecimal getTotalDeposits();

    long countByIsActiveTrue();

    long countByIsFrozenTrue();

    @Query("SELECT a FROM Account a JOIN FETCH a.user ORDER BY a.createdAt DESC")
    List<Account> findAllWithUser();
}
