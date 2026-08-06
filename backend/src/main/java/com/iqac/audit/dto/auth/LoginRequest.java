package com.iqac.audit.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    private String username;
    private String email;

    @NotBlank
    private String password;

    public LoginRequest() {}

    public LoginRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        if (username != null && !username.trim().isEmpty()) {
            return username;
        }
        return email;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
        if (this.username == null || this.username.trim().isEmpty()) {
            this.username = email;
        }
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}