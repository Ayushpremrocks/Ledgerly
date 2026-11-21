package com.bankapp.repository;

import com.bankapp.model.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {

    List<Beneficiary> findByUserIdOrderByNicknameAsc(Long userId);

    boolean existsByUserIdAndAccountNumber(Long userId, String accountNumber);

    Optional<Beneficiary> findByIdAndUserId(Long id, Long userId);
}
