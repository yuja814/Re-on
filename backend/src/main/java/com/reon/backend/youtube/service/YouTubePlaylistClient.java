package com.reon.backend.youtube.service;

import com.reon.backend.global.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.time.Duration;
import java.util.Map;
import java.util.*;
import java.util.function.Supplier;

@Component
public class YouTubePlaylistClient {
    private final RestClient http;
    @Autowired
    public YouTubePlaylistClient(RestClient.Builder builder) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3)); factory.setReadTimeout(Duration.ofSeconds(5));
        http = builder.baseUrl("https://www.googleapis.com/youtube/v3").requestFactory(factory).build();
    }
    YouTubePlaylistClient(RestClient http) { this.http = http; }

    public String create(String accessToken, String title, String description) {
        var result = post("/playlists?part=snippet,status", accessToken, Map.of(
                "snippet", Map.of("title", title, "description", description),
                "status", Map.of("privacyStatus", "private")));
        return requireId(result);
    }

    public void addVideo(String accessToken, String playlistId, String videoId) {
        var result = post("/playlistItems?part=snippet", accessToken, Map.of("snippet", Map.of(
                "playlistId", playlistId, "resourceId", Map.of("kind", "youtube#video", "videoId", videoId))));
        requireId(result);
    }

    private String requireId(JsonNode result) {
        if (result == null || !result.path("id").isString() || !result.path("id").asText().matches("[A-Za-z0-9_-]{1,128}")) {
            throw failure();
        }
        return result.path("id").asText();
    }

    public List<String> videoIds(String token, String playlistId) {
        var ids = new ArrayList<String>();
        var pages = new HashSet<String>();
        String page = "";
        do {
            if (!pages.add(page) || pages.size() > 100) { throw failure(); }
            String currentPage = page;
            var result = request(() -> http.get().uri(uri -> {
                var query = uri.path("/playlistItems").queryParam("part", "snippet")
                        .queryParam("playlistId", playlistId).queryParam("maxResults", 50);
                if (!currentPage.isEmpty()) { query.queryParam("pageToken", currentPage); }
                return query.build();
            }).headers(headers -> headers.setBearerAuth(token)).retrieve().body(JsonNode.class));
            if (result == null || !result.path("items").isArray()) { throw failure(); }
            for (var item : result.path("items")) {
                String id = item.path("snippet").path("resourceId").path("videoId").asText();
                if (!id.matches("[A-Za-z0-9_-]{11}")) { throw failure(); }
                ids.add(id);
            }
            var next = result.path("nextPageToken");
            if (!next.isMissingNode() && !next.isNull() && !next.isString()) { throw failure(); }
            page = next.isString() ? next.asText() : "";
        } while (!page.isEmpty());
        return List.copyOf(ids);
    }

    private JsonNode post(String path, String token, Object body) {
        return request(() -> http.post().uri(path).headers(headers -> headers.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(JsonNode.class));
    }
    private JsonNode request(Supplier<JsonNode> call) {
        try {
            return call.get();
        } catch (RestClientResponseException exception) {
            String reason = "";
            try {
                reason = JsonMapper.builder().build().readTree(exception.getResponseBodyAsString())
                        .path("error").path("errors").path(0).path("reason").asText();
            } catch (RuntimeException ignored) { /* Do not log token or provider body. */ }
            if (exception.getStatusCode().value() == 401 || "insufficientPermissions".equals(reason)) {
                throw new ApiException(HttpStatus.CONFLICT, "YOUTUBE_AUTH_REQUIRED", "YouTube 계정 권한을 다시 연결해주세요.");
            }
            if ("quotaExceeded".equals(reason) || "dailyLimitExceeded".equals(reason)) {
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "YOUTUBE_QUOTA_EXCEEDED", "YouTube API 할당량을 초과했습니다. 나중에 다시 시도해주세요.");
            }
            if ("youtubeSignupRequired".equals(reason)) {
                throw new ApiException(HttpStatus.CONFLICT, "YOUTUBE_CHANNEL_REQUIRED", "YouTube 채널을 만든 후 다시 시도해주세요.");
            }
            if ("videoNotFound".equals(reason) || "videoNotEmbeddable".equals(reason)) {
                throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "YOUTUBE_TRACK_UNAVAILABLE", "플레이리스트에 추가할 수 없는 곡이 있습니다.");
            }
            throw failure();
        } catch (RestClientException exception) { throw failure(); }
    }

    private ApiException failure() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_PLAYLIST_ERROR", "YouTube 플레이리스트 요청에 실패했습니다.");
    }
}
