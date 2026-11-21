package com.bankapp.service;

import com.bankapp.dto.ChangePasswordRequest;
import com.bankapp.dto.UpdateProfileRequest;
import com.bankapp.dto.UserProfileResponse;
import com.bankapp.exception.ApiException;
import com.bankapp.model.Notification;
import com.bankapp.model.User;
import com.bankapp.repository.UserRepository;
import com.bankapp.service.support.CurrentUser;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUser currentUser;
    private final NotificationService notificationService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, CurrentUser currentUser,
                       NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUser = currentUser;
        this.notificationService = notificationService;
    }

    public UserProfileResponse me() {
        return toProfile(currentUser.get());
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = currentUser.get();
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailAndIdNot(email, user.getId())) {
            throw ApiException.conflict("That email is already used by another profile");
        }
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhoneNumber(request.phoneNumber() == null || request.phoneNumber().isBlank()
                ? null : request.phoneNumber().trim());
        return toProfile(userRepository.save(user));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = currentUser.get();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw ApiException.badRequest("Your current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw ApiException.badRequest("The new password must be different from the current one");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        notificationService.notify(user, Notification.Kind.SECURITY, "Password changed",
                "If this wasn't you, contact support right away.");
    }

    static UserProfileResponse toProfile(User u) {
        return new UserProfileResponse(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(),
                u.getPhoneNumber(), u.getRole().name(), u.getCreatedAt(), u.getLastLoginAt());
    }
}
