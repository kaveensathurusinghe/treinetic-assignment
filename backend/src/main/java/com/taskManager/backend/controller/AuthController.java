package com.taskManager.backend.controller;

import com.taskManager.backend.dto.auth.JwtResponse;
import com.taskManager.backend.dto.auth.LoginRequest;
import com.taskManager.backend.dto.auth.RegisterRequest;
import com.taskManager.backend.model.User;
import com.taskManager.backend.repository.UserRepository;
import com.taskManager.backend.security.JwtUtil;
import com.taskManager.backend.security.CustomUserDetailsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost"})
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwt = jwtUtil.generateToken(userDetails);

            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow();

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name()
            ));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Invalid username or password");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        Map<String, String> response = new HashMap<>();

        try {
            // Check if username exists
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                response.put("message", "Username is already taken");
                return ResponseEntity
                        .badRequest()
                        .body(response);
            }

            // Check if email exists
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                response.put("message", "Email is already registered");
                return ResponseEntity
                        .badRequest()
                        .body(response);
            }

            // Create new user
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setEmail(registerRequest.getEmail());
            user.setFullName(registerRequest.getFullName());

            userRepository.save(user);

            response.put("message", "User registered successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow();

        return ResponseEntity.ok(new JwtResponse(
                null,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
        ));
    }
}