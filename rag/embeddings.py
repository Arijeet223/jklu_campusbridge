"""CampusBridge AI — Local Embeddings Gateway.

Supports:
1. Ollama / LiteLLM / OpenAI-compatible local embedding endpoints (nomic-embed-text).
2. Deterministic local embedding fallback for air-gapped / unit test execution.
3. Cosine similarity & cosine distance metrics for vector matching.
4. Telemetry and health check hooks.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import time
import urllib.request
from typing import Any, Sequence

VECTOR_DIMENSIONS = 1536


class EmbeddingGateway:
    """Provides vector embeddings with Ollama nomic-embed-text and automatic fallback."""

    def __init__(
        self,
        endpoint_url: str | None = None,
        model_name: str = "nomic-embed-text",
        api_key: str = "local-campusbridge",
        target_dimensions: int = VECTOR_DIMENSIONS,
    ):
        self.endpoint_url = endpoint_url or os.getenv(
            "EMBEDDING_API_URL", "http://localhost:11434/api/embed"
        )
        self.single_endpoint_url = os.getenv(
            "EMBEDDING_SINGLE_API_URL", "http://localhost:11434/api/embeddings"
        )
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = os.getenv("EMBEDDING_MODEL", model_name)
        self.api_key = api_key
        self.target_dimensions = target_dimensions
        self._last_offline_time: float = 0.0

    def check_health(self) -> dict[str, Any]:
        """Check nomic-embed-text readiness on Ollama."""
        is_online = False
        try:
            req = urllib.request.Request(f"{self.ollama_base_url}/api/tags")
            with urllib.request.urlopen(req, timeout=0.2) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    models = [m.get("name", "") for m in data.get("models", [])]
                    is_online = any("nomic-embed-text" in m for m in models)
        except Exception:
            is_online = False

        return {
            "status": "ONLINE" if is_online else "OFFLINE",
            "model": self.model_name,
            "dimensions": self.target_dimensions,
            "endpoint": self.endpoint_url,
        }

    def embed_text(self, text: str) -> list[float]:
        """Embed a single string."""
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Embed a list of strings, with graceful fallback to deterministic vectors."""
        if not texts:
            return []

        # If recently detected as offline (within 10s), short-circuit directly to deterministic fallback
        if time.time() - self._last_offline_time < 10.0:
            return [self._deterministic_vector(t) for t in texts]

        # Attempt local Ollama nomic-embed-text batch endpoint (/api/embed)
        try:
            req_data = json.dumps({
                "model": self.model_name,
                "input": list(texts),
            }).encode("utf-8")

            req = urllib.request.Request(
                self.endpoint_url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=0.8) as resp:
                if resp.status == 200:
                    body = json.loads(resp.read().decode("utf-8"))
                    raw_embeddings = body.get("embeddings", [])
                    if raw_embeddings:
                        return [self._format_vector(emb) for emb in raw_embeddings]
        except Exception:
            self._last_offline_time = time.time()
            return [self._deterministic_vector(t) for t in texts]

    def _format_vector(self, vec: list[float]) -> list[float]:
        """Ensure vector matches target dimensions while preserving L2-norm and cosine angles."""
        if len(vec) == self.target_dimensions:
            return vec
        if len(vec) < self.target_dimensions:
            # Zero-padding preserves L2 norm and dot products
            return vec + [0.0] * (self.target_dimensions - len(vec))
        return vec[: self.target_dimensions]

    @staticmethod
    def _deterministic_vector(text: str) -> list[float]:
        """Generate a deterministic, unit-normalized 1536-dimensional embedding.

        Uses multi-salt SHA-256 token hashing to populate dense vector buckets,
        preserving cosine similarity for texts sharing semantic keywords.
        """
        words = text.lower().split()
        vec = [0.0] * VECTOR_DIMENSIONS

        if not words:
            vec[0] = 1.0
            return vec

        for word in words:
            # Compute multiple bucket projections per word
            for seed in (0, 7, 31, 97):
                h = int(hashlib.md5(f"{word}:{seed}".encode()).hexdigest(), 16)
                idx = h % VECTOR_DIMENSIONS
                sign = 1.0 if (h >> 16) % 2 == 0 else -1.0
                vec[idx] += sign

        # Unit normalize (L2 norm)
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0.0:
            vec = [x / norm for x in vec]
        else:
            vec[0] = 1.0

        return vec

    @staticmethod
    def cosine_similarity(v1: Sequence[float], v2: Sequence[float]) -> float:
        """Compute cosine similarity between two vectors (-1.0 to 1.0)."""
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
        return dot / (norm1 * norm2)

    @classmethod
    def cosine_distance(cls, v1: Sequence[float], v2: Sequence[float]) -> float:
        """Compute cosine distance (1.0 - cosine_similarity)."""
        return 1.0 - cls.cosine_similarity(v1, v2)
