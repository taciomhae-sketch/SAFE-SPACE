# =============================================================
#  support_recommender.py — AI-Powered Supportive Comment Recommender
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
from typing import Dict, Any, Optional

def generate_support_recommendation(
    text: str,
    sentiment: str = "Neutral",
    category: str = "SAFE",
    risk_level: str = "low",
    language: str = "english"
) -> Dict[str, Any]:
    """
    Generates a compassionate, contextual, and helpful support recommendation
    for a published student post.

    Guidelines:
    - Acknowledge the user's feelings.
    - Respond to the actual context of the post.
    - Offer practical, safe, and realistic suggestions when appropriate.
    - Use compassionate, nonjudgmental language.
    - Encourage healthy coping strategies and seeking support from trusted people.
    - Avoid blaming, shaming, criticizing, or minimizing the user's experience.
    - Avoid pretending to be a human, professional counselor, or emergency service.
    - Never diagnose the user or make unsupported claims about their mental health.
    - In self-harm/crisis situations, prioritize safety and verified hotlines.
    """
    clean_text = (text or "").strip()
    lower_text = clean_text.lower()
    sent = (sentiment or "Neutral").capitalize()
    cat = (category or "SAFE").upper()
    lang = (language or "english").lower()

    is_filipino_or_taglish = lang in ["filipino", "tagalog", "taglish"] or bool(
        re.search(r"\b(ako|ko|mo|ka|na|ng|sa|ang|naman|kasi|talaga|sobrang|hirap|pagod|salamat|gusto|ayoko)\b", lower_text)
    )

    # ─────────────────────────────────────────────────────────────
    # 1. Potential Self-Harm, Suicide-Related or Urgent Safety Crisis
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
            message = (
                "Ikinalulungkot ko na dumadaan ka sa napakahirap na sitwasyon. "
                "Karapat-dapat kang suportahan, at hindi mo kailangang harapin ito nang mag-isa. "
                "Kung maaari, makipag-ugnayan sa isang taong pinagkakatiwalaan mo at sabihin sa kanila ang iyong pinagdaraanan. "
                "Kung ikaw ay nasa agarang panganib, mangyaring makipag-ugnayan sa National Center for Mental Health (NCMH) Hotline "
                "sa 1553 (toll-free) o 0917-899-USAP (8727), tumawag sa Emergency 911, o humingi ng tulong sa sinumang malapit sa iyo."
            )
        else:
            message = (
                "I'm sorry you're going through such a difficult time. "
                "You deserve support, and you don't have to handle this alone. "
                "If you can, reach out to someone you trust and tell them what you're experiencing. "
                "If you may be in immediate danger, please contact local emergency services or ask someone nearby to help you get immediate support."
            )

        return {
            "type": "crisis_support",
            "message": message,
            "show_resources_button": True,
            "resource_link": "resources.html#support",
            "is_sensitive": True,
            "emergency_numbers": ["1553", "911", "0917-899-8727"],
            "disclaimer": "Suggested Support from Safe Space AI · Verified crisis support guidance. Not a substitute for professional clinical care or emergency assistance."
        }

    # ─────────────────────────────────────────────────────────────
    # 2. Academic Stress, Burnout & Deadlines
    # ─────────────────────────────────────────────────────────────
    is_academic_stress = bool(
        re.search(r"\b(exam|exams|assignment|assignments|project|projects|deadline|deadlines|thesis|defense|study|studying|finals|quizzes|quiz|midterm|midterms|homework|burnout|overwhelmed|daming schoolwork|sobrang requirements)\b", lower_text)
    )

    if is_academic_stress:
        # Failing, low score, or disappointed in exam
        if bool(re.search(r"\b(fail|failed|bagsak|bumagsak|low grade|low score|disappointed|disappointing)\b", lower_text)):
            if is_filipino_or_taglish:
                message = (
                    "Pasensya ka na at pinagdaraanan mo ito. Natural lang na malungkot o madismaya matapos ibuhos ang iyong pagsisikap. "
                    "Ang isang pagsusulit ay hindi nagtatakda ng iyong tunay na kakayahan at halaga. "
                    "Magpahinga muna sandali, at kapag handa ka na, subukang balikan ang mga paksang nahirapan ka o humingi ng tulong sa kaklase o guro. "
                    "Kaya mo itong harapin nang dahan-dahan, isa-isang hakbang sa bawat pagkakataon."
                )
            else:
                message = (
                    "Sorry you're going through this. It's understandable to feel disappointed after putting in so much effort. "
                    "One exam doesn't define your abilities. Take a little time to rest, then consider reviewing the topics you found difficult "
                    "or asking a classmate or teacher for help. You can take this one step at a time."
                )
        else:
            # Overwhelmed with deadlines or workload
            if is_filipino_or_taglish:
                message = (
                    "Talagang nakaka-overwhelm ang ganyang sitwasyon. Subukang ilista ang iyong mga deadlines, piliin ang pinaka-urgent, "
                    "at hati-hatiin ito sa mas maliliit at kayang hakbang. Tandaan ding maglaan ng maiikling pahinga at sapat na tulog. "
                    "Hindi mo kailangang tapusin ang lahat nang sabay-sabay."
                )
            else:
                message = (
                    "That sounds overwhelming. Try listing your deadlines, choosing the most urgent task, and breaking it into smaller steps. "
                    "Remember to take short breaks and get enough rest. You don't have to finish everything at once."
                )

        return {
            "type": "academic_support",
            "message": message,
            "show_resources_button": False,
            "is_sensitive": False,
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation."
        }

    # ─────────────────────────────────────────────────────────────
    # 3. Loneliness, Feeling Misunderstood, or Social Sadness
    # ─────────────────────────────────────────────────────────────
    is_loneliness = bool(
        re.search(r"\b(lonely|alone|nobody understands|no friends|left out|isolated|nag-iisa|walang kausap|walang nakakaintindi|hindi ako maintindihan|walang may pake|walang may care)\b", lower_text)
    )

    if is_loneliness:
        if is_filipino_or_taglish:
            message = (
                "Ikinalulungkot ko na ganito ang iyong nararamdaman. Masakit maramdamang walang nakakaintindi, ngunit mahalaga ang iyong nararamdaman. "
                "Kung komportable ka, isaalang-alang ang pakikipag-ugnayan sa isang taong pinagkakatiwalaan mo at ibahagi ang iyong nararanasan. "
                "Karapat-dapat kang marinig at suportahan."
            )
        else:
            message = (
                "I'm sorry you're feeling this way. Feeling misunderstood can be painful, but your feelings matter. "
                "If you feel comfortable, consider reaching out to someone you trust and sharing what you've been experiencing. "
                "You deserve to be heard and supported."
            )

        return {
            "type": "empathy_support",
            "message": message,
            "show_resources_button": True,
            "resource_link": "resources.html#support",
            "is_sensitive": True,
            "disclaimer": "Suggested Support from Safe Space AI · Compassionate peer encouragement."
        }

    # ─────────────────────────────────────────────────────────────
    # 4. General Sadness, Discouragement, or Negative Sentiment
    # ─────────────────────────────────────────────────────────────
    if sent == "Negative" or bool(re.search(r"\b(sad|down|crying|upset|hurt|cried|malungkot|umiiyak|nasasaktan|lungkot|heartbroken)\b", lower_text)):
        if is_filipino_or_taglish:
            message = (
                "Nais naming ipaalam sa iyo na naririnig at pinapahalagahan ang iyong nararamdaman. "
                "Normal lang at okay lang na hindi maging okay sa lahat ng pagkakataon. "
                "Maging banayad sa iyong sarili ngayong araw, magpahinga, at tandaan na nandito ang Safe Space community para sumuporta sa iyo."
            )
        else:
            message = (
                "We hear you, and your feelings are completely valid. It is okay not to be okay all the time. "
                "Be gentle with yourself today. Take a moment to pause, breathe, and practice a little self-care. "
                "Remember that challenging days do pass, and you have a supportive community cheering you on."
            )

        return {
            "type": "comfort_support",
            "message": message,
            "show_resources_button": True,
            "resource_link": "resources.html#support",
            "is_sensitive": False,
            "disclaimer": "Suggested Support from Safe Space AI · Emotional well-being support."
        }

    # ─────────────────────────────────────────────────────────────
    # 5. Positive Experience, Achievement & Celebration
    # ─────────────────────────────────────────────────────────────
    is_positive = (
        sent == "Positive" or
        bool(re.search(r"\b(proud|achieved|passed|won|happy|blessed|thankful|grateful|congratulations|congrats|success|yay|panalo|pumasa|natutuwa|masaya|salamat)\b", lower_text))
    )

    if is_positive:
        if is_filipino_or_taglish:
            message = (
                "Maligayang pagbati! Ang iyong sipag at pagpupursigi ay nagbunga nang maganda. "
                "Maglaan ng sandali upang pahalagahan ang iyong progreso at ipagdiwang ang tagumpay na ito. "
                "Patuloy na maniwala sa iyong sarili habang tinatahak ang iyong susunod na layunin!"
            )
        else:
            message = (
                "Congratulations! Your dedication and effort have paid off. "
                "Take a moment to appreciate your progress and celebrate this achievement. "
                "Keep believing in yourself as you work toward your next goal."
            )

        return {
            "type": "celebration",
            "message": message,
            "show_resources_button": False,
            "is_sensitive": False,
            "disclaimer": "Suggested Support from Safe Space AI · Community celebration & encouragement."
        }

    # ─────────────────────────────────────────────────────────────
    # 6. Neutral, Informational, Group Presentation, or Questions
    # ─────────────────────────────────────────────────────────────
    is_presentation_or_group = bool(
        re.search(r"\b(presentation|group|groupmates|friday|monday|tuesday|wednesday|thursday|schedule|meeting|room|announcement|question|classmates)\b", lower_text)
    )

    if is_presentation_or_group:
        if is_filipino_or_taglish:
            message = (
                "Salamat sa pagbabahagi! Makatutulong kung susuriin mo ang iyong nakatalagang bahagi at makikipag-ugnayan sa iyong mga kagrupo bago ang takdang araw. "
                "Nais namin ang tagumpay ng inyong grupo sa inyong presentation!"
            )
        else:
            message = (
                "Thanks for sharing! You may find it helpful to review your assigned section and coordinate with your groupmates before Friday. "
                "Good luck with your presentation!"
            )
    else:
        if is_filipino_or_taglish:
            message = (
                "Salamat sa pagbabahagi sa Safe Space community. "
                "Nais naming maging mapayapa at produktibo ang iyong araw sa pag-aaral. Nandito ang ating komunidad upang magbahagi at magtulungan."
            )
        else:
            message = (
                "Thank you for sharing with the Safe Space community. "
                "Wishing you a peaceful and productive day ahead in your studies. Feel free to connect and collaborate with fellow students."
            )

    return {
        "type": "general_support",
        "message": message,
        "show_resources_button": False,
        "is_sensitive": False,
        "disclaimer": "Suggested Support from Safe Space AI · Informational student community response."
    }
