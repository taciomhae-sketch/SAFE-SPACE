# =============================================================
#  language_detector.py — Multilingual & Taglish Language Detector
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
from typing import Dict, Any, Tuple

# Common Tagalog/Filipino structural particles, markers, pronouns, and words
TAGALOG_MARKERS = {
    # Markers & prepositions
    "ang", "ng", "mga", "sa", "kay", "kina", "para", "ni", "nina",
    # Pronouns
    "ako", "ko", "akin", "ikaw", "ka", "mo", "iyo", "siya", "niya", "kaniya",
    "kanya", "tayo", "natin", "atin", "kami", "namin", "amin", "kayo", "ninyo",
    "inyo", "sila", "nila", "kanila",
    # Demonstratives
    "ito", "iyan", "iyon", "dito", "diyan", "doon", "nito", "niyan", "noon",
    # Question words
    "ano", "sino", "saan", "kailan", "bakit", "paano", "magkano", "alin",
    # Common verbs & adjectives & adverbs
    "may", "meron", "wala", "hindi", "huwag", "wag", "oo", "opo", "po",
    "na", "pa", "naman", "din", "rin", "daw", "raw", "pala", "kaya", "kasi",
    "pero", "dahil", "kundi", "upang", "habang", "bago", "pagkatapos",
    "talaga", "sobra", "sobrang", "masyado", "masyadong", "gusto", "ayaw",
    "puwede", "pwede", "dapat", "kailangan", "buhay", "tao", "araw", "oras",
    "bahay", "paaralan", "eskwela", "klase", "guro", "kaibigan", "pamilya",
    # Slang & colloquial
    "lods", "lodz", "tol", "pre", "chibog", "arat", "tara", "eme", "charot",
    "char", "luh", "sheesh", "chika", "petmalu", "werpa", "skwela", "walwal",
    "bwisit", "buwisit", "hirap", "lungkot", "pagod", "saya", "tulong", "salamat"
}

# Common English stopwords & structural markers
ENGLISH_MARKERS = {
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her",
    "she", "or", "an", "will", "my", "one", "all", "would", "there",
    "their", "what", "so", "up", "out", "if", "about", "who", "get",
    "which", "go", "me", "when", "make", "can", "like", "time", "no",
    "just", "him", "know", "take", "people", "into", "year", "your",
    "good", "some", "could", "them", "see", "other", "than", "then",
    "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first",
    "well", "way", "even", "new", "want", "because", "any", "these",
    "give", "day", "most", "us", "is", "are", "was", "were", "am"
}

# Common Filipino verb affixes (e.g. nag-aaral, kumakain, pinag-usapan)
FILIPINO_AFFIX_PATTERN = re.compile(
    r"\b(nag|mag|pag|i|in|um|ma|ipag|ipinag|napag|makipag|makapag)[a-z]+|\b[a-z]+(an|han|in|hin)\b",
    re.IGNORECASE
)

# Taglish code-switching patterns (e.g., "nag-study", "nag-call", "i-message")
TAGLISH_HYBRID_PATTERN = re.compile(
    r"\b(nag|mag|i|pa|ipag)-[a-z]{3,}\b",
    re.IGNORECASE
)


class LanguageDetector:
    """
    Extensible multilingual language detector specialized for student Safe Space communications.
    Accurately classifies English, Filipino/Tagalog, and Taglish code-switching.
    """

    @classmethod
    def detect(cls, text: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return {
                "language": "english",
                "code": "en",
                "confidence": 1.0,
                "is_multilingual": False,
                "details": {"fil_score": 0.0, "en_score": 0.0}
            }

        # Tokenize words (alphabetic only)
        words = re.findall(r"[a-zA-Z]+", text.lower())
        total_words = len(words)
        if total_words == 0:
            return {
                "language": "english",
                "code": "en",
                "confidence": 0.5,
                "is_multilingual": False,
                "details": {"fil_score": 0.0, "en_score": 0.0}
            }

        fil_count = 0
        en_count = 0
        has_taglish_hybrid = bool(TAGLISH_HYBRID_PATTERN.search(text))

        for w in words:
            is_fil = w in TAGALOG_MARKERS
            is_en = w in ENGLISH_MARKERS

            if is_fil:
                fil_count += 1
            elif is_en:
                en_count += 1
            elif FILIPINO_AFFIX_PATTERN.match(w):
                fil_count += 0.8

        fil_ratio = fil_count / total_words
        en_ratio = en_count / total_words

        # Classification logic
        # 1. TAGLISH: Significant mixture of both languages or presence of hybrid affixes
        if has_taglish_hybrid or (fil_count >= 1 and en_count >= 1 and (fil_ratio >= 0.15 or en_ratio >= 0.15)):
            confidence = min(0.98, max(0.85, 0.70 + (fil_ratio + en_ratio) * 0.3))
            return {
                "language": "taglish",
                "code": "taglish",
                "confidence": round(confidence, 2),
                "is_multilingual": True,
                "details": {
                    "fil_ratio": round(fil_ratio, 2),
                    "en_ratio": round(en_ratio, 2),
                    "hybrid_affixes": has_taglish_hybrid
                }
            }

        # 2. FILIPINO / TAGALOG: Dominant Tagalog signals
        if fil_count > en_count or fil_ratio >= 0.25:
            conf = min(0.98, max(0.82, 0.65 + fil_ratio * 0.5))
            return {
                "language": "filipino",
                "code": "fil",
                "confidence": round(conf, 2),
                "is_multilingual": False,
                "details": {
                    "fil_ratio": round(fil_ratio, 2),
                    "en_ratio": round(en_ratio, 2)
                }
            }

        # 3. ENGLISH: Default or dominant English
        conf = min(0.98, max(0.80, 0.65 + en_ratio * 0.5))
        return {
            "language": "english",
            "code": "en",
            "confidence": round(conf, 2),
            "is_multilingual": False,
            "details": {
                "fil_ratio": round(fil_ratio, 2),
                "en_ratio": round(en_ratio, 2)
            }
        }
