package com.reon.backend.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.reon.backend.global.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

@Component
public class GoogleTokenVerifier {
    public record GoogleProfile(String subject, String name, String email, String profileImageUrl) {}
    private final GoogleIdTokenVerifier verifier;
    private final boolean configured;

    @Autowired
    public GoogleTokenVerifier(@Value("${google.client-id}") String clientId) {
        configured = !clientId.isBlank();
        verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(List.of(clientId)).build();
    }

    GoogleTokenVerifier(GoogleIdTokenVerifier verifier) {
        this.verifier = verifier;
        this.configured = true;
    }

    public GoogleProfile verify(String token) {
        if (!configured) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_AUTH_NOT_CONFIGURED",
                    "Google 로그인 설정이 필요합니다.");
        }
        GoogleIdToken parsed;
        try {
            parsed = GoogleIdToken.parse(GsonFactory.getDefaultInstance(), token);
        } catch (IOException | IllegalArgumentException exception) {
            throw invalidToken();
        }
        GoogleIdToken verified;
        try {
            verified = verifier.verify(parsed) ? parsed : null;
        } catch (IllegalArgumentException | GeneralSecurityException exception) {
            throw invalidToken();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "GOOGLE_AUTH_UNAVAILABLE",
                    "Google 인증 정보를 확인하지 못했습니다.");
        }
        if (verified == null) { throw invalidToken(); }
        var payload = verified.getPayload();
        String subject = payload.getSubject();
        String email = payload.getEmail();
        Object nameValue = payload.get("name");
        Object pictureValue = payload.get("picture");
        if (!valid(subject, 255) || !valid(email, 320) || !Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw invalidToken();
        }
        String name = nameValue instanceof String text && !text.isBlank() ? text : email;
        String picture = pictureValue instanceof String text ? text : null;
        if (name.length() > 255 || (picture != null && picture.length() > 2048)) { throw invalidToken(); }
        return new GoogleProfile(subject, name, email, picture);
    }

    private boolean valid(String text, int maxLength) {
        return text != null && !text.isBlank() && text.length() <= maxLength;
    }

    private ApiException invalidToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN",
                "유효하지 않은 Google 인증 정보입니다.");
    }
}
