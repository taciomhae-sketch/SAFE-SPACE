# =============================================================
#  support_recommender.py — Context-Aware Safe Space AI Support
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
import random
from typing import Dict, Any, Optional, List

SUPPORT_RECOMMENDATION_SYSTEM_PROMPT = """You are "Safe Space AI", the supportive-recommendation assistant of Safe Space, a peer-support platform for college students in the Philippines. After a post is published, you write ONE short recommendation that appears under that post as "Suggested Support from Safe Space AI". You are NOT a counselor, therapist, or emergency dispatcher. Your reply is never saved as a comment.

## THE MOST IMPORTANT RULE
Every recommendation must be written for THIS post only. Two different posts must never get the same advice, the same opening, or the same structure. If your reply could be pasted under a different post and still make sense, it is wrong and you must rewrite it.

## INPUT
- POST_TEXT: the full text the student wrote (English, Filipino, Taglish, or other language)
- MODERATION: { category, severity, sentiment }
- IS_ANONYMOUS: true/false
- RECENT_REPLIES: (optional) the last few recommendations you gave. Do not reuse their openings, phrases, or advice.
"""

def clean_preview(text: str, max_words: int = 40) -> str:
    """Helper to extract a clean preview of 2-4 complete sentences without cutting mid-sentence."""
    if not text:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) >= 2:
        combined = " ".join(sentences[:3])
        if len(combined.split()) <= max_words + 15:
            return combined
        return " ".join(sentences[:2])
    if sentences:
        return sentences[0]
    words = text.strip().split()
    if len(words) <= max_words:
        return text.strip()
    return " ".join(words[:max_words]) + "..."


def detect_content_language(text: str) -> str:
    """
    Automatically detects language: 'filipino', 'taglish', 'english', or 'other'.
    """
    if not text:
        return "english"
    lower = text.lower()

    # Foreign script detection (Hangul, Japanese Hiragana/Katakana/Kanji, Cyrillic, Arabic)
    if re.search(r"[\uac00-\ud7af\u1100-\u11ff]", text):
        return "other"
    if re.search(r"[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]", text):
        return "other"
    if re.search(r"[\u0400-\u04ff]", text):
        return "other"
    if re.search(r"\b(hola|gracias|amigo|por favor|estoy|buenos dias|adios|triste|ayuda|merci|bonjour|s'il vous plait|danke|bitte)\b", lower):
        return "other"

    fil_words = re.findall(
        r"\b(ako|ko|mo|ka|na|ng|sa|ang|naman|kasi|talaga|sobrang|hirap|pagod|salamat|gusto|ayoko|paano|buntong|kaba|kinakabahan|umiiyak|malungkot|kaklase|pala|hindi|wala|lahat|atin|kami|kayo|ninyo|sila|mga|para|tungkol|ngayon|dahil|bakit|saan|kailan|sino|dito|dyan|doon|kaya|tayo|masaya|galit|inaapi|binubully|nagaaway|kaaway|niloko|pumasa|bagsak|bumagsak|magulang|pamilya)\b",
        lower
    )
    en_words = re.findall(
        r"\b(the|and|is|are|was|were|have|has|had|with|for|this|that|from|they|them|their|what|when|where|why|how|feel|feeling|because|about|just|really|always|never|help|know|think|would|could|should|every|student|school|class|exam|assignment|friend|roommate|teacher|study|studying|fail|passed|sleep|sleeping|crying|hurt|alone|lonely|deadline|thesis)\b",
        lower
    )

    fil_count = len(fil_words)
    en_count = len(en_words)

    if fil_count >= 2 and en_count >= 2:
        return "taglish"
    elif fil_count >= 1 and fil_count >= en_count:
        return "filipino"
    elif en_count >= 1:
        return "english"
    elif fil_count > 0:
        return "filipino"
    return "english"


def _extract_subject_or_entity(text: str) -> Optional[str]:
    """Extracts course subjects or key project elements from post text."""
    match = re.search(
        r"\b(chemistry|chem|physics|math|mathematics|algebra|calculus|accounting|statistics|biology|programming|coding|thesis|defense|internship|practicum|nursing|psychology|midterm|midterms|finals|board exam|hackathon|scholarship)\b",
        text,
        re.IGNORECASE
    )
    if match:
        return match.group(1).title()
    return None


