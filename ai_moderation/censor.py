# =============================================================
#  censor.py — Word-by-Word AI Profanity Censorship Engine
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
#
#  RULE SPECIFICATION:
#  - Scans user content word-by-word from beginning to end.
#  - Keep first letter of prohibited word visible.
#  - Replace letters between first and last with asterisks (*).
#  - Keep last letter visible.
#  - Preserve original capitalization for visible letters.
#  - Number of asterisks equals middle letters (len - 2).
#  - 2-letter words: keep both letters (no middle letters).
#  - <2-letter words: return as-is.
#  - Multiword phrases: mask each constituent word individually.
#  - Surrounding punctuation, spacing, line breaks, and emojis
#    are preserved intact.
#  - Detect repeated letters (e.g. fuuuuck, gagoooo) and
#    leetspeak substitutions (e.g. b0b0, g@go, f*ck, sh!t).
#  - Zero false positives on harmless words (pass, class, assistant,
#    boba tea, compassion, cocktail, tangent, etc.).
#  - Administrator-configurable custom profanity dictionary.
# =============================================================

import os
import re
import json
from typing import List, Set, Optional

# Path to custom profanity dictionary file
CUSTOM_WORDS_FILE = os.path.join(os.path.dirname(__file__), "custom_banned_words.json")


def censor_word(w: str) -> str:
    """
    Censors a prohibited word:
    - Keep first letter visible.
    - Replace letters between first and last with asterisks (*) (len - 2).
    - Keep last letter visible.
    - Preserve original word's capitalization for visible letters.
    - If word has 2 letters, keep both letters because there are no middle letters.
    - If word has <2 letters, return as-is.
    """
    if not w or not isinstance(w, str) or len(w) <= 2:
        return w or ""

    return w[0] + ('*' * (len(w) - 2)) + w[-1]


COMMON_STOP_WORDS = {
    'the', 'of', 'and', 'or', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'about',
    'ng', 'mga', 'sa', 'kay', 'ni', 'na', 'ang'
}


def mask_expression(raw: str) -> str:
    """
    Masks a matched prohibited expression (single word or multiword phrase).
    Splits by whitespace, hyphens, and underscores so that each relevant
    word is masked individually according to the first-and-last-letter rule,
    while grammatical connectors and delimiters are preserved.
    """
    parts = re.split(r'(\s+|[-_]+)', raw)
    censored_parts = []
    for part in parts:
        if not part or part.isspace() or part in ('-', '_'):
            censored_parts.append(part)
        elif part.lower() in COMMON_STOP_WORDS:
            censored_parts.append(part)
        else:
            censored_parts.append(censor_word(part))
    return "".join(censored_parts)


# ── Base Profanity Patterns (English, Filipino, Taglish, Vulgarities) ──
# Boundaries (?<![a-zA-Z0-9]) and (?![a-zA-Z0-9]) ensure exact word isolation
# without false positives on words like pass, class, assistant, compassion.

