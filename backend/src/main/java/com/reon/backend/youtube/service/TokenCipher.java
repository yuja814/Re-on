package com.reon.backend.youtube.service;

import com.reon.backend.global.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class TokenCipher {
    private final String encodedKey;
    private final SecureRandom random = new SecureRandom();
    public TokenCipher(@Value("${youtube.oauth.encryption-key}") String encodedKey) { this.encodedKey = encodedKey; }

    public void requireConfigured() { key(); }

    private SecretKeySpec key() {
        try {
            byte[] bytes = Base64.getDecoder().decode(encodedKey);
            if (bytes.length != 32) { throw new IllegalArgumentException(); }
            return new SecretKeySpec(bytes, "AES");
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "YOUTUBE_OAUTH_NOT_CONFIGURED", "YouTube 연결 설정이 필요합니다.");
        }
    }

    public String encrypt(String value) {
        var key = key();
        try {
            byte[] iv = new byte[12];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (GeneralSecurityException exception) { throw storageError(); }
    }

    public String decrypt(String value) {
        var key = key();
        try {
            byte[] combined = Base64.getDecoder().decode(value);
            if (combined.length < 28) { throw new IllegalArgumentException(); }
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, combined, 0, 12));
            return new String(cipher.doFinal(combined, 12, combined.length - 12), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException exception) { throw storageError(); }
    }

    private ApiException storageError() {
        return new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "YOUTUBE_TOKEN_STORAGE_ERROR", "YouTube 연결 정보를 읽거나 저장하지 못했습니다.");
    }
}
