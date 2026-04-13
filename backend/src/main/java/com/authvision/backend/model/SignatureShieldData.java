package com.authvision.backend.model;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SignatureShieldData {
    private boolean synthIdFound;
    private String watermarkDetected;
    private double metadataTrust;
    private boolean c2paVerified;
    private boolean isSignatureVerified;
    private List<TamperCoordinate> tamperMap;

    @Data
    @Builder
    public static class TamperCoordinate {
        private double x;
        private double y;
        private double prob;
    }
}
