package com.reon.backend.youtube.service;

import com.reon.backend.global.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class YouTubePlaylistClientTests {
    private MockRestServiceServer server;
    private YouTubePlaylistClient client;
    @BeforeEach void setUp() {
        var builder = RestClient.builder().baseUrl("https://www.googleapis.com/youtube/v3");
        server = MockRestServiceServer.bindTo(builder).build(); client = new YouTubePlaylistClient(builder.build());
    }
    @Test void createsPrivatePlaylistWithBearerToken() {
        server.expect(requestTo("https://www.googleapis.com/youtube/v3/playlists?part=snippet,status"))
                .andExpect(method(HttpMethod.POST)).andExpect(header("Authorization", "Bearer secret-token"))
                .andExpect(content().json("{\"snippet\":{\"title\":\"Memory title\",\"description\":\"description\"},\"status\":{\"privacyStatus\":\"private\"}}"))
                .andRespond(withSuccess("{\"id\":\"PL123\"}", MediaType.APPLICATION_JSON));
        assertEquals("PL123", client.create("secret-token", "Memory title", "description")); server.verify();
    }
    @Test void addsVideoToPlaylist() {
        server.expect(requestTo("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet"))
                .andExpect(content().json("{\"snippet\":{\"playlistId\":\"PL123\",\"resourceId\":{\"kind\":\"youtube#video\",\"videoId\":\"wJhWwt1OmT8\"}}}"))
                .andRespond(withSuccess("{\"id\":\"item123\"}", MediaType.APPLICATION_JSON));
        client.addVideo("secret-token", "PL123", "wJhWwt1OmT8"); server.verify();
    }
    @Test void readsAllPlaylistPagesInOrder() {
        server.expect(requestTo("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL123&maxResults=50"))
                .andExpect(method(HttpMethod.GET)).andExpect(header("Authorization", "Bearer token"))
                .andRespond(withSuccess("{\"items\":[{\"snippet\":{\"resourceId\":{\"videoId\":\"wJhWwt1OmT8\"}}}],\"nextPageToken\":\"next\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL123&maxResults=50&pageToken=next"))
                .andRespond(withSuccess("{\"items\":[{\"snippet\":{\"resourceId\":{\"videoId\":\"abcdefghijk\"}}}]}", MediaType.APPLICATION_JSON));
        assertEquals(java.util.List.of("wJhWwt1OmT8", "abcdefghijk"), client.videoIds("token", "PL123"));
        server.verify();
    }
    @Test void incompleteReadResponseNeverLooksLikeEmptyPlaylist() {
        server.expect(anything()).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        assertThrows(ApiException.class, () -> client.videoIds("token", "PL123"));
    }
    @Test void repeatingPageTokenStopsRecoveryRead() {
        for (int i = 0; i < 2; i++) {
            server.expect(anything()).andRespond(withSuccess("{\"items\":[],\"nextPageToken\":\"next\"}", MediaType.APPLICATION_JSON));
        }
        assertThrows(ApiException.class, () -> client.videoIds("token", "PL123")); server.verify();
    }
    @Test void rejectedTokenRequiresReauthWithoutExposingProviderBody() {
        server.expect(anything()).andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("secret-token"));
        var error = assertThrows(ApiException.class, () -> client.create("secret-token", "title", ""));
        assertEquals("YOUTUBE_AUTH_REQUIRED", error.code()); assertFalse(error.getMessage().contains("secret-token"));
    }
    @Test void mapsQuotaAndUnavailableTrack() {
        server.expect(anything()).andRespond(withStatus(HttpStatus.FORBIDDEN).body("{\"error\":{\"errors\":[{\"reason\":\"quotaExceeded\"}]}}"));
        assertEquals("YOUTUBE_QUOTA_EXCEEDED", assertThrows(ApiException.class, () -> client.create("token", "title", "")).code());
    }
    @Test void rejectsMalformedSuccessResponse() {
        server.expect(anything()).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        assertEquals("YOUTUBE_PLAYLIST_ERROR", assertThrows(ApiException.class, () -> client.create("token", "title", "")).code());
    }
}
