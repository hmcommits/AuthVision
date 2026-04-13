package com.authvision.backend.repository;

import com.authvision.backend.model.ForensicCache;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.mongodb.repository.Aggregation;
import java.util.List;

@Repository
public interface ForensicCacheRepository extends MongoRepository<ForensicCache, String> {

    @Aggregation(pipeline = {"{ $vectorSearch: { queryVector: ?0, path: 'vectorEmbedding', numCandidates: 100, limit: 1 } }"})
    List<ForensicCache> findSimilarFakes(List<Double> embedding, double minScore);
}
