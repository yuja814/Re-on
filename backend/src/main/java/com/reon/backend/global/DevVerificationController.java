package com.reon.backend.global;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Profile("dev")
@RestController
public class DevVerificationController {
    private final String clientId;
    public DevVerificationController(@Value("${google.client-id}") String clientId) { this.clientId = clientId; }
    @GetMapping(value = {"/dev/verify", "/dev/youtube-callback"}, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> page() throws IOException {
        String html = new ClassPathResource("dev/verification.html").getContentAsString(StandardCharsets.UTF_8);
        html = html.replace("__CLIENT_ID_JSON__", JsonMapper.builder().build().writeValueAsString(clientId).replace("<", "\\u003c"));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header("Referrer-Policy", "no-referrer-when-downgrade").body(html);
    }
}
