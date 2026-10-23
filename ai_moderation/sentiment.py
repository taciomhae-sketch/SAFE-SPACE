# =============================================================
#  sentiment.py - AI-Powered Sentiment Analysis Module
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
#
#  Features:
#  - Three-tier classification: Positive, Neutral, Negative
#  - Context-aware analysis for English, Filipino (Tagalog), and Taglish
#  - Negation window handling ("not happy", "hindi masaya", "di maganda")
#  - Emoji valence detection (smiling/celebration vs crying/broken heart)
#  - Question affective evaluation
#  - Dominant sentiment balancing for mixed emotions
#  - HuggingFace RoBERTa model integration with local fallback
# =============================================================

import re
from typing import Dict, Any, List

LABEL_POSITIVE = "Positive"
LABEL_NEUTRAL = "Neutral"
LABEL_NEGATIVE = "Negative"

SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
_sentiment_pipeline = None

def get_sentiment_pipeline():
    """Lazy load the HuggingFace RoBERTa sentiment pipeline if available."""
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
            print("[AI] RoBERTa Sentiment pipeline loaded.")
        except Exception:
            _sentiment_pipeline = None
    return _sentiment_pipeline

ROBERTA_LABEL_MAP = {
    "LABEL_0": LABEL_NEGATIVE,
    "LABEL_1": LABEL_NEUTRAL,
    "LABEL_2": LABEL_POSITIVE,
    "NEGATIVE": LABEL_NEGATIVE,
    "NEUTRAL": LABEL_NEUTRAL,
    "POSITIVE": LABEL_POSITIVE,
}

# 1. Emojis
POSITIVE_EMOJIS = set([
    "😊", "😀", "😃", "😄", "😁", "😆", "🥰", "😍", "🤩", "🥳", "😇", "🤗",
    "👍", "👍🏻", "👍🏼", "👍🏽", "👍🏾", "👍🏿", "👏", "🙌", "❤️", "💖", "💕",
    "✨", "🌟", "⭐", "🎉", "🎊", "💪", "💯", "🌸", "🌻", "🌈", "☀️"
])

NEGATIVE_EMOJIS = set([
    "😢", "😭", "💔", "😞", "😔", "😟", "😣", "😩", "😫", "🥺", "😿",
    "😡", "😠", "🤬", "👿", "😤", "😰", "😨", "😱", "😓", "🥀", "👎", "🌧️"
])

# 2. Negation Tokens
NEGATION_WORDS = set([
    "not", "no", "never", "none", "neither", "nor", "hardly", "barely",
    "don't", "dont", "doesn't", "doesnt", "didn't", "didnt", "isn't", "isnt",
    "aren't", "arent", "wasn't", "wasnt", "weren't", "werent", "won't", "wont",
    "cannot", "can't", "cant", "couldn't", "couldnt", "shouldn't", "shouldnt",
    # Tagalog negations
    "hindi", "di", "hinde", "wala", "walang", "ayaw", "ayoko", "huwag", "wag"
])

# 3. Positive Lexicon
POSITIVE_WORDS = {
    "happy": 2.0, "glad": 1.8, "joy": 2.0, "joyful": 2.0, "cheerful": 1.8, "delighted": 2.0,
    "masaya": 2.0, "saya": 1.8, "natutuwa": 1.8, "nakakatuwa": 1.8, "galak": 1.8, "kagalakan": 2.0,
    "thank": 1.8, "thanks": 1.8, "thankful": 2.0, "grateful": 2.0, "appreciate": 2.0, "appreciated": 2.0,
    "appreciation": 1.8, "blessed": 2.0, "salamat": 1.8, "pasasalamat": 1.8,
    "proud": 2.0, "believe": 1.6, "hope": 1.8, "hopeful": 2.0, "inspiring": 2.0, "inspired": 1.8,
    "support": 1.6, "supporting": 1.6, "supportive": 1.8, "kindness": 1.8, "kind": 1.5,
    "accomplished": 2.0, "progress": 1.6, "succeed": 2.0, "success": 2.0, "successful": 2.0,
    "kayang-kaya": 2.0, "kaya mo yan": 2.2, "laban lang": 1.8, "tiwala": 1.8, "pag-asa": 2.0,
    "galing": 1.8, "magaling": 1.8, "panalo": 2.0, "husay": 1.8, "mahusay": 1.8, "mabuti": 1.6,
    "love": 2.0, "best": 1.8, "great": 1.8, "awesome": 2.0, "wonderful": 2.0, "amazing": 2.0,
    "mahal": 1.8, "pagmamahal": 2.0, "mabait": 1.8, "alaga": 1.6
}

