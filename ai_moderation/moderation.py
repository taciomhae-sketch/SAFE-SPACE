# =============================================================
#  moderation.py — Multilingual Content Moderation Engine
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
from typing import Dict, Any, List, Optional

from language_detector import LanguageDetector
from normalizer import TextNormalizer
from context_analyzer import ContextAnalyzer
from censor import censor_profanity, contains_profanity
from rules import (
    RULES_CONFIG,
    CATEGORY_SAFE, CATEGORY_PROFANITY, CATEGORY_HARASSMENT,
    CATEGORY_BULLYING, CATEGORY_HATE, CATEGORY_THREAT,
    CATEGORY_VIOLENCE, CATEGORY_SEXUAL_HARASSMENT, CATEGORY_SEXUAL_CONTENT, CATEGORY_NUDITY,
    CATEGORY_SELF_HARM, CATEGORY_ENCOURAGEMENT_OF_SELF_HARM,
    CATEGORY_DANGEROUS_BEHAVIOR, CATEGORY_DISCRIMINATION, CATEGORY_SPAM,
    SEVERITY_NONE, SEVERITY_LOW, SEVERITY_MEDIUM, SEVERITY_HIGH, SEVERITY_CRITICAL,
    ACTION_ALLOW, ACTION_WARN, ACTION_REVIEW, ACTION_BLOCK,
    STATUS_APPROVED, STATUS_REVIEW, STATUS_BLOCKED
)
from config import DEBUG

# ── Lazy-load the zero-shot classifier ────────────────────────
_classifier = None

def get_classifier():
    """Load the HuggingFace zero-shot classifier if available."""
    global _classifier
    if _classifier is None:
        try:
            from transformers import pipeline
            try:
                _classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=-1,
                    local_files_only=True
                )
            except Exception:
                _classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=-1
                )
            if DEBUG:
                print("[AI] Classifier loaded successfully.")
        except Exception as e:
            if DEBUG:
                print(f"[AI] Notice: Transformer pipeline not available: {e}")
                print("[AI] Operating in Multilingual Safety Shield mode.")
            _classifier = None
    return _classifier


CLASSIFIER_LABELS = [
    "safe and appropriate student content",
    "personal harassment or bullying of a person",
    "offensive or vulgar language",
    "discriminatory or hateful speech",
    "threatening or violent language",
    "self-harm or suicide encouragement",
    "nudity or sexually explicit content",
    "sexually explicit or sexual harassment content",
    "spam or repetitive nonsense"
]

LABEL_TO_CATEGORY = {
    "safe and appropriate student content":            CATEGORY_SAFE,
    "personal harassment or bullying of a person":     CATEGORY_HARASSMENT,
    "offensive or vulgar language":                    CATEGORY_PROFANITY,
    "discriminatory or hateful speech":                CATEGORY_HATE,
    "threatening or violent language":                 CATEGORY_THREAT,
    "self-harm or suicide encouragement":              CATEGORY_SELF_HARM,
    "nudity or sexually explicit content":              CATEGORY_NUDITY,
    "sexually explicit or sexual harassment content":  CATEGORY_SEXUAL_HARASSMENT,
    "spam or repetitive nonsense":                     CATEGORY_SPAM
}


def _check_spam_repetition(text: str) -> bool:
    """Detects excessive repetition of words."""
    words = text.lower().split()
    if len(words) < 6:
        return False
    word_counts: Dict[str, int] = {}
    for w in words:
        word_counts[w] = word_counts.get(w, 0) + 1
    max_count = max(word_counts.values())
    return (max_count / len(words)) >= 0.40


def _match_rules(test_strings: List[str], lang_code: str) -> Optional[Dict[str, Any]]:
    """
    Match normalized variants against universal rules and language-specific rules.
    """
    rule_groups = ["universal", "spam"]
    if lang_code == "taglish":
        rule_groups.extend(["taglish", "fil", "en"])
    elif lang_code == "fil":
        rule_groups.extend(["fil", "taglish", "en"])
    else:
        rule_groups.extend(["en", "taglish", "fil"])

    seen_ids = set()
    for group in rule_groups:
        rules = RULES_CONFIG.get(group, [])
        for rule in rules:
            if rule["id"] in seen_ids:
                continue
            seen_ids.add(rule["id"])

            pattern = rule["pattern"]
            for test_str in test_strings:
                if not test_str:
                    continue
                if re.search(pattern, test_str, re.IGNORECASE):
                    return rule
    return None