BASE_PROFANITY_PATTERNS = [
    # ── Filipino Multiword Expressions ──
    r"(?<![a-zA-Z0-9])p+u+t+[a@4]+n+g+[\s\-_]+[i1!]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+u+k+[i1!]+n+[a@4]+n+g+[\s\-_]+[i1!]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+u+k+[i1!]+[\s\-_]+n+[a@4]+n+g+[\s\-_]+[i1!]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+n+g+[\s\-_]+[i1!e3]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+[\s\-_]+[e3]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])a+n+[a@4]+k+[\s\-_]+n+g+[\s\-_]+p+[uUoO*]+t+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])h+[a@4]+y+[uUoO]+p+[\s\-_]+k+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])l+[e3]+[ct]+s?h+[e3]+[\s\-_]+k+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+[a@4]+k+[\s\-_]+y+[uU]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])f+[a@4]+k+[\s\-_]+y+[uU]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+u+t+[a@4]+n+g+[\s\-_]*i+n+[a@4]+(?![a-zA-Z0-9])",

    # ── Filipino Single Profanities & Local Variations ──
    r"(?<![a-zA-Z0-9])p+u+t+[a@4]+n+g+[i1!]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+u+k+[i1!]+n+[a@4]+n+g+[i1!]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+n+g+[i1!]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+n+g+[e3]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+[e3]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+y+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])k+[i1!]+n+g+[i1!]+n+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])a+m+p+[uUoO*]+t+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+u+n+y+[e3]+t+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])l+[e3]+[ct]+s?h+[e3]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+[ei]+s+t+[e3]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])y+[a@4]+w+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])k+u+p+[a@4]+l+(?:s)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])o+g+[a@4]+g+(?:s)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+[uUoO*]+t+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])l+[i1!]+n+t+[i1!]+k+(?:s)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])h+u+d+[a@4]+s+(?:s)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])g+[a@4]+g+[oO0uU]+(?:ng)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])g+[a@4]+g+[a@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])k+[a@4]+g+[a@4]+g+u+h+[a@4]+n+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+r+[a@4]+n+t+[a@4]+d+[oO0uUa@4]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])k+[a@4]+t+[a@4]+r+[a@4]+n+t+[a@4]+d+[oO0]+h+[a@4]+n+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+[oO0]+b+[oO0]+(?:ng)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+[oO0]+b+[aA@4]+(?!\s*(?:tea|milk|drink))(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])k+[a@4]+b+[oO0]+b+[oO0]+h+[a@4]+n+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+[oO0]+p+[oO0]+l+s+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+[oO0]+p+l+[a@4]+k+s+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])u+l+[oO0]+l+(?:s)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])i+n+u+t+[i1!]+l+(?:s)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+n+g+[a@4]+(?:ng)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])k+[a@4]+t+[a@4]+n+g+[a@4]+h+[a@4]+n+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+u*w+[i1!]+s+[i1!]+t+(?:s)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])h+[i1!]+n+[a@4]+y+u+p+[a@4]+k+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])k+[a@4]+n+t+[o0]+t+(?:an|in)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])c+h+u+p+[a@4]+(?:in)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+s+u+p+[a@4]+(?:in)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[i1!]+t+[e3]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+u+k+[e3i1!]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])k+[i1!]+k+[i1!]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+[a@4]+m+[o0]+d+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])j+[a@4]+k+[o0]+l+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+u+r+[a@4]+t+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+[a@4]+y+[a@4]+g+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+[e3]+p+[e3]+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])i+y+[o0]+t+(?:an)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+[o0]+k+p+[o0]+k+(?![a-zA-Z0-9])",

    # ── English Profanities, Vulgarities & Leetspeak ──
    r"(?<![a-zA-Z0-9])s+h+u+t+[\s\-_]+t+h+e+[\s\-_]+f+[uU*vV]+c+k+[\s\-_]+u+p+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])f+[uU*vV]+c+k+[\s\-_]+(?:y+o+u+|o+f+f+|u+)(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])m+[o0]+t+h+e+r+f+[uU*vV]+c+k+(?:e+r+s?|i+n+g+|e+d+|s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])f+[uU*vV]+c+k+(?:i+n+g+|e+r+s?|e+d+|s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])f+[\*]+c*k+(?:i+n+g+|e+r+s?|e+d+|s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])f+u+k+(?:i+n+g+|e+r+s?|e+d+|s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+u+l+l+s+h+[iI1!*]+t+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])d+[i1!]+p+s+h+[iI1!*]+t+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])h+[o0]+r+s+e+s+h+[iI1!*]+t+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])s+h+[iI1!*]+t+(?:s+|t+e+d+|t+i+n+g+|t+y+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+[iI1!*]+t+c+h+(?:e+s+|i+n+g+|y+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+[iI1!*]+c+h+(?:e+s+|i+n+g+|y+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])a+[s$5]+h+[o0]+l+e+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])d+u+m+b+a+[s$5]{2,}(?:e+s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])j+[a@4]+c+k+a+[s$5]{2,}(?:e+s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])f+[a@4]+t+a+[s$5]{2,}(?:e+s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])b+[a@4]+s+t+[a@4]+r+d+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])c+u+n+t+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])d+[iI1!*]+c+k+h+e+[a@4]+d+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])d+[iI1!*]+c+k+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])c+[o0]+c+k+s+u+c+k+e+r+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])c+[o0]+c+k+(?:s+)?(?!(?:tail|roach|[a-zA-Z0-9]))",
    r"(?<![a-zA-Z0-9])p+u+s+s+y+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])p+u+s+s+i+e+s+(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])t+w+[a@4]+t+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])w+[a@4]+n+k+e+r+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])s+l+u+t+(?:s+|t+y+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])w+h+[o0]+r+e+(?:s+)?(?![a-zA-Z0-9])",
    r"(?<![a-zA-Z0-9])s+t+f+u+(?![a-zA-Z0-9])",
    # Standalone 'ass' (requires at least 2 s's, zero collision with class, pass, assistant, compassion, asset)
    r"(?<![a-zA-Z0-9])a+[s$5]{2,}(?:es)?(?![a-zA-Z0-9])",
]


