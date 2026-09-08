package com.iqac.audit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
@EnableAsync
public class AuditApplication {
    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(AuditApplication.class, args);
    }

    private static void loadDotEnv() {
        try {
            Path path = Paths.get(".env");
            if (Files.exists(path)) {
                Files.readAllLines(path).forEach(line -> {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty() && !trimmed.startsWith("#") && trimmed.contains("=")) {
                        int idx = trimmed.indexOf("=");
                        String key = trimmed.substring(0, idx).trim();
                        String val = trimmed.substring(idx + 1).trim();
                        if (val.startsWith("\"") && val.endsWith("\"")) {
                            val = val.substring(1, val.length() - 1);
                        } else if (val.startsWith("'") && val.endsWith("'")) {
                            val = val.substring(1, val.length() - 1);
                        }
                        System.setProperty(key, val);
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("Could not load .env file: " + e.getMessage());
        }
    }
}