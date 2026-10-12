package com.reon.backend.youtube.service;

import com.reon.backend.global.ApiException;
import org.junit.jupiter.api.Test;
import java.util.Base64;
import static org.junit.jupiter.api.Assertions.*;

class TokenCipherTests {
    private final TokenCipher cipher = new TokenCipher(Base64.getEncoder().encodeToString(new byte[32]));
    @Test void encryptsWithDifferentNoncesAndDecrypts() {
        String first = cipher.encrypt("secret-refresh-token");
        String second = cipher.encrypt("secret-refresh-token");
        assertNotEquals(first, second);
        assertFalse(first.contains("secret-refresh-token"));
        assertEquals("secret-refresh-token", cipher.decrypt(first));
    }
    @Test void rejectsTamperingAndWrongKey() {
        byte[] bytes = Base64.getDecoder().decode(cipher.encrypt("token"));
        bytes[15] ^= 1;
        assertThrows(ApiException.class, () -> cipher.decrypt(Base64.getEncoder().encodeToString(bytes)));
        var otherKey = new byte[32]; otherKey[0] = 1;
        assertThrows(ApiException.class, () -> new TokenCipher(Base64.getEncoder().encodeToString(otherKey)).decrypt(cipher.encrypt("token")));
    }
    @Test void rejectsMissingKey() {
        assertEquals("YOUTUBE_OAUTH_NOT_CONFIGURED", assertThrows(ApiException.class, () -> new TokenCipher("").encrypt("token")).code());
    }
}
