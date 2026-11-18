"""CampusBridge AI — OCR & Multi-Format Academic Document Parsing Pipeline.

Handles both digital and scanned transcripts:
1. Native vector & table extraction from PDF via PyMuPDF (fitz) and pdfplumber.
2. In-memory Optical Character Recognition (OCR) via RapidOCR / ONNX for portal screenshots
   (.png, .jpg, .jpeg) and scanned image-only PDFs.
"""

from __future__ import annotations

import io
import logging
import os
from pathlib import Path
from typing import Any, Optional

from PIL import Image

logger = logging.getLogger("campusbridge.ocr")

# Check PyMuPDF
try:
    import pymupdf
    PYMUPDF_AVAILABLE = True
except ImportError:
    try:
        import fitz as pymupdf
        PYMUPDF_AVAILABLE = True
    except ImportError:
        PYMUPDF_AVAILABLE = False

# Check pdfplumber
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

# Check RapidOCR
try:
    from rapidocr_onnxruntime import RapidOCR
    RAPID_OCR_AVAILABLE = True
    _rapid_ocr_instance: Optional[RapidOCR] = None
except ImportError:
    RAPID_OCR_AVAILABLE = False
    _rapid_ocr_instance = None

# Check pytesseract
try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False


def get_rapid_ocr() -> Optional[Any]:
    """Lazy singleton for RapidOCR engine."""
    global _rapid_ocr_instance
    if RAPID_OCR_AVAILABLE and _rapid_ocr_instance is None:
        try:
            _rapid_ocr_instance = RapidOCR()
        except Exception as e:
            logger.warning(f"Failed to initialize RapidOCR: {e}")
            _rapid_ocr_instance = None
    return _rapid_ocr_instance


def preprocess_image_for_ocr(image_bytes: bytes) -> bytes:
    """Preprocess image in-memory for optimal OCR character detection."""
    try:
        img = Image.open(io.BytesIO(image_bytes))

        # Convert palette/transparency to standard RGB
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Upscale small or low-resolution portal screenshots (e.g. mobile portal screenshots)
        if img.width < 1200:
            scale = 1200.0 / float(img.width)
            new_size = (1200, int(img.height * scale))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        out_buf = io.BytesIO()
        img.save(out_buf, format="PNG")
        return out_buf.getvalue()
    except Exception as e:
        logger.warning(f"Image preprocessing skipped: {e}")
        return image_bytes


def group_ocr_boxes_into_lines(ocr_result: list[Any]) -> str:
    """Spatially group RapidOCR bounding boxes into coherent table lines.
    
    Portals like TCS iON render tabular rows where columns (Course Code, Subject Name,
    Credits, Grade) are detected as separate text boxes. Grouping them by vertical
    alignment (y_mid) and ordering left-to-right (x_min) produces structured rows.
    """
    if not ocr_result:
        return ""

    boxes = []
    for item in ocr_result:
        if len(item) >= 2 and item[1]:
            box = item[0]
            text = str(item[1]).strip()
            if not text:
                continue
            ys = [pt[1] for pt in box]
            xs = [pt[0] for pt in box]
            y_mid = sum(ys) / len(ys)
            x_min = min(xs)
            height = max(ys) - min(ys)
            boxes.append({"text": text, "y_mid": y_mid, "x_min": x_min, "height": height})

    if not boxes:
        return ""

    # Sort primarily by vertical coordinate
    boxes.sort(key=lambda b: b["y_mid"])

    avg_h = sum(b["height"] for b in boxes) / len(boxes)
    y_threshold = max(8.0, avg_h * 0.65)

    lines: list[str] = []
    curr_line: list[dict[str, Any]] = []
    curr_y: Optional[float] = None

    for b in boxes:
        if curr_y is None or abs(b["y_mid"] - curr_y) <= y_threshold:
            curr_line.append(b)
            curr_y = (curr_y + b["y_mid"]) / 2.0 if curr_y is not None else b["y_mid"]
        else:
            curr_line.sort(key=lambda x: x["x_min"])
            lines.append(" | ".join(x["text"] for x in curr_line))
            curr_line = [b]
            curr_y = b["y_mid"]

    if curr_line:
        curr_line.sort(key=lambda x: x["x_min"])
        lines.append(" | ".join(x["text"] for x in curr_line))

    return "\n".join(lines)


