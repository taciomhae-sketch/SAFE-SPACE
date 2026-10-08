# =============================================================
#  context_analyzer.py — Context, Intent & Target Evaluation
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
from typing import Dict, Any, List

# Benign substring collisions and harmless phrases
BENIGN_WHITELIST_PATTERNS = [
    # English benign idioms
    r"\b(diet|dieting|balanced diet|healthy diet)\b",
    r"\b(my\s*(phone|laptop|battery|pc|car|earphones)\s*died)\b",
    r"\b(died\s*laughing|dying\s*laughing|dead\s*tired)\b",
    r"\b(roll\s*(the\s*)?die)\b",
    r"\b(kill\s*(time|the\s*game|it|the\s*vibe))\b",
    
    # Filipino benign idioms / food
    r"\b(puto\s*(bumbong|cheese|pao|kutsinta)?)\b",
    r"\b(tatawa\s*ako|nakakatawa|nakakatuwa)\b"
]

# Academic and emotional stress sharing patterns (MUST be approved as safe student support)
SAFE_ACADEMIC_STRESS_PATTERNS = [
    # Exam / grade / thesis / homework stress
    r"\b(stressed|exhausted|tired|burnout|overwhelmed|worried|anxious)\s*(because of|due to|about|with)?\s*(my|the|our|this|all\s*the)?\s*(exam|assignment|school|study|homework|class|project|thesis|finals|grades?|defense|prof|teacher|subject)\b",
    r"\b(i('m| am| feel| felt)?\s*(sad|upset|down|frustrated|discouraged|crying))\s*(about|because of|due to|today|lately|right now)?\s*(my|the|our|this)?\s*(exam|grade|score|class|school|failure|project|homework|thesis|defense|interview)\b",
    r"\b(i\s*(failed|did\s*not\s*pass|did\s*bad\s*on|got\s*a\s*low\s*grade\s*on|struggling\s*with))\b",
    r"\b(hindi\s*ako\s*(pumasa|nakapasa)|bagsak\s*ako|bumagsak\s*ako|hirap\s*na\s*hirap\s*ako)\b",
    r"\b(pagod\s*na\s*ako\s*(sa\s*school|sa\s*klase|sa\s*assignments?|sa\s*exams?|sa\s*thesis|sa\s*buhay\s*estudyante))\b",
    r"\b(ang\s*hirap\s*(ng\s*exam|ng\s*thesis|ng\s*defense|mag-aral|sa\s*school))\b",
    r"\b(sobrang\s*(dami|hirap)\s*ng\s*(requirements|tasks|exams|assignments))\b"
]

# Educational discussion, reporting, or meta-referencing harmful content
EDUCATIONAL_OR_REPORTING_PATTERNS = [
    r"\b(the\s*(lecture|class|prof|teacher|seminar|lesson|topic|discussion)\s*(is|was|talked|discussed)\s*(about)?)\b",
    r"\b(what\s*(does|is)\s*(cyberbullying|harassment|bullying|hate speech)\s*mean)\b",
    r"\b(someone\s*(called\s*me|sent\s*me|messaged\s*me|threatened\s*me))\b",
    r"\b(how\s*(do\s*i|to)\s*(report|block|handle)\s*(harassment|bullying|threats?))\b",
    r"\b(may\s*(nagsabi\s*sa\s*akin|nag-message\s*sa\s*akin|nang-away\s*sa\s*akin))\b",
    r"\b(paano\s*(mag-report|mag-block|isumbong))\b",
    r"\b(definition\s*of|meaning\s*of)\b"
]

# Targeted second-person pronouns (indicating personal targeting)
TARGETED_PRONOUNS_EN = re.compile(r"\b(you|u|ur|your|you're|yourself)\b", re.IGNORECASE)
TARGETED_PRONOUNS_FIL = re.compile(r"\b(ka|mo|ikaw|kayo|ninyo|iyo|sayo|sa\s*iyo)\b", re.IGNORECASE)


class ContextAnalyzer:
    """
    Evaluates contextual intent, targeting, academic distress vs self-harm,
    and protects benign discussions from false positives.
    """

    @classmethod
    def analyze(cls, text_dict: Dict[str, Any]) -> Dict[str, Any]:
        clean = text_dict.get("clean", "")
        deobf = text_dict.get("deobfuscated", clean)

        # 1. Check Benign Whitelist Safeguard
        is_whitelisted = False
        for pat in BENIGN_WHITELIST_PATTERNS:
            if re.search(pat, clean, re.IGNORECASE) or re.search(pat, deobf, re.IGNORECASE):
                is_whitelisted = True
                break

        # 2. Check Academic Stress (Supportive, non-harmful)
        is_academic_stress = False
        for pat in SAFE_ACADEMIC_STRESS_PATTERNS:
            if re.search(pat, clean, re.IGNORECASE) or re.search(pat, deobf, re.IGNORECASE):
                is_academic_stress = True
                break

        # 3. Check Educational / Reporting Context
        is_educational_or_reporting = False
        for pat in EDUCATIONAL_OR_REPORTING_PATTERNS:
            if re.search(pat, clean, re.IGNORECASE) or re.search(pat, deobf, re.IGNORECASE):
                is_educational_or_reporting = True
                break

        # 4. Check Direct Targeting (Addressing a user directly)
        has_en_target = bool(TARGETED_PRONOUNS_EN.search(clean) or TARGETED_PRONOUNS_EN.search(deobf))
        has_fil_target = bool(TARGETED_PRONOUNS_FIL.search(clean) or TARGETED_PRONOUNS_FIL.search(deobf))
        is_targeted = has_en_target or has_fil_target

        return {
            "is_whitelisted": is_whitelisted,
            "is_academic_stress": is_academic_stress,
            "is_educational_or_reporting": is_educational_or_reporting,
            "is_targeted": is_targeted,
            "target_language": "both" if (has_en_target and has_fil_target) else ("fil" if has_fil_target else ("en" if has_en_target else "none"))
        }
