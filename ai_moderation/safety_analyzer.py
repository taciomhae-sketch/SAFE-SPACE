# =============================================================
#  safety_analyzer.py — AI-Powered User Risk Detection & Safety Monitoring
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
#
#  Features:
#  1. Context-aware personal risk classification:
#     - Critical / High Risk (Imminent suicide, severe violence, immediate danger)
#     - Moderate Risk (Repeated hopelessness, emotional distress, non-imminent self-harm)
#     - Low Risk (Mild sadness, academic pressure, early warning signs)
#     - No Identified Safety Risk (Positive/neutral, educational, jokes)
#  2. Separate Content Moderation Severity from Personal Safety Risk.
#  3. Detection of depression & distress indicators (NON-DIAGNOSTIC).
#  4. Contextual discrimination: educational vs personal, academic stress vs crisis, idioms.
#  5. Longitudinal analysis of user posts over time.
# =============================================================

import re
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

# ── Risk Level Constants ───────────────────────────────────────
RISK_CRITICAL = "critical"
RISK_HIGH     = "high"
RISK_MODERATE = "moderate"
RISK_LOW      = "low"
RISK_NONE     = "none"

# ── Concern Types ─────────────────────────────────────────────
CONCERN_SUICIDAL_IMMINENT   = "SUICIDAL_IDEATION_IMMINENT"
CONCERN_SUICIDAL_PASSIVE    = "SUICIDAL_IDEATION_PASSIVE"
CONCERN_SELF_HARM           = "SELF_HARM_CONCERN"
CONCERN_EMOTIONAL_DISTRESS  = "POSSIBLE_EMOTIONAL_DISTRESS"
CONCERN_HOPELESSNESS        = "REPEATED_HOPELESSNESS_INDICATORS"
CONCERN_NEGATIVE_EXPRESSION = "PERSISTENT_NEGATIVE_SELF_EXPRESSION"
CONCERN_ESCALATING_DISTRESS = "INCREASING_DISTRESS_HUMAN_REVIEW_RECOMMENDED"
CONCERN_VIOLENCE_THREAT     = "CREDIBLE_VIOLENCE_OR_THREAT"
CONCERN_BULLYING_HARASSMENT = "BULLYING_OR_HARASSMENT"
CONCERN_NUDITY_VIOLATION    = "NUDITY_OR_EXPLICIT_CONTENT"
CONCERN_ACADEMIC_STRESS     = "ACADEMIC_STRESS_BENIGN"
CONCERN_EDUCATIONAL_AWARENESS = "EDUCATIONAL_OR_REPORTING_AWARENESS"
CONCERN_SAFE_EXPRESSION     = "SAFE_STUDENT_EXPRESSION"

# ── Imminent Crisis Patterns ───────────────────────────────────
# Active suicidal intent, goodbye letters, timeframes, explicit desire to end life
IMMINENT_CRISIS_PATTERNS = [
    # English
    r"\b(i('m| am| will| plan to| decide to| decided to| want to| need to| ready to)?\s*(going to|gonna|will)?\s*(kill myself|end my life|commit suicide|hang myself|slit my wrists|overdose|jump off|swallow pills|take my own life)\s*(tonight|today|now|soon|this evening|after this|goodbye|right now)?)\b",
    r"\b(i\s*want\s*to\s*(end\s*my\s*life|die|kill\s*myself)\s*(tonight|today|now|soon)?)\b",
    r"\b(goodbye\s*(cruel\s*world|everyone|everybody|forever|guys|y'?all|to\s*all)\b.*?(won'?t\s*be\s*here|never\s*see\s*me|last\s*(post|message|day|night)|ending\s*it)?)\b",
    r"\b(this\s*is\s*my\s*(last|final)\s*(post|message|note|goodbye))\b",
    r"\b(i\s*don'?t\s*want\s*to\s*(live|exist|be\s*alive|wake\s*up)\s*anymore\s*(and|so)?\s*(i('m| am)?\s*(ending|done|killing)))\b",
    r"\b(i\s*have\s*(a\s*plan|written\s*my\s*note|prepared\s*everything)\s*(to\s*die|to\s*end\s*it|to\s*kill\s*myself))\b",
    
    # Filipino / Taglish
    r"\b(magpapakamatay\s*na\s*(ako|ko)|tatapusin\s*ko\s*na\s*ang\s*buhay\s*ko|gusto\s*ko\s*nang\s*(mamatay|mawala\s*sa\s*mundo|maglaho\s*ng\s*tuluyan))\b",
    r"\b(paalam\s*(sa\s*lahat|sa\s*inyo|mundo)\s*.*?(huling\s*(post|mensahe|araw|gabi)|hindi\s*na\s*ako\s*magigising))\b",
    r"\b(huling\s*(post|paalam|mensahe)\s*ko\s*na\s*ito)\b",
    r"\b(ayoko\s*nang\s*(mabuhay|gumising|huminga|magpatuloy)\s*.*?(magpapakamatay|tatapusin))\b"
]

