package com.bankapp.service.support;

import com.bankapp.exception.ApiException;
import com.bankapp.model.User;
import com.bankapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Looks up the logged-in user (set by JwtAuthenticationFilter) in the database. */
@Component
public class CurrentUser {

    private final UserRepository userRepository;

    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in"));
    }
}
