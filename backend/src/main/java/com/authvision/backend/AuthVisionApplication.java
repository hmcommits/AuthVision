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
            Dotenv dotenv = Dotenv.configure()
                    .directory("..")
                    .ignoreIfMissing()
                    .load();
            
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        } catch (Exception e) {
            System.err.println("Warning: Could not load .env file from parent directory: " + e.getMessage());
        }

        SpringApplication.run(AuthVisionApplication.class, args);
    }
}