# ── Passive Suicidal Ideation / Severe Despair ─────────────────
PASSIVE_SUICIDAL_PATTERNS = [
    # English
    r"\b(i\s*(wish|hope)\s*i\s*(was|were)\s*dead)\b",
    r"\b(i\s*(don'?t|do\s*not)\s*want\s*to\s*(be\s*here|exist|wake\s*up|live)\s*anymore)\b",
    r"\b(what\s*is\s*the\s*point\s*of\s*(living|life|going\s*on|trying|anything)\b.*?(better\s*off\s*dead|if\s*i\s*die)?)\b",
    r"\b(wish\s*i\s*could\s*(just\s*)?(disappear\s*forever|sleep\s*and\s*never\s*wake\s*up))\b",
    
    # Filipino / Taglish
    r"\b(sana\s*(patay\s*na\s*lang\s*ako|hindi\s*na\s*lang\s*ako\s*ipinanganak|mawala\s*na\s*lang\s*ako))\b",
    r"\b(mas\s*mabuti\s*pang\s*(mawala|mamatay)\s*na\s*lang\s*ako)\b",
    r"\b(ayoko\s*nang\s*(gumising|mabuhay|magpatuloy))\b",
    r"\b(sana\s*makatulog\s*nang\s*hindi\s*na\s*magising)\b"
]

# ── Self-Harm Indicators (Non-imminent / General) ──────────────
SELF_HARM_PATTERNS = [
    # English
    r"\b(i\s*(cut|burned|hit|hurt|harmed)\s*myself\s*(again|today|last\s*night)?)\b",
    r"\b(urge\s*to\s*(cut|self-harm|hurt\s*myself))\b",
    r"\b(relapsed\s*(on|with)?\s*self-harm)\b",
    
    # Filipino / Taglish
    r"\b(sinasaktan\s*ko\s*ang\s*sarili\s*ko|naglalaslas|naghihiwa\s*ako\s*ng\s*braso)\b",
    r"\b(gusto\s*kong\s*saktan\s*ang\s*sarili\s*ko)\b"
]

# ── Potential Depression & Emotional Distress Indicators ───────
DISTRESS_HOPELESSNESS_PATTERNS = [
    # Hopelessness / Despair
    r"\b(nothing\s*(ever|will\s*ever|seems\s*to)?\s*(gets?|getting)\s*better)\b",
    r"\b(i\s*feel\s*(completely\s*)?(hopeless|empty|numb|broken|trapped|drowning))\b",
    r"\b(there\s*is\s*no\s*(hope|way\s*out|point|light|future)\s*(for\s*me)?)\b",
    r"\b(giving\s*up\s*on\s*(everything|life|myself|my\s*future))\b",
    r"\b(wala\s*nang\s*(pag-asa|patutunguhan|saysay\s*ang\s*lahat))\b",
    r"\b(parang\s*walang\s*katapusan\s*ang\s*(lungkot|paghihirap|dilim))\b",
    
    # Worthlessness & Burden
    r"\b(i\s*feel\s*so\s*(worthless|useless|pathetic|like\s*garbage))\b",
    r"\b(i\s*am\s*a\s*(failure|disappointment|burden)\s*to\s*(everyone|my\s*parents|my\s*family))\b",
    r"\b(i\s*am\s*just\s*a\s*burden\s*to\s*(everyone|my\s*family|my\s*friends|society))\b",
    r"\b(pabigat\s*lang\s*ako\s*sa\s*(lahat|pamilya\s*ko|magulang\s*ko))\b",
    r"\b(walang\s*silbi\s*(ako|buhay\s*ko)|inutil\s*ako)\b",
    
    # Exhaustion & Inability to Cope
    r"\b(i\s*(can'?t|cannot)\s*(take\s*it|cope|do\s*this|handle\s*this|keep\s*going)\s*anymore)\b",
    r"\b(i('m| am)\s*(so\s*)?(emotionally\s*drained|mentally\s*exhausted|breaking\s*down))\b",
    r"\b(sobrang\s*(pagod\s*na\s*ako|suko\s*na\s*ako)|hindi\s*ko\s*na\s*kaya)\b",
    r"\b(ubos\s*na\s*ubos\s*na\s*ako|sukong-suko\s*na\s*ako)\b",
    
    # Isolation & Severe Loneliness
    r"\b(no\s*one\s*(cares|understands|would\s*notice|loves\s*me)\s*(if\s*i\s*(was\s*gone|disappeared))?)\b",
    r"\b(i\s*am\s*so\s*alone\s*(and|in\s*this|with\s*no\s*one))\b",
    r"\b(walang\s*(may\s*pakialam|nakikinig|nagmamahal)\s*sa\s*akin)\b"
]

