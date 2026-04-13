package com.authvision.backend.controller;

import com.authvision.backend.model.ForensicCache;
import com.authvision.backend.model.ForensicHints;
import com.authvision.backend.model.SignatureShieldData;
import com.authvision.backend.repository.ForensicCacheRepository;
import com.authvision.backend.service.DeepForensicService;
import com.authvision.backend.service.SignatureShieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@RestController
@RequestMapping("/api/v1/forensics")
@RequiredArgsConstructor
public class ForensicController {

    private final SignatureShieldService signatureShieldService;
    private final ForensicCacheRepository forensicCacheRepository;
    private final DeepForensicService deepForensicService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamForensics(
            @RequestParam(required = false) String pHash,
            @RequestParam(required = false) Double peakX,
            @RequestParam(required = false) Double peakY) {
        
        // Fast-Pass Check
        if (pHash != null) {
            Optional<ForensicCache> cacheOpt = forensicCacheRepository.findById(pHash);
            if (cacheOpt.isPresent()) {
                ForensicCache cached = cacheOpt.get();
                cached.setLastAccessedAt(new Date());
                forensicCacheRepository.save(cached);

                SseEmitter fastEmitter = new SseEmitter(2000L);
                try {
                    fastEmitter.send(SseEmitter.event().name("FAST_PASS").data(cached));
                    fastEmitter.complete();
                } catch (IOException e) {
                    fastEmitter.completeWithError(e);
                }
                return fastEmitter;
            }
        }

        byte[] mockUploadedBytes = new byte[2048];

        // Semantic Vector Search Memory Check
        List<Double> currentEmbedding = deepForensicService.generateEmbedding(mockUploadedBytes);
        List<ForensicCache> similarFakes = forensicCacheRepository.findSimilarFakes(currentEmbedding, 0.95);
        if (similarFakes != null && !similarFakes.isEmpty()) {
            ForensicCache cacheMatch = similarFakes.get(0);
            cacheMatch.setLastAccessedAt(new Date());
            forensicCacheRepository.save(cacheMatch);

            SseEmitter semanticEmitter = new SseEmitter(2000L);
            try {
                semanticEmitter.send(SseEmitter.event().name("VECTOR_CACHE_HIT").data(cacheMatch));
                semanticEmitter.complete();
            } catch (IOException e) {
                semanticEmitter.completeWithError(e);
            }
            return semanticEmitter;
        }

        // Establish an 8.5-second streaming connection
        SseEmitter emitter = new SseEmitter(8500L);

        try {
            emitter.send(SseEmitter.event().name("START").data("Starting Parallel Orchestrator with Hints (" + peakX + ", " + peakY + ")"));
        } catch (IOException e) {
            emitter.completeWithError(e);
            return emitter;
        }

        // Start the SignatureShieldService immediately
        CompletableFuture<SignatureShieldData> signatureTask = signatureShieldService.detectSignatures(mockUploadedBytes);

        // Implementing Parallel Race logic with a 7-second timeout boundary
        signatureTask.orTimeout(7, TimeUnit.SECONDS).whenComplete((result, exception) -> {
            if (exception != null) {
                if (exception instanceof TimeoutException) {
                    try {
                        emitter.send(SseEmitter.event().name("ERROR").data("Signature Shield Timeout"));
                    } catch (IOException ioException) {}
                }
                emitter.completeWithError(exception);
            } else {
                try {
                    emitter.send(SseEmitter.event().name("SIGNATURE_SHIELD_RESULT").data(result));
                    // Start Deep Logic
                    ForensicHints hints = ForensicHints.builder().peakX(peakX).peakY(peakY).build();
                    deepForensicService.conductDeepAudit(mockUploadedBytes, hints, result, emitter, pHash);
                    // Emit close relies on the deepForensicService
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            }
        });

        emitter.onCompletion(() -> System.out.println("SSE Stream Completed"));
        emitter.onTimeout(() -> emitter.complete());
        emitter.onError(e -> System.out.println("SSE Stream Error: " + e.getMessage()));

        return emitter;
    }
}
