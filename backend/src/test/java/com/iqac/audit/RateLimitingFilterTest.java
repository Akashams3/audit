package com.iqac.audit;

import com.iqac.audit.service.auth.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class RateLimitingFilterTest {

    private RateLimitService rateLimitService;

    @BeforeEach
    public void setUp() {
        rateLimitService = new RateLimitService();
    }

    @Test
    public void testRateLimitAllows200Requests() {
        String clientIp = "192.168.1.100";
        for (int i = 1; i <= 200; i++) {
            assertTrue(rateLimitService.isAllowed(clientIp), "Request " + i + " should be allowed");
        }
        assertFalse(rateLimitService.isAllowed(clientIp), "201st request should be blocked by rate limiter");
    }

    @Test
    public void testRateLimitIsIsolatedByClientIp() {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";

        for (int i = 1; i <= 200; i++) {
            rateLimitService.isAllowed(ip1);
        }
        assertFalse(rateLimitService.isAllowed(ip1));
        assertTrue(rateLimitService.isAllowed(ip2), "Distinct client IP should have separate rate limit bucket");
    }
}
