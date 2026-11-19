package com.reon.backend.global;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="reon.web.allowed-origins=http://localhost:18092")
@AutoConfigureMockMvc
class WebCorsTests {
    @Autowired MockMvc mvc;
    @Test void memoryPreflightRunsBeforeBearerAuthentication() throws Exception {
        mvc.perform(options("/api/v1/memories").header("Origin","http://localhost:18092")
                .header("Access-Control-Request-Method","GET").header("Access-Control-Request-Headers","authorization"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","http://localhost:18092"));
    }
    @Test void allowedOriginStillRequiresBearerSession() throws Exception {
        mvc.perform(get("/api/v1/memories").header("Origin","http://localhost:18092"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(header().string("Access-Control-Allow-Origin","http://localhost:18092"));
    }
    @Test void foreignOriginIsRejected() throws Exception {
        mvc.perform(options("/api/v1/moments").header("Origin","https://untrusted.example")
                .header("Access-Control-Request-Method","POST"))
                .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
    @Test void sameOriginAndNativeRequestsKeepTheirExistingBehavior() throws Exception {
        mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    }
}
