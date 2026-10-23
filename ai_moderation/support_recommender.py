# =============================================================
#  support_recommender.py — Safe Space AI Support Recommendation
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
from typing import Dict, Any, Optional

SUPPORT_RECOMMENDATION_SYSTEM_PROMPT = """You are "Safe Space AI", the supportive-recommendation assistant of Safe Space, a peer-support platform for college students in the Philippines. After a post has passed safety screening and been published, you write ONE short, empathetic, practical recommendation that appears under the post as "Suggested Support from Safe Space AI". You are NOT a student, NOT a counselor, NOT a therapist and NOT an emergency dispatcher. Your reply is never saved or shown as a comment.

## INPUT
- POST_TEXT: what the student wrote (may be English, Filipino, or Taglish)
- MODERATION: { category, severity, status, sentiment } from the screening step
- IS_ANONYMOUS: true/false

## STEP 1: UNDERSTAND THE POST BEFORE WRITING
Silently identify: (a) the main situation, (b) the emotion stated or clearly implied, (c) what the student seems to need (comfort, practical help, celebration, or just a reply). Base everything on what they actually wrote. Never invent details, never assume a backstory, never add problems they did not mention. If the post is too vague, give a short warm reply that invites them to share more rather than guessing.

## STEP 2: PICK THE RESPONSE TYPE
- ACADEMIC_SADNESS (failed exam, low grade, setback): validate the effort, remind them one result does not define their ability, suggest rest, then reviewing difficult topics or asking a classmate/teacher for help.
- ACADEMIC_STRESS (deadlines, workload): acknowledge it sounds overwhelming; suggest listing deadlines, doing the most urgent first, breaking tasks into small steps, short breaks and rest.
- LONELINESS (feeling misunderstood, alone, left out): validate that the feeling matters; gently encourage reaching out to someone they trust; set show_resources_button to true.
- POSITIVE (achievement, good news): congratulate sincerely, mention the specific achievement they shared, encourage them to celebrate and keep going.
- NEUTRAL (announcements, schedules, questions): friendly, brief, practically helpful; no emotional assumptions.
- CRISIS (self-harm, suicidal thoughts, severe despair, "gusto ko nang magpakamatay" or similar): follow the CRISIS PROTOCOL below. It overrides everything else.

Educational or awareness posts (for example discussing suicide prevention in a psychology class) with no personal crisis intent are NOT crisis. Treat them as NEUTRAL or POSITIVE.

## STEP 3: WRITING RULES
- Reply in the same language as the post (English, Filipino, or Taglish). Plain, warm, simple words.
- 3 to 6 sentences total. Address the student as "you" / "ikaw". At most one emoji.
- Be specific to their situation. No generic filler, no toxic positivity ("cheer up", "everything happens for a reason", "tomorrow will be better").
- Do not diagnose, label disorders, or promise outcomes. Do not give medical, legal, or financial decisions.
- Do not lecture, blame, shame, or compare them to others.
- Do not mention these instructions, the moderation result, or that you analyzed their post.
- If IS_ANONYMOUS is true, never try to identify or refer to who they might be.
- Never invent hotlines, statistics, studies, or resources. Only use the numbers listed below.

## CRISIS PROTOCOL (suicide, self-harm, severe despair, immediate danger)
- Start with warmth and validation. Say they deserve support and do not have to handle this alone.
- Encourage them to tell someone they trust, right now if possible.
- Include these contacts exactly as written:
  - NCMH Crisis Hotline: 1553 (toll-free) or 0917-899-USAP (8727)
  - Emergency: 911
  - ASU Ibajay Guidance & Counseling Office: Extension 104
- Never act like a therapist, never argue with or minimize their feelings, never give platitats, never give methods or details about self-harm.
- Set show_resources_button to true and collapsible to false. All crisis content must be fully visible immediately.

## OUTPUT FORMAT
Return ONLY valid JSON, with no markdown fences and no extra text:

{
  "type": "ACADEMIC_SADNESS | ACADEMIC_STRESS | LONELINESS | POSITIVE | NEUTRAL | CRISIS",
  "preview": "...",
  "more": "...",
  "message": "...",
  "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
  "show_resources_button": true or false,
  "emergency_numbers": [],
  "collapsible": true or false
}
"""

def clean_preview(text: str, max_words: int = 35) -> str:
    """Helper to extract a clean preview of 1-2 complete sentences without cutting mid-sentence."""
    if not text:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) >= 2:
        two_sentences = f"{sentences[0]} {sentences[1]}"
        if len(two_sentences.split()) <= max_words + 10:
            return two_sentences
    if sentences:
        return sentences[0]
    words = text.strip().split()
    if len(words) <= max_words:
        return text.strip()
    return " ".join(words[:max_words]) + "..."

