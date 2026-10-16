package com.reon.backend.user.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "reon_users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "google_subject", nullable = false, unique = true, length = 255)
    private String googleSubject;
    @Column(nullable = false, length = 255)
    private String name;
    @Column(nullable = false, length = 320)
    private String email;
    @Column(name = "profile_image_url", length = 2048)
    private String profileImageUrl;

    protected User() {}

    public User(String googleSubject, String name, String email, String profileImageUrl) {
        this.googleSubject = googleSubject;
        updateProfile(name, email, profileImageUrl);
    }

    public void updateProfile(String name, String email, String profileImageUrl) {
        this.name = name;
        this.email = email;
        this.profileImageUrl = profileImageUrl;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getProfileImageUrl() { return profileImageUrl; }
}
