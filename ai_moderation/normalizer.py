# =============================================================
#  normalizer.py — Multilingual Text Normalization & Obfuscation Detector
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
import unicodedata
from typing import Dict, Any, List

# Unicode Cyrillic and Greek lookalikes commonly used to evade Latin filters
HOMOGLYPH_MAP = {
    '\u0430': 'a', '\u0410': 'A',  # Cyrillic a
    '\u0435': 'e', '\u0415': 'E',  # Cyrillic e
    '\u043e': 'o', '\u041e': 'O',  # Cyrillic o
    '\u0440': 'p', '\u0420': 'P',  # Cyrillic er -> p
    '\u0441': 'c', '\u0421': 'C',  # Cyrillic es -> c
    '\u0443': 'y', '\u0423': 'Y',  # Cyrillic u -> y
    '\u0445': 'x', '\u0425': 'X',  # Cyrillic ha -> x
    '\u0456': 'i', '\u0406': 'I',  # Cyrillic Byelorussian-Ukrainian i
    '\u0458': 'j', '\u0408': 'J',  # Cyrillic je
    '\u0455': 's', '\u0405': 'S',  # Cyrillic dze
    '\u03bf': 'o', '\u039f': 'O',  # Greek omicron
    '\u03b1': 'a', '\u0391': 'A',  # Greek alpha
    '\uff41': 'a', '\uff42': 'b', '\uff43': 'c', '\uff44': 'd',  # Fullwidth Latin
    '\uff45': 'e', '\uff46': 'f', '\uff47': 'g', '\uff48': 'h',
    '\uff49': 'i', '\uff4a': 'j', '\uff4b': 'k', '\uff4c': 'l',
    '\uff4d': 'm', '\uff4e': 'n', '\uff4f': 'o', '\uff50': 'p',
    '\uff51': 'q', '\uff52': 'r', '\uff53': 's', '\uff54': 't',
    '\uff55': 'u', '\uff56': 'v', '\uff57': 'w', '\uff58': 'x',
    '\uff59': 'y', '\uff5a': 'z'
}

# Leetspeak and symbol substitutions
LEET_MAP = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
    '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i',
    '+': 't', '(': 'c', '<': 'c'
}

# Common phonetically misspelled / abbreviated vulgarities in Taglish / Filipino / English
PHONETIC_VARIANTS = {
    r"\b(ptngina|tngina|tang1na|tangena|p-tangina|p\*tangina)\b": "putangina",
    r"\b(pkyu|fck|fckin|fcking|f\*ck|fu\*k|fuk|fcku)\b": "fuck",
    r"\b(b0b0|b-o-b-o|b\*b\*)\b": "bobo",
    r"\b(t4ng4|t-a-n-g-a|tng4)\b": "tanga",
    r"\b(g4g0|g-a-g-o|g@go)\b": "gago",
    r"\b(k1ll|k\*ll|k-i-l-l)\b": "kill",
    r"\b(sh\*t|sh!t|s-h-i-t)\b": "shit",
    r"\b(b\*tch|b!tch|b1tch|b-i-t-c-h)\b": "bitch",
    r"\b(4ssh0le|a\$\$hole|a\*\*hole)\b": "asshole",
    r"\b(k\*ntot|k4nt0t)\b": "kantot",
    r"\b(t\*te|t1te)\b": "tite",
    r"\b(p\*ke|puk1)\b": "puke"
}


