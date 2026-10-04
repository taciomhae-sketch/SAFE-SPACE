# =============================================================
#  app.py — FastAPI Main Application Entry Point
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
#
#  This file starts a local HTTP API server that your existing
#  PHP system can communicate with using cURL.
#
#  Usage (from terminal with virtual environment activated):
#    python app.py
#
#  API will be available at:
#    http://127.0.0.1:8000
#
#  Endpoints:
#    GET  /          — Health check (confirms service is online)
#    POST /moderate  — Combined moderation + sentiment analysis
#    POST /sentiment — Sentiment analysis only
#    POST /moderation-only — Content moderation only (no sentiment)
# =============================================================

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import uvicorn
import time

from config import (
    HOST, PORT, SERVICE_NAME, SERVICE_VERSION, SERVICE_DESC,
    MAX_TEXT_LENGTH, MIN_TEXT_LENGTH, DEBUG
)
from moderation import moderate
from sentiment import analyze_sentiment


# ── FastAPI Application Instance ──────────────────────────────
app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    description=SERVICE_DESC,
    docs_url="/docs",       # Interactive API docs at http://127.0.0.1:8000/docs
    redoc_url="/redoc",
)

# ── CORS Middleware ────────────────────────────────────────────
# Allows PHP running on localhost to reach this Python API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # In production, restrict to your PHP server IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──────────────────────────────────
class TextRequest(BaseModel):
    text: str

    @validator("text")
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError("Text is required and cannot be empty.")
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(
                f"Text exceeds maximum allowed length of {MAX_TEXT_LENGTH} characters."
            )
        return v.strip()


# ── Helper: Safe Error Response ───────────────────────────────
def error_response(message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": message}
    )


# ── Middleware: Log incoming requests (debug mode only) ───────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000, 2)
    if DEBUG:
        print(f"[{request.method}] {request.url.path} — {response.status_code} ({elapsed}ms)")
    return response


# ── GET / and GET /health — Health Check ───────────────────────
@app.get("/", summary="Health Check")
@app.get("/health", summary="Health Check Alias")
async def health_check():
    """
    Returns the service status.
    Your PHP system can call this to verify the AI service is running.

    Example PHP usage:
        file_get_contents('http://127.0.0.1:8000/')
    """
    return {
        "status": "online",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "description": SERVICE_DESC,
        "endpoints": {
            "POST /moderate": "Combined content moderation and sentiment analysis",
            "POST /sentiment": "Sentiment analysis only",
            "POST /moderation-only": "Content moderation only",
            "GET  /docs": "Interactive API documentation"
        }
    }


# ── POST /moderate — Combined Analysis ───────────────────────
@app.post("/moderate", summary="Combined Moderation + Sentiment")
async def moderate_endpoint(request: TextRequest):
    """
    Analyze submitted student text for:
    1. Content moderation (category + status)
    2. Sentiment analysis

    Request body (JSON):
        { "text": "Your text here..." }

    Response:
        {
            "success": true,
            "category": "SAFE",
            "status": "APPROVED",
            "confidence": 0.85,
            "reason": "...",
            "sentiment": "POSITIVE",
            "sentiment_score": 0.91
        }

    IMPORTANT:
    - NEGATIVE sentiment alone does NOT result in BLOCKED status.
    - "I am sad because of my exam." → sentiment: NEGATIVE, status: APPROVED
    - Final disciplinary decisions are made by authorized personnel, NOT the AI.
    """
    text = request.text

    # Run moderation
    mod_result = moderate(text)

    # Run sentiment analysis
    sent_result = analyze_sentiment(text)

    return {
        "success": True,
        # — Moderation fields —
        "allowed":             mod_result["allowed"],
        "status":              mod_result["status"],
        "action":              mod_result["action"],
        "language":            mod_result["language"],
        "language_confidence": mod_result["language_confidence"],
        "category":            mod_result["category"],
        "categories":          mod_result["categories"],
        "severity":            mod_result["severity"],
        "confidence":          mod_result["confidence"],
        "reason":              mod_result["reason"],
        "detection_source":    mod_result["detection_source"],
        "has_obfuscation":     mod_result.get("has_obfuscation", False),
        "obfuscation_types":   mod_result.get("obfuscation_types", []),
        "is_academic_stress":  mod_result.get("is_academic_stress", False),
        "is_targeted":         mod_result.get("is_targeted", False),
        # — Sentiment fields —
        "sentiment":           sent_result["sentiment"],
        "sentiment_score":     sent_result["sentiment_score"],
        # — Meta —
        "text_length": len(text),
        "note": (
            "AI results are advisory only. "
            "Final decisions require human review by authorized personnel."
        )
    }


# ── POST /sentiment — Sentiment Only ──────────────────────────
@app.post("/sentiment", summary="Sentiment Analysis Only")
async def sentiment_endpoint(request: TextRequest):
    """
    Analyze only the emotional tone of the text.
    Use this when you only need sentiment, not full moderation.
    """
    text = request.text
    sent_result = analyze_sentiment(text)

    return {
        "success": True,
        "sentiment":       sent_result["sentiment"],
        "sentiment_score": sent_result["sentiment_score"],
        "text_length":     len(text),
    }


# ── POST /moderation-only — Moderation Only ───────────────────
@app.post("/moderation-only", summary="Content Moderation Only")
async def moderation_only_endpoint(request: TextRequest):
    """
    Analyze only the content moderation category and status.
    Use this when you only need moderation, not sentiment.
    """
    text = request.text
    mod_result = moderate(text)

    return {
        "success":             True,
        "allowed":             mod_result["allowed"],
        "status":              mod_result["status"],
        "action":              mod_result["action"],
        "language":            mod_result["language"],
        "language_confidence": mod_result["language_confidence"],
        "category":            mod_result["category"],
        "categories":          mod_result["categories"],
        "severity":            mod_result["severity"],
        "confidence":          mod_result["confidence"],
        "reason":              mod_result["reason"],
        "detection_source":    mod_result["detection_source"],
        "has_obfuscation":     mod_result.get("has_obfuscation", False),
        "obfuscation_types":   mod_result.get("obfuscation_types", []),
        "is_academic_stress":  mod_result.get("is_academic_stress", False),
        "is_targeted":         mod_result.get("is_targeted", False),
    }


# ── Global Exception Handlers ─────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Never expose internal error details to clients
    if DEBUG:
        print(f"[UNHANDLED ERROR] {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An internal error occurred in the AI service. Please try again."
        }
    )

@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc):
    # Pydantic validation errors — extract user-friendly message
    try:
        detail = exc.errors()[0].get("msg", "Invalid request.")
        # Strip pydantic's "Value error," prefix
        if detail.lower().startswith("value error,"):
            detail = detail[13:].strip()
    except Exception:
        detail = "Invalid request body. Please send JSON with a 'text' field."
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": detail}
    )


# ── Application Entry Point ────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print(f"  {SERVICE_NAME}")
    print(f"  Version: {SERVICE_VERSION}")
    print("=" * 60)
    print(f"  Starting API server at: http://{HOST}:{PORT}")
    print(f"  Interactive docs at:    http://{HOST}:{PORT}/docs")
    print(f"  Health check:           http://{HOST}:{PORT}/")
    print("-" * 60)
    print("  NOTE: The AI models will be downloaded on first use.")
    print("  This may take several minutes depending on your")
    print("  internet connection. After first download, the AI")
    print("  works OFFLINE.")
    print("=" * 60)

    uvicorn.run(
        "app:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info" if not DEBUG else "debug"
    )
