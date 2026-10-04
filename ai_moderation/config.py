# =============================================================
#  config.py — Safe Space AI Moderation Service Configuration
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
#  Institution: Aklan State University – Ibajay
# =============================================================

import os

# ── API Server Settings ────────────────────────────────────────
HOST = "127.0.0.1"      # Only listen on localhost (not exposed to internet)
PORT = 8000             # Port that PHP will connect to via cURL

# ── Text Constraints ──────────────────────────────────────────
MAX_TEXT_LENGTH  = 5000   # Maximum characters accepted per request
MIN_TEXT_LENGTH  = 1      # Minimum characters required

# ── Moderation Status Labels ──────────────────────────────────
STATUS_APPROVED = "APPROVED"
STATUS_REVIEW   = "REVIEW"
STATUS_BLOCKED  = "BLOCKED"

# ── Moderation Categories ─────────────────────────────────────
CATEGORY_SAFE            = "SAFE"
CATEGORY_OFFENSIVE       = "OFFENSIVE"
CATEGORY_BULLYING        = "BULLYING_HARASSMENT"
CATEGORY_DISCRIMINATORY  = "DISCRIMINATORY"
CATEGORY_THREATENING     = "THREATENING"
CATEGORY_SELF_HARM       = "SELF_HARM_CONCERN"
CATEGORY_SEXUAL          = "SEXUAL_EXPLICIT"
CATEGORY_SPAM            = "SPAM"

# ── Sentiment Labels ──────────────────────────────────────────
SENTIMENT_POSITIVE = "POSITIVE"
SENTIMENT_NEUTRAL  = "NEUTRAL"
SENTIMENT_NEGATIVE = "NEGATIVE"

# ── Category → Status Mapping ─────────────────────────────────
# Defines the default moderation status for each category.
# Authorized administrators can override these decisions.
CATEGORY_STATUS_MAP = {
    CATEGORY_SAFE:           STATUS_APPROVED,
    CATEGORY_OFFENSIVE:      STATUS_REVIEW,
    CATEGORY_BULLYING:       STATUS_REVIEW,
    CATEGORY_DISCRIMINATORY: STATUS_REVIEW,
    CATEGORY_THREATENING:    STATUS_BLOCKED,
    CATEGORY_SELF_HARM:      STATUS_REVIEW,
    CATEGORY_SEXUAL:         STATUS_BLOCKED,
    CATEGORY_SPAM:           STATUS_REVIEW,
}

# ── Confidence Thresholds ─────────────────────────────────────
# When rule-based confidence is below this value, the result
# is escalated to REVIEW instead of the default status.
CONFIDENCE_ESCALATE_THRESHOLD = 0.55

# ── Service Metadata ──────────────────────────────────────────
SERVICE_NAME    = "Safe Space AI Moderation Service"
SERVICE_VERSION = "1.0.0"
SERVICE_DESC    = (
    "Local AI module for automated content moderation and "
    "sentiment analysis. For thesis demonstration purposes only."
)

# ── Privacy Notice ────────────────────────────────────────────
# Submitted text is processed entirely in memory.
# No student text is permanently stored by the Python AI service.
# Storage decisions are handled by the existing PHP + database system.
STORE_TEXT = False  # Set to True only if you need debug logging

# ── Model Path ────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# ── Debug Mode ────────────────────────────────────────────────
# Set to True during development to see detailed console output.
# Set to False before thesis defense demonstration.
DEBUG = False
