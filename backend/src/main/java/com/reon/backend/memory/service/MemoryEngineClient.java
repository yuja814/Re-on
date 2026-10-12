package com.reon.backend.memory.service;

import com.reon.backend.global.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import tools.jackson.databind.JsonNode;
import java.time.Duration;

@Component
public class MemoryEngineClient {
    private final RestClient http;
    public MemoryEngineClient(@Value("${memory.engine-url}") String url, @Value("${memory.engine-token}") String token) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3)); factory.setReadTimeout(Duration.ofSeconds(10));
        http = RestClient.builder().baseUrl(url).defaultHeader("X-Service-Token", token).requestFactory(factory).build();
    }
    public JsonNode analyze(Object request) {
        try {
            JsonNode response = http.post().uri("/api/v1/memories/analyze/core").contentType(MediaType.APPLICATION_JSON).body(request).retrieve().body(JsonNode.class);
            if (response == null) { throw new IllegalStateException(); }
            return response;
        } catch (RestClientException | IllegalStateException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "MEMORY_ENGINE_UNAVAILABLE", "Memory 분석 서버에 연결하지 못했습니다.");
        }
    }
}