# 4. Negative Lexicon
NEGATIVE_WORDS = {
    "sad": 2.0, "unhappy": 2.0, "depressed": 2.2, "depression": 2.2, "lonely": 2.0, "alone": 1.6,
    "overwhelmed": 2.0, "crying": 2.0, "cry": 1.8, "tears": 1.6, "grief": 2.2, "heartbroken": 2.2,
    "malungkot": 2.0, "lungkot": 1.8, "nakakalungkot": 2.0, "nag-iisa": 1.8, "umiiyak": 2.0, "iyak": 1.8,
    "frustrated": 2.0, "frustrating": 2.0, "frustration": 2.0, "difficult": 1.8, "hard": 1.5,
    "disappointed": 2.0, "disappointing": 2.0, "disappointment": 2.0, "worry": 1.8, "worried": 1.8,
    "anxious": 2.0, "anxiety": 2.0, "stress": 1.8, "stressed": 1.8, "exhausted": 2.0, "tired": 1.6,
    "burnout": 2.0, "struggling": 1.8, "struggle": 1.8, "discouraged": 2.0, "hopeless": 2.2,
    "hirap": 1.8, "mahirap": 1.8, "nahihirapan": 2.0, "pagod": 1.8, "nakakapagod": 2.0, "sawang-sawa": 2.0,
    "takot": 1.8, "natatakot": 1.8, "kaba": 1.6, "kinakabahan": 1.8, "bagsak": 1.8, "sakit": 1.8, "masakit": 2.0,
    "angry": 2.0, "mad": 1.8, "hate": 2.2, "hateful": 2.2, "annoyed": 1.8, "upset": 1.8,
    "galit": 2.0, "inis": 1.8, "nakakainis": 1.8, "bad": 1.5, "awful": 2.0, "terrible": 2.0, "horrible": 2.2,
    "worthless": 2.2, "loser": 2.0, "fail": 1.8, "failed": 1.8, "toxic": 2.0, "mean": 1.6, "nakakaiyak": 2.0, "hurt": 1.8, "hurting": 1.8, "pain": 1.8, "painful": 2.0
}

# 5. Neutral Anchors
NEUTRAL_ANCHORS = set([
    "class", "classes", "starts", "started", "starts at", "at", "tomorrow", "yesterday", "today",
    "assignment", "homework", "exam", "quiz", "announcement", "posted", "library", "open", "closed",
    "until", "schedule", "schedule:", "room", "building", "professor", "prof", "teacher", "meeting",
    "link", "submitted", "deadline", "page", "chapter", "reading", "notes", "presentation",
    "pasok", "klase", "aral", "libro", "aklatan", "silid-aralan", "anunsyo", "takdang-aralin",
    "bukas", "kahapon", "ngayon", "oras", "kailan", "saan", "paano", "meron", "mayroon"
])

def _tokenize(text: str) -> List[str]:
    cleaned = re.sub(r"[^\w\s\'-]", " ", text.lower())
    return [w.strip() for w in cleaned.split() if w.strip()]

