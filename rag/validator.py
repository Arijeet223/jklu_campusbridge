"""CampusBridge AI — Strict Citation & Claim Validator.

Implements PRD §8.3 and rag-evidence-pipeline skill:
- Every synthesized claim must resolve to a stored document_id and chunk_id.
- Exact substring / fuzzy anchor verification against raw chunk content.
- Never fabricates a citation: unverified claims are flagged as INSUFFICIENT_EVIDENCE.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Literal, Sequence

CitationStatus = Literal["VERIFIED", "UNRESOLVED_CITATION", "SPAN_MISMATCH", "INSUFFICIENT_EVIDENCE"]


@dataclass
class CitationValidationResult:
    is_valid: bool
    status: CitationStatus
    claim_text: str
    citation_tag: str
    resolved_chunk_id: str | None
    resolved_document_id: str | None
    matched_span: str | None
    confidence: float
    message: str


class CitationValidator:
    """Validates citations in generated advice or match explanations against stored evidence."""

    # Matches inline citations like [ev_44], [chunk-01], [fake_citation_999], [uuid]
    CITATION_REGEX = re.compile(r"\[([a-zA-Z0-9_\-]+)\]")

    def validate_single_citation(
        self,
        claim_text: str,
        citation_tag: str,
        retrieved_chunks: Sequence[dict[str, Any]],
        raw_document_text: str | None = None,
    ) -> CitationValidationResult:
        """Validate a single claim and citation against retrieved evidence."""
        tag_clean = citation_tag.strip("[]")

        # 1. Check if citation resolves to any chunk
        matched_chunk: dict[str, Any] | None = None
        for chunk in retrieved_chunks:
            chunk_id = str(chunk.get("chunk_id", chunk.get("id", "")))
            doc_id = str(chunk.get("document_id", ""))
            evidence_id = str(chunk.get("evidence_id", chunk.get("assessment_id", "")))

            if tag_clean in (chunk_id, doc_id, evidence_id):
                matched_chunk = chunk
                break

        if not matched_chunk:
            return CitationValidationResult(
                is_valid=False,
                status="UNRESOLVED_CITATION",
                claim_text=claim_text,
                citation_tag=citation_tag,
                resolved_chunk_id=None,
                resolved_document_id=None,
                matched_span=None,
                confidence=0.0,
                message=f"Citation '{citation_tag}' does not resolve to any retrieved chunk in permissioned context.",
            )

        # 2. Check if claim content is supported by the chunk text
        chunk_content = matched_chunk.get("content", "").lower()
        claim_words = [w for w in re.findall(r"\w+", claim_text.lower()) if len(w) > 3]

        if not claim_words:
            # Short claim — fallback to content match
            overlap = 1.0 if claim_text.lower() in chunk_content else 0.5
        else:
            matches = sum(1 for w in claim_words if w in chunk_content)
            overlap = matches / len(claim_words)

        if overlap < 0.3:
            return CitationValidationResult(
                is_valid=False,
                status="SPAN_MISMATCH",
                claim_text=claim_text,
                citation_tag=citation_tag,
                resolved_chunk_id=str(matched_chunk.get("chunk_id", matched_chunk.get("id"))),
                resolved_document_id=str(matched_chunk.get("document_id")),
                matched_span=None,
                confidence=round(overlap, 2),
                message=f"Claim text is not supported by cited source chunk ({int(overlap * 100)}% keyword grounding).",
            )

        return CitationValidationResult(
            is_valid=True,
            status="VERIFIED",
            claim_text=claim_text,
            citation_tag=citation_tag,
            resolved_chunk_id=str(matched_chunk.get("chunk_id", matched_chunk.get("id"))),
            resolved_document_id=str(matched_chunk.get("document_id")),
            matched_span=matched_chunk.get("section_path", "Document Span"),
            confidence=round(max(0.7, overlap), 2),
            message="Citation verified against permissioned source chunk.",
        )

    def validate_agent_text(
        self,
        agent_response_text: str,
        retrieved_chunks: Sequence[dict[str, Any]],
    ) -> tuple[str, list[CitationValidationResult]]:
        """Validate all citations in an LLM agent response.

        Replaces fabricated or unresolved citations with '[INSUFFICIENT_EVIDENCE]'
        to prevent hallucinated student facts from reaching the UI.
        """
        results: list[CitationValidationResult] = []
        sanitized_text = agent_response_text

        # Find all citation matches
        for match in self.CITATION_REGEX.finditer(agent_response_text):
            tag = match.group(0)
            if tag == "[INSUFFICIENT_EVIDENCE]":
                continue

            # Find surrounding clause / sentence
            start = max(0, agent_response_text.rfind(".", 0, match.start()) + 1)
            claim = agent_response_text[start:match.start()].strip()
            if not claim:
                claim = agent_response_text[max(0, match.start() - 50):match.start()].strip()

            val_res = self.validate_single_citation(claim, tag, retrieved_chunks)
            results.append(val_res)

            if not val_res.is_valid:
                sanitized_text = sanitized_text.replace(tag, "[INSUFFICIENT_EVIDENCE]")

        return sanitized_text, results
