package com.reon.backend.youtube.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.reon.backend.global.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.*;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.json.JsonMapper;
import java.net.URI;
import java.time.Duration;
import java.util.Arrays;

@Component
public class GoogleOAuthClient {
    public static final String SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";
    public record Tokens(@JsonProperty("access_token") String accessToken,
            @JsonProperty("refresh_token") String refreshToken, @JsonProperty("expires_in") Long expiresIn,
            @JsonProperty("token_type") String tokenType, String scope) {}
    public static class ReauthRequired extends RuntimeException {}
    private final RestClient http;
    private final String clientId, clientSecret, redirectUri;

    @Autowired
    public GoogleOAuthClient(RestClient.Builder builder,
            @Value("${youtube.oauth.client-id}") String id, @Value("${youtube.oauth.client-secret}") String secret,
            @Value("${youtube.oauth.redirect-uri}") String redirectUri) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3)); factory.setReadTimeout(Duration.ofSeconds(5));
        this.http = builder.baseUrl("https://oauth2.googleapis.com").requestFactory(factory).build();
        this.clientId = id; this.clientSecret = secret; this.redirectUri = redirectUri;
    }

    GoogleOAuthClient(RestClient http, String id, String secret, String redirectUri) {
        this.http = http; this.clientId = id; this.clientSecret = secret; this.redirectUri = redirectUri;
    }

    public void requireConfigured() {
        try {
            URI uri = URI.create(redirectUri);
            boolean https = "https".equals(uri.getScheme());
            boolean local = "http".equals(uri.getScheme()) && ("localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost()));
            if (clientId.isBlank() || clientSecret.isBlank() || uri.getHost() == null || (!https && !local)
                    || uri.getUserInfo() != null || uri.getFragment() != null) { throw new IllegalArgumentException(); }
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "YOUTUBE_OAUTH_NOT_CONFIGURED", "YouTube 연결 설정이 필요합니다.");
        }
    }

    public String authorizationUrl(String state, String challenge) {
        requireConfigured();
        return UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", clientId).queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code").queryParam("scope", SCOPE)
                .queryParam("access_type", "offline").queryParam("prompt", "consent")
                .queryParam("state", state).queryParam("code_challenge", challenge)
                .queryParam("code_challenge_method", "S256").build().encode().toUriString();
    }

    public Tokens exchange(String code, String verifier) {
        var form = baseForm(); form.add("grant_type", "authorization_code");
        form.add("code", code); form.add("redirect_uri", redirectUri); form.add("code_verifier", verifier);
        return request(form, false);
    }

    public Tokens refresh(String token) {
        var form = baseForm(); form.add("grant_type", "refresh_token"); form.add("refresh_token", token);
        return request(form, true);
    }

    private LinkedMultiValueMap<String, String> baseForm() {
        requireConfigured();
        var form = new LinkedMultiValueMap<String, String>();
        form.add("client_id", clientId); form.add("client_secret", clientSecret); return form;
    }

    private Tokens request(LinkedMultiValueMap<String, String> form, boolean refresh) {
        Tokens tokens;
        try {
            tokens = http.post().uri("/token").contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form).retrieve().body(Tokens.class);
        } catch (RestClientResponseException exception) {
            String error = "";
            try { error = JsonMapper.builder().build().readTree(exception.getResponseBodyAsString()).path("error").asText(); }
            catch (RuntimeException ignored) { /* Never expose provider body or secrets. */ }
            if ("invalid_grant".equals(error)) {
                if (refresh) { throw new ReauthRequired(); }
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_YOUTUBE_AUTHORIZATION_CODE", "유효하지 않은 YouTube 인증 코드입니다. 연결을 다시 시작해주세요.");
            }
            throw unavailable();
        } catch (RestClientException exception) { throw unavailable(); }
        if (tokens == null || tokens.accessToken() == null || tokens.accessToken().isBlank()
                || tokens.accessToken().length() > 4096 || tokens.expiresIn() == null
                || tokens.expiresIn() < 60 || tokens.expiresIn() > 86400
                || !"Bearer".equalsIgnoreCase(tokens.tokenType())
                || (tokens.refreshToken() != null && tokens.refreshToken().length() > 4096)) { throw unavailable(); }
        if ((!refresh || tokens.scope() != null) && !hasScope(tokens.scope())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "YOUTUBE_SCOPE_REQUIRED", "플레이리스트 생성 권한이 필요합니다. 연결을 다시 시작해주세요.");
        }
        return tokens;
    }

    private boolean hasScope(String scope) {
        return scope != null && Arrays.stream(scope.split(" ")).anyMatch(value ->
                value.equals(SCOPE) || value.equals("https://www.googleapis.com/auth/youtube"));
    }
    private ApiException unavailable() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_OAUTH_UNAVAILABLE", "Google에서 YouTube 연결 정보를 확인하지 못했습니다.");
    }
}
