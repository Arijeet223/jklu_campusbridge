"""CampusBridge AI — Cross-Encoder Reranker.

Reranks candidate retrieved passages from hybrid search using fine-grained
token interaction scoring or deterministic cross-encoder approximations.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Sequence


@dataclass
class RerankedCandidate:
    chunk_id: str
    document_id: str
    content: str
    section_path: str
    page_number: int
    char_start: int
    char_end: int
    initial_score: float
    rerank_score: float


class CrossEncoderReranker:
    """Reranks candidate chunks based on query-passage relevance."""

    def __init__(self, top_k: int = 5):
        self.top_k = top_k

    def rerank(
        self,
        query: str,
        candidates: Sequence[dict],
    ) -> list[RerankedCandidate]:
        """Score and sort retrieved chunks by query relevance."""
        if not candidates:
            return []

        query_terms = set(re.findall(r"\w+", query.lower()))
        scored: list[RerankedCandidate] = []

        for cand in candidates:
            content = cand.get("content", "")
            content_lower = content.lower()
            initial_score = float(cand.get("rrf_score", 0.0))

            # Cross-encoder score approximation:
            # 1. Exact phrase matches
            phrase_bonus = 0.3 if query.lower() in content_lower else 0.0

            # 2. Term coverage & density
            matched_terms = [t for t in query_terms if t in content_lower]
            coverage = len(matched_terms) / max(1, len(query_terms))

            # 3. Section relevance bonus (e.g., Skills or Experience matching query)
            sec = cand.get("section_path", "").lower()
            section_bonus = 0.15 if any(t in sec for t in query_terms) else 0.0

            # Combined calibrated rerank score (0.0 - 1.0)
            rerank_score = min(
                1.0,
                (coverage * 0.5) + phrase_bonus + section_bonus + (initial_score * 0.2),
            )

            scored.append(
                RerankedCandidate(
                    chunk_id=str(cand.get("chunk_id", cand.get("id", ""))),
                    document_id=str(cand.get("document_id", "")),
                    content=content,
                    section_path=cand.get("section_path", "General"),
                    page_number=int(cand.get("page_number", 1)),
                    char_start=int(cand.get("char_start", 0)),
                    char_end=int(cand.get("char_end", len(content))),
                    initial_score=initial_score,
                    rerank_score=round(rerank_score, 4),
                )
            )

        scored.sort(key=lambda x: x.rerank_score, reverse=True)
        return scored[: self.top_k]