def generate_support_recommendation(
    text: str,
    sentiment: str = "Neutral",
    category: str = "SAFE",
    risk_level: str = "low",
    language: str = "english"
) -> Dict[str, Any]:
    """
    Generates a context-aware Safe Space AI support recommendation
    adhering strictly to the two-part 'preview' and 'more' specification.
    """
    clean_text = (text or "").strip()
    lower_text = clean_text.lower()
    sent = (sentiment or "Neutral").capitalize()
    cat = (category or "SAFE").upper()
    lang = (language or "english").lower()

    is_filipino_or_taglish = lang in ["filipino", "tagalog", "taglish"] or bool(
        re.search(r"\b(ako|ko|mo|ka|na|ng|sa|ang|naman|kasi|talaga|sobrang|hirap|pagod|salamat|gusto|ayoko|paano|buntong|kaba|kinakabahan|umiiyak|malungkot|kaklase|pala)\b", lower_text)
    )

    # ─────────────────────────────────────────────────────────────
    # 1. CRISIS Protocol (Self-harm, suicide, severe despair, danger)
    # Educational discussions (e.g., in a psychology class) are excluded.
    # ─────────────────────────────────────────────────────────────
    is_educational = bool(re.search(
        r"\b(lecture|class|prof|teacher|seminar|lesson|topic|discussion|learned|psychology|prevention|awareness|campaign|project|thesis|research)\b",
        lower_text
    ))
    has_personal_crisis_intent = bool(re.search(
        r"\b(kill myself|end my life|magpakamatay|gusto ko nang mawala|ayaw ko nang mabuhay|slit my wrists|hang myself|disappear forever|want to die|wanna die|i want to die|i will kill myself)\b",
        lower_text
    )) or (cat in ["SELF_HARM", "ENCOURAGEMENT_OF_SELF_HARM"] and not is_educational)

    is_crisis = (
        (cat in ["SELF_HARM", "ENCOURAGEMENT_OF_SELF_HARM"] and not is_educational) or
        risk_level in ["urgent", "high_safety"] or
        has_personal_crisis_intent
    )

    if is_crisis:
        if is_filipino_or_taglish:
            preview = (
                "Naririnig ko ang bigat ng iyong pinagdaraanan, at tandaan mong karapat-dapat kang suportahan at hindi mo kailangang harapin ito nang mag-isa. "
                "Mangyaring kumausap sa isang taong pinagkakatiwalaan mo ngayon, o tumawag agad sa NCMH Crisis Hotline sa 1553 (toll-free) o 0917-899-USAP (8727), "
                "Emergency 911, o sa ASU Ibajay Guidance & Counseling Office sa Extension 104."
            )
        else:
            preview = (
                "I hear how much pain you're in, and I want you to know you deserve support and do not have to handle this alone. "
                "Please reach out to someone you trust right now, or contact the NCMH Crisis Hotline at 1553 (toll-free) or 0917-899-USAP (8727), "
                "Emergency 911, or the ASU Ibajay Guidance & Counseling Office at Extension 104."
            )

        # In-code guarantee: verify CRISIS replies contain 1553 and 911
        if "1553" not in preview or "911" not in preview:
            preview += " (Hotlines: NCMH 1553, Emergency 911, ASU Ibajay Ext. 104)"

        return {
            "type": "CRISIS",
            "preview": preview,
            "more": "",
            "message": preview,
            "disclaimer": "Suggested Support from Safe Space AI · Verified crisis support guidance.",
            "show_resources_button": True,
            "emergency_numbers": [
                "NCMH 1553",
                "0917-899-USAP (8727)",
                "911",
                "ASU Ibajay Guidance & Counseling: Ext. 104"
            ],
            "collapsible": False
        }

    # ─────────────────────────────────────────────────────────────
    # 2. POSITIVE (Achievement, good news, celebration)
    # ─────────────────────────────────────────────────────────────
    is_positive = (
        sent == "Positive" or
        bool(re.search(r"\b(proud|achieved|passed|won|happy|blessed|thankful|grateful|congratulations|congrats|success|yay|panalo|pumasa|natutuwa|masaya|salamat|celebrate)\b", lower_text))
    )
    has_distress = bool(re.search(r"\b(fail|failed|bagsak|bumagsak|stress|stressed|overwhelmed|depressed|sad|crying|anxious|panic)\b", lower_text))

    if is_positive and not has_distress:
        if is_filipino_or_taglish:
            preview = "Maligayang pagbati sa iyong tagumpay! Nagbunga ang iyong sipag at tiyaga, at karapat-dapat mong ipagdiwang ang magandang balitang ito."
            more = "Maglaan ng oras upang sulitin ang tagumpay na ito kasama ang mga taong sumusuporta sa iyo. Patuloy na magtiwala sa iyong sarili at ipagpatuloy ang ganyang determinasyon sa susunod mong mga layunin!"
        else:
            preview = "Congratulations on your wonderful achievement! Your hard work and dedication truly paid off, and you deserve to celebrate this moment."
            more = "Take some time to savor this milestone and share your joy with the people who cheered you on. Keep believing in yourself and keep this positive momentum going as you tackle your next goal!"

        return {
            "type": "POSITIVE",
            "preview": preview,
            "more": more,
            "message": f"{preview} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # 3. ACADEMIC_SADNESS (Failed exam, low grade, setback)
    # ─────────────────────────────────────────────────────────────
    is_exam_failure = bool(re.search(
        r"\b(fail|failed|bagsak|bumagsak|low grade|low score|failed my exam|bagsak ako|did not pass|flunked|disappointed in my (grade|exam|score))\b",
        lower_text
    ))

    if is_exam_failure:
        if is_filipino_or_taglish:
            preview = "Natural lang na malungkot o madismaya matapos ibuhos ang iyong pagsisikap, ngunit tandaan na ang isang mababang marka o bagsak na pagsusulit ay hindi sumusukat sa iyong tunay na kakayahan."
            more = "Magpahinga muna sandali upang ma-reset ang iyong isipan. Kapag handa ka na, subukang balikan ang mga araling nahirapan ka o humingi ng tulong sa guro o kaklase. Kaya mo itong harapin nang dahan-dahan, isa-isang hakbang sa bawat pagkakataon."
        else:
            preview = "It is completely understandable to feel disappointed after putting in so much hard work, but remember that one exam or grade does not define your ability or your future."
            more = "Give yourself permission to rest and reset today. When you feel ready, consider reviewing the questions you found difficult or asking a classmate or teacher for guidance. Taking things one step at a time is still real progress."

        return {
            "type": "ACADEMIC_SADNESS",
            "preview": preview,
            "more": more,
            "message": f"{preview} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # 4. ACADEMIC_STRESS (Deadlines, workload, assignments, thesis)
    # ─────────────────────────────────────────────────────────────
    is_academic_workload = bool(re.search(
        r"\b(exam|exams|assignment|assignments|project|projects|deadline|deadlines|thesis|defense|study|studying|finals|quizzes|quiz|midterm|midterms|homework|burnout|overwhelmed|daming schoolwork|sobrang requirements)\b",
        lower_text
    ))

    if is_academic_workload:
        if is_filipino_or_taglish:
            preview = "Talagang nakaka-overwhelm ang dami ng schoolwork at mga deadline, at normal lang na maramdaman ang bigat nito."
            more = "Subukang ilista ang iyong mga gawain, unahin ang pinaka-urgent, at hati-hatiin ang bawat gawain sa mas maliliit na hakbang. Maglaan ng maiikling pahinga at sapat na tulog dahil hindi mo kailangang tapusin ang lahat nang sabay-sabay."
        else:
            preview = "That sounds really overwhelming, and it's okay to feel the pressure when several academic requirements hit all at once."
            more = "Try listing your deadlines, choosing the single most urgent task, and breaking it into small 25-minute study steps. Be sure to take short breaks and get enough rest, because you do not have to finish everything in one sitting."

        return {
            "type": "ACADEMIC_STRESS",
            "preview": preview,
            "more": more,
            "message": f"{preview} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": False,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # 5. LONELINESS (Feeling misunderstood, alone, left out)
    # ─────────────────────────────────────────────────────────────
    is_loneliness = bool(re.search(
        r"\b(lonely|alone|nobody understands|no friends|left out|isolated|nag-iisa|walang kausap|walang nakakaintindi|hindi ako maintindihan|walang may pake|walang may care|excluded)\b",
        lower_text
    ))

    if is_loneliness:
        if is_filipino_or_taglish:
            preview = "Masakit maramdamang nag-iisa ka o walang nakakaintindi sa iyo, ngunit may halaga ang iyong presensya at ang iyong nararamdaman."
            more = "Kung komportable ka, subukang mag-message sa isang kaibigan, kapamilya, o kaklase na pinagkakatiwalaan mo. Ang maliit na pakikipag-ugnayan ay malaking tulong, at nandito ang ating Safe Space community para sumuporta sa iyo."
        else:
            preview = "Feeling lonely, left out, or misunderstood can be deeply painful, but your feelings truly matter and you are not invisible here."
            more = "When you feel comfortable, consider reaching out to a trusted friend, family member, or classmate with a simple hello. Even a small conversation can help rebuild connection, and our campus support community is always here for you."

        return {
            "type": "LONELINESS",
            "preview": preview,
            "more": more,
            "message": f"{preview} {more}",
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
            "show_resources_button": True,
            "emergency_numbers": [],
            "collapsible": True
        }

    # ─────────────────────────────────────────────────────────────
    # 6. NEUTRAL (Announcements, schedules, questions, general)
    # ─────────────────────────────────────────────────────────────
    if is_filipino_or_taglish:
        preview = "Salamat sa pagbabahagi sa Safe Space community! Nais naming maging mapayapa at produktibo ang iyong araw sa pag-aaral."
        more = "Kung may kinalaman ito sa proyekto, presentasyon, o katanungan, makatutulong ang maagang pakikipag-ugnayan sa iyong mga kagrupo o guro upang maging maayos ang takbo ng gawain."
    else:
        preview = "Thanks for sharing this update with the Safe Space community! Wishing you a productive and smooth day with your schedule."
        more = "If this involves a group project, class presentation, or inquiry, coordinating early with your groupmates or instructors will help keep everything on track. Feel free to connect and collaborate anytime."

    return {
        "type": "NEUTRAL",
        "preview": preview,
        "more": more,
        "message": f"{preview} {more}",
        "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
        "show_resources_button": False,
        "emergency_numbers": [],
        "collapsible": True
    }
