package com.authvision.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableAsync
public class AuthVisionApplication {
    public static void main(String[] args) {
        try {
            // Load from both parent directory (if run from backend/) and current directory
            Dotenv dotenvParent = Dotenv.configure().directory("..").ignoreIfMissing().load();
            dotenvParent.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

            Dotenv dotenvCurrent = Dotenv.configure().directory(".").ignoreIfMissing().load();
            dotenvCurrent.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
        } catch (Exception e) {
            System.err.println("Warning: Could not load .env files: " + e.getMessage());
        }

        SpringApplication.run(AuthVisionApplication.class, args);
    }
}