def run_image_ocr(image_bytes: bytes) -> tuple[str, str]:
    """Run OCR on in-memory image bytes (PNG, JPG, JPEG, WEBP)."""
    text_lines: list[str] = []
    method = "OCR_RAPID"

    # Preprocess image for clean OCR
    processed_bytes = preprocess_image_for_ocr(image_bytes)

    # 1. Primary Engine: RapidOCR (ONNX runtime, in-memory, self-contained)
    rapid = get_rapid_ocr()
    if rapid:
        try:
            result, _ = rapid(processed_bytes)
            if result:
                # Use spatial line grouping to reconstruct table rows
                structured_text = group_ocr_boxes_into_lines(result)
                if structured_text.strip():
                    return structured_text.strip(), "RapidOCR (ONNX Spatial Table)"

                # Fallback to simple line-by-line concatenation
                for item in result:
                    if len(item) >= 2 and item[1]:
                        text_lines.append(str(item[1]).strip())
                if text_lines:
                    return "\n".join(text_lines), "RapidOCR (ONNX)"
        except Exception as e:
            logger.warning(f"RapidOCR execution failed: {e}")

    # 2. Secondary Fallback Engine: pytesseract
    if PYTESSERACT_AVAILABLE:
        try:
            img = Image.open(io.BytesIO(processed_bytes))
            text = pytesseract.image_to_string(img)
            if text and text.strip():
                return text.strip(), "PyTesseract (Fallback)"
        except Exception as e:
            logger.warning(f"PyTesseract fallback failed: {e}")

    # 3. Clean Text Fallback if all else fails
    if text_lines:
        return "\n".join(text_lines), method
    return "", "OCR_FAILED"


def extract_text_and_tables_from_grade_file(
    file_bytes: bytes,
    file_name: str = "",
    content_type: str = "",
) -> tuple[str, str, int]:
    """Extract raw transcript text from PDF or image file bytes in-memory.

    Returns:
        (extracted_text, method_used, page_count)
    """
    if not file_bytes:
        return "", "EMPTY_FILE", 0

    lower_name = (file_name or "").lower()
    lower_content = (content_type or "").lower()

    is_pdf = (
        file_bytes.startswith(b"%PDF")
        or lower_name.endswith(".pdf")
        or "pdf" in lower_content
    )

    is_image = (
        file_bytes.startswith(b"\x89PNG")
        or file_bytes.startswith(b"\xff\xd8\xff")
        or any(lower_name.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp"])
        or any(img_type in lower_content for img_type in ["image/png", "image/jpeg", "image/jpg"])
    )

    # ──────────────────────────────────────────────────────────────────────────
    # CASE 1: IMAGE GRADE SHEET (PNG, JPG, JPEG Screenshots)
    # ──────────────────────────────────────────────────────────────────────────
    if is_image and not is_pdf:
        logger.info(f"Processing image grade sheet with OCR: {file_name}")
        raw_text, method = run_image_ocr(file_bytes)
        return raw_text, method, 1

    # ──────────────────────────────────────────────────────────────────────────
    # CASE 2: PDF GRADE SHEET (Digital or Scanned)
    # ──────────────────────────────────────────────────────────────────────────
    pages_text: list[str] = []
    scanned_pages_needed: list[int] = []

    # Step A: High-performance text extraction with PyMuPDF
    if PYMUPDF_AVAILABLE:
        try:
            doc = pymupdf.open(stream=file_bytes, filetype="pdf")
            page_count = len(doc)
            for idx, page in enumerate(doc):
                text = page.get_text("text") or ""
                # Also attempt table extraction if available in PyMuPDF
                if hasattr(page, "find_tables"):
                    try:
                        tabs = page.find_tables()
                        for tab in tabs:
                            df = tab.extract()
                            for row in df:
                                row_str = " | ".join(str(c) for c in row if c is not None)
                                if row_str.strip():
                                    text += "\n" + row_str
                    except Exception:
                        pass

                text = text.strip()
                if len(text) > 40:
                    pages_text.append(f"--- PAGE {idx + 1} ---\n{text}")
                else:
                    # Page has very little or no selectable text -> Likely scanned!
                    scanned_pages_needed.append(idx)

            # Step B: Render scanned pages to pixmap & run OCR
            if scanned_pages_needed:
                logger.info(f"Running OCR on {len(scanned_pages_needed)} scanned PDF page(s)")
                for p_idx in scanned_pages_needed:
                    page = doc[p_idx]
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    ocr_text, _ = run_image_ocr(img_bytes)
                    if ocr_text:
                        pages_text.append(f"--- PAGE {p_idx + 1} (OCR Scanned) ---\n{ocr_text}")

            full_text = "\n\n".join(pages_text).strip()
            if full_text:
                method = "PyMuPDF (Hybrid Text + OCR)" if scanned_pages_needed else "PyMuPDF (Text & Tables)"
                return full_text, method, page_count

        except Exception as e:
            logger.warning(f"PyMuPDF PDF parsing failed: {e}")

    # Step C: Fallback to pdfplumber
    if PDFPLUMBER_AVAILABLE:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                plumber_texts = []
                for p_idx, page in enumerate(pdf.pages):
                    t = page.extract_text() or ""
                    tables = page.extract_tables() or []
                    for t_rows in tables:
                        for row in t_rows:
                            row_str = " | ".join(str(c) for c in row if c is not None)
                            if row_str.strip():
                                t += "\n" + row_str
                    if t.strip():
                        plumber_texts.append(t.strip())
                if plumber_texts:
                    return "\n\n".join(plumber_texts), "pdfplumber (Fallback)", len(pdf.pages)
        except Exception as e:
            logger.warning(f"pdfplumber PDF parsing failed: {e}")

    # Step D: Direct Image OCR fallback if file was wrongly typed
    raw_text, method = run_image_ocr(file_bytes)
    return raw_text, method, 1
