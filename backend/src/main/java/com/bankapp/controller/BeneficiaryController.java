package com.bankapp.controller;

import com.bankapp.dto.BeneficiaryRequest;
import com.bankapp.dto.BeneficiaryResponse;
import com.bankapp.service.BeneficiaryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    public BeneficiaryController(BeneficiaryService beneficiaryService) {
        this.beneficiaryService = beneficiaryService;
    }

    @GetMapping
    public List<BeneficiaryResponse> list() {
        return beneficiaryService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BeneficiaryResponse add(@Valid @RequestBody BeneficiaryRequest request) {
        return beneficiaryService.add(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        beneficiaryService.delete(id);
    }
}
