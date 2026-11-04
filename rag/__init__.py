"""CampusBridge AI — RAG, Evidence & Knowledge Architecture."""

from rag.chunking import SectionAwareChunker, Chunk
from rag.embeddings import EmbeddingGateway
from rag.validation import FileValidator, ValidationResult
from rag.retrieval import HybridRetrievalEngine, RetrievalResult
from rag.reranking import CrossEncoderReranker
from rag.validator import CitationValidator, CitationValidationResult

__all__ = [
    "SectionAwareChunker",
    "Chunk",
    "EmbeddingGateway",
    "FileValidator",
    "ValidationResult",
    "HybridRetrievalEngine",
    "RetrievalResult",
    "CrossEncoderReranker",
    "CitationValidator",
    "CitationValidationResult",
]