def _ai_classify(text: str) -> Optional[Dict[str, Any]]:
    """Zero-shot model classification with safety calibration."""
    clf = get_classifier()
    if clf is None:
        return None

    try:
        result = clf(text, CLASSIFIER_LABELS, multi_label=False)
        top_label = result["labels"][0]
        top_score = float(result["scores"][0])

        safe_score = 0.0
        for l, s in zip(result["labels"], result["scores"]):
            if l == "safe and appropriate student content":
                safe_score = float(s)
                break

        if top_label == "safe and appropriate student content":
            return {
                "category": CATEGORY_SAFE,
                "severity": SEVERITY_NONE,
                "action": ACTION_ALLOW,
                "confidence": round(top_score, 4),
                "reason": f"AI verified safe content (confidence: {top_score:.1%})"
            }

        # Substantial threshold required for non-safe classifications
        if top_score < 0.50 or (top_score - safe_score < 0.15):
            return {
                "category": CATEGORY_SAFE,
                "severity": SEVERITY_NONE,
                "action": ACTION_ALLOW,
                "confidence": round(safe_score if safe_score > 0 else 0.85, 4),
                "reason": "AI verified safe content (no dominant harmful intent detected)."
            }

        category = LABEL_TO_CATEGORY.get(top_label, CATEGORY_SAFE)
        severity = SEVERITY_CRITICAL if category in [CATEGORY_THREAT, CATEGORY_SELF_HARM, CATEGORY_SEXUAL_HARASSMENT, CATEGORY_NUDITY] else SEVERITY_HIGH
        action = ACTION_BLOCK if severity == SEVERITY_CRITICAL else ACTION_REVIEW

        return {
            "category": category,
            "severity": severity,
            "action": action,
            "confidence": round(top_score, 4),
            "reason": f"AI classified as: {top_label} (confidence: {top_score:.1%})"
        }
    except Exception as e:
        if DEBUG:
            print(f"[AI Classifier Error] {e}")
        return None


def get_risk_level(category: str, severity: str, status: str) -> str:
    cat = (category or "").upper()
    sev = (severity or "").lower()
    stat = (status or "").upper()
    if cat in [CATEGORY_SELF_HARM, CATEGORY_ENCOURAGEMENT_OF_SELF_HARM]:
        return "urgent"
    if stat == STATUS_BLOCKED or sev == SEVERITY_CRITICAL or cat in [CATEGORY_THREAT, CATEGORY_VIOLENCE, CATEGORY_SEXUAL_HARASSMENT, CATEGORY_NUDITY]:
        return "high"
    if stat == STATUS_REVIEW or sev in [SEVERITY_HIGH, SEVERITY_MEDIUM] or cat in [CATEGORY_HARASSMENT, CATEGORY_BULLYING, CATEGORY_HATE]:
        return "moderate"
    return "low"