class ProfanityEngine:
    """
    Centralized, thread-safe profanity detection and asterisk censorship engine.
    Supports dynamic administrative dictionary configuration, multiword expressions,
    repeated characters, and leetspeak variations.
    """
    def __init__(self):
        self.custom_words: List[str] = []
        self._load_custom_words()
        self._recompile()

    def _load_custom_words(self):
        if os.path.exists(CUSTOM_WORDS_FILE):
            try:
                with open(CUSTOM_WORDS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self.custom_words = [str(w).strip().lower() for w in data if str(w).strip()]
            except Exception:
                self.custom_words = []
        else:
            self.custom_words = []

    def _save_custom_words(self):
        try:
            with open(CUSTOM_WORDS_FILE, "w", encoding="utf-8") as f:
                json.dump(sorted(list(set(self.custom_words))), f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def _build_custom_pattern(self, word: str) -> str:
        """
        Builds a safe, bounded regex pattern for an administrator-configured keyword or phrase.
        Supports phrases (space-separated) and word variations.
        """
        w = word.strip()
        if not w:
            return ""
        if " " in w:
            parts = [re.escape(p) for p in w.split()]
            inner = r"\s+".join(parts)
            return rf"(?<![a-zA-Z0-9]){inner}(?![a-zA-Z0-9])"
        else:
            escaped = re.escape(w)
            return rf"(?<![a-zA-Z0-9]){escaped}(?:s|es)?(?![a-zA-Z0-9])"

    def _recompile(self):
        all_patterns = list(BASE_PROFANITY_PATTERNS)
        for cw in self.custom_words:
            pat = self._build_custom_pattern(cw)
            if pat:
                all_patterns.append(pat)

        self.compiled_regex = re.compile("|".join(f"(?:{p})" for p in all_patterns), re.IGNORECASE)

    def add_custom_word(self, word: str) -> bool:
        """Add an administrator-configured prohibited keyword."""
        w_clean = str(word or "").strip().lower()
        if not w_clean or w_clean in self.custom_words:
            return False
        self.custom_words.append(w_clean)
        self._save_custom_words()
        self._recompile()
        return True

    def remove_custom_word(self, word: str) -> bool:
        """Remove an administrator-configured prohibited keyword."""
        w_clean = str(word or "").strip().lower()
        if w_clean in self.custom_words:
            self.custom_words = [w for w in self.custom_words if w != w_clean]
            self._save_custom_words()
            self._recompile()
            return True
        return False

    def get_custom_words(self) -> List[str]:
        return list(self.custom_words)

    def censor(self, text: str) -> str:
        """
        Scans complete submitted text from beginning to end, word-by-word.
        Masks every detected prohibited word using the first-and-last-letter
        format (e.g. Example -> E*****e, Unkind -> U****d).
        Preserves all unaffected words, punctuation, spacing, emojis, and line breaks.
        """
        if not text or not isinstance(text, str):
            return text or ""

        def _replace_match(m):
            return mask_expression(m.group(0))

        return self.compiled_regex.sub(_replace_match, text)

    def has_profanity(self, text: str) -> bool:
        """Check if the text contains any prohibited word or phrase."""
        if not text or not isinstance(text, str):
            return False
        return bool(self.compiled_regex.search(text))

    def find_profanities(self, text: str) -> List[str]:
        """Return all unique matched prohibited words found in text."""
        if not text or not isinstance(text, str):
            return []
        matches = self.compiled_regex.findall(text)
        seen = set()
        result = []
        for m in matches:
            m_clean = m.strip().lower()
            if m_clean and m_clean not in seen:
                seen.add(m_clean)
                result.append(m)
        return result


# Singleton Engine Instance
_ENGINE = ProfanityEngine()

# ── Public API Module Functions ──
def censor_profanity(text: str) -> str:
    """Public wrapper to censor profanities in text."""
    return _ENGINE.censor(text)

def contains_profanity(text: str) -> bool:
    """Public wrapper to check if text contains profanity."""
    return _ENGINE.has_profanity(text)

def get_profanities_found(text: str) -> List[str]:
    """Public wrapper to retrieve all profanity occurrences."""
    return _ENGINE.find_profanities(text)

def add_custom_word(word: str) -> bool:
    return _ENGINE.add_custom_word(word)

def remove_custom_word(word: str) -> bool:
    return _ENGINE.remove_custom_word(word)

def get_custom_words() -> List[str]:
    return _ENGINE.get_custom_words()