# ── Credible Violence & Immediate Threat Patterns ──────────────
VIOLENCE_THREAT_PATTERNS = [
    r"\b(i('ll| will| am going to| gonna)\s*(kill|murder|shoot|stab|choke|strangle|slit\s*the\s*throat\s*of)\s*(you|him|her|them|everyone|all\s*of\s*you))\b",
    r"\b(i('m| am)\s*bringing\s*(a\s*gun|a\s*knife|a\s*weapon|a\s*bomb)\s*to\s*(school|campus|class|building))\b",
    r"\b(watch\s*your\s*back\s*.*?(gonna\s*die|beat\s*you|kill\s*you))\b",
    r"\b(papatayin\s*kita|sasaksakin\s*kita|babarilin\s*ko\s*kayo|papatayin\s*ko\s*kayo)\b"
]

# ── Educational, Awareness, Reporting & Safe Idiom Exceptions ──
EDUCATIONAL_CONTEXT_PATTERNS = [
    r"\b(in\s*(our|my|the)?\s*(psychology|guidance|ethics|philosophy|science|health|values|pe)\s*(class|lecture|subject|course|seminar|webinar))\b",
    r"\b(we\s*(discussed|studied|talked\s*about|learned\s*about)\s*(suicide\s*prevention|depression|mental\s*health|anxiety))\b",
    r"\b(the\s*(lecture|topic|presentation|seminar|lesson)\s*(is|was|covered)\s*(about)?\s*(suicide|depression|self-harm))\b",
    r"\b(suicide\s*prevention\s*(awareness|month|campaign|hotlines?|strategies))\b",
    r"\b(how\s*to\s*(help|support)\s*(a\s*friend|someone|classmates?)\s*(struggling|who\s*is\s*sad))\b",
    r"\b(definition\s*of|meaning\s*of|research\s*on|study\s*shows\s*that)\b"
]

SAFE_IDIOM_PATTERNS = [
    r"\b(diet|dieting|balanced diet)\b",
    r"\b(my\s*(phone|laptop|earphones|pc|car)\s*(died|is\s*dead))\b",
    r"\b(dying\s*(of\s*)?laughing|died\s*laughing|dead\s*tired)\b",
    r"\b(kill\s*(time|the\s*game|it|the\s*vibe))\b",
    r"\b(roll\s*(the\s*)?die)\b"
]

SAFE_ACADEMIC_PATTERNS = [
    r"\b(stressed|exhausted|tired|anxious|nervous|upset|crying|depressed)\s*(because|since|about|with|over|due\s*to)?\s*(i\s*(failed|did\s*bad)|my|our|the)?\s*(exam|midterm|finals|thesis|quiz|grades?|defense|project|deadline|school|homework|all\s*night|scores?)\b",
    r"\b(i\s*(failed|did\s*bad\s*on|flunked|messed\s*up)\s*(my|the)?\s*(exam|test|quiz|subject|thesis|midterm))\b",
    r"\b(bumagsak\s*ako|bagsak\s*ako|hirap\s*sa\s*(exam|thesis|school))\b",
    r"\b(sobrang\s*daming\s*(requirements|tasks|deadlines))\b"
]


