# =============================================================
#  sensitive_analyzer.py — AI Sensitive Content Classifier & Warning Generator
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
from typing import Dict, Any, List, Optional

# Standard Category Keys
CAT_SEXUAL_CONTENT = "SEXUAL_CONTENT"
CAT_NUDITY = "NUDITY"
CAT_BULLYING = "BULLYING"
CAT_VIOLENCE = "VIOLENCE"
CAT_SELF_HARM = "SELF_HARM"
CAT_TRAUMA = "TRAUMA"
CAT_PROFANITY = "PROFANITY"
CAT_OTHER = "OTHER"

# Canonical Human-Readable Category Names
CATEGORY_DISPLAY_NAMES = {
    CAT_SEXUAL_CONTENT: "Sexual Content",
    CAT_NUDITY: "Nudity",
    CAT_BULLYING: "Bullying and Harassment",
    CAT_VIOLENCE: "Violence and Graphic Content",
    CAT_SELF_HARM: "Self-Harm and Suicide-Related Content",
    CAT_TRAUMA: "Trauma and Distressing Experiences",
    CAT_PROFANITY: "Profanity and Offensive Language",
    CAT_OTHER: "Sensitive Content"
}

# Canonical Warning Messages per Section 4 & 8
WARNING_MESSAGES = {
    CAT_SEXUAL_CONTENT: "Sensitive Content: This post may contain sexual content or sexually suggestive material.",
    CAT_NUDITY: "Sensitive Content: This post may contain nudity or exposed body parts.",
    CAT_BULLYING: "Sensitive Content: This post may contain bullying, harassment, or offensive language.",
    CAT_VIOLENCE: "Sensitive Content: This post may contain violence, disturbing descriptions, or graphic material.",
    CAT_SELF_HARM: "Sensitive Content: This post discusses self-harm, suicide-related experiences, or emotional distress.",
    CAT_TRAUMA: "Sensitive Content: This post may discuss trauma, abuse, or distressing personal experiences.",
    CAT_PROFANITY: "Sensitive Content: This post may contain profanity or offensive language.",
    CAT_OTHER: "Sensitive Content: This post may contain material that some users find distressing."
}

# ─────────────────────────────────────────────────────────────
# 1. Normal Academic / Daily Life Patterns (MUST NEVER BE SENSITIVE/BLURRED)
# ─────────────────────────────────────────────────────────────
SAFE_NORMAL_EMOTION_PATTERNS = [
    # Academic stress, exams, thesis, homework, classes
    r"\b(exam|test|quiz|assignment|homework|thesis|defense|grades?|score|school|subject|class|studying|study|prof|teacher|presentation|project)\b",
    r"\b(bagsak|pumasa|nakapasa|aral|klase|eskwela|guro|proyekto|takdang-aralin)\b",
    # Normal sadness / tiredness without crisis or self-harm
    r"\b(i('m| am| feel)?\s*(just\s*)?(tired|exhausted|sleepy|sad|down|frustrated|upset|anxious|stressed|overwhelmed))\b",
    r"\b(pagod|antok|lungkot|nalulungkot|hirap|nahihirapan|stress|sobrang daming gagawin)\b",
    # Benign positive, appreciation, questions, casual updates
    r"\b(happy|glad|excited|grateful|blessed|thankful|fun|great day|masaya|salamat|araw)\b"
]

# ─────────────────────────────────────────────────────────────
# 2. Sensitive Content Patterns (Multilingual: EN, FIL, Taglish)
# ─────────────────────────────────────────────────────────────

# A. Sexual Content
SEXUAL_CONTENT_PATTERNS = [
    r"\b(sexual|sexuality|intercourse|horny|orgasm|erotic|sensual|intimate\s*encounter|hookup|hooking\s*up|making\s*out|foreplay)\b",
    r"\b(kantot|kantutan|chupain|tsupain|pakikipagtalik|pagnanasa|libog|malibog|pakikipagrelasyon\s*sa\s*kama)\b",
    r"\b(sexual\s*(harassment|advances|innuendo|suggestive|solicitation|favors))\b"
]

# B. Nudity
NUDITY_PATTERNS = [
    r"\b(nudity|nude|nudes|naked|topless|bottomless|undressed|stripping|exposed\s*(body|skin|chest|private\s*parts))\b",
    r"\b(hubad|nakahubad|walang\s*damit|bold|bold\s*star|paghuhubad|maselang\s*bahagi)\b",
    r"\b(tite|puke|puki|kiki|burat|bayag|pepe|penis|vagina|boobs|boobies|tits)\b"
]