class TextNormalizer:
    """
    Multilingual text normalization & evasion detection pipeline.
    Always preserves user's original text while creating enriched representations for moderation.
    """

    @classmethod
    def normalize(cls, text: str) -> Dict[str, Any]:
        if not text:
            return {
                "original": "",
                "clean": "",
                "collapsed": "",
                "evasion": "",
                "deleet": "",
                "deobfuscated": "",
                "has_obfuscation": False,
                "obfuscation_types": []
            }

        original = text
        obfuscation_types: List[str] = []

        # 1. Unicode Homoglyph detection & replacement
        has_homoglyphs = False
        homoglyph_chars = []
        for ch in original:
            if ch in HOMOGLYPH_MAP:
                homoglyph_chars.append(HOMOGLYPH_MAP[ch])
                has_homoglyphs = True
            else:
                homoglyph_chars.append(ch)
        homoglyph_text = "".join(homoglyph_chars)
        if has_homoglyphs:
            obfuscation_types.append("unicode_homoglyphs")

        # 2. Unicode NFKC normalization
        nfkc = unicodedata.normalize('NFKC', homoglyph_text)
        lower = nfkc.lower()

        # 3. Collapse multiple whitespace
        clean = re.sub(r'\s+', ' ', lower).strip()

        # 4. Repeated character collapsing (3 or more repeated chars -> 1)
        # e.g., "stuuuupid" -> "stupid", "boooobo" -> "bobo"
        has_excess_repeats = bool(re.search(r'(.)\1{2,}', clean))
        collapsed = re.sub(r'(.)\1{2,}', r'\1', clean)
        if has_excess_repeats:
            obfuscation_types.append("repeated_characters")

        # 5. Detect Spacing & Punctuation evasion (e.g. "b o b o", "b.o.b.o", "k - i - l - l", "f_u_c_k")
        has_spaced_letters = False
        evasion = collapsed

        # 5A. Intra-word punctuation: b.o.b.o, g_a_g_o, f*u*c*k, k-a
        if re.search(r'(?<=[a-z0-9])[\.\-_*~#|/\\]+(?=[a-z0-9])', evasion):
            has_spaced_letters = True
            evasion = re.sub(r'(?<=[a-z0-9])[\.\-_*~#|/\\]+(?=[a-z0-9])', '', evasion)

        # 5B. Runs of single spaced letters: "b o b o", "k i l l"
        KNOWN_SUBWORDS = [
            'bobo', 'tanga', 'gago', 'kill', 'fuck', 'shit', 'ka', 'mo', 'ako',
            'die', 'ulol', 'puke', 'tite', 'inutil', 'salot', 'puta', 'hate',
            'yourself', 'urself', 'bitch', 'asshole', 'bastard'
        ]

        def _despace_runs(m):
            nonlocal has_spaced_letters
            raw = m.group(0)
            if len(raw.split()) <= 1:
                return raw
            has_spaced_letters = True
            condensed = re.sub(r'\s+', '', raw)
            # Re-split recognized subwords if concatenated (e.g. "boboka" -> "bobo ka")
            tokens = [condensed]
            for kw in sorted(KNOWN_SUBWORDS, key=len, reverse=True):
                next_tokens = []
                for tok in tokens:
                    if tok not in KNOWN_SUBWORDS and kw in tok and len(tok) > len(kw):
                        parts = [p for p in re.split(rf'({re.escape(kw)})', tok) if p]
                        next_tokens.extend(parts)
                    else:
                        next_tokens.append(tok)
                tokens = next_tokens
            return ' '.join(tokens)

        evasion = re.sub(r'\b(?:[a-z0-9]\s+)+[a-z0-9]\b', _despace_runs, evasion)

        if has_spaced_letters:
            obfuscation_types.append("spacing_or_punctuation_evasion")

        # 6. Leetspeak & character substitution (e.g. "b0b0", "k1ll", "g@go", "a$$hole")
        has_leetspeak = False
        deleet_chars = []
        for ch in evasion:
            if ch in LEET_MAP:
                deleet_chars.append(LEET_MAP[ch])
                has_leetspeak = True
            else:
                deleet_chars.append(ch)
        deleet = "".join(deleet_chars)
        if has_leetspeak:
            obfuscation_types.append("leetspeak_substitutions")

        # 7. Common phonetic abbreviations replacement
        deobfuscated = deleet
        for pattern, replacement in PHONETIC_VARIANTS.items():
            if re.search(pattern, deobfuscated, re.IGNORECASE):
                deobfuscated = re.sub(pattern, replacement, deobfuscated, flags=re.IGNORECASE)
                obfuscation_types.append("phonetic_misspelling")

        has_obfuscation = len(obfuscation_types) > 0

        return {
            "original": original,
            "clean": clean,
            "collapsed": collapsed,
            "evasion": evasion,
            "deleet": deleet,
            "deobfuscated": deobfuscated,
            "has_obfuscation": has_obfuscation,
            "obfuscation_types": list(set(obfuscation_types))
        }
