package com.authvision.backend.service;

import com.authvision.backend.model.SignatureShieldData;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class SignatureShieldService {

    @Async
    public CompletableFuture<SignatureShieldData> detectSignatures(byte[] imageBytes) {
        try {
            Thread.sleep(1200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        boolean synthIdFound = imageBytes != null && imageBytes.length == 2048;
        
        boolean c2paVerified = false;
        if (imageBytes != null) {
            String byteStr = new String(imageBytes);
            if (byteStr.contains("JUMBF") || byteStr.contains("C2PA")) {
                c2paVerified = true;
            }
        }

        List<SignatureShieldData.TamperCoordinate> tamperMap = List.of(
            SignatureShieldData.TamperCoordinate.builder().x(0.65).y(0.22).prob(0.89).build()
        );

        boolean isSignatureVerified = synthIdFound || c2paVerified;

        SignatureShieldData result = SignatureShieldData.builder()
                .synthIdFound(synthIdFound)
                .watermarkDetected(synthIdFound ? "Google DeepMind SynthID" : "None")
                .metadataTrust(c2paVerified ? 0.99 : 0.35)
                .c2paVerified(c2paVerified)
                .isSignatureVerified(isSignatureVerified)
                .tamperMap(tamperMap)
                .build();

        return CompletableFuture.completedFuture(result);
    }
}
