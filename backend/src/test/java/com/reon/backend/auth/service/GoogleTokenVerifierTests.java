package com.reon.backend.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GooglePublicKeysManager;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.json.webtoken.JsonWebSignature;
import com.reon.backend.global.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.security.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GoogleTokenVerifierTests {
    private final GsonFactory json = GsonFactory.getDefaultInstance();
    private KeyPair keys;
    private GoogleTokenVerifier verifier;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keys = generator.generateKeyPair();
        var manager = spy(new GooglePublicKeysManager.Builder(new NetHttpTransport(), json).build());
        doReturn(List.of(keys.getPublic())).when(manager).getPublicKeys();
        verifier = new GoogleTokenVerifier(new GoogleIdTokenVerifier.Builder(manager)
                .setAudience(List.of("our-client")).build());
    }

    private String token(String audience, String issuer, long expiry, boolean verified, PrivateKey signingKey) throws Exception {
        long now = System.currentTimeMillis() / 1000;
        var payload = new GoogleIdToken.Payload();
        payload.setSubject("google-sub-123");
        payload.setAudience(audience);
        payload.setIssuer(issuer);
        payload.setIssuedAtTimeSeconds(now - 60);
        payload.setExpirationTimeSeconds(expiry);
        payload.setEmail("user@example.com");
        payload.setEmailVerified(verified);
        payload.set("name", "승환");
        payload.set("picture", "https://example.com/profile.png");
        var header = new JsonWebSignature.Header().setAlgorithm("RS256").setType("JWT");
        return JsonWebSignature.signUsingRsaSha256(signingKey, json, header, payload);
    }

    private long future() { return System.currentTimeMillis() / 1000 + 3600; }

    private void rejects(String token) {
        var error = assertThrows(ApiException.class, () -> verifier.verify(token));
        assertEquals("INVALID_GOOGLE_TOKEN", error.code());
        assertEquals(401, error.status().value());
    }

    @Test void acceptsSignedGoogleTokenForOurAudience() throws Exception {
        var profile = verifier.verify(token("our-client", "https://accounts.google.com", future(), true, keys.getPrivate()));
        assertEquals("google-sub-123", profile.subject());
        assertEquals("user@example.com", profile.email());
        assertEquals("승환", profile.name());
    }
    @Test void rejectsWrongAudience() throws Exception {
        rejects(token("other-client", "https://accounts.google.com", future(), true, keys.getPrivate()));
    }
    @Test void rejectsWrongIssuer() throws Exception {
        rejects(token("our-client", "https://evil.example", future(), true, keys.getPrivate()));
    }
    @Test void rejectsExpiredToken() throws Exception {
        rejects(token("our-client", "https://accounts.google.com", System.currentTimeMillis() / 1000 - 3600, true, keys.getPrivate()));
    }
    @Test void rejectsWrongSignature() throws Exception {
        var generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        rejects(token("our-client", "https://accounts.google.com", future(), true, generator.generateKeyPair().getPrivate()));
    }
    @Test void rejectsUnverifiedEmail() throws Exception {
        rejects(token("our-client", "https://accounts.google.com", future(), false, keys.getPrivate()));
    }
    @Test void rejectsMalformedToken() { rejects("not.a.valid-token"); }
    @Test void missingClientIdFailsClosed() {
        var error = assertThrows(ApiException.class, () -> new GoogleTokenVerifier("").verify("any-token"));
        assertEquals("GOOGLE_AUTH_NOT_CONFIGURED", error.code());
        assertEquals(503, error.status().value());
    }
}
