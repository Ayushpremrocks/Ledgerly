package com.bankapp.controller;

import com.bankapp.dto.ChangePasswordRequest;
import com.bankapp.dto.UpdateProfileRequest;
import com.bankapp.dto.UserProfileResponse;
import com.bankapp.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserProfileResponse me() {
        return userService.me();
    }

    @PutMapping
    public UserProfileResponse update(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(request);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
    }
}
