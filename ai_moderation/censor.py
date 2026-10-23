# =============================================================
#  censor.py — Partial Profanity Censorship Engine
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
#
#  RULE:
#  - Keep first letter of profanity word visible.
#  - Replace letters between first and last with asterisks (*).
#  - Keep last letter visible.
#  - Preserve original capitalization for visible letters.
#  - The number of asterisks equals the number of letters between
#    the first and last letters.
# =============================================================

import re
from typing import List, Tuple

def censor_word(w: str) -> str:
    """
    Censors a prohibited word:
    - Keep first letter visible.
    - Replace letters between first and last with asterisks (*).
    - Keep last letter visible.
    - Preserve original word's capitalization for visible letters.
    - Use exact number of asterisks needed to replace middle letters (len - 2).
    """
    if not w or len(w) <= 2:
        return w

    return w[0] + ('*' * (len(w) - 2)) + w[-1]



# Configured English and Filipino profanity patterns with complete word boundary matching
PROFANITY_PATTERNS = [
    # Filipino compound / spaced profanities
    r"\bputang[\s\-_]*ina\b",
    r"\bpukinang[\s\-_]*ina\b",
    r"\bpuki[\s\-_]*nang[\s\-_]*ina\b",
    r"\btang[\s\-_]*ina\b",
    r"\btang[\s\-_]*ena\b",
    r"\banak[\s\-_]*ng[\s\-_]*puta\b",
    r"\bhayop[\s\-_]*ka\b",
    r"\bhayup[\s\-_]*ka\b",

    # Filipino single profanities
    r"\bputangina\b",
    r"\bpukinangina\b",
    r"\btangina\b",
    r"\btangena\b",
    r"\btaena\b",
    r"\btayna\b",
    r"\bkingina\b",
    r"\bamputa\b",
    r"\bampota\b",
    r"\bpunyeta\b",
    r"\bleche\b",
    r"\bletse\b",
    r"\bpiste\b",
    r"\bpeste\b",
    r"\byawa\b",
    r"\bkupal\b",
    r"\bogag\b",
    r"\bpota\b",
    r"\bputa\b",
    r"\blintik\b",
    r"\bhudas\b",
    r"\bgago(?:ng)?\b",
    r"\bgaga\b",
    r"\bkagaguhan\b",
    r"\btarantado\b",
    r"\btarantada\b",
    r"\bkatarantadohan\b",
    r"\bbobo(?:ng)?\b",
    r"\bboba\b(?!\s+(?:tea|milk|drink))",
    r"\bkabobohan\b",
    r"\bbopols\b",
    r"\bboplaks\b",
    r"\bulol\b",
    r"\binutil\b",
    r"\btanga(?:ng)?\b",
    r"\bkatangahan\b",
    r"\bbwisit\b",
    r"\bbuwisit\b",
    r"\bhinayupak\b",
    r"\bkantot(?:an|in)?\b",
    r"\bchupa(?:in)?\b",
    r"\btsupa(?:in)?\b",
    r"\btite\b",
    r"\bpuke\b",
    r"\bpuki\b",
    r"\bkiki\b",
    r"\btamod\b",
    r"\bjakol\b",
    r"\bburat\b",
    r"\bbayag\b",
    r"\bpepe\b",
    r"\biyot(?:an)?\b",
    r"\bpokpok\b",

    # English profanities
    r"\bmotherfuck(?:er|ers|ing)?\b",
    r"\bfuck(?:ing|ers?|ed|s)?\b",
    r"\bbullshit(?:s)?\b",
    r"\bdipshit(?:s)?\b",
    r"\bhorseshit\b",
    r"\bshit(?:s|ted|ting|ty)?\b",
    r"\bbitch(?:es|ing|y)?\b",
    r"\basshole(?:s)?\b",
    r"\bdumbass(?:es)?\b",
    r"\bjackass(?:es)?\b",
    r"\bfatass(?:es)?\b",
    r"\bbastard(?:s)?\b",
    r"\bcunt(?:s)?\b",
    r"\bdickhead(?:s)?\b",
    r"\bdick(?:s)?\b",
    r"\bcocksucker(?:s)?\b",
    r"\bcock(?:s)?\b",
    r"\bpuss(?:y|ies)\b",
    r"\btwat(?:s)?\b",
    r"\bwanker(?:s)?\b",
    r"\bslut(?:s|ty)?\b",
    r"\bwhore(?:s)?\b",
    # Standalone 'ass' without colliding with classic, pass, asset, etc.
    r"(?<![a-zA-Z0-9])ass(?:es)?(?![a-zA-Z0-9])",
]

COMPILED_PROFANITY_REGEX = re.compile("|".join(f"(?:{p})" for p in PROFANITY_PATTERNS), re.IGNORECASE)

def censor_profanity(text: str) -> str:
    """
    Scans text for prohibited profanity words and replaces their middle letters with asterisks,
    preserving the first and last letters and their original casing.
    Preserves emojis, punctuation, normal text, and spacing intact.
    """
    if not text or not isinstance(text, str):
        return text

    def _replace_match(m):
        raw = m.group(0)
        # Apply word-level censorship to each alphabetical sequence in the match
        return re.sub(r'[a-zA-Z]+', lambda wm: censor_word(wm.group(0)), raw)

    return COMPILED_PROFANITY_REGEX.sub(_replace_match, text)


def contains_profanity(text: str) -> bool:
    """Check if the text contains any prohibited profanity word."""
    if not text or not isinstance(text, str):
        return False
    return bool(COMPILED_PROFANITY_REGEX.search(text))


def get_profanities_found(text: str) -> List[str]:
    """Return all matched profanity words/phrases found in the text."""
    if not text or not isinstance(text, str):
        return []
    matches = COMPILED_PROFANITY_REGEX.findall(text)
    # Deduplicate while preserving order
    seen = set()
    result = []
    for m in matches:
        m_lower = m.lower().strip()
        if m_lower and m_lower not in seen:
            seen.add(m_lower)
            result.append(m)
    return result
