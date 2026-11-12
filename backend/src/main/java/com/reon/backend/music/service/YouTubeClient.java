package com.reon.backend.music.service;

import com.reon.backend.global.ApiException;
import com.reon.backend.music.dto.MusicResolveResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class YouTubeClient {
    private static final String MUSIC_CATEGORY_ID = "10";
    private final RestClient restClient;
    private final String apiKey;

    @Autowired
    public YouTubeClient(RestClient.Builder builder, @Value("${youtube.api-key}") String apiKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = builder.baseUrl("https://www.googleapis.com/youtube/v3")
                .requestFactory(factory).build();
        this.apiKey = apiKey;
    }

    YouTubeClient(RestClient restClient, String apiKey) {
        this.restClient = restClient;
        this.apiKey = apiKey;
    }

    public MusicResolveResponse findVideo(String videoId) {
        if (apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "YOUTUBE_API_NOT_CONFIGURED",
                    "YouTube API 설정이 필요합니다.");
        }
        VideosResponse response;
        try {
            response = restClient.get()
                    .uri(uri -> uri.path("/videos").queryParam("part", "snippet")
                            .queryParam("id", videoId).queryParam("key", apiKey).build())
                    .retrieve().body(VideosResponse.class);
        } catch (RestClientException exception) {
            // Upstream exceptions may contain the API key; never expose them.
            throw upstreamFailure();
        }
        if (response == null || response.items() == null) {
            throw upstreamFailure();
        }
        if (response.items().isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "MUSIC_NOT_FOUND", "조회 가능한 음악을 찾을 수 없습니다.");
        }
        Video video = response.items().getFirst();
        if (video == null || !videoId.equals(video.id()) || video.snippet() == null
                || video.snippet().title() == null || video.snippet().channelTitle() == null) {
            throw upstreamFailure();
        }
        Snippet snippet = video.snippet();
        // Shared by URL resolution and Moment creation: never trust the caller's metadata.
        if (!MUSIC_CATEGORY_ID.equals(snippet.categoryId())) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "MUSIC_CATEGORY_REQUIRED",
                    "YouTube에서 음악으로 분류된 영상만 기록할 수 있어요. 다른 음악 링크를 선택해주세요.");
        }
        return new MusicResolveResponse(video.id(), snippet.title(), snippet.channelTitle(),
                thumbnailUrl(snippet.thumbnails()));
    }

    private String thumbnailUrl(Map<String, Thumbnail> thumbnails) {
        if (thumbnails != null) {
            for (String size : List.of("maxres", "standard", "high", "medium", "default")) {
                Thumbnail thumbnail = thumbnails.get(size);
                if (thumbnail != null && thumbnail.url() != null && !thumbnail.url().isBlank()) {
                    return thumbnail.url();
                }
            }
        }
        return null;
    }

    private ApiException upstreamFailure() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_API_ERROR", "음악 정보를 조회하지 못했습니다.");
    }

    public record VideosResponse(List<Video> items) {}
    public record Video(String id, Snippet snippet) {}
    public record Snippet(String title, String channelTitle, String categoryId, Map<String, Thumbnail> thumbnails) {}
    public record Thumbnail(String url) {}
}