# C. Bullying & Harassment
BULLYING_PATTERNS = [
    # Personal accounts or descriptions of bullying
    r"\b(bullied|bullying|cyberbullied|cyberbullying|harassed|harassment|teased|humiliated|name-calling|picked\s*on|gang(ed)?\s*up\s*on|mocked|mocking|make\s*fun\s*of|making\s*fun\s*of|ridiculed|ridiculing|belittled|belittling|ostracized)\b",
    r"\b(na-bully|binully|nambu-bully|pang-aapi|inapi|inaapi|tinutukso|hinahamak|pinapahiya|pinahiya|pangungutya|pang-aasar|tinatawanan|pinagtatawanan)\b",
    # Direct insults or humiliation
    r"\b(bobo|tanga|gago|ulol|inutil|tarantado|salot|loser|worthless|pathetic|stupid|idiot|dumbass)\b",
    r"\b(everyone\s*(should|must|let'?s)?\s*(hate|avoid|ignore|mock|bully|make\s*fun\s*of))\b"
]

# D. Violence & Graphic Content
VIOLENCE_PATTERNS = [
    r"\b(violence|violent|assault|assaulted|beaten\s*up|punch(ed)?|stab(bed)?|shot|shooting|blood(y)?|wound(ed)?|injury|injuries|fracture|broken\s*bones)\b",
    r"\b(sinapak|binugbog|binaril|sinaksak|saksakan|bugbugan|duguan|sugat|karahasan|pambubugbog|napaslang|patayan|madugong|suntukan)\b",
    r"\b(graphic\s*content|disturbing\s*scene|graphic\s*images?|horror|gore|mutilat(ion|ed))\b"
]

# E. Self-Harm & Suicide-Related Content
SELF_HARM_PATTERNS = [
    r"\b(self-harm|self\s*harm|cutting|slit(ting)?\s*wrists?|burned\s*myself|suicid(e|al)|ending\s*(my|one'?s)\s*life|kill(ing)?\s*myself)\b",
    r"\b(magpakamatay|pagpapakamatay|maglaslas|laslas|magbigti|kitilin\s*ang\s*buhay|patayin\s*ang\s*sarili|ayaw\s*ko\s*nang\s*mabuhay|gusto\s*ko\s*nang\s*mawala)\b",
    r"\b(recovery\s*from\s*(self-harm|cutting)|trying\s*to\s*stay\s*clean|urges\s*to\s*harm|crisis\s*hotline)\b"
]

# F. Trauma & Distressing Experiences
TRAUMA_PATTERNS = [
    r"\b(trauma|traumatic|traumatiz(ed|ing)|ptsd|abuse|abused|abusive|molest(ed|ation)|rape|raped|survivor\s*of\s*abuse|toxic\s*household)\b",
    r"\b(pinagmalupitan|minolestya|ginahasa|pang-aabuso|na-trauma|nakaranas\s*ng\s*trauma|masakit\s*na\s*karanasan|masamang\s*karanasan)\b",
    r"\b(flashbacks?|painful\s*memories|frightening\s*event|horrific\s*accident|distressing\s*experience|emotional\s*crisis|mental\s*breakdown|umiiyak\s*lang\s*(ako)?\s*gabi\s*gabi|hirap\s*na\s*hirap\s*na\s*ako\s*umiiyak)\b"
]

# G. Profanity & Offensive Language
PROFANITY_PATTERNS = [
    r"\b(putangina|tangina|taena|amputa|pukinangina|punyeta|leche|letse|piste|peste|yawa|kupal|ogag|pota|puta|lintik)\b",
    r"\b(fuck|fucking|fucker|fucked|shit|bitch|bastard|asshole|cunt|dickhead|cocksucker|bullshit|twat|wanker|slut|whore)\b"
]