def generate_support_recommendation(
    text: str,
    sentiment: str = "Neutral",
    category: str = "SAFE",
    risk_level: str = "low",
    language: str = "english",
    is_anonymous: bool = False,
    recent_replies: Optional[List[str]] = None,
    temperature: float = 0.8
) -> Dict[str, Any]:
    """
    Generates a context-aware, language-adaptive, non-repetitive, and safety-conscious
    Safe Space AI support recommendation.
    """
    clean_text = (text or "").strip()
    lower_text = clean_text.lower()
    sent = (sentiment or "Neutral").capitalize()
    cat = (category or "SAFE").upper()
    recent = recent_replies or []

    # 1. Automatic Language Detection
    detected_lang_code = detect_content_language(clean_text)
    if language and language.lower() in ["filipino", "tagalog", "taglish"] and detected_lang_code not in ["other"]:
        detected_lang_code = language.lower()

    is_ph = detected_lang_code in ["filipino", "tagalog", "taglish"]
    is_other_lang = (detected_lang_code == "other")
    lang_display = "Filipino" if detected_lang_code in ["filipino", "tagalog"] else ("Taglish" if detected_lang_code == "taglish" else ("Other (English Response)" if is_other_lang else "English"))

    extracted_subject = _extract_subject_or_entity(clean_text)

    # Compute a deterministic diversity seed from text + recent length
    text_seed = sum(ord(c) for c in clean_text) + len(recent) * 7

    # ─────────────────────────────────────────────────────────────
    # TOPIC 1: CRISIS PROTOCOL (Self-Harm, Suicide, Severe Danger)
    # Educational discussions (e.g. psychology lectures) are excluded.
    # ─────────────────────────────────────────────────────────────
    is_educational = bool(re.search(
        r"\b(lecture|class|prof|teacher|seminar|lesson|topic|discussion|learned|psychology|prevention|awareness|campaign|project|thesis|research)\b",
        lower_text
    ))
    has_personal_crisis_intent = bool(re.search(
        r"\b(kill myself|end my life|magpakamatay|gusto ko nang mawala|ayaw ko nang mabuhay|slit my wrists|hang myself|disappear forever|want to die|wanna die|i want to die|i will kill myself|i am suicidal|feeling suicidal)\b",
        lower_text
    )) or ((bool(re.search(r"\b(suicide|suicidal)\b", lower_text)) or cat in ["SELF_HARM", "ENCOURAGEMENT_OF_SELF_HARM"]) and not is_educational)

    is_crisis = (
        (cat in ["SELF_HARM", "ENCOURAGEMENT_OF_SELF_HARM"] and not is_educational) or
        (risk_level in ["urgent", "high_safety"] and not is_educational) or
        has_personal_crisis_intent
    )

    if is_crisis:
        if is_ph:
            prev = (
                "Naririnig ko ang bigat ng iyong pinagdaraanan, at tandaan mong karapat-dapat kang suportahan at hindi mo kailangang harapin ito nang mag-isa. "
                "Mangyaring kumausap sa isang taong pinagkakatiwalaan mo ngayon, o tumawag agad sa NCMH Crisis Hotline sa 1553 (toll-free) o 0917-899-USAP (8727), "
                "Emergency 911, o sa ASU Ibajay Guidance & Counseling Office sa Extension 104."
            )
            ack = "Mabigat ang iyong nararamdaman, ngunit may mga taong handang makinig at tumulong sa iyo ngayon."
            full = (
                f"{ack} {prev} Narito ang mga agarang hakbang para sa iyong kaligtasan:\n"
                "1. Huwag mag-isa: Tawagan o lapitan ang isang kapamilya, kaibigan, o guidance counselor.\n"
                "2. Tumawag sa NCMH Crisis Hotline 1553 o Emergency 911 nang libre anumang oras ng araw o gabi.\n"
                "3. Magtungo sa pinakamalapit na campus clinic o ospital kung ikaw ay nasa agarang panganib.\n"
                "Mahalaga ang iyong buhay at may suportang naghihintay para sa iyo."
            )
        else:
            prev = (
                "I hear how much pain you're in, and I want you to know you deserve support and do not have to handle this alone. "
                "Please reach out to someone you trust right now, or contact the NCMH Crisis Hotline at 1553 (toll-free) or 0917-899-USAP (8727), "
                "Emergency 911, or the ASU Ibajay Guidance & Counseling Office at Extension 104."
            )
            ack = "Your feelings and safety matter deeply, and immediate help is available to guide you through this difficult moment."
            full = (
                f"{ack} {prev}\n\nImmediate Safety Guidance:\n"
                "1. Connect immediately with a trusted friend, family member, professor, or school counselor.\n"
                "2. Call the NCMH Crisis Line at 1553 (toll-free 24/7) or dial Emergency 911.\n"
                "3. Contact ASU Ibajay Guidance & Counseling at Extension 104 or visit the campus clinic.\n"
                "You are never alone, and there are people ready to stand with you right now."
            )

        return {
            "type": "CRISIS",
            "detected_topic": "CRISIS_SAFETY_SUPPORT",
            "topic_label": "Crisis & Urgent Safety Support",
            "detected_language": lang_display,
            "situation_summary": "Urgent crisis distress detected requiring immediate contact numbers and human support.",
            "preview": prev,
            "full_support": full,
            "more": "",
            "message": prev,
            "safety_priority": "urgent",
            "confidence_or_uncertainty": "high",
            "disclaimer": "Suggested Support from Safe Space AI · Verified crisis support guidance.",
            "show_resources_button": True,
            "emergency_numbers": [
                "NCMH Crisis Hotline: 1553",
                "Mobile: 0917-899-USAP (8727)",
                "National Emergency: 911",
                "ASU Ibajay Guidance & Counseling: Ext. 104"
            ],
            "collapsible": False
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 2: BULLYING OR HARASSMENT VICTIM SUPPORT
    # (User is being targeted, teased, harassed, or attacked)
    # ─────────────────────────────────────────────────────────────
    is_bullying_victim = bool(re.search(
        r"\b(binubully|inaapi|tinutukso|pinagkakaisahan|binabantaan|pinagtsitsismisan|sinisiraan|inaaway|bullying me|bullied|being bullied|harassed|harassing me|making fun of me|spreading rumors|teasing me|teased me|calling me names|excluded me|shaming me)\b",
        lower_text
    )) or (cat in ["HARASSMENT", "BULLYING"] and bool(re.search(r"\b(me|i|ako|sa akin|ko)\b", lower_text)))

    if is_bullying_victim:
        sit_summary = "Student describing experiences of being bullied, harassed, or mistreated by peers."
        
        # Diversity angles for bullying support
        if is_ph:
            var_prevs_ph = [
                "Pasensya na kung nararanasan mo ito. Hindi mo kailangang harapin ang bullying nang mag-isa. Subukang kausapin ang isang taong pinagkakatiwalaan mo, tulad ng guro, guidance personnel, o kapamilya. Kung ligtas, itago ang mga ebidensya at i-report ang insidente.",
                "Mabigat sa kalooban ang maranasan ang pambubully o panunukso, ngunit tandaan na hindi mo kasalanan ang kanilang ginagawa. Makatutulong na mag-save ng screenshots o patunay at lumapit sa guidance counselor ng campus upang magkaroon ka ng opisyal na proteksyon.",
                "Hindi katanggap-tanggap ang anumang uri ng panggigipit o paninira sa paaralan. Hangga't maaari, i-mute o i-block ang mga nanliligalig sa iyo at makipag-ugnayan agad sa guidance office o sa isang pinagkakatiwalaang propesor."
            ]
            var_mores_ph = [
                "Narito ang mga hakbang na maaari mong gawin:\n"
                "1. Dokumentasyon: Magtabi ng malinaw na kopya o screenshots ng mga mensahe bilang patunay.\n"
                "2. Proteksyon: I-block o i-restrict ang kanilang mga account upang maiwasan ang patuloy na panliligalig.\n"
                "3. Tulong: Bisitahin ang ASU Ibajay Guidance Office (Ext. 104) para sa kumpidensyal na suporta at imbestigasyon.\n"
                "May karapatan kang mag-aral sa isang ligtas at magalang na kapaligiran.",
                "Mga praktikal na susunod na hakbang:\n"
                "1. Huwag makipag-away nang mag-isa sa neutral o hindi ligtas na sitwasyon.\n"
                "2. Kausapin ang isang kaibigan o kapamilya para hindi mo solong dinadala ang takot o lungkot.\n"
                "3. I-report ang insidente sa Student Affairs o Guidance Coordinator para sa pormal na aksyon.\n"
                "Nandito ang komunidad upang suportahan ka."
            ]
            prev = var_prevs_ph[text_seed % len(var_prevs_ph)]
            more = var_mores_ph[(text_seed // 2) % len(var_mores_ph)]
        else:
            var_prevs_en = [
                "You don't have to face this bullying alone. Consider reaching out to a trusted instructor, school guidance staff, or family member who can step in. If it feels safe, keep records of the incidents and report the account so school staff can help protect you.",
                "Dealing with harassment or bullying takes a heavy emotional toll, but their behavior is never your fault. Take screenshots of threatening messages, set clear digital boundaries by blocking responsible accounts, and let our campus guidance personnel support you.",
                "Experiencing mistreatment or rumors from peers is distressing and unacceptable. Prioritize your peace of mind by stepping away from hostile threads and reporting the situation to an academic adviser or student affairs coordinator."
            ]
            var_mores_en = [
                "Recommended next steps:\n"
                "1. Document safely: Keep screenshots, timestamps, or written records of any harmful incidents.\n"
                "2. Guard boundaries: Block or mute harassing accounts on all social platforms.\n"
                "3. Seek school assistance: Visit the ASU Ibajay Guidance & Counseling Office (Ext. 104) for confidential protection.\n"
                "You deserve an educational environment rooted in dignity and safety.",
                "Supportive action plan:\n"
                "1. Avoid engaging in hostile back-and-forth exchanges that might escalate tension.\n"
                "2. Confide in a close friend, parent, or trusted mentor so you have immediate human encouragement.\n"
                "3. File a formal incident report with student welfare personnel for official mediation.\n"
                "Our campus support network is here to ensure you are heard and protected."
            ]
            prev = var_prevs_en[text_seed % len(var_prevs_en)]
            more = var_mores_en[(text_seed // 2) % len(var_mores_en)]

        return {
            "type": "BULLYING_VICTIM_SUPPORT",
            "detected_topic": "BULLYING_VICTIM_SUPPORT",
            "topic_label": "Bullying & Harassment Support",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "safety_priority": "standard",
            "confidence_or_uncertainty": "high",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": True,
            "emergency_numbers": ["ASU Ibajay Guidance & Counseling: Ext. 104"],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 3: HARMFUL BEHAVIOR, THREATS, OR INSTIGATION
    # (User is expressing hostility, threats, or urging harassment)
    # ─────────────────────────────────────────────────────────────
    is_harmful_behavior = bool(re.search(
        r"\b(i will punch|i will beat|i will hurt|gonna beat|let's attack|doxx|ipapa-bugbog|sasapakin|papatayin|resbakan|awayin natin|sugurin)\b",
        lower_text
    )) or (cat in ["THREAT", "VIOLENCE", "HARASSMENT"] and not is_bullying_victim)

    if is_harmful_behavior:
        sit_summary = "Content containing aggressive confrontation, threat, or harmful behavior toward others."
        if is_ph:
            prev = "Ang Safe Space ay nakalaan upang itaguyod ang paggalang at ligtas na pakikitungo sa bawat mag-aaral. Hindi katanggap-tanggap ang pangha-harass, pagbabanta, o pambubully sa kapwa."
            more = "Hinihikayat ka naming pag-isipan ang epekto ng iyong mga salita at huminahon bago makipag-ugnayan. Kung may hindi pagkakaunawaan, lutasin ito sa pamamagitan ng magalang na komunikasyon o sa tulong ng isang guidance counselor."
        else:
            prev = "Safe Space is committed to mutual respect and psychological safety across the student community. Bullying, harassment, and harmful hostility violate our community standards."
            more = "Take a pause to reflect on the impact of these words. If you are experiencing frustration or conflict with a peer, focus on calm de-escalation or reach out to campus guidance staff to resolve the dispute constructively without causing harm."

        return {
            "type": "HARMFUL_BEHAVIOR_GUIDANCE",
            "detected_topic": "HARMFUL_BEHAVIOR_GUIDANCE",
            "topic_label": "Harm Prevention & Respect",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "safety_priority": "standard",
            "confidence_or_uncertainty": "high",
            "disclaimer": "Suggested Support from Safe Space AI · Community standards guidance.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 4: NUDITY, EXPLICIT CONTENT & DIGITAL PRIVACY SAFETY
    # ─────────────────────────────────────────────────────────────
    is_sexual_or_harass = bool(re.search(
        r"\b(sex(\s*with|\s*ka)?|have\s*sex|wanna\s*sex|let'?s\s*fuck|fuck\s*me|send\s*nudes|kantot|kantutan|chupain|tsupain|hubad|tite|puke|puki|burat|intimate photos?|nude photo|leak.*nudes)\b",
        lower_text
    )) or (cat in ["NUDITY", "SEXUAL_HARASSMENT", "SEXUAL_CONTENT"])

    if is_sexual_or_harass:
        sit_summary = "Content involving intimate privacy, sexual proposition, or digital consent concerns."
        if is_ph:
            prev = "Mahalaga ang privacy, consent, at digital safety ng bawat isa. Ang pagbabahagi o paghingi ng intimate photos at explicit content ay labag sa ating community standards at maaaring magdulot ng seryosong panganib."
            more = "Laging protektahan ang iyong personal na seguridad online. Huwag kailanman magbahagi ng maseselang larawan nang walang pahintulot. Kung ikaw o may kakilala kang pinagbabantaan o biktima ng non-consensual image sharing, agad itong i-report sa pamunuan ng paaralan o sa awtoridad para sa legal na proteksyon."
        else:
            prev = "Safe Space is dedicated to peer academic support and mental wellness; sexually explicit propositions or messages are not permitted in our community feed."
            more = "Please keep posts respectful and focused on student well-being and campus life. Guard your personal digital privacy, practice enthusiastic consent, and report non-consensual image sharing immediately to school authorities."

        return {
            "type": "CONTENT_POLICY_NOTICE",
            "detected_topic": "NUDITY_AND_PRIVACY_SAFETY",
            "topic_label": "Digital Privacy & Safety",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical digital safety recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 5: DISCRIMINATION, OFFENSIVE LANGUAGE & INCLUSION
    # ─────────────────────────────────────────────────────────────
    is_discrimination = bool(re.search(
        r"\b(bakla|tomboy|bading|bayot|salot|retard|autistic|pangit|baduy|poorita|squatter|discrimination|racist|sexist)\b",
        lower_text
    )) or (cat in ["HATE", "DISCRIMINATION"])

    if is_discrimination:
        sit_summary = "Content involving discriminatory language, identity slurs, or exclusion."
        if is_ph:
            prev = "Mahalaga ang bawat mag-aaral anuman ang kasarian, pinagmulan, o pagkakakilanlan. Ang paggamit ng mga mapanirang salita o diskriminasyon ay sumusugat sa ating komunidad."
            more = "Hinihikayat natin ang lahat na magsulong ng respeto, empatiya, at pagkakaunawaan. Ang pagtanggap sa pagkakaiba-iba ng bawat isa ang tunay na pundasyon ng isang ligtas na pamantasan."
        else:
            prev = "Inclusive empathy and respect are core values of Safe Space. Using discriminatory terms or exclusionary remarks undermines the psychological safety of our student community."
            more = "We encourage reflecting on how language impacts others. Embracing diverse identities, backgrounds, and perspectives creates an environment where every student can thrive without fear of prejudice."

        return {
            "type": "DISCRIMINATION_GUIDANCE",
            "detected_topic": "DISCRIMINATION_AND_INCLUSION",
            "topic_label": "Respect & Inclusion",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Inclusive community guidelines.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 6: ANGER & CONFLICT RESOLUTION
    # ─────────────────────────────────────────────────────────────
    is_anger = bool(re.search(
        r"\b(galit|sobrang galit|nanggagalaiti|pikon|inis na inis|furious|raging|pissed off|so angry|screaming inside|hate them so much|punch a wall)\b",
        lower_text
    ))

    if is_anger:
        sit_summary = "Student experiencing intense anger, frustration, or heated agitation."
        if is_ph:
            prev = "Normal lang makaramdam ng matinding galit o inis kapag may nangyaring hindi patas o nakakabigo, ngunit huwag hayaang magdikta ito sa iyong mga susunod na aksyon."
            more = "Bigyan muna ang sarili ng ilang sandali para magpalamig—huminga nang malalim ng 4 na beses o maglakad-lakad muna palayo sa sitwasyon. Kapag mahinahon na ang iyong isip, mas madali mong maipapahayag ang iyong saloobin nang may dignidad at walang pagsisisihan."
        else:
            prev = "Experiencing intense anger or frustration is a valid human reaction to feeling wronged, but acting in the heat of the moment often leads to unnecessary regret."
            more = "Give yourself a 10-minute cooldown window before responding to whatever triggered this. Practicing box breathing (inhale 4 seconds, hold 4, exhale 4) helps reset your nervous system so you can address the issue assertively and calmly."

        return {
            "type": "ANGER_MANAGEMENT",
            "detected_topic": "ANGER_AND_CONFLICT_RESOLUTION",
            "topic_label": "Calming & Conflict Resolution",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 7: POSITIVE & ACHIEVEMENTS (Celebration)
    # ─────────────────────────────────────────────────────────────
    is_positive = (
        sent == "Positive" or
        bool(re.search(r"\b(proud|achieved|passed|won|win|first place|highest score|blessed|thankful|grateful|congratulations|congrats|success|yay|panalo|pumasa|natutuwa|masaya|salamat|celebrate)\b", lower_text))
    )
    has_distress = bool(re.search(r"\b(fail|failed|bagsak|bumagsak|stress|stressed|overwhelmed|depressed|sad|crying|anxious|panic)\b", lower_text))

    if is_positive and not has_distress:
        subj = extracted_subject or "milestone"
        sit_summary = f"Student celebrating a positive win or achievement related to {subj}."

        if is_ph:
            openers_fil = [
                f"Napakagandang balita nito para sa iyong pinaghirapang {subj}! Nagbunga ang bawat puyat at tiyagang ibinuhos mo.",
                f"Isang malaking tagumpay ang makamit ang ganitong resulta sa {subj}! Karapat-dapat kang magdiwang ngayong araw.",
                f"Ang sarap sa pakiramdam ng gantimpalang ito matapos ang mahabang preparasyon para sa {subj}."
            ]
            more_fil = [
                "Ibahagi ang saya sa iyong pamilya o mga kaibigang naniwala sa iyo. Magsilbi sana itong paalala sa iyong kakayahan sa bawat susunod na hakbang!",
                "Sulitin ang momentum na ito at maglaan din ng oras para magpahinga. Ipagpatuloy ang ganyang sipag sa mga susunod mo pang minimithi!"
            ]
            prev = openers_fil[text_seed % len(openers_fil)]
            more = more_fil[(text_seed // 3) % len(more_fil)]
        else:
            openers_en = [
                f"Celebrating your hard work on {subj}—seeing that dedication convert into real success is inspiring.",
                f"Hitting a win like this in {subj} is a huge milestone that reflects genuine perseverance.",
                f"This result in {subj} shows just what your preparation and focus are capable of achieving."
            ]
            more_en = [
                "Take time today to soak this in and share the good news with the people who backed you up. Keep this strong confidence handy as you take on whatever is next!",
                "Savor the reward of crossing this finish line after all the effort you invested. Celebrate properly, recharge, and carry this positive energy forward!"
            ]
            prev = openers_en[text_seed % len(openers_en)]
            more = more_en[(text_seed // 3) % len(more_en)]

        return {
            "type": "ACHIEVEMENT",
            "detected_topic": "ACHIEVEMENT",
            "topic_label": "Celebrating Achievement",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Positive student encouragement.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 8: EXAM SETBACK / ACADEMIC FAILURE (Chemistry, Math, etc.)
    # ─────────────────────────────────────────────────────────────
    is_exam_failure = bool(re.search(
        r"\b(fail|failed|bagsak|bumagsak|low grade|low score|failed my exam|bagsak ako|did not pass|flunked|disappointed in my (grade|exam|score)|scholarship on the line)\b",
        lower_text
    ))

    if is_exam_failure:
        subj = extracted_subject or "this exam"
        sit_summary = f"Student experiencing disappointment over an academic setback or exam in {subj}."

        if is_ph:
            openers_fil = [
                f"Masakit harapin ang naging resulta sa {subj}, lalo na't ibinuhos mo ang iyong oras at pagsisikap dito.",
                f"Hindi madaling tanggapin ang mababang marka sa {subj}, ngunit hindi nito nasusukat ang buong kakayahan mo bilang estudyante.",
                f"Natural lang na madismaya sa kinalabasan ng {subj}, pero tandaan na isang kabanata lamang ito at hindi ang kabuuan ng iyong kinabukasan."
            ]
            more_fil = [
                f"Bigyan muna ang sarili ng pagkakataong magpahinga ngayong gabi. Kapag mahinahon na ang isip, maaari mong balikan ang reviewer sa {subj} o kumonsulta sa iyong propesor tungkol sa possible remedial o project credits.",
                f"Huminga nang malalim at huwag munang magdesisyon habang mabigat ang damdamin. Makatutulong ang pakikipag-usap sa isang kaklase para malaman kung saan ka nagkulang at mapaghandaan ang susunod na grading period."
            ]
            prev = openers_fil[text_seed % len(openers_fil)]
            more = more_fil[(text_seed // 2) % len(more_fil)]
        else:
            openers_en = [
                f"Facing a setback in {subj} cuts deep, especially when you invested genuine effort and hoped for a better outcome.",
                f"A tough result in {subj} can feel crushing in the moment, but one exam score never defines your true capability or potential.",
                f"Processing disappointment around {subj} is completely valid, especially when the stakes felt so high."
            ]
            more_en = [
                f"Give yourself permission to pause and step away from studying for the rest of today. When your head clears, schedule a quick consultation with your instructor to review which problem areas tripped you up, and ask if any extra-credit or grade-recovery avenues are open.",
                f"Take the evening to decompress and let the shock settle. Once you're ready, look over the test rubrics with a classmate who did well in {subj}; pinpointing specific gaps turns a difficult setback into an actionable roadmap."
            ]
            prev = openers_en[text_seed % len(openers_en)]
            more = more_en[(text_seed // 2) % len(more_en)]

        return {
            "type": "EXAM_SETBACK",
            "detected_topic": "EXAM_SETBACK",
            "topic_label": "Exam Setback & Recovery",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 9: ACADEMIC WORKLOAD, DEADLINES, SLEEP DEPRIVATION
    # ─────────────────────────────────────────────────────────────
    is_academic_workload = bool(re.search(
        r"\b(exam|exams|assignment|assignments|project|projects|deadline|deadlines|thesis|defense|study|studying|finals|quizzes|quiz|midterm|midterms|homework|burnout|overwhelmed|daming schoolwork|sobrang requirements|cannot sleep|can't sleep|sleep properly)\b",
        lower_text
    ))

    if is_academic_workload:
        subj = extracted_subject or "academic deadlines"
        sit_summary = f"Student experiencing stress and fatigue from balancing deadlines related to {subj}."

        # Support prompt explicit example for assignment/sleep stress
        has_sleep_issue = bool(re.search(r"\b(sleep|tulog|puyat)\b", lower_text))

        if is_ph:
            if has_sleep_issue:
                prev = f"Mabigat dalhin ang tambak na gawain sa {subj}, lalo na kung naapektuhan na ang iyong tulog at pahinga. Subukang ilista ang mga submission ayon sa deadline at hatiin sa maliliit na hakbang."
                more = "Huwag isakripisyo ang iyong kalusugan para sa requirements. Maglaan ng kahit 6 na oras ng tulog dahil mas madaling mag-aral kapag nakapahinga ang utak. Kung patuloy kang nahihirapang matulog, lumapit sa student support services."
            else:
                var_fil = [
                    f"Kapag sabay-sabay dumarating ang mga deadline para sa {subj}, talagang mabigat sa pakiramdam at nakakaipon ng pagod.",
                    f"Normal lang na mapagod sa sunod-sunod na requirements para sa {subj}; kailangan ding huminga ang iyong isip."
                ]
                prev = var_fil[text_seed % len(var_fil)]
                more = f"Subukang isulat sa papel ang mga gawain para sa {subj} at piliin lamang ang nag-iisang pinaka-urgent ngayong araw. Mag-aral gamit ang 25-minutong focus intervals at tiyaking makakakuha ka ng sapat na tulog."
        else:
            if has_sleep_issue or "too many assignments" in lower_text:
                prev = "You're dealing with a lot right now, and it's okay to take things one step at a time. Try listing your assignments by deadline, breaking large tasks into smaller steps, and setting aside time to rest. If the pressure continues affecting your sleep, consider reaching out to someone you trust or your school's student support services."
                more = "Prioritize resting tonight rather than pulling an all-nighter, as sleep deprivation exponentially multiplies stress. Focus on the single nearest submission tomorrow morning and communicate proactively with your professor if an extension is warranted."
            else:
                var_en = [
                    f"Juggling tight submission windows around {subj} demands a lot of mental energy, and feeling drained is a very real response.",
                    f"Balancing heavy deadlines for {subj} piles on serious cognitive load, especially when timelines collide.",
                    f"When multiple requirements for {subj} hit all at once, mental exhaustion can make even starting feel impossible."
                ]
                prev = var_en[text_seed % len(var_en)]
                more = f"Try dumping every pending item onto a notepad and circling only the single most urgent piece of {subj} to tackle right now. Work in focused 25-minute sprints with 5-minute breather breaks, and guard at least six hours of sleep tonight."

        return {
            "type": "DEADLINE_STRESS",
            "detected_topic": "ACADEMIC_STRESS",
            "topic_label": "Academic Stress & Workload",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 10: RELATIONSHIP & FAMILY PROBLEMS
    # ─────────────────────────────────────────────────────────────
    is_relationship_family = bool(re.search(
        r"\b(breakup|break up|broken heart|broke up|cheated|niloko|iniwan|ex-boyfriend|ex-girlfriend|boyfriend|girlfriend|partner|magulang|parents fighting|family problem|away sa pamilya|toxic household|father|mother|strict parents)\b",
        lower_text
    ))

    if is_relationship_family:
        sit_summary = "Student experiencing distress related to relationship breakdown, family friction, or personal rejection."
        if is_ph:
            prev = "Mabigat dalhin ang problema sa relasyon o pamilya, lalo na habang pinagsasabay ito sa iyong pag-aaral."
            more = "Makatutulong na magtakda ng malinaw na emosyonal na boundaries para mapangalagaan ang iyong sarili. Kausapin ang isang pinagkakatiwalaang kaibigan o campus counselor upang maibsan ang bigat na iyong dinadala."
        else:
            prev = "Navigating relationship heartbreak or family strain creates heavy emotional exhaustion that can make focusing on college life very difficult."
            more = "Give yourself space to process these emotions without self-judgment. Establish firm personal boundaries to protect your peace of mind, and confide in a supportive peer or school counselor when you need a sounding board."

        return {
            "type": "RELATIONSHIP_PROBLEM",
            "detected_topic": "RELATIONSHIP_AND_FAMILY_PROBLEMS",
            "topic_label": "Relationship & Family Support",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": True,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 11: INTERPERSONAL, ROOMMATE, OR DORM CONFLICT
    # ─────────────────────────────────────────────────────────────
    is_conflict = bool(re.search(
        r"\b((roommate|roommates|friend|friends|classmate|groupmate|peer|dorm)\s*(issue|issues|conflict|conflicts|fight|fights|argument|arguments|drama|problem|problems)?\s*(with|against)?\s*(my|our|a)?\s*(roommate|friend|classmate|groupmate|dormmate)|fight|fighting|fought|argued?|argument|drama|away|nagaaway|kaaway|tsismis|talking behind my back|fake friend)\b",
        lower_text
    )) and not bool(re.search(r"\b(no real friends|no friends|walang kaibigan)\b", lower_text))

    if is_conflict:
        is_roommate = "roommate" in lower_text or "dorm" in lower_text
        sit_summary = "Student facing interpersonal friction or disagreement with a peer, roommate, or friend."
        if is_ph:
            prev = "Nakakaubos ng enerhiya ang alitan o di-pagkakaunawaan sa kasama sa dorm o kaklase, lalo na kung araw-araw mo silang nakikita."
            more = "Makatutulong na magpalamig muna ng ulo bago mag-usap upang maiwasan ang mga salitang bibitawan sa bugso ng damdamin. Kung kinakailangan, magtakda ng mahinahong usapan sa neutral na lugar, o lumapit sa dorm adviser o counselor kung lumalala ang sitwasyon."
        else:
            prev = "Living or working through friction with a roommate or friend creates constant background tension that wears down your peace of mind."
            more = "Give yourself some physical space until the initial frustration cools before initiating a conversation. When you're ready, approach them focusing on specific behaviors rather than accusations, and consider looping in a dorm resident adviser or guidance staff if boundaries aren't being respected."

        return {
            "type": "ROOMMATE_CONFLICT" if is_roommate else "INTERPERSONAL_CONFLICT",
            "detected_topic": "ROOMMATE_CONFLICT" if is_roommate else "INTERPERSONAL_CONFLICT",
            "topic_label": "Roommate & Peer Conflict" if is_roommate else "Interpersonal Conflict",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 12: LONELINESS, ISOLATION, HOMESICKNESS
    # ─────────────────────────────────────────────────────────────
    is_loneliness = bool(re.search(
        r"\b(lonely|alone|nobody understands|no friends|left out|isolated|nag-iisa|walang kausap|walang nakakaintindi|hindi ako maintindihan|walang may pake|walang may care|excluded|homesick|far from home|missing home|miss my family)\b",
        lower_text
    ))

    if is_loneliness:
        is_homesick = "homesick" in lower_text or "far from home" in lower_text or "missing home" in lower_text
        sit_summary = "Student experiencing homesickness, loneliness, or isolation in their campus environment."
        label = "HOMESICKNESS" if is_homesick else "LONELINESS"

        if is_ph:
            if is_homesick:
                prev = "Mahirap ang malayo sa pamilya at nakasanayang tahanan habang nag-aadjust sa bagong kapaligiran ng kolehiyo."
                more = "Subukang mag-video call sa iyong pamilya o lumang kaibigan ngayong gabi kahit sandali lang. Ang pagdala ng paboritong pagkain o simpleng gawi mula sa bahay ay nakakatulong magpalubag ng loob habang dahan-dahang nakikibagay."
            else:
                prev = "Ang pakiramdam na nag-iisa ka sa gitna ng maraming tao ay mabigat sa kalooban, ngunit may halaga ang iyong nararamdaman."
                more = "Subukang magsimula sa maliit na hakbang—isang simpleng ngiti o tanong sa katabi sa klase, o pagsali sa isang campus organization na tugma sa iyong hilig. Hindi mo kailangang dumaan sa kolehiyo nang mag-isa."
        else:
            if is_homesick:
                prev = "Adjusting to dorm life or being far from family can make even routine college days feel quietly overwhelming."
                more = "Set up a brief phone call or FaceTime with someone back home tonight just to hear a familiar voice. Bringing small comforting habits into your current space can make the transition much more grounded as you find your footing."
            else:
                prev = "Navigating feelings of isolation or feeling like you haven't found your crowd yet can make campus life feel especially daunting."
                more = "Consider starting with one low-pressure connection today—saying hello to a lab partner or checking out an interest-based student club. Building community takes time, and our campus peer network is always right beside you."

        return {
            "type": label,
            "detected_topic": label,
            "topic_label": "Homesickness Support" if is_homesick else "Social Connection & Loneliness",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": True,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 13: SADNESS, EMOTIONAL EXHAUSTION & GRIEF
    # ─────────────────────────────────────────────────────────────
    is_sadness = bool(re.search(
        r"\b(sad|crying|tears|depressed|heartbroken|empty|drained|grief|lost someone|feeling low|down in the dumps|malungkot|umiiyak|iiyak|pagod na pagod)\b",
        lower_text
    )) or sent == "Negative"

    if is_sadness:
        sit_summary = "Student expressing sadness, emotional fatigue, or personal sorrow."
        if is_ph:
            prev = "May mga araw talagang mabigat sa kalooban, at may halaga at karapatan ang iyong nararamdaman kahit hindi ito agad maipaliwanag."
            more = "Huwag piliting maging masaya agad. Payagan ang sarili na magpahinga, uminom ng maligamgam na tubig, at huminga nang dahan-dahan. Kung handa ka na, maaari kang makipag-usap sa isang taong mapagkakatiwalaan o sa ating peer support circle dito."
        else:
            prev = "Some days feel deeply exhausting and emotionally draining, and it is completely okay to simply honor that sadness without pressure to fix it immediately."
            more = "Be gentle with your expectations today. Wrap yourself in a warm blanket, hydrate, and take quiet rest breaks. Reaching out to a compassionate peer or dropping by the campus wellness room can help lighten this emotional weight."

        return {
            "type": "EMOTIONAL_DISTRESS_SADNESS",
            "detected_topic": "EMOTIONAL_DISTRESS_SADNESS",
            "topic_label": "Emotional Wellness & Care",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": True,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 14: FINANCIAL & MONEY WORRY
    # ─────────────────────────────────────────────────────────────
    is_money = bool(re.search(
        r"\b(money|allowance|tuition|baon|gastos|pera|walang pera|bills|rent|bayarin|financial|gutom|pamasahe)\b",
        lower_text
    ))

    if is_money:
        sit_summary = "Student experiencing stress regarding expenses, allowance, or campus financial obligations."
        if is_ph:
            prev = "Mabigat sa isip ang alalahanin sa allowance, pamasahe, o bayarin habang sinusubukang mag-focus sa pag-aaral."
            more = "Maaari kang sumangguni sa University Student Affairs o Scholarship Office upang magtanong tungkol sa emergency student assistance, student assistant programs, o flexible tuition payment schemes. May mga opisyal na tulong ang pamantasan para sa ganitong sitwasyon."
        else:
            prev = "Worrying about money, living expenses, or allowance creates persistent stress that makes academic concentration difficult."
            more = "Consider stopping by the Office of Student Affairs or Financial Aid to ask about emergency student loan funds, work-study openings, or promissory arrangements. Campus resources are in place specifically to support students facing unexpected budget strains."

        return {
            "type": "MONEY_WORRY",
            "detected_topic": "MONEY_WORRY",
            "topic_label": "Financial Support & Guidance",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": True,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 15: VERY SHORT, VAGUE, OR CASUAL SHARING
    # ─────────────────────────────────────────────────────────────
    word_count = len(clean_text.split())
    if word_count <= 4:
        sit_summary = "Brief or vague post shared by a student."
        if is_ph:
            prev = "Maikli man ang iyong naibahagi, bukas ang Safe Space community kung nais mong magkwento nang mas marami tungkol sa iyong araw."
            more = "Nandito kami upang makinig kapag handa ka nang magbahagi ng iyong naiisip o nararamdaman."
        else:
            prev = "You kept it brief, but whenever you feel like sharing more about what's going on, this space is open."
            more = "Feel free to post more details anytime you need a listening ear or practical advice from fellow students."

        return {
            "type": "VAGUE_SHARE",
            "detected_topic": "VAGUE_SHARE",
            "topic_label": "Open Student Sharing",
            "detected_language": lang_display,
            "situation_summary": sit_summary,
            "preview": prev,
            "full_support": f"{prev}\n\n{more}",
            "more": more,
            "message": f"{prev} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # TOPIC 16: GENERAL / ANNOUNCEMENTS / QUESTIONS
    # ─────────────────────────────────────────────────────────────
    has_question = "?" in clean_text or bool(re.search(r"\b(how|what|where|when|who|paano|saan|kailan|sino|tips|ano)\b", lower_text))
    sit_summary = "Student posting a campus schedule, general question, or practical inquiry."

    if is_ph:
        if has_question:
            prev = "Tungkol sa iyong katanungan, makatutulong ang direktang pagtatanong sa kinauukulang departamento o sa class representative para sa pinakabagong detalye."
            more = "Maaari mo ring i-check ang opisyal na bulletin board o university portal upang makatiyak sa tamang mga kinakailangang dokumento at hakbang."
        else:
            prev = "Mahalaga ang ganitong mga update para sa koordinasyon ng ating mga kapwa mag-aaral sa campus."
            more = "Kung may kaugnayan ito sa nalalapit na aktibidad o schedule, ang maagang paghahanda at pag-coordinate sa mga kasamahan ay makatutulong nang malaki."
    else:
        if has_question:
            prev = "Regarding your question, touching base with your department office or department representative is usually the fastest route to verified info."
            more = "Checking the university portal announcements or registrar FAQ page often lays out the required documents and submission windows cleanly."
        else:
            prev = "Sharing practical schedules and announcements keeps everyone across the student community aligned."
            more = "Coordinating timelines with your team or blockmates early helps keep academic activities running smoothly without last-minute scrambling."

    return {
        "type": "ANNOUNCEMENT_INQUIRY" if has_question else "ANNOUNCEMENT",
        "detected_topic": "ANNOUNCEMENT_INQUIRY" if has_question else "ANNOUNCEMENT",
        "topic_label": "Campus Inquiry" if has_question else "Campus Announcements",
        "detected_language": lang_display,
        "situation_summary": sit_summary,
        "preview": prev,
        "full_support": f"{prev}\n\n{more}",
        "more": more,
        "message": f"{prev} {more}",
        "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
        "show_resources_button": False,
        "emergency_numbers": [],
        "collapsible": True
    }
