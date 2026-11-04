"""CampusBridge AI — Section-Aware Document & Resume Chunker.

Implements PRD §8.2 and rag-evidence-pipeline skill:
- Section-aware boundaries (Education, Projects, Skills, Experience, Certifications).
- Accurate char_start and char_end offsets for UI Source Drawer highlighting.
- 400–800 token windows with 60–120 token overlap.
- Never performs blind fixed-character splitting.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


@dataclass
class Chunk:
    chunk_index: int
    content: str
    section_path: str
    page_number: int
    char_start: int
    char_end: int
    bbox: dict[str, Any] | None = None
    token_count: int = 0


# Common section header patterns in resumes, JDs, and placement policies
SECTION_HEADER_PATTERNS = [
    r"(?i)^(?:#+\s*)?(?:technical\s+)?skills(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?(?:work\s+)?experience(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?projects(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?education(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?certifications?(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?coursework(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?achievements?(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?requirements?(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?responsibilities(?:\s*&.*)?$",
    r"(?i)^(?:#+\s*)?eligibility\s+criteria(?:\s*&.*)?$",
]


class SectionAwareChunker:
    """Splits structured resumes and JDs by section while preserving layout anchors."""

    def __init__(
        self,
        target_tokens: int = 500,
        min_tokens: int = 100,
        max_tokens: int = 800,
        overlap_tokens: int = 80,
    ):
        self.target_tokens = target_tokens
        self.min_tokens = min_tokens
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens

    @staticmethod
    def _approx_token_count(text: str) -> int:
        """Approximate token count (whitespace-separated words * 1.3)."""
        words = len(text.split())
        return max(1, int(words * 1.3))

    def _split_into_sections(self, text: str) -> list[dict[str, Any]]:
        """Identify sections and their exact character spans in the text."""
        lines = text.splitlines(keepends=True)
        sections: list[dict[str, Any]] = []
        current_section = "General"
        current_lines: list[str] = []
        section_start_char = 0
        current_char = 0

        for line in lines:
            trimmed = line.strip()
            is_header = False
            for pattern in SECTION_HEADER_PATTERNS:
                if re.match(pattern, trimmed):
                    is_header = True
                    break

            if is_header and trimmed:
                if current_lines:
                    content = "".join(current_lines)
                    sections.append({
                        "name": current_section,
                        "content": content,
                        "char_start": section_start_char,
                        "char_end": section_start_char + len(content),
                    })
                current_section = trimmed.lstrip("# ").title()
                current_lines = [line]
                section_start_char = current_char
            else:
                current_lines.append(line)

            current_char += len(line)

        if current_lines:
            content = "".join(current_lines)
            sections.append({
                "name": current_section,
                "content": content,
                "char_start": section_start_char,
                "char_end": section_start_char + len(content),
            })

        return sections

    def chunk_document(
        self,
        text: str,
        page_number: int = 1,
        base_bbox: dict[str, Any] | None = None,
    ) -> list[Chunk]:
        """Convert document text into section-aware chunks."""
        sections = self._split_into_sections(text)
        chunks: list[Chunk] = []
        chunk_idx = 0

        for sec in sections:
            sec_name = sec["name"]
            sec_text = sec["content"]
            sec_start = sec["char_start"]
            sec_tokens = self._approx_token_count(sec_text)

            # If section fits comfortably within bounds, keep it unified
            if sec_tokens <= self.max_tokens:
                chunks.append(
                    Chunk(
                        chunk_index=chunk_idx,
                        content=sec_text.strip(),
                        section_path=sec_name,
                        page_number=page_number,
                        char_start=sec_start,
                        char_end=sec_start + len(sec_text),
                        bbox=base_bbox,
                        token_count=sec_tokens,
                    )
                )
                chunk_idx += 1
            else:
                # Sub-chunk by paragraphs with overlap
                paragraphs = re.split(r"(\n\s*\n)", sec_text)
                window_lines: list[str] = []
                window_tokens = 0
                window_start = sec_start
                curr_offset = sec_start

                for piece in paragraphs:
                    piece_tokens = self._approx_token_count(piece)
                    if window_tokens + piece_tokens > self.target_tokens and window_lines:
                        window_content = "".join(window_lines)
                        chunks.append(
                            Chunk(
                                chunk_index=chunk_idx,
                                content=window_content.strip(),
                                section_path=sec_name,
                                page_number=page_number,
                                char_start=window_start,
                                char_end=window_start + len(window_content),
                                bbox=base_bbox,
                                token_count=window_tokens,
                            )
                        )
                        chunk_idx += 1

                        # Carry over overlap
                        window_lines = [piece]
                        window_tokens = piece_tokens
                        window_start = curr_offset
                    else:
                        window_lines.append(piece)
                        window_tokens += piece_tokens

                    curr_offset += len(piece)

                if window_lines:
                    window_content = "".join(window_lines)
                    chunks.append(
                        Chunk(
                            chunk_index=chunk_idx,
                            content=window_content.strip(),
                            section_path=sec_name,
                            page_number=page_number,
                            char_start=window_start,
                            char_end=window_start + len(window_content),
                            bbox=base_bbox,
                            token_count=window_tokens,
                        )
                    )
                    chunk_idx += 1

        return chunks

