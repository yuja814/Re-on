package com.reon.backend.youtube.service;

import com.reon.backend.global.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GoogleOAuthClientTests {
    private MockRestServiceServer server;
    private GoogleOAuthClient client;
    @BeforeEach void setUp() {
        var builder = RestClient.builder().baseUrl("https://oauth2.googleapis.com");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new GoogleOAuthClient(builder.build(), "client-id", "client-secret", "http://localhost:8081/callback");
    }
    private String response(String scope) {
        return "{\"access_token\":\"access\",\"refresh_token\":\"refresh\",\"expires_in\":3600,\"token_type\":\"Bearer\",\"scope\":\"" + scope + "\"}";
    }
    @Test void exchangesCodeWithFormEncodedSecretAndPkce() {
        server.expect(requestTo("https://oauth2.googleapis.com/token")).andExpect(method(HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(content().formDataContains(Map.of("client_secret", "client-secret", "code", "code", "code_verifier", "verifier", "redirect_uri", "http://localhost:8081/callback")))
                .andRespond(withSuccess(response(GoogleOAuthClient.SCOPE), MediaType.APPLICATION_JSON));
        assertEquals("access", client.exchange("code", "verifier").accessToken()); server.verify();
    }
    @Test void refreshesWithoutAnotherAuthorizationCode() {
        server.expect(requestTo("https://oauth2.googleapis.com/token"))
                .andExpect(content().formDataContains(Map.of("grant_type", "refresh_token", "refresh_token", "old-refresh")))
                .andRespond(withSuccess("{\"access_token\":\"new\",\"expires_in\":3600,\"token_type\":\"Bearer\"}", MediaType.APPLICATION_JSON));
        assertEquals("new", client.refresh("old-refresh").accessToken()); server.verify();
    }
    @Test void distinguishesRevokedTokenFromNetworkFailure() {
        server.expect(requestTo("https://oauth2.googleapis.com/token"))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST).contentType(MediaType.APPLICATION_JSON).body("{\"error\":\"invalid_grant\"}"));
        assertThrows(GoogleOAuthClient.ReauthRequired.class, () -> client.refresh("refresh")); server.verify();
    }
    @Test void rejectsInvalidCodeAndHidesProviderBody() {
        server.expect(requestTo("https://oauth2.googleapis.com/token"))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST).body("{\"error\":\"invalid_grant\",\"error_description\":\"client-secret\"}"));
        var error = assertThrows(ApiException.class, () -> client.exchange("code", "verifier"));
        assertEquals("INVALID_YOUTUBE_AUTHORIZATION_CODE", error.code()); assertFalse(error.getMessage().contains("client-secret"));
    }
    @Test void rejectsReadonlyScope() {
        server.expect(requestTo("https://oauth2.googleapis.com/token"))
                .andRespond(withSuccess(response("https://www.googleapis.com/auth/youtube.readonly"), MediaType.APPLICATION_JSON));
        assertEquals("YOUTUBE_SCOPE_REQUIRED", assertThrows(ApiException.class, () -> client.exchange("code", "verifier")).code());
    }
    @Test void mapsServerErrorWithoutExposingSecrets() {
        server.expect(requestTo("https://oauth2.googleapis.com/token")).andRespond(withServerError().body("client-secret"));
        var error = assertThrows(ApiException.class, () -> client.refresh("refresh"));
        assertEquals("YOUTUBE_OAUTH_UNAVAILABLE", error.code()); assertNull(error.getCause());
    }
    @Test void authorizationUrlRequestsOfflineAccessAndPkce() {
        String url = client.authorizationUrl("state", "challenge");
        assertTrue(url.contains("access_type=offline")); assertTrue(url.contains("prompt=consent"));
        assertTrue(url.contains("code_challenge_method=S256")); assertTrue(url.contains("state=state"));
        assertFalse(url.contains("client-secret"));
    }
}
