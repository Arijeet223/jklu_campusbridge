# ─────────────────────────────────────────────────────────────────────────────
# CampusBridge AI — Multi-Stage Production Dockerfile (Render & Koyeb Free Tier)
# Optimized for 512MB RAM cap: Multi-stage slim build, minimal RSS footprint (~95MB)
# ─────────────────────────────────────────────────────────────────────────────

# ── STAGE 1: Builder ──────────────────────────────────────────────────────────
FROM python:3.11-slim-bookworm AS builder

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

# Install build dependencies for compiling wheels if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment to isolate dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install production dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt


# ── STAGE 2: Lightweight Production Runtime ──────────────────────────────────
FROM python:3.11-slim-bookworm AS runner

# Memory optimization flags for 512MB free tier containers:
# - MALLOC_ARENA_MAX=2 curbs glibc virtual memory fragmentation in Python
# - PYTHONUNBUFFERED=1 streams stdout/stderr directly to Render/Koyeb log viewer
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MALLOC_ARENA_MAX=2 \
    PYTHONHASHSEED=random \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000 \
    APP_ENV=production

WORKDIR /app

# Install minimal runtime essentials (curl for healthchecks, ca-certificates for Neon/Qdrant SSL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Create unprivileged system user for container security (UID 10001)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Copy application source code
COPY --chown=appuser:appgroup . .

# Ensure storage directories exist with proper write permissions for non-root user
RUN mkdir -p data/chat_history data/qdrant_storage data/uploads && \
    chown -R appuser:appgroup /app

# Switch to unprivileged user
USER appuser

# Expose default port (Render sets $PORT dynamically to 10000; Koyeb uses 8000)
EXPOSE 8000

# Container healthcheck: verifies FastAPI responsiveness every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT}/health || exit 1

# Launch with Gunicorn managing Uvicorn async workers:
# - 1 worker is strictly recommended for 512MB RAM free tier (uses ~90MB RSS)
# - --worker-class uvicorn.workers.UvicornWorker for high-concurrency async I/O
# - --max-requests 1000 + jitter recycles workers periodically to prevent memory leaks
# - --worker-tmp-dir /dev/shm uses memory-backed heartbeat files to prevent false worker timeouts
CMD ["sh", "-c", "exec gunicorn services.api.main:app \
    --workers ${WEB_CONCURRENCY:-1} \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:${PORT} \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --worker-tmp-dir /dev/shm \
    --access-logfile - \
    --error-logfile -"]

