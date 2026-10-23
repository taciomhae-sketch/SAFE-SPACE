# =============================================================
#  support_recommender.py — Context-Aware Safe Space AI Support
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

import re
from typing import Dict, Any, Optional

def clean_preview(message: str, max_words: int = 35) -> str:
    """
    Creates a clean 1-2 sentence preview (~25-40 words) ending at a sentence boundary.
    Ensures that the collapsed sneak peek gives an idea of the advice without
    revealing the full multi-step guidance.
    """
    if not message:
        return ""
    cleaned = message.strip().replace("\r\n", " ").replace("\n", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    
    # Split by sentence end punctuation
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    preview = ""
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        candidate = (preview + " " + s).strip() if preview else s
        word_count = len(candidate.split())
        if word_count <= max_words:
            preview = candidate
        else:
            if not preview:
                # If first sentence is already longer than max_words, truncate gracefully
                words = s.split()[:max_words]
                preview = " ".join(words).rstrip(",;:-") + "..."
            break
            
    if not preview:
        words = cleaned.split()[:max_words]
        preview = " ".join(words).rstrip(",;:-") + "..."
        
    return preview


def generate_support_recommendation(
    text: str,
    sentiment: str = "Neutral",
    category: str = "SAFE",
    risk_level: str = "low",
    language: str = "english"
) -> Dict[str, Any]:
    """
    Analyzes the full context of the user's post (sentences and paragraphs)
    and generates context-specific, compassionate support advice.
    
    Returns both a short sneak peek preview (~25-40 words) and the full multi-step advice.
    
    Categories supported:
    - Urgent Safety & Crisis Support (with hotlines and resources)
    - Positive Experiences & Achievements (celebration only; no unwanted stress advice)
    - Bullying or Interpersonal Conflict
    - Anxiety or Excessive Worry (grounding, breathing, manageable steps)
    - Academic Stress & Pressure (exam setbacks vs deadline management)
    - Loneliness or Feeling Left Out
    - Practical Advice or Problem-Solving Questions
    - Sadness or Disappointment
    - Other Topics / General Student Community
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
            preview = (
                "Ikinalulungkot ko na dumadaan ka sa napakahirap na sitwasyon. "
                "Karapat-dapat kang suportahan, at hindi mo kailangang harapin ito nang mag-isa."
            )
            message = (
                "Ikinalulungkot ko na dumadaan ka sa napakahirap na sitwasyon. "
                "Karapat-dapat kang suportahan, at hindi mo kailangang harapin ito nang mag-isa.\n\n"
                "Kung maaari, makipag-ugnayan sa isang taong pinagkakatiwalaan mo at sabihin sa kanila ang iyong pinagdaraanan. "
                "Kung ikaw ay nasa agarang panganib, mangyaring makipag-ugnayan sa National Center for Mental Health (NCMH) Hotline "
                "sa 1553 (toll-free) o 0917-899-USAP (8727), tumawag sa Emergency 911, o humingi ng tulong sa sinumang malapit sa iyo."
            )
        else:
            preview = (
                "I'm sorry you're going through such a difficult time. "
                "You deserve support, and you don't have to handle this alone."
            )
            message = (
                "I'm sorry you're going through such a difficult time. "
                "You deserve support, and you don't have to handle this alone.\n\n"
                "If you can, reach out to someone you trust and tell them what you're experiencing. "
                "If you may be in immediate danger, please contact local emergency services or ask someone nearby to help you get immediate support."
            )

        return {
            "type": "crisis_support",
            "preview": preview,
            "message": message,
            "show_resources_button": True,
            "resource_link": "resources.html#support",
            "is_sensitive": True,
            "emergency_numbers": ["1553", "911", "0917-899-8727"],
            "disclaimer": "Suggested Support from Safe Space AI · Verified crisis support guidance. Not a substitute for professional clinical care or emergency assistance."
        }

    # ─────────────────────────────────────────────────────────────
    # 2. Positive Experiences & Achievements (Category F)
    # Check early so achievements like "passed my exams" are celebrated,
    # and not wrongly treated as academic stress.
    # ─────────────────────────────────────────────────────────────
    is_positive = (
        sent == "Positive" or
        bool(re.search(r"\b(proud|achieved|passed|won|happy|blessed|thankful|grateful|congratulations|congrats|success|yay|panalo|pumasa|natutuwa|masaya|salamat|celebrate)\b", lower_text))
    )
    has_distress = bool(re.search(r"\b(fail|failed|bagsak|bumagsak|stress|stressed|overwhelmed|depressed|crying|anxious|panic)\b", lower_text))

    if is_positive and not has_distress:
        if is_filipino_or_taglish:
            preview = (
                "Maligayang pagbati sa iyong tagumpay! "
                "Ang iyong sipag at pagpupursigi ay nagbunga nang maganda, at karapat-dapat mong ipagdiwang ito."
            )
            message = (
                "Maligayang pagbati sa iyong tagumpay! Ang iyong sipag at pagpupursigi ay nagbunga nang maganda.\n\n"
                "Maglaan ng sandali upang pahalagahan ang iyong progreso at ipagdiwang ang tagumpay na ito kasama ang mga taong sumuporta sa iyo.\n\n"
                "Patuloy na maniwala sa iyong sarili habang tinatahak ang iyong susunod na layunin!"
            )
        else:
            preview = (
                "Congratulations! Your dedication and effort have paid off, "
                "and you deserve to celebrate this achievement."
            )
            message = (
                "Congratulations! Your dedication and effort have paid off. "
                "Take a moment to appreciate your progress and celebrate this achievement with those who support you.\n\n"
                "Keep believing in yourself and your strengths as you work toward your next goal!"
            )

        return {
            "type": "celebration",
            "preview": preview,
            "message": message,
            "show_resources_button": False,
            "is_sensitive": False,
            "disclaimer": "Suggested Support from Safe Space AI · Community celebration & encouragement."
        }

    # ─────────────────────────────────────────────────────────────
    # 3. Bullying or Interpersonal Conflict (Category E)
    # ─────────────────────────────────────────────────────────────
    is_bullying = (cat in ["BULLYING", "HARASSMENT"] and not is_educational) or bool(
        re.search(r"\b(bully|bullied|bullying|harassed|harassment|teased|making fun of me|sinisiraan|binubully|inaapi|pinagtsitsismisan|rumors|cyberbullying|toxic classmates|threatened me|spreading lies)\b", lower_text)
    )

    if is_bullying:
        if is_filipino_or_taglish:
            preview = (
                "Walang sinuman ang may karapatang tratuhin ka nang masama o i-bully. "
                "Hindi mo kasalanan ang nangyayari, at mahalaga ang iyong kaligtasan at kapayapaan ng isip."
            )
            message = (
                "Walang sinuman ang may karapatang tratuhin ka nang masama o i-bully. "
                "Hindi mo kasalanan ang nangyayari, at mahalaga ang iyong kaligtasan at kapayapaan ng isip.\n\n"
                "Kung ligtas, magtakda ng malinaw na boundaries at itago o idokumento ang mga mensahe, screenshots, o insidente upang magkaroon ka ng talaan. "
                "Iwasang makipag-away o pumatol na maaaring magpalala ng sitwasyon.\n\n"
                "Iparating ito sa isang pinagkakatiwalaang guro, guidance counselor, magulang, o opisyal ng paaralan na maaaring mamagitan. "
                "Karapat-dapat ka sa isang ligtas at magalang na kapaligiran sa pag-aaral."
            )
        else:
            preview = (
                "No one deserves to be treated with hostility, harassment, or disrespect. "
                "What you are experiencing is not your fault, and your safety and peace of mind matter."
            )
            message = (
                "No one deserves to be treated with hostility, harassment, or disrespect. "
                "What you are experiencing is not your fault, and your safety and peace of mind matter.\n\n"
                "If it is safe to do so, set firm boundaries and document any harmful messages, dates, or incidents in case you need a record. "
                "Avoid engaging in retaliatory arguments that could escalate tension.\n\n"
                "Reach out to a trusted teacher, guidance counselor, parent, or campus administrator who can intervene and support you. "
                "You deserve a secure, welcoming, and respectful learning environment."
            )

        return {
            "type": "bullying_support",
            "preview": preview,
            "message": message,
            "show_resources_button": True,
            "resource_link": "resources.html#support",
            "is_sensitive": True,
            "disclaimer": "Suggested Support from Safe Space AI · Guidance for student safety and boundary support."
        }

    # ─────────────────────────────────────────────────────────────
    # 4. Anxiety or Excessive Worry (Category D)
    # ─────────────────────────────────────────────────────────────
    is_anxiety = bool(
        re.search(r"\b(anxious|anxiety|panic|panicking|panic attack|nervous|nervousness|scared|terrified|overthinking|racing thoughts|trembling|dread|worry|worried|worrying|kinakabahan|kaba|nagpapanic|di makahinga|sobrang takot)\b", lower_text)
    )

    if is_anxiety:
        if is_filipino_or_taglish:
            preview = (
                "Mukhang nakaka-overwhelm ang kaba at takot na nararamdaman mo ngayon. "
                "Huminto muna sandali at huminga nang malalim—ligtas ka rito."
            )
            message = (
                "Mukhang nakaka-overwhelm ang kaba at takot na nararamdaman mo ngayon. "
                "Huminto muna sandali at huminga nang malalim—ligtas ka rito sa sandaling ito.\n\n"
                "Subukan ang isang simpleng grounding exercise: huminga nang dahan-dahan (4 na segundo paloob, pigilin ng 4 na segundo, at ibuga nang banayad sa loob ng 6 na segundo). "
                "Panoorin ang 5 bagay na nakikita mo at 4 na bagay na mahahawakan mo sa iyong paligid upang mapakalma ang iyong isipan.\n\n"
                "Hati-hatiin ang dahilan ng iyong pag-aalala sa mas maliliit na bahagi at isa-isang harapin ito. Tandaan na hindi mo kailangang lutasin ang lahat ngayon. "
                "Kung patuloy ang kaba, huwag mag-atubiling humingi ng suporta sa isang taong pinagkakatiwalaan mo."
            )
        else:
            preview = (
                "It sounds like anxiety and racing thoughts are making things feel overwhelming right now. "
                "Let's take a pause together—you are safe here in this moment."
            )
            message = (
                "It sounds like anxiety and racing thoughts are making things feel overwhelming right now. "
                "Let's take a pause together—you are safe here in this moment.\n\n"
                "Try a quick grounding exercise: take a slow, deep breath in for 4 seconds, hold for 4 seconds, and exhale gently for 6 seconds. "
                "Notice 5 things you can see around you, 4 things you can physically touch, and 3 things you can hear to bring your awareness back to the present.\n\n"
                "Break whatever problem is causing you worry into one small, manageable step you can focus on right now. "
                "You don't have to figure out everything today. If the anxious feelings persist, consider sharing how you feel with someone you trust or campus guidance support."
            )

        return {
            "type": "anxiety_support",
            "preview": preview,
            "message": message,
            "show_resources_button": True,
            "resource_link": "resources.html#support",
            "is_sensitive": False,
            "disclaimer": "Suggested Support from Safe Space AI · Grounding & anxiety relief coping suggestions."
        }

    # ─────────────────────────────────────────────────────────────
    # 5. Academic Pressure or School Stress (Category A)
    # ─────────────────────────────────────────────────────────────
    is_academic_stress = bool(
        re.search(r"\b(exam|exams|assignment|assignments|project|projects|deadline|deadlines|thesis|defense|study|studying|finals|quizzes|quiz|midterm|midterms|homework|burnout|overwhelmed|daming schoolwork|sobrang requirements)\b", lower_text)
    )

    if is_academic_stress:
        # Sub-case: Failing, low score, or disappointed in exam
        if bool(re.search(r"\b(fail|failed|bagsak|bumagsak|low grade|low score|disappointed|disappointing)\b", lower_text)):
            if is_filipino_or_taglish:
                preview = (
                    "Pasensya ka na at pinagdaraanan mo ito. Natural lang na malungkot o madismaya, "
                    "ngunit ang isang pagsusulit ay hindi nagtatakda ng iyong tunay na halaga at kakayahan."
                )
                message = (
                    "Pasensya ka na at pinagdaraanan mo ito. Natural lang na malungkot o madismaya matapos ibuhos ang iyong pagsisikap. "
                    "Ang isang pagsusulit ay hindi nagtatakda ng iyong tunay na kakayahan at halaga.\n\n"
                    "Magpahinga muna sandali upang ma-reset ang iyong isip. Kapag handa ka na, subukang balikan ang mga paksang nahirapan ka o humingi ng tulong sa kaklase o guro para sa karagdagang paliwanag.\n\n"
                    "Ang pagkatuto ay patuloy na proseso, at ang mga hamon ay pagkakataon upang magbago ng diskarte. "
                    "Kaya mo itong harapin nang dahan-dahan, isa-isang hakbang sa bawat pagkakataon."
                )
            else:
                preview = (
                    "Sorry you're going through this. It's understandable to feel disappointed after putting in so much effort, "
                    "but one exam does not define your abilities."
                )
                message = (
                    "Sorry you're going through this. It's understandable to feel disappointed after putting in so much effort. "
                    "One exam doesn't define your abilities or your worth as a student.\n\n"
                    "Take a little time to rest and clear your mind. When you feel ready, consider reviewing the topics you found difficult "
                    "or asking a classmate or teacher for guidance.\n\n"
                    "Learning is a step-by-step journey, and setbacks are opportunities to adjust your approach. "
                    "You can take this one manageable step at a time."
                )
        else:
            # Sub-case: Overwhelmed with deadlines or heavy workload
            if is_filipino_or_taglish:
                preview = (
                    "Talagang nakaka-overwhelm ang dami ng kailangang gawin. "
                    "Subukang ilista ang iyong mga deadlines at hati-hatiin ito sa mas maliliit at kayang hakbang."
                )
                message = (
                    "Talagang nakaka-overwhelm ang dami ng schoolwork at deadlines. "
                    "Subukang ilista ang iyong mga gawain, piliin ang pinaka-urgent, at hati-hatiin ito sa mas maliliit na bahagi.\n\n"
                    "Maglaan ng maiikling 5-minutong pahinga sa bawat 25 minutong pag-aaral, at siguraduhing may sapat kang tulog. "
                    "Kung masyadong mabigat, huwag mahihiyang kumausap sa iyong mga guro o kaklase para sa gabay.\n\n"
                    "Hindi mo kailangang tapusin ang lahat nang sabay-sabay. Ang maliliit na tuloy-tuloy na hakbang ay may malaking ambag."
                )
            else:
                preview = (
                    "That sounds overwhelming. Try listing your deadlines, choosing the most urgent task, "
                    "and breaking it into smaller steps to regain your momentum."
                )
                message = (
                    "That sounds overwhelming. Try listing your deadlines, choosing the most urgent task, and breaking it into smaller steps. "
                    "Divide your work into focused 25-minute intervals, take short breaks, and remember to get enough rest to stay energized.\n\n"
                    "If the workload feels unmanageable, consider talking to a teacher or classmate you trust for assistance or clarification.\n\n"
                    "You don't have to finish everything at once. Taking one manageable step forward is already real progress."
                )

        return {
            "type": "academic_support",
            "preview": preview,
            "message": message,
            "show_resources_button": False,
            "is_sensitive": False,
            "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation."
        }

    # ─────────────────────────────────────────────────────────────
    # 6. Loneliness or Feeling Left Out (Category C)
    # ─────────────────────────────────────────────────────────────
    is_loneliness = bool(
        re.search(r"\b(lonely|alone|nobody understands|no friends|left out|isolated|nag-iisa|walang kausap|walang nakakaintindi|hindi ako maintindihan|walang may pake|walang may care|excluded)\b", lower_text)
    )

    if is_loneliness:
        if is_filipino_or_taglish:
            preview = (
                "Ikinalulungkot ko na ganito ang iyong nararamdaman. "
                "Masakit maramdamang nag-iisa ka, ngunit mahalaga at may saysay ang iyong nararamdaman."
            )
            message = (
                "Ikinalulungkot ko na ganito ang iyong nararamdaman. "
                "Masakit maramdamang walang nakakaintindi o nag-iisa ka, ngunit mahalaga ang iyong nararamdaman at ang iyong presensya.\n\n"
                "Kung komportable ka, isaalang-alang ang pakikipag-ugnayan sa isang taong pinagkakatiwalaan mo—kaibigan, kapamilya, o kaklase—at ibahagi ang iyong nararanasan. "
                "Maaari ring sumali sa mga organisasyon o grupo sa paaralan na may parehong hilig.\n\n"
                "Karapat-dapat kang marinig, pahalagahan, at suportahan dito sa Safe Space."
            )
        else:
            preview = (
                "I'm sorry you're feeling this way. "
                "Feeling lonely or misunderstood can be deeply painful, but your feelings truly matter."
            )
            message = (
                "I'm sorry you're feeling this way. Feeling misunderstood or left out can be painful, but your feelings truly matter.\n\n"
                "If you feel comfortable, consider reaching out to someone you trust and sharing what you've been experiencing. "
                "Connecting through small conversations or student clubs aligned with your hobbies can also help foster meaningful bonds.\n\n"
                "You deserve to be heard and supported, and you are not alone in this community."
            )

        return {
            "type": "empathy_support",
            "preview": preview,
            "message": message,
            "show_resources_button": True,
            "resource_link": "resources.html#support",
            "is_sensitive": True,
            "disclaimer": "Suggested Support from Safe Space AI · Compassionate peer encouragement."
        }

    # ─────────────────────────────────────────────────────────────
    # 7. Practical Advice or Questions (Category G)
    # ─────────────────────────────────────────────────────────────
    is_asking_advice = bool(
        re.search(r"\b(how do i|how can i|how to|any tips|any advice|does anyone know|what should i do|help me with|need advice on|paano ba|paano mag|may alam ba|ano dapat gawin|pahingi ng tips|recommendations for|suggestions for)\b", lower_text)
    ) or (clean_text.endswith("?") and bool(re.search(r"\b(how|what|where|who|when|paano|saan|kanino|alin)\b", lower_text)))

    if is_asking_advice:
        if is_filipino_or_taglish:
            preview = (
                "Mukhang naghahanap ka ng praktikal na gabay at solusyon. "
                "Narito ang ilang mabisang hakbang upang matulungan kang umusad nang maayos."
            )
            message = (
                "Mukhang naghahanap ka ng praktikal na gabay at solusyon. Narito ang ilang mabisang hakbang upang matulungan kang umusad nang maayos:\n\n"
                "1. Linawin ang iyong eksaktong layunin at ilista ang mga kinakailangang impormasyon o rekisito bago magsimula.\n"
                "2. Sumangguni sa opisyal na gabay o magtanong sa guro o kaklase na may karanasan sa paksang ito para sa direktang payo.\n"
                "3. Gumawa ng maikling checklist ng 2-3 simpleng hakbang upang maiwasan ang pagkalito at masimulan agad.\n\n"
                "Ang sistematikong pagkilos ay magbibigay sa iyo ng mabilis at malinaw na resulta."
            )
        else:
            preview = (
                "It looks like you're looking for practical steps and direct advice. "
                "Here are a few actionable suggestions to help you move forward efficiently."
            )
            message = (
                "It looks like you're looking for practical steps and direct advice. Here are a few actionable suggestions to help you move forward efficiently:\n\n"
                "1. Clearly define the exact outcome you need and gather any prerequisite details before taking action.\n"
                "2. Consult official course guidelines or speak directly with a subject instructor or peer who has experience with this process.\n"
                "3. Create a short checklist with 2-3 manageable action items so you can focus on one step at a time without feeling stuck.\n\n"
                "Structured, practical steps are often the most reliable way to solve challenges quickly."
            )

        return {
            "type": "practical_guidance",
            "preview": preview,
            "message": message,
            "show_resources_button": False,
            "is_sensitive": False,
            "disclaimer": "Suggested Support from Safe Space AI · Practical action steps & problem-solving guidance."
        }

    # ─────────────────────────────────────────────────────────────
    # 8. Sadness or Disappointment / Negative Sentiment (Category B)
    # ─────────────────────────────────────────────────────────────
    if sent == "Negative" or bool(re.search(r"\b(sad|down|crying|upset|hurt|cried|malungkot|umiiyak|nasasaktan|lungkot|heartbroken|grief|disappointed|hopeless)\b", lower_text)):
        if is_filipino_or_taglish:
            preview = (
                "Nais naming ipaalam sa iyo na naririnig at pinapahalagahan ang iyong nararamdaman. "
                "Normal lang at okay lang na hindi maging okay sa lahat ng pagkakataon."
            )
            message = (
                "Nais naming ipaalam sa iyo na naririnig at pinapahalagahan ang iyong nararamdaman. "
                "Normal lang at okay lang na hindi maging okay sa lahat ng pagkakataon.\n\n"
                "Maging banayad sa iyong sarili ngayong araw. Maglaan ng sandali upang huminga, uminom ng tubig, at magpahinga. "
                "Ang maliliit na hakbang ng pangangalaga sa sarili ay makatutulong upang muling lumakas ang iyong kalooban.\n\n"
                "Tandaan na lumilipas din ang mga mapanghamong araw, at nandito ang Safe Space community para sumuporta sa iyo."
            )
        else:
            preview = (
                "We hear you, and your feelings are completely valid. "
                "It is okay not to be okay all the time, and you don't have to carry this alone."
            )
            message = (
                "We hear you, and your feelings are completely valid. It is okay not to be okay all the time, and you don't have to carry this alone.\n\n"
                "Be gentle with yourself today. Take a moment to pause, breathe, and practice a little comfort and self-care. "
                "Allow yourself to process what you're experiencing at your own pace.\n\n"
                "Remember that challenging days do pass, and you have a supportive community cheering you on."
            )

        return {
            "type": "comfort_support",
            "preview": preview,
            "message": message,
            "show_resources_button": True,
            "resource_link": "resources.html#support",
            "is_sensitive": False,
            "disclaimer": "Suggested Support from Safe Space AI · Emotional well-being support."
        }

    # ─────────────────────────────────────────────────────────────
    # 9. Other Topics / Informational / Presentations (Category H)
    # ─────────────────────────────────────────────────────────────
    is_presentation_or_group = bool(
        re.search(r"\b(presentation|group|groupmates|friday|monday|tuesday|wednesday|thursday|schedule|meeting|room|announcement|classmates)\b", lower_text)
    )

    if is_presentation_or_group:
        if is_filipino_or_taglish:
            preview = (
                "Salamat sa pagbabahagi! "
                "Makatutulong kung susuriin mo ang iyong nakatalagang bahagi at makikipag-ugnayan sa iyong mga kagrupo."
            )
            message = (
                "Salamat sa pagbabahagi! Makatutulong kung susuriin mo ang iyong nakatalagang bahagi at makikipag-ugnayan sa iyong mga kagrupo bago ang takdang araw.\n\n"
                "Ang maagang paghahanda at bukas na komunikasyon ay susi sa matagumpay na presentation. "
                "Nais namin ang tagumpay ng inyong grupo!"
            )
        else:
            preview = (
                "Thanks for sharing! "
                "You may find it helpful to review your assigned section and coordinate with your groupmates ahead of time."
            )
            message = (
                "Thanks for sharing! You may find it helpful to review your assigned section and coordinate with your groupmates before Friday.\n\n"
                "Early preparation and clear role delegation will help ensure everything runs smoothly. "
                "Good luck with your presentation!"
            )
    else:
        if is_filipino_or_taglish:
            preview = (
                "Salamat sa pagbabahagi sa Safe Space community. "
                "Nais naming maging mapayapa at produktibo ang iyong araw sa pag-aaral."
            )
            message = (
                "Salamat sa pagbabahagi sa Safe Space community. "
                "Nais naming maging mapayapa at produktibo ang iyong araw sa pag-aaral. "
                "Nandito ang ating komunidad upang magbahagi at magtulungan."
            )
        else:
            preview = (
                "Thank you for sharing with the Safe Space community. "
                "Wishing you a peaceful and productive day ahead in your studies."
            )
            message = (
                "Thank you for sharing with the Safe Space community. "
                "Wishing you a peaceful and productive day ahead in your studies. "
                "Feel free to connect and collaborate with fellow students."
            )

    return {
        "type": "general_support",
        "preview": preview,
        "message": message,
        "show_resources_button": False,
        "is_sensitive": False,
        "disclaimer": "Suggested Support from Safe Space AI · Informational student community response."
    }