def get_warning_config(category: str, severity: str, status: str, reason: str = "", is_academic_stress: bool = False, is_targeted: bool = False) -> Dict[str, Any]:
    cat = (category or "HARASSMENT").upper()
    sev = (severity or "medium").lower()
    stat = (status or "REVIEW").upper()
    risk = get_risk_level(cat, sev, stat)

    is_sensitive = (cat not in [CATEGORY_SAFE, "NONE"])
    tw_label = "Sensitive Content"
    if "NUDITY" in cat or "SEXUAL" in cat:
        tw_label = "Nudity / Explicit Content"
    elif "SELF_HARM" in cat or "CRISIS" in cat:
        tw_label = "Self-Harm / Crisis Concern"
    elif "THREAT" in cat or "VIOLEN" in cat:
        tw_label = "Violence or Threatening Content"
    elif "BULLY" in cat or "HARASS" in cat or "HATE" in cat:
        tw_label = "Bullying or Harassment"
    elif "TRAUMA" in cat or "ABUSE" in cat:
        tw_label = "Trauma or Sensitive Experiences"
    elif "DISTRESS" in cat or "ALARM" in cat or "SENSITIVE" in cat:
        tw_label = "Distressing Emotional Content"

    config = {
        "category": cat,
        "risk_level": risk,
        "title": "Sensitive Content Detected",
        "message": "Your post may contain sensitive or distressing material. Please review it before sharing it with the community.",
        "can_continue": (stat != STATUS_BLOCKED and sev != SEVERITY_CRITICAL and cat not in [CATEGORY_THREAT, CATEGORY_VIOLENCE, CATEGORY_ENCOURAGEMENT_OF_SELF_HARM, CATEGORY_NUDITY]),
        "show_support_resources": False,
        "show_guidelines_button": False,
        "is_imminent_danger": False,
        "has_trigger_warning": is_sensitive,
        "trigger_warning_category": cat,
        "trigger_warning_label": tw_label,
        "primary_button_label": "Review Post",
        "secondary_button_label": "Cancel Posting",
        "continue_label": "Continue, if permitted by the moderation policy"
    }

    if cat in [CATEGORY_SELF_HARM, CATEGORY_ENCOURAGEMENT_OF_SELF_HARM]:
        config["title"] = "Your Post May Indicate a Safety Concern"
        config["message"] = "Some parts of your post suggest that you may be experiencing serious distress. You deserve support, and you do not have to face difficult moments alone. Would you like to review your post or explore available support resources before continuing?"
        config["show_support_resources"] = True
        config["show_guidelines_button"] = False
        config["is_imminent_danger"] = (sev == SEVERITY_CRITICAL or cat == CATEGORY_SELF_HARM)
        config["primary_button_label"] = "Review My Post"
        config["secondary_button_label"] = "Cancel Posting"
        config["can_continue"] = False
    elif cat in [CATEGORY_BULLYING, CATEGORY_HARASSMENT, CATEGORY_HATE]:
        config["title"] = "Please Review Your Post"
        config["message"] = "Your post may contain language that could hurt or target another person. Consider revising it to help maintain a respectful and supportive community."
        config["can_continue"] = (stat != STATUS_BLOCKED)
        config["show_support_resources"] = False
        config["show_guidelines_button"] = False
        config["primary_button_label"] = "Edit Post"
        config["secondary_button_label"] = "Cancel Posting"
        config["continue_label"] = "Continue, if permitted by the moderation policy"
    elif cat in [CATEGORY_THREAT, CATEGORY_VIOLENCE]:
        config["title"] = "Potentially Harmful Content Detected"
        config["message"] = "Your post may contain content that could put someone at risk. Please review it before continuing. Content that violates community safety rules cannot be published."
        config["show_guidelines_button"] = True
        config["show_support_resources"] = False
        config["can_continue"] = False
        config["primary_button_label"] = "Edit Post"
        config["secondary_button_label"] = "Cancel Posting"
    elif cat in [CATEGORY_NUDITY, CATEGORY_SEXUAL_CONTENT, CATEGORY_SEXUAL_HARASSMENT]:
        config["title"] = "Potentially Harmful Content Detected"
        config["message"] = "Your post contains nudity, sexual solicitation, or explicit content. Safe Space strictly prohibits nudity and sexually explicit content to maintain a safe, respectful environment for students."
        config["can_continue"] = False
        config["show_guidelines_button"] = True
        config["show_support_resources"] = False
        config["primary_button_label"] = "Edit Post"
        config["secondary_button_label"] = "Cancel Posting"
    elif cat in ["DISTRESS", "ALARMING", "SENSITIVE", "TRAUMA", "ABUSE"]:
        config["title"] = "Sensitive Content Detected"
        config["message"] = "Your post may contain sensitive or distressing material. Please review it before sharing it with the community."
        config["can_continue"] = (stat != STATUS_BLOCKED)
        config["show_support_resources"] = True
        config["show_guidelines_button"] = False
        config["primary_button_label"] = "Review Post"
        config["secondary_button_label"] = "Cancel Posting"
        config["continue_label"] = "Continue, if permitted by the moderation policy"

    return config