def analyze_contextual_sentiment(text: str) -> Dict[str, Any]:
    if not text or not text.strip():
        return {
            "sentiment": LABEL_NEUTRAL,
            "sentiment_score": 0.50,
            "confidence": 0.50,
            "method": "empty_input"
        }

    raw = text.strip()
    words = _tokenize(raw)

    pos_emoji_count = sum(1 for ch in raw if ch in POSITIVE_EMOJIS)
    neg_emoji_count = sum(1 for ch in raw if ch in NEGATIVE_EMOJIS)

    pos_score = pos_emoji_count * 1.5
    neg_score = neg_emoji_count * 1.5

    lower_raw = raw.lower()
    if "you can do it" in lower_raw or "believe in yourself" in lower_raw or "proud of" in lower_raw:
        pos_score += 2.5
    if "thank you" in lower_raw or "salamat sa" in lower_raw or "happy with my" in lower_raw:
        pos_score += 2.5
    if "really difficult" in lower_raw or "nothing seems to work" in lower_raw:
        neg_score += 2.5
    if "feel lonely" in lower_raw or "disappointed with" in lower_raw:
        neg_score += 2.5

    window_negation = False
    window_count = 0

    for i, word in enumerate(words):
        if window_negation:
            window_count += 1
            if window_count > 3:
                window_negation = False
                window_count = 0

        if word in NEGATION_WORDS:
            window_negation = True
            window_count = 0
            continue

        if word in POSITIVE_WORDS:
            weight = POSITIVE_WORDS[word]
            if window_negation:
                neg_score += weight * 1.4
                window_negation = False
            else:
                pos_score += weight

        elif word in NEGATIVE_WORDS:
            weight = NEGATIVE_WORDS[word]
            if window_negation:
                pos_score += weight * 0.8
                window_negation = False
            else:
                neg_score += weight

    is_question = "?" in raw
    has_affective = (pos_score > 0 or neg_score > 0)
    has_neutral_anchor = any(w in NEUTRAL_ANCHORS for w in words)

    if is_question and not has_affective:
        return {
            "sentiment": LABEL_NEUTRAL,
            "sentiment_score": 0.85,
            "confidence": 0.85,
            "method": "neutral_question"
        }

    diff = pos_score - neg_score

    if diff >= 1.2:
        sentiment = LABEL_POSITIVE
        confidence = min(0.98, 0.70 + (diff * 0.08))
    elif diff <= -1.2:
        sentiment = LABEL_NEGATIVE
        confidence = min(0.98, 0.70 + (abs(diff) * 0.08))
    else:
        if has_neutral_anchor or (pos_score == 0 and neg_score == 0):
            sentiment = LABEL_NEUTRAL
            confidence = 0.88 if has_neutral_anchor else 0.65
        elif diff > 0:
            sentiment = LABEL_POSITIVE
            confidence = 0.68
        elif diff < 0:
            sentiment = LABEL_NEGATIVE
            confidence = 0.68
        else:
            sentiment = LABEL_NEUTRAL
            confidence = 0.60

    return {
        "sentiment": sentiment,
        "sentiment_score": round(confidence, 4),
        "confidence": round(confidence, 4),
        "method": "contextual_multilingual"
    }

def analyze_sentiment(text: str) -> Dict[str, Any]:
    if not text or not text.strip():
        return {
            "sentiment": LABEL_NEUTRAL,
            "sentiment_score": 0.50,
            "confidence": 0.50,
            "method": "empty_input"
        }

    context_res = analyze_contextual_sentiment(text)

    pipe = get_sentiment_pipeline()
    if pipe is not None:
        try:
            truncated = text[:1500]
            result = pipe(truncated)[0]
            raw_label = str(result.get("label", "LABEL_1")).upper()
            score = float(result.get("score", 0.50))

            roberta_sentiment = ROBERTA_LABEL_MAP.get(raw_label, LABEL_NEUTRAL)

            if context_res["confidence"] >= 0.80 and context_res["sentiment"] != roberta_sentiment:
                return {
                    "sentiment": context_res["sentiment"],
                    "sentiment_score": round(context_res["confidence"], 4),
                    "confidence": round(context_res["confidence"], 4),
                    "method": "roberta_with_context_override"
                }

            return {
                "sentiment": roberta_sentiment,
                "sentiment_score": round(score, 4),
                "confidence": round(score, 4),
                "method": "roberta"
            }
        except Exception:
            pass

    return context_res
