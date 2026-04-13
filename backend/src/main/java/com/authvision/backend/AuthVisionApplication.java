package com.authvision.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AuthVisionApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthVisionApplication.class, args);
    }
}
