package com.reon.backend.music.service;

import com.reon.backend.global.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MusicServiceTests {
    private final YouTubeClient client = mock(YouTubeClient.class);
    private final MusicService service = new MusicService(client);

    @Test
    void extractsSharedUrlAndCallsClient() {
        service.resolve("https://music.youtube.com/watch?si=share&v=wJhWwt1OmT8&list=playlist");
        verify(client).findVideo("wJhWwt1OmT8");
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "https://m.youtube.com/watch?v=maTP315XZCQ&list=RDmaTP315XZCQ&start_radio=1&pp=ygUST2FzaXMgc3RhbmQgYnkgbWUgoAcB0gcJCUcMAYcqIYzv&ra=m",
        "https://www.youtube.com/watch?v=maTP315XZCQ",
        "https://youtube.com/watch?si=share&v=maTP315XZCQ",
        "https://music.youtube.com/watch?v=maTP315XZCQ",
        "https://youtu.be/maTP315XZCQ?si=share&t=12",
        "  https://M.YOUTUBE.COM/watch?v=maTP315XZCQ  "
    })
    void acceptsYouTubeShareLinks(String url) {
        service.resolve(url);
        verify(client).findVideo("maTP315XZCQ");
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "", "not a url", "http://music.youtube.com/watch?v=wJhWwt1OmT8",
        "https://example.com/watch?v=wJhWwt1OmT8",
        "https://music.youtube.com.evil.com/watch?v=wJhWwt1OmT8",
        "https://music.youtube.com/playlist?v=wJhWwt1OmT8",
        "https://music.youtube.com/watch?si=share", "https://music.youtube.com/watch?v=",
        "https://music.youtube.com/watch?v=short",
        "https://music.youtube.com/watch?v=wJhWwt1OmT8&v=wJhWwt1OmT8",
        "https://someone@music.youtube.com/watch?v=wJhWwt1OmT8",
        "https://music.youtube.com:1234/watch?v=wJhWwt1OmT8",
        "https://music.youtube.com/watch?v=%ZZ",
        "https://m.youtube.com.evil.com/watch?v=maTP315XZCQ",
        "https://youtu.be.evil.com/maTP315XZCQ",
        "https://someone@youtu.be/maTP315XZCQ",
        "https://youtu.be:1234/maTP315XZCQ",
        "https://youtu.be/short", "https://youtu.be/maTP315XZCQ/extra",
        "https://www.youtube.com/playlist?list=RDmaTP315XZCQ",
        "https://m.youtube.com/watch?v=maTP315XZCQ&v=wJhWwt1OmT8"
    })
    void rejectsInvalidUrlsWithoutCallingYouTube(String url) {
        ApiException error = assertThrows(ApiException.class, () -> service.resolve(url));
        assertEquals("INVALID_YOUTUBE_MUSIC_URL", error.code());
        verifyNoInteractions(client);
    }
}
