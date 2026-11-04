"""CampusBridge AI — File Quarantine & MIME Sniffing.

Enforces:
1. Maximum upload size: 20 MB (PRD §10).
2. Content-based MIME inspection (magic byte sniffing).
3. SHA-256 cryptographic content digest.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Literal

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

QuarantineStatus = Literal["PENDING", "SCANNING", "CLEAN", "INFECTED", "PARSE_FAILED"]


@dataclass
class ValidationResult:
    is_valid: bool
    mime_type: str
    file_size_bytes: int
    sha256_hash: str
    quarantine_status: QuarantineStatus
    error_message: str | None = None


class FileValidator:
    """Validates uploaded files before layout parsing or indexing."""

    ALLOWED_MIME_TYPES = {
        "application/pdf": [b"%PDF-"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [b"PK\x03\x04"],
        "text/plain": [],
    }

    @classmethod
    def validate_content(cls, raw_bytes: bytes, file_name: str = "") -> ValidationResult:
        size = len(raw_bytes)
        sha256 = hashlib.sha256(raw_bytes).hexdigest()

        if size == 0:
            return ValidationResult(
                is_valid=False,
                mime_type="application/octet-stream",
                file_size_bytes=size,
                sha256_hash=sha256,
                quarantine_status="PARSE_FAILED",
                error_message="Uploaded file is empty (0 bytes).",
            )

        if size > MAX_FILE_SIZE_BYTES:
            return ValidationResult(
                is_valid=False,
                mime_type="application/octet-stream",
                file_size_bytes=size,
                sha256_hash=sha256,
                quarantine_status="PARSE_FAILED",
                error_message=f"File exceeds maximum allowed size of 20 MB ({size} bytes).",
            )

        # Magic byte sniffing
        detected_mime: str | None = None
        if raw_bytes.startswith(b"%PDF-"):
            detected_mime = "application/pdf"
        elif raw_bytes.startswith(b"PK\x03\x04"):
            detected_mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            # Check if valid UTF-8 text (must not contain null bytes)
            if b"\x00" in raw_bytes:
                detected_mime = "application/octet-stream"
            else:
                try:
                    raw_bytes.decode("utf-8")
                    detected_mime = "text/plain"
                except UnicodeDecodeError:
                    detected_mime = "application/octet-stream"

        if detected_mime not in cls.ALLOWED_MIME_TYPES:
            return ValidationResult(
                is_valid=False,
                mime_type=detected_mime,
                file_size_bytes=size,
                sha256_hash=sha256,
                quarantine_status="PARSE_FAILED",
                error_message=f"Disallowed file format: detected '{detected_mime}'. Only PDF, DOCX, and TXT are permitted.",
            )

        return ValidationResult(
            is_valid=True,
            mime_type=detected_mime,
            file_size_bytes=size,
            sha256_hash=sha256,
            quarantine_status="CLEAN",
        )
