package com.authvision.backend.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ForensicHints {
    private Double peakX;
    private Double peakY;
}
