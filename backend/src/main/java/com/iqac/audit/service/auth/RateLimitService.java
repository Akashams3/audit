package com.iqac.audit.service.auth;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimitService {

    private static final int MAX_REQUESTS_PER_MINUTE = 200;
    private final Map<String, RequestBucket> buckets = new ConcurrentHashMap<>();

    public boolean isAllowed(String clientIp) {
        long currentMinute = System.currentTimeMillis() / 60000;
        RequestBucket bucket = buckets.compute(clientIp, (ip, existingBucket) -> {
            if (existingBucket == null || existingBucket.getMinute() != currentMinute) {
                return new RequestBucket(currentMinute, new AtomicInteger(1));
            }
            existingBucket.getCounter().incrementAndGet();
            return existingBucket;
        });

        // Clean up old buckets periodically
        if (buckets.size() > 5000) {
            buckets.entrySet().removeIf(entry -> entry.getValue().getMinute() < currentMinute - 2);
        }

        return bucket.getCounter().get() <= MAX_REQUESTS_PER_MINUTE;
    }

    public int getRemainingRequests(String clientIp) {
        long currentMinute = System.currentTimeMillis() / 60000;
        RequestBucket bucket = buckets.get(clientIp);
        if (bucket == null || bucket.getMinute() != currentMinute) {
            return MAX_REQUESTS_PER_MINUTE;
        }
        int remaining = MAX_REQUESTS_PER_MINUTE - bucket.getCounter().get();
        return Math.max(0, remaining);
    }

    private static class RequestBucket {
        private final long minute;
        private final AtomicInteger counter;

        public RequestBucket(long minute, AtomicInteger counter) {
            this.minute = minute;
            this.counter = counter;
        }

        public long getMinute() {
            return minute;
        }

        public AtomicInteger getCounter() {
            return counter;
        }
    }
}
