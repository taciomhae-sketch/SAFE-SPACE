# =============================================================
#  sentiment.py — Sentiment Analysis Module
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
#
#  This module analyzes the emotional tone of submitted text.
#
#  IMPORTANT CLARIFICATION:
#  - NEGATIVE sentiment does NOT automatically mean harmful content.
#  - A student writing "I am stressed because of my exams" should
#    be classified as NEGATIVE sentiment, but the moderation
#    result should still be APPROVED.
#  - Sentiment analysis and content moderation are separate
#    analyses that are combined in the final API response.
#
#  Model used:
#    cardiffnlp/twitter-roberta-base-sentiment-latest
#    (free, ~500 MB, trained on social media text, good for
#     informal/casual language similar to student posts)
#
#  Fallback (no model available):
#    TextBlob — lightweight rule-based sentiment, zero download.
# =============================================================

from typing import Dict, Any

from config import (
    SENTIMENT_POSITIVE, SENTIMENT_NEUTRAL, SENTIMENT_NEGATIVE, DEBUG
)

# ── Model name for HuggingFace ─────────────────────────────────
SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"

# ── Lazy-load pattern ─────────────────────────────────────────
_sentiment_pipeline = None

def get_sentiment_pipeline():
    """Load the HuggingFace sentiment pipeline."""
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        try:
            from transformers import pipeline
            try:
                _sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model=SENTIMENT_MODEL,
                    device=-1,
                    local_files_only=True
                )
            except Exception:
                _sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model=SENTIMENT_MODEL,
                    device=-1
                )
            print("[AI] Sentiment model loaded.")
        except Exception as e:
            print(f"[AI] WARNING: Sentiment model unavailable: {e}")
            print("[AI] Using TextBlob fallback for sentiment analysis.")
            _sentiment_pipeline = None
    return _sentiment_pipeline


# ── Label mapping for the RoBERTa model ───────────────────────
# The cardiffnlp model returns: LABEL_0=NEGATIVE, LABEL_1=NEUTRAL, LABEL_2=POSITIVE
ROBERTA_LABEL_MAP = {
    "LABEL_0": SENTIMENT_NEGATIVE,
    "LABEL_1": SENTIMENT_NEUTRAL,
    "LABEL_2": SENTIMENT_POSITIVE,
    "negative": SENTIMENT_NEGATIVE,
    "neutral":  SENTIMENT_NEUTRAL,
    "positive": SENTIMENT_POSITIVE,
}


def _textblob_fallback(text: str) -> Dict[str, Any]:
    """
    Rule-based fallback using TextBlob when the AI model is unavailable.
    TextBlob polarity: -1.0 (very negative) to +1.0 (very positive).
    """
    try:
        from textblob import TextBlob
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity  # -1.0 to 1.0

        if polarity > 0.10:
            sentiment = SENTIMENT_POSITIVE
            score = round((polarity + 1) / 2, 4)  # Normalize to 0-1
        elif polarity < -0.10:
            sentiment = SENTIMENT_NEGATIVE
            score = round((1 - (polarity + 1) / 2), 4)
        else:
            sentiment = SENTIMENT_NEUTRAL
            score = 0.50

        return {
            "sentiment": sentiment,
            "sentiment_score": score,
            "method": "textblob_fallback"
        }

    except ImportError:
        # If TextBlob is also not available, return neutral as safe default
        return {
            "sentiment": SENTIMENT_NEUTRAL,
            "sentiment_score": 0.50,
            "method": "default_fallback"
        }
    except Exception as e:
        if DEBUG:
            print(f"[TextBlob Error] {e}")
        return {
            "sentiment": SENTIMENT_NEUTRAL,
            "sentiment_score": 0.50,
            "method": "error_fallback"
        }


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze the emotional tone of submitted text.

    Parameters
    ----------
    text : str
        The student-submitted text to analyze.

    Returns
    -------
    dict with keys:
        sentiment       : str   — POSITIVE | NEUTRAL | NEGATIVE
        sentiment_score : float — confidence (0.0 to 1.0)
        method          : str   — which method was used

    Examples
    --------
    "I am happy today."
        → sentiment: POSITIVE

    "I went to class today."
        → sentiment: NEUTRAL

    "I feel exhausted because of school assignments."
        → sentiment: NEGATIVE
        (This is NOT harmful — just negative in emotional tone)
    """
    if not text or not text.strip():
        return {
            "sentiment": SENTIMENT_NEUTRAL,
            "sentiment_score": 0.50,
            "method": "empty_input"
        }

    # Try HuggingFace RoBERTa model first
    pipe = get_sentiment_pipeline()

    if pipe is not None:
        try:
            # Truncate to 512 tokens max (RoBERTa limit)
            truncated = text[:1500]
            result = pipe(truncated)[0]

            raw_label = result.get("label", "LABEL_1")
            score = float(result.get("score", 0.50))

            sentiment = ROBERTA_LABEL_MAP.get(raw_label.upper(), SENTIMENT_NEUTRAL)

            return {
                "sentiment": sentiment,
                "sentiment_score": round(score, 4),
                "method": "roberta"
            }

        except Exception as e:
            if DEBUG:
                print(f"[Sentiment Model Error] {e}")
            # Fall through to TextBlob

    # Fallback to TextBlob
    return _textblob_fallback(text)
