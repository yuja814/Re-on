package com.reon.backend.memory.security;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.global.ApiException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.security.Principal;
import java.util.Map;

/** Supplies only a database user ID verified by Core's persisted Bearer session. */
@Component
public class MemoryBearerFilter extends OncePerRequestFilter {
    private final SessionService sessions;
    private final ObjectMapper mapper;
    public MemoryBearerFilter(SessionService sessions, ObjectMapper mapper) { this.sessions = sessions; this.mapper = mapper; }
    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !(path.equals("/api/v1/memories") || path.startsWith("/api/v1/memories/"));
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        final Long userId;
        try { userId = sessions.currentUserId(request.getHeader("Authorization")); }
        catch (ApiException error) {
            response.setStatus(error.status().value()); response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8"); response.setHeader("Cache-Control", "no-store");
            response.getWriter().write(mapper.writeValueAsString(Map.of("code", error.code(), "message", error.getMessage())));
            return;
        }
        response.setHeader("Cache-Control", "no-store");
        chain.doFilter(new HttpServletRequestWrapper(request) {
            @Override public Principal getUserPrincipal() { return () -> userId.toString(); }
            @Override public String getRemoteUser() { return userId.toString(); }
        }, response);
    }
}