def moderate(text: str, context_meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Comprehensive Multilingual Moderation Pipeline:
    1. Language Detection (English, Filipino, Taglish)
    2. Text Normalization (Unicode NFKC, Repeated Chars, Spacing, Leetspeak, Phonetics)
    3. Partial Profanity Censorship (Asterisk masking: first and last letters preserved)
    4. Obfuscation Detection
    5. Context Analysis (Targeting, Academic Stress vs Self-Harm, Benign Collisions, Educational/Reporting)
    6. Rule Evaluation (Multilingual & Code-switching)
    7. AI Neural Classification
    8. Final Decision Synthesis (Allow / Warn / Review / Block)
    """
    if not text or not text.strip():
        return {
            "success": True,
            "allowed": True,
            "status": STATUS_APPROVED,
            "action": ACTION_ALLOW,
            "risk_level": "low",
            "language": "english",
            "language_confidence": 1.0,
            "category": CATEGORY_SAFE,
            "categories": [],
            "severity": SEVERITY_NONE,
            "confidence": 1.0,
            "reason": "Empty content allowed.",
            "detection_source": "fallback",
            "has_obfuscation": False,
            "obfuscation_types": [],
            "is_academic_stress": False,
            "is_targeted": False,
            "original_text": text or "",
            "censored_text": text or "",
            "has_profanity": False
        }

    original_text = text.strip()
    censored_text = censor_profanity(original_text)
    has_profanity = (censored_text != original_text)

    # Step 1: Normalization & Obfuscation Detection
    norm = TextNormalizer.normalize(original_text)
    has_obf = norm["has_obfuscation"]
    obf_types = norm["obfuscation_types"]

    # Step 2: Language Detection (informed by deobfuscated tokens if evasion occurred)
    eval_text_for_lang = norm["deobfuscated"] if has_obf else original_text
    lang_info = LanguageDetector.detect(eval_text_for_lang)
    detected_lang = lang_info["language"]
    lang_code = lang_info["code"]
    lang_conf = lang_info["confidence"]

    # Step 3: Multilingual Rule Matching across normalized variants
    test_variants = [norm["clean"], norm["evasion"], norm["deleet"], norm["deobfuscated"]]
    matched_rule = _match_rules(test_variants, lang_code)

    # Step 4: Context & Intent Analysis
    ctx = ContextAnalyzer.analyze(norm)
    is_whitelisted = ctx["is_whitelisted"]
    is_academic_stress = ctx["is_academic_stress"]
    is_educational_or_reporting = ctx["is_educational_or_reporting"]
    is_targeted = ctx["is_targeted"]

    rule_decision: Optional[Dict[str, Any]] = None
    if matched_rule:
        cat = matched_rule["category"]
        sev = matched_rule["severity"]
        act = matched_rule["action"]
        conf = matched_rule["confidence"]
        reason = matched_rule["reason"]

        # Profanity handling: Automatically censor with asterisks while preserving first and last letters.
        # When profanity is censored and not targeted harassment or threat, approve with censored text.
        if cat == CATEGORY_PROFANITY:
            sev = SEVERITY_LOW
            act = ACTION_ALLOW
            status = STATUS_APPROVED
            reason = f"Prohibited profanity automatically censored with asterisks: {censored_text}"
        elif sev == SEVERITY_CRITICAL:
            status = STATUS_BLOCKED
            act = ACTION_BLOCK
        elif sev in [SEVERITY_HIGH, SEVERITY_MEDIUM]:
            status = STATUS_REVIEW
            act = ACTION_WARN if sev == SEVERITY_MEDIUM else ACTION_REVIEW
        else:
            status = STATUS_APPROVED
            act = ACTION_ALLOW

        # If deliberate obfuscation was used with a violation, bump confidence
        if has_obf and sev != SEVERITY_NONE:
            conf = min(0.99, conf + 0.05)
            reason += f" (Evasion attempts detected: {', '.join(obf_types)})"

        rule_decision = {
            "category": cat,
            "categories": [cat],
            "severity": sev,
            "action": act,
            "status": status,
            "allowed": (status == STATUS_APPROVED),
            "confidence": conf,
            "reason": reason,
            "detection_source": "fallback"
        }

        # Safeguard: Do not classify self-directed academic frustration/failure as harassment
        if (is_academic_stress or not is_targeted) and cat in [CATEGORY_HARASSMENT, CATEGORY_BULLYING] and not is_targeted:
            rule_decision = None

        # If critical or high/medium rule matched, enforce immediately without allowing whitelist bypass
        if rule_decision and not rule_decision["allowed"]:
            return {
                "success": True,
                "allowed": False,
                "status": rule_decision["status"],
                "action": rule_decision["action"],
                "risk_level": get_risk_level(rule_decision["category"], rule_decision["severity"], rule_decision["status"]),
                "language": detected_lang,
                "language_confidence": lang_conf,
                "category": rule_decision["category"],
                "categories": rule_decision["categories"],
                "severity": rule_decision["severity"],
                "confidence": rule_decision["confidence"],
                "reason": rule_decision["reason"],
                "detection_source": "ai_and_fallback",
                "has_obfuscation": has_obf,
                "obfuscation_types": obf_types,
                "is_academic_stress": False,
                "is_targeted": is_targeted,
                "original_text": original_text,
                "censored_text": censored_text,
                "has_profanity": has_profanity
            }

    # 4A. Benign Whitelist Shortcut (e.g., "my phone died", "healthy diet", "puto bumbong")
    if is_whitelisted:
        return {
            "success": True,
            "allowed": True,
            "status": STATUS_APPROVED,
            "action": ACTION_ALLOW,
            "language": detected_lang,
            "language_confidence": lang_conf,
            "category": CATEGORY_SAFE,
            "categories": [],
            "severity": SEVERITY_NONE,
            "confidence": 0.98,
            "reason": "Harmless benign phrase or idiom verified safe.",
            "detection_source": "fallback",
            "has_obfuscation": has_obf,
            "obfuscation_types": obf_types,
            "is_academic_stress": False,
            "is_targeted": is_targeted,
            "original_text": original_text,
            "censored_text": censored_text,
            "has_profanity": has_profanity
        }

    # 4B. Academic / Student Stress Shortcut (Empathetic sharing)
    if is_academic_stress:
        return {
            "success": True,
            "allowed": True,
            "status": STATUS_APPROVED,
            "action": ACTION_ALLOW,
            "language": detected_lang,
            "language_confidence": lang_conf,
            "category": CATEGORY_SAFE,
            "categories": [],
            "severity": SEVERITY_NONE,
            "confidence": 0.96,
            "reason": "Safe empathetic student stress or academic sharing.",
            "detection_source": "fallback",
            "has_obfuscation": has_obf,
            "obfuscation_types": obf_types,
            "is_academic_stress": True,
            "is_targeted": is_targeted,
            "original_text": original_text,
            "censored_text": censored_text,
            "has_profanity": has_profanity
        }

    # 4C. Educational Discussion or Quoting / Reporting
    if is_educational_or_reporting:
        return {
            "success": True,
            "allowed": True,
            "status": STATUS_APPROVED,
            "action": ACTION_ALLOW,
            "language": detected_lang,
            "language_confidence": lang_conf,
            "category": CATEGORY_SAFE,
            "categories": [],
            "severity": SEVERITY_NONE,
            "confidence": 0.92,
            "reason": "Legitimate educational discussion or reporting context.",
            "detection_source": "fallback",
            "has_obfuscation": has_obf,
            "obfuscation_types": obf_types,
            "is_academic_stress": False,
            "is_targeted": is_targeted,
            "original_text": original_text,
            "censored_text": censored_text,
            "has_profanity": has_profanity
        }

    # Step 6: AI Neural Classification
    ai_decision = _ai_classify(norm["clean"])

    # Step 7: Decision Synthesis
    # If we have both rule and AI decisions:
    final_decision: Dict[str, Any]
    detection_source: str

    if rule_decision and ai_decision:
        detection_source = "ai_and_fallback"
        # Prioritize higher severity to maintain strict psychological safety
        severity_ranks = {SEVERITY_NONE: 0, SEVERITY_LOW: 1, SEVERITY_MEDIUM: 2, SEVERITY_HIGH: 3, SEVERITY_CRITICAL: 4}
        rule_rank = severity_ranks.get(rule_decision["severity"], 0)
        ai_rank = severity_ranks.get(ai_decision["severity"], 0)

        if rule_rank >= ai_rank:
            final_decision = rule_decision
        else:
            is_profanity_allowed = (ai_decision["category"] == CATEGORY_PROFANITY and not is_targeted)
            is_allowed = (ai_decision["category"] == CATEGORY_SAFE) or is_profanity_allowed
            status = STATUS_BLOCKED if ai_decision["severity"] == SEVERITY_CRITICAL else (STATUS_APPROVED if is_allowed else STATUS_REVIEW)
            action = ACTION_ALLOW if is_allowed else ai_decision["action"]
            reason = f"Prohibited profanity automatically censored with asterisks: {censored_text}" if is_profanity_allowed else ai_decision["reason"]
            final_decision = {
                "category": ai_decision["category"],
                "categories": [ai_decision["category"]],
                "severity": SEVERITY_LOW if is_profanity_allowed else ai_decision["severity"],
                "action": action,
                "status": status,
                "allowed": is_allowed,
                "confidence": ai_decision["confidence"],
                "reason": reason,
                "detection_source": "ai_and_fallback"
            }
        final_decision["detection_source"] = "ai_and_fallback"

    elif ai_decision:
        detection_source = "ai"
        is_profanity_allowed = (ai_decision["category"] == CATEGORY_PROFANITY and not is_targeted)
        is_safe = (ai_decision["category"] == CATEGORY_SAFE) or is_profanity_allowed
        status = STATUS_APPROVED if is_safe else (STATUS_BLOCKED if ai_decision["severity"] == SEVERITY_CRITICAL else STATUS_REVIEW)
        action = ACTION_ALLOW if is_safe else ai_decision["action"]
        reason = f"Prohibited profanity automatically censored with asterisks: {censored_text}" if is_profanity_allowed else ai_decision["reason"]
        final_decision = {
            "category": ai_decision["category"],
            "categories": [ai_decision["category"]],
            "severity": SEVERITY_LOW if is_profanity_allowed else ai_decision["severity"],
            "action": action,
            "status": status,
            "allowed": is_safe,
            "confidence": ai_decision["confidence"],
            "reason": reason,
            "detection_source": "ai"
        }

    elif rule_decision:
        final_decision = rule_decision
        final_decision["detection_source"] = "fallback"

    else:
        # Default safe fallback
        final_decision = {
            "category": CATEGORY_SAFE,
            "categories": [],
            "severity": SEVERITY_NONE,
            "action": ACTION_ALLOW,
            "status": STATUS_APPROVED,
            "allowed": True,
            "confidence": 0.90,
            "reason": "Content verified safe by Safe Space multilingual moderation system.",
            "detection_source": "fallback"
        }

    return {
        "success": True,
        "allowed": final_decision["allowed"],
        "status": final_decision["status"],
        "action": final_decision["action"],
        "risk_level": get_risk_level(final_decision["category"], final_decision["severity"], final_decision["status"]),
        "warning_config": get_warning_config(
            final_decision["category"],
            final_decision["severity"],
            final_decision["status"],
            final_decision["reason"],
            final_decision.get("is_academic_stress", False),
            is_targeted
        ),
        "language": detected_lang,
        "language_confidence": lang_conf,
        "category": final_decision["category"],
        "categories": final_decision["categories"],
        "severity": final_decision["severity"],
        "confidence": final_decision["confidence"],
        "reason": final_decision["reason"],
        "detection_source": final_decision["detection_source"],
        "has_obfuscation": has_obf,
        "obfuscation_types": obf_types,
        "is_academic_stress": final_decision.get("is_academic_stress", False),
        "is_targeted": is_targeted,
        "original_text": original_text,
        "censored_text": censored_text,
        "has_profanity": has_profanity
    }
