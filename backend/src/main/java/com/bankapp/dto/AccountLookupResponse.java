package com.bankapp.dto;

/** What you see before paying someone: enough to confirm it's the right person, nothing more. */
public record AccountLookupResponse(String accountNumber, String ownerName, String accountType, boolean canReceive) {}
