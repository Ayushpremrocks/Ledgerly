package com.bankapp.service;

import com.bankapp.dto.BeneficiaryRequest;
import com.bankapp.dto.BeneficiaryResponse;
import com.bankapp.exception.ApiException;
import com.bankapp.model.Account;
import com.bankapp.model.Beneficiary;
import com.bankapp.model.User;
import com.bankapp.repository.AccountRepository;
import com.bankapp.repository.BeneficiaryRepository;
import com.bankapp.service.support.CurrentUser;
import com.bankapp.service.support.Mappers;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final AccountRepository accountRepository;
    private final CurrentUser currentUser;

    public BeneficiaryService(BeneficiaryRepository beneficiaryRepository, AccountRepository accountRepository,
                              CurrentUser currentUser) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.accountRepository = accountRepository;
        this.currentUser = currentUser;
    }

    public List<BeneficiaryResponse> list() {
        User user = currentUser.get();
        return beneficiaryRepository.findByUserIdOrderByNicknameAsc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BeneficiaryResponse add(BeneficiaryRequest request) {
        User user = currentUser.get();
        String number = request.accountNumber().trim().toUpperCase(Locale.ROOT);

        Account account = accountRepository.findByAccountNumber(number)
                .orElseThrow(() -> ApiException.notFound("No account found with that number"));
        if (account.getUser().getId().equals(user.getId())) {
            throw ApiException.badRequest("That's one of your own accounts. You can already move money to it.");
        }
        if (beneficiaryRepository.existsByUserIdAndAccountNumber(user.getId(), number)) {
            throw ApiException.conflict("This payee is already saved");
        }

        Beneficiary b = new Beneficiary();
        b.setUser(user);
        b.setAccountNumber(number);
        b.setNickname(request.nickname().trim());
        return toResponse(beneficiaryRepository.save(b));
    }

    @Transactional
    public void delete(Long id) {
        Beneficiary b = beneficiaryRepository.findByIdAndUserId(id, currentUser.get().getId())
                .orElseThrow(() -> ApiException.notFound("Payee not found"));
        beneficiaryRepository.delete(b);
    }

    private BeneficiaryResponse toResponse(Beneficiary b) {
        String owner = accountRepository.findByAccountNumber(b.getAccountNumber())
                .map(a -> Mappers.maskName(a.getUser().getFullName()))
                .orElse("Account no longer exists");
        return new BeneficiaryResponse(b.getId(), b.getNickname(), b.getAccountNumber(), owner, b.getCreatedAt());
    }
}