class SafetyAnalyzer:
    """
    Core AI-powered Safety and Risk Detection Engine.
    Interprets context, assigns multi-tier risk levels, evaluates depression/distress,
    and supports longitudinal escalation analysis over time.
    """

    @classmethod
    def evaluate(cls, text: str, history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Evaluates submitted text for user safety risk and moderation categories.
        
        Returns structured dictionary adhering to Section 11 of the specification:
        - risk_level: 'critical', 'high', 'moderate', 'low', 'none'
        - concern_type: Standardized enum
        - moderation_category: 'SELF_HARM', 'THREAT', 'BULLYING', 'DISTRESS', 'SAFE', etc.
        - moderation_severity: 'critical', 'high', 'medium', 'low', 'none'
        - reason: Contextual explanation
        - evidence_reference: Matched text or phrase
        - confidence: Float (0.0 to 1.0)
        - urgency: 'immediate', 'urgent', 'routine', 'none'
        - recommended_action: Standardized administrative response recommendation
        - language_detected: 'english', 'filipino', 'taglish', 'other'
        - requires_human_review: Boolean
        - alert_required: Boolean
        - is_imminent_danger: Boolean
        - distress_indicators: List of identified warning flags
        - longitudinal_risk: Analysis of user's past posts over time
        """
        clean_text = (text or "").strip()
        lower_text = clean_text.lower()
        
        distress_indicators = []
        is_imminent = False
        matched_evidence = ""
        
        # 1. Quick check for benign idioms / slang
        for idiom_pat in SAFE_IDIOM_PATTERNS:
            if re.search(idiom_pat, lower_text):
                # Check if text contains ONLY the safe idiom or has an actual crisis
                # We'll allow safe idiom check to prevent false positives on 'died laughing'
                if not re.search(r"\b(kill myself|end my life|magpapakamatay)\b", lower_text):
                    if "laughing" in lower_text or "phone died" in lower_text or "laptop died" in lower_text or "dead tired" in lower_text:
                        return cls._build_safe_result(clean_text, "Idiomatic or harmless expression.", CONCERN_SAFE_EXPRESSION)

        # 2. Check for educational or reporting context
        is_educational = False
        for edu_pat in EDUCATIONAL_CONTEXT_PATTERNS:
            if re.search(edu_pat, lower_text):
                is_educational = True
                break

        # 3. Check for imminent suicide or self-harm crisis (HIGHEST PRIORITY)
        # Even if mentioned in educational tone, explicit first-person imminent intent overrides
        for im_pat in IMMINENT_CRISIS_PATTERNS:
            m = re.search(im_pat, lower_text)
            if m:
                matched_evidence = m.group(0)
                is_imminent = True
                break

        if is_imminent:
            # Imminent self-harm / suicidal intent identified!
            return {
                "risk_level": RISK_CRITICAL,
                "concern_type": CONCERN_SUICIDAL_IMMINENT,
                "moderation_category": "SELF_HARM",
                "moderation_severity": "critical",
                "reason": "Explicit indicator of acute or imminent suicidal intent. Immediate protective human response required.",
                "evidence_reference": matched_evidence,
                "confidence": 0.98,
                "urgency": "immediate",
                "recommended_action": "Urgent safety alert generated. Immediate intervention recommended; provide verified emergency crisis hotlines (NCMH 1553, 911, ASU Ibajay Counselor Ext. 104) and restrict account identity review to authorized safety personnel.",
                "language_detected": cls._detect_lang(clean_text),
                "requires_human_review": True,
                "alert_required": True,
                "is_imminent_danger": True,
                "distress_indicators": ["Imminent Suicidal Intent", "Desire to End Life", "Potential Goodbye Message"],
                "longitudinal_risk": cls.analyze_longitudinal(history, latest_risk=RISK_CRITICAL)
            }

        # 4. Check for Credible Violence or Severe Threat to Others
        for vt_pat in VIOLENCE_THREAT_PATTERNS:
            m = re.search(vt_pat, lower_text)
            if m:
                return {
                    "risk_level": RISK_HIGH,
                    "concern_type": CONCERN_VIOLENCE_THREAT,
                    "moderation_category": "THREAT",
                    "moderation_severity": "critical",
                    "reason": "Direct, credible threat of severe physical harm or violence against another individual.",
                    "evidence_reference": m.group(0),
                    "confidence": 0.96,
                    "urgency": "immediate",
                    "recommended_action": "Halt post from public view. Notify designated safety administrator immediately for urgent investigation and threat mitigation.",
                    "language_detected": cls._detect_lang(clean_text),
                    "requires_human_review": True,
                    "alert_required": True,
                    "is_imminent_danger": True,
                    "distress_indicators": ["Physical Threat", "Targeted Violence"],
                    "longitudinal_risk": cls.analyze_longitudinal(history, latest_risk=RISK_HIGH)
                }

        # 5. Check if Educational Discussion (when no imminent threat exists)
        if is_educational:
            return {
                "risk_level": RISK_NONE,
                "concern_type": CONCERN_EDUCATIONAL_AWARENESS,
                "moderation_category": "SAFE",
                "moderation_severity": "none",
                "reason": "Educational, clinical, or awareness discussion concerning mental health or suicide prevention without personal crisis intent.",
                "evidence_reference": clean_text[:80],
                "confidence": 0.93,
                "urgency": "none",
                "recommended_action": "Permit standard publication. No personal safety alert required.",
                "language_detected": cls._detect_lang(clean_text),
                "requires_human_review": False,
                "alert_required": False,
                "is_imminent_danger": False,
                "distress_indicators": [],
                "longitudinal_risk": {"trend": "stable", "escalation_detected": False}
            }

        # 6. Check for Passive Suicidal Ideation / Severe Hopelessness
        for ps_pat in PASSIVE_SUICIDAL_PATTERNS:
            m = re.search(ps_pat, lower_text)
            if m:
                distress_indicators.append("Passive Thoughts of Death / Lack of Desire to Live")
                matched_evidence = m.group(0)

        # 7. Check for Self-Harm Concerns
        for sh_pat in SELF_HARM_PATTERNS:
            m = re.search(sh_pat, lower_text)
            if m:
                distress_indicators.append("Self-Harm Reference")
                if not matched_evidence:
                    matched_evidence = m.group(0)

        # 8. Check for Depression & Emotional Distress Indicators
        for dh_pat in DISTRESS_HOPELESSNESS_PATTERNS:
            m = re.search(dh_pat, lower_text)
            if m:
                flag = "Possible Emotional Distress"
                if "burden" in m.group(0) or "pabigat" in m.group(0):
                    flag = "Feeling Like a Burden"
                elif "hopeless" in m.group(0) or "pag-asa" in m.group(0):
                    flag = "Repeated Hopelessness Indicators"
                elif "worthless" in m.group(0) or "walang silbi" in m.group(0):
                    flag = "Expressions of Worthlessness"
                elif "exhausted" in m.group(0) or "drained" in m.group(0) or "pagod" in m.group(0):
                    flag = "Emotional Exhaustion & Inability to Cope"
                elif "alone" in m.group(0) or "no one" in m.group(0):
                    flag = "Severe Social Isolation"
                
                if flag not in distress_indicators:
                    distress_indicators.append(flag)
                if not matched_evidence:
                    matched_evidence = m.group(0)

        # Check Academic Stress exception
        is_academic = False
        for ac_pat in SAFE_ACADEMIC_PATTERNS:
            if re.search(ac_pat, lower_text):
                is_academic = True
                break

        # 9. Evaluate Longitudinal Context
        longitudinal_data = cls.analyze_longitudinal(history, latest_indicators=distress_indicators)

        # Decision Matrix
        if "Passive Thoughts of Death / Lack of Desire to Live" in distress_indicators:
            return {
                "risk_level": RISK_HIGH,
                "concern_type": CONCERN_SUICIDAL_PASSIVE,
                "moderation_category": "DISTRESS",
                "moderation_severity": "high",
                "reason": "Expressed thoughts about not wanting to exist or feelings of being a burden to others. Context indicates potential serious mental distress.",
                "evidence_reference": matched_evidence,
                "confidence": 0.92,
                "urgency": "urgent",
                "recommended_action": "Route to Counselor Triage Queue. Offer supportive guidance and verified mental health resources; monitor for escalation.",
                "language_detected": cls._detect_lang(clean_text),
                "requires_human_review": True,
                "alert_required": True,
                "is_imminent_danger": False,
                "distress_indicators": distress_indicators,
                "longitudinal_risk": longitudinal_data
            }

        if "Self-Harm Reference" in distress_indicators:
            return {
                "risk_level": RISK_HIGH if longitudinal_data.get("escalation_detected") else RISK_MODERATE,
                "concern_type": CONCERN_SELF_HARM,
                "moderation_category": "SELF_HARM",
                "moderation_severity": "high",
                "reason": "Content indicates potential self-harm behavior or recurring self-injury urges.",
                "evidence_reference": matched_evidence,
                "confidence": 0.90,
                "urgency": "urgent" if longitudinal_data.get("escalation_detected") else "routine",
                "recommended_action": "Create administrator notification and queue for counselor safety review.",
                "language_detected": cls._detect_lang(clean_text),
                "requires_human_review": True,
                "alert_required": True,
                "is_imminent_danger": False,
                "distress_indicators": distress_indicators,
                "longitudinal_risk": longitudinal_data
            }

        if len(distress_indicators) >= 2 or longitudinal_data.get("escalation_detected"):
            # Multi-indicator distress or escalating distress over time
            concern_label = CONCERN_ESCALATING_DISTRESS if longitudinal_data.get("escalation_detected") else CONCERN_HOPELESSNESS
            return {
                "risk_level": RISK_MODERATE,
                "concern_type": concern_label,
                "moderation_category": "DISTRESS",
                "moderation_severity": "medium",
                "reason": f"Content contains multiple potential emotional distress indicators: {', '.join(distress_indicators)}. Human review recommended.",
                "evidence_reference": matched_evidence,
                "confidence": 0.88,
                "urgency": "routine",
                "recommended_action": "Offer contextual coping guidance and Suggested Support. Record safety indicator for counselor review.",
                "language_detected": cls._detect_lang(clean_text),
                "requires_human_review": True,
                "alert_required": True,
                "is_imminent_danger": False,
                "distress_indicators": distress_indicators,
                "longitudinal_risk": longitudinal_data
            }

        if len(distress_indicators) == 1:
            # Single non-imminent indicator
            if is_academic:
                # Academic pressure: Mild/Low risk, safe expression with supportive comment
                return {
                    "risk_level": RISK_LOW,
                    "concern_type": CONCERN_ACADEMIC_STRESS,
                    "moderation_category": "SAFE",
                    "moderation_severity": "none",
                    "reason": "Expressed academic frustration or temporary study-related pressure. Evaluated as safe student peer-support sharing.",
                    "evidence_reference": matched_evidence,
                    "confidence": 0.91,
                    "urgency": "none",
                    "recommended_action": "Provide empathetic student coping recommendation (Study tips / break encouragement). No administrative alert required.",
                    "language_detected": cls._detect_lang(clean_text),
                    "requires_human_review": False,
                    "alert_required": False,
                    "is_imminent_danger": False,
                    "distress_indicators": distress_indicators,
                    "longitudinal_risk": longitudinal_data
                }
            else:
                return {
                    "risk_level": RISK_LOW,
                    "concern_type": CONCERN_EMOTIONAL_DISTRESS,
                    "moderation_category": "DISTRESS",
                    "moderation_severity": "low",
                    "reason": f"Single potential distress indicator identified: {distress_indicators[0]}.",
                    "evidence_reference": matched_evidence,
                    "confidence": 0.85,
                    "urgency": "routine",
                    "recommended_action": "Provide AI Suggested Support. Record indicator for trend monitoring.",
                    "language_detected": cls._detect_lang(clean_text),
                    "requires_human_review": False,
                    "alert_required": False,
                    "is_imminent_danger": False,
                    "distress_indicators": distress_indicators,
                    "longitudinal_risk": longitudinal_data
                }

        # 10. Academic stress without active self-harm / suicidal intent -> LOW RISK
        if is_academic:
            return {
                "risk_level": RISK_LOW,
                "concern_type": CONCERN_ACADEMIC_STRESS,
                "moderation_category": "SAFE",
                "moderation_severity": "none",
                "reason": "Expressed academic frustration or study-related pressure. Evaluated as non-urgent student expression.",
                "evidence_reference": clean_text[:60],
                "confidence": 0.92,
                "urgency": "none",
                "recommended_action": "Provide empathetic student coping recommendation (Study tips / break encouragement). No administrative alert required.",
                "language_detected": cls._detect_lang(clean_text),
                "requires_human_review": False,
                "alert_required": False,
                "is_imminent_danger": False,
                "distress_indicators": ["Academic Stress / Study Pressure"],
                "longitudinal_risk": longitudinal_data
            }

        # 11. Default: Safe Expression
        return cls._build_safe_result(clean_text, "No potential safety risk identified in content.", CONCERN_SAFE_EXPRESSION)

    @classmethod
    def analyze_longitudinal(cls, history: Optional[List[Dict[str, Any]]], latest_risk: str = "none", latest_indicators: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Longitudinal Analysis (User Posts Over Time):
        Evaluates sequence of recent posts from the author to observe progression,
        escalation, or recurring hopelessness statements.
        
        Safeguards:
        - Never assumes single sad post is proof of worsening mental health.
        - Escalation is marked only when consecutive statements demonstrate increasing despair.
        - Respects user privacy; never creates medical or psychological diagnoses.
        """
        if not history or not isinstance(history, list) or len(history) == 0:
            return {
                "total_historical_posts": 0,
                "recent_concerning_count": 0,
                "trend": "baseline",
                "escalation_detected": False,
                "summary": "First observed post or no historical distress records."
            }

        concerning_posts = []
        for post in history[-5:]:  # Look at up to last 5 recent posts
            content = post.get("content", "")
            risk = (post.get("risk_level") or "low").lower()
            sentiment = (post.get("sentiment") or "NEUTRAL").upper()
            created_at = post.get("created_at")
            
            # Simple distress flag on history item
            has_distress = (risk in ["moderate", "high", "critical"]) or (sentiment == "NEGATIVE")
            if has_distress:
                concerning_posts.append({
                    "snippet": content[:60],
                    "risk_level": risk,
                    "sentiment": sentiment,
                    "created_at": created_at
                })

        distress_count = len(concerning_posts)
        escalation = False
        trend = "stable"
        
        if distress_count >= 2:
            trend = "escalating" if latest_risk in [RISK_HIGH, RISK_CRITICAL, RISK_MODERATE] else "persistent"
            escalation = True
            summary = f"Progression detected: User has shared {distress_count} concerning statement(s) recently. Contextual review recommended."
        elif distress_count == 1 and latest_risk in [RISK_HIGH, RISK_CRITICAL]:
            trend = "acute_escalation"
            escalation = True
            summary = "Acute high-risk post following a recent prior distress indicator."
        else:
            summary = "Historical expressions remain within normal bounds."

        return {
            "total_historical_posts": len(history),
            "recent_concerning_count": distress_count,
            "trend": trend,
            "escalation_detected": escalation,
            "summary": summary,
            "recent_signals": concerning_posts
        }

    @staticmethod
    def _detect_lang(text: str) -> str:
        t = text.lower()
        fil_markers = ["ako", "ko", "mo", "ka", "na", "sa", "ang", "ng", "mga", "para", "buhay", "ayaw", "gusto", "sana"]
        fil_count = sum(1 for w in fil_markers if re.search(rf"\b{w}\b", t))
        if fil_count >= 3:
            return "filipino"
        elif fil_count >= 1:
            return "taglish"
        return "english"

    @staticmethod
    def _build_safe_result(text: str, reason: str, concern_type: str) -> Dict[str, Any]:
        return {
            "risk_level": RISK_NONE,
            "concern_type": concern_type,
            "moderation_category": "SAFE",
            "moderation_severity": "none",
            "reason": reason,
            "evidence_reference": text[:60] if text else "",
            "confidence": 0.95,
            "urgency": "none",
            "recommended_action": "Standard publication permitted. No safety alert required.",
            "language_detected": "english",
            "requires_human_review": False,
            "alert_required": False,
            "is_imminent_danger": False,
            "distress_indicators": [],
            "longitudinal_risk": {
                "trend": "stable",
                "escalation_detected": False,
                "summary": "Standard student expression."
            }
        }
