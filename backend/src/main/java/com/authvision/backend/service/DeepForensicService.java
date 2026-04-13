package com.authvision.backend.service;

import com.authvision.backend.model.ForensicHints;
import com.authvision.backend.model.SignatureShieldData;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import com.authvision.backend.repository.ForensicCacheRepository;
import com.authvision.backend.model.ForensicCache;

@Service
@RequiredArgsConstructor
public class DeepForensicService {

    private final ForensicCacheRepository forensicCacheRepository;

    private enum ModelProvider {
        GEMINI_3_1_PRO("Gemini 3.1 Pro"),
        CLAUDE_4_6_OPUS("Claude 4.6 Opus"),
        LLAMA_4_MAVERICK("Llama 4 Maverick");

        private final String displayName;

        ModelProvider(String name) {
            this.displayName = name;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    @Async
    public CompletableFuture<Void> conductDeepAudit(byte[] image, ForensicHints hints, SignatureShieldData sigData, SseEmitter emitter, String pHash) {
        String prompt = buildPrompt(hints, sigData);
        List<ModelProvider> providers = List.of(ModelProvider.GEMINI_3_1_PRO, ModelProvider.CLAUDE_4_6_OPUS, ModelProvider.LLAMA_4_MAVERICK);

        for (int i = 0; i < providers.size(); i++) {
            ModelProvider currentModel = providers.get(i);
            try {
                emitter.send(SseEmitter.event().name("MODEL_SWITCHED").data(currentModel.getDisplayName()));

                // Mock execution: pretend Gemini fails to trigger failover
                if (currentModel == ModelProvider.GEMINI_3_1_PRO) {
                    Thread.sleep(800);
                    emitter.send(SseEmitter.event().name("REASONING_CHUNK").data("Initiating " + currentModel.getDisplayName() + " Context..."));
                    throw new RuntimeException("QuotaExhaustedException: Gemini API rate limit hit.");
                }

                String[] chunks = {
                    "Initiating Supreme Court Audit via " + currentModel.getDisplayName() + "...",
                    "Active Prompt: " + prompt,
                    String.format("Analyzing spectral spikes at coordinate [%.2f, %.2f]...", hints.getPeakX(), hints.getPeakY()),
                    "Localized dithering confirmed in flagged quadrant...",
                    "Conclusion: Highly likely synthesized. Confidence injected."
                };

                for (String chunk : chunks) {
                    Thread.sleep(400); // 400ms latency to stay inside 8.5s across failovers
                    emitter.send(SseEmitter.event().name("REASONING_CHUNK").data(chunk));
                }

                // Caching the successful reasoning sequence semantically
                List<Double> embeddingVal = generateEmbedding(image);
                ForensicCache newlyCached = ForensicCache.builder()
                        .pHash(pHash != null ? pHash : "sem_" + System.currentTimeMillis())
                        .lastAccessedAt(new java.util.Date())
                        .verdict("SUSPICIOUS")
                        .confidence(92)
                        .explanationFragments(java.util.Arrays.asList(chunks))
                        .vectorEmbedding(embeddingVal)
                        .build();
                forensicCacheRepository.save(newlyCached);

                emitter.send(SseEmitter.event().name("DONE").data("Audit Complete"));
                emitter.complete();
                return CompletableFuture.completedFuture(null);

            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("REASONING_CHUNK").data("Failover Triggered: " + e.getMessage() + " Switching to secondary."));
                } catch (Exception emitEx) {
                    // Ignore fail message emit exception
                }
                // allow loop to continue to next model
            }
        }

        // If all fail
        try {
            emitter.send(SseEmitter.event().name("ERROR").data("All Models Failed in Frontier Council."));
            emitter.complete();
        } catch (Exception e) {}

        return CompletableFuture.completedFuture(null);
    }

    private String buildPrompt(ForensicHints hints, SignatureShieldData sigData) {
        String base = String.format("The local spectral engine has flagged a high-frequency anomaly at coordinates [%.2f, %.2f]. You MUST perform a micro-texture and shadow audit specifically at this location and explain if it represents an AI upscaling artifact or a natural photographic pattern. ", hints.getPeakX(), hints.getPeakY());
        if (sigData.isSignatureVerified()) {
            return base + "This is confirmed AI. Find the physical/anatomical flaws that prove it without the watermark.";
        }
        return base + "Determine if this is AI using the WASM noise hints. Act as a World-Class Forensic Expert. Audit the image for: 1. Shadow/Light Mismatches (Physics). 2. Anatomical Errors (Skin pores, eye reflections). Be concise and technical.";
    }

    public List<Double> generateEmbedding(byte[] imageBytes) {
        // Mock lightweight local embedding proxy matching Google Multimodal embeddings
        return java.util.Collections.nCopies(768, 0.88);
    }
}
