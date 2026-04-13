package com.authvision.backend.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Builder
@Document(collection = "forensicCache")
public class ForensicCache {
    @Id
    private String pHash;

    @Indexed(expireAfterSeconds = 604800) // 7-day TTL
    private Date lastAccessedAt;

    private String verdict;
    private int confidence;

    private java.util.List<String> explanationFragments;

    @Indexed
    private java.util.List<Double> vectorEmbedding;
}