class SensitiveContentDetector:
    """
    Automated sensitive content detection engine for community posts.
    Identifies sensitive, disturbing, or potentially triggering topics (A through H),
    distinguishing between ordinary student distress and triggering material.
    """

    @classmethod
    def evaluate(cls, text: str, has_photo: bool = False, photo_is_sensitive: bool = False) -> Dict[str, Any]:
        """
        Analyzes full post text and attachments for sensitive content categories.
        Returns sensitivity assessment, detected categories, generated warning, and blur flag.
        """
        if not text or not isinstance(text, str):
            text = ""

        cleaned = text.strip()
        lower_text = cleaned.lower()

        # If completely empty and no sensitive photo, it's not sensitive
        if not lower_text and not photo_is_sensitive:
            return {
                "is_sensitive": False,
                "categories": [],
                "primary_category": None,
                "warning": None,
                "blur_enabled": False
            }

        # Step 1: Check if this is an ordinary academic/daily concern without sensitive topics
        # (Must protect benign expression: e.g. "I am so sad because I failed my exam.")
        is_normal_academic = False
        has_academic_word = bool(re.search(SAFE_NORMAL_EMOTION_PATTERNS[0], lower_text, re.IGNORECASE) or 
                                 re.search(SAFE_NORMAL_EMOTION_PATTERNS[1], lower_text, re.IGNORECASE))
        has_normal_emotion = bool(re.search(SAFE_NORMAL_EMOTION_PATTERNS[2], lower_text, re.IGNORECASE) or 
                                  re.search(SAFE_NORMAL_EMOTION_PATTERNS[3], lower_text, re.IGNORECASE))

        if has_academic_word and has_normal_emotion and not photo_is_sensitive:
            is_normal_academic = True

        detected_categories: List[str] = []

        # Step 2: Evaluate Category A: Sexual Content
        for pat in SEXUAL_CONTENT_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                if CAT_SEXUAL_CONTENT not in detected_categories:
                    detected_categories.append(CAT_SEXUAL_CONTENT)
                break

        # Step 3: Evaluate Category B: Nudity
        for pat in NUDITY_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                if CAT_NUDITY not in detected_categories:
                    detected_categories.append(CAT_NUDITY)
                break

        # Step 4: Evaluate Category C: Bullying and Harassment
        for pat in BULLYING_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                if CAT_BULLYING not in detected_categories:
                    detected_categories.append(CAT_BULLYING)
                break

        # Step 5: Evaluate Category D: Violence and Graphic Content
        for pat in VIOLENCE_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                if CAT_VIOLENCE not in detected_categories:
                    detected_categories.append(CAT_VIOLENCE)
                break

        # Step 6: Evaluate Category E: Self-Harm and Suicide-Related Content
        for pat in SELF_HARM_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                if CAT_SELF_HARM not in detected_categories:
                    detected_categories.append(CAT_SELF_HARM)
                break

        # Step 7: Evaluate Category F: Trauma and Distressing Experiences
        for pat in TRAUMA_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                if CAT_TRAUMA not in detected_categories:
                    detected_categories.append(CAT_TRAUMA)
                break

        # Step 8: Evaluate Category G: Profanity and Offensive Language
        for pat in PROFANITY_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                if CAT_PROFANITY not in detected_categories:
                    detected_categories.append(CAT_PROFANITY)
                break

        # If a sensitive photo attachment was flagged
        if photo_is_sensitive:
            if CAT_NUDITY not in detected_categories and CAT_SEXUAL_CONTENT not in detected_categories and CAT_VIOLENCE not in detected_categories:
                detected_categories.append(CAT_OTHER)

        # Safeguard: If it's an ordinary academic or non-sensitive post and no serious category matched:
        if is_normal_academic and not any(c in detected_categories for c in [CAT_SEXUAL_CONTENT, CAT_NUDITY, CAT_BULLYING, CAT_VIOLENCE, CAT_SELF_HARM, CAT_TRAUMA]):
            # If mild profanity was present, treat per profanity rules, but ordinary academic concern alone is NOT sensitive
            if CAT_PROFANITY not in detected_categories:
                return {
                    "is_sensitive": False,
                    "categories": [],
                    "primary_category": None,
                    "warning": None,
                    "blur_enabled": False
                }

        # Step 9: Determine sensitivity and warning string
        is_sensitive = len(detected_categories) > 0

        if not is_sensitive:
            return {
                "is_sensitive": False,
                "categories": [],
                "primary_category": None,
                "warning": None,
                "blur_enabled": False
            }

        # Step 10: Generate tailored warning message (Section 4 & 8)
        warning_message = cls._generate_warning_message(detected_categories)
        primary_category = detected_categories[0] if detected_categories else CAT_OTHER

        return {
            "is_sensitive": True,
            "categories": detected_categories,
            "category_names": [CATEGORY_DISPLAY_NAMES.get(c, c) for c in detected_categories],
            "primary_category": primary_category,
            "warning": warning_message,
            "blur_enabled": True
        }

    @classmethod
    def _generate_warning_message(cls, categories: List[str]) -> str:
        """
        Generates understandable, specific content warning text based on detected categories.
        Combines categories if multiple are detected (Section 8).
        """
        if not categories:
            return WARNING_MESSAGES[CAT_OTHER]

        # Single category match
        if len(categories) == 1:
            cat = categories[0]
            return WARNING_MESSAGES.get(cat, WARNING_MESSAGES[CAT_OTHER])

        # Multiple categories detected — combine them cleanly
        labels: List[str] = []
        if CAT_BULLYING in categories:
            labels.append("bullying")
        if CAT_PROFANITY in categories:
            labels.append("offensive language")
        if CAT_TRAUMA in categories:
            labels.append("distressing personal experiences")
        if CAT_VIOLENCE in categories:
            labels.append("violence or disturbing descriptions")
        if CAT_SELF_HARM in categories:
            labels.append("self-harm or emotional distress")
        if CAT_SEXUAL_CONTENT in categories:
            labels.append("sexual content")
        if CAT_NUDITY in categories:
            labels.append("nudity")

        if not labels:
            return WARNING_MESSAGES[CAT_OTHER]

        if len(labels) == 1:
            return f"Sensitive Content: This post may contain {labels[0]}."
        elif len(labels) == 2:
            return f"Sensitive Content: This post may contain {labels[0]} or {labels[1]}."
        else:
            joined = ", ".join(labels[:-1]) + f", and {labels[-1]}"
            return f"Sensitive Content: This post may contain {joined}."
