# =============================================================
#  rules.py — Multilingual Categorized Rules & Harmful Content Patterns
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
# =============================================================

from typing import Dict, List, Any

# Standard Categories according to Safe Space Community Guidelines
CATEGORY_SAFE = "SAFE"
CATEGORY_PROFANITY = "PROFANITY"
CATEGORY_HARASSMENT = "HARASSMENT"
CATEGORY_BULLYING = "BULLYING"
CATEGORY_HATE = "HATE"
CATEGORY_THREAT = "THREAT"
CATEGORY_VIOLENCE = "VIOLENCE"
CATEGORY_SEXUAL_HARASSMENT = "SEXUAL_HARASSMENT"
CATEGORY_SEXUAL_CONTENT = "SEXUAL_CONTENT"
CATEGORY_SELF_HARM = "SELF_HARM"
CATEGORY_ENCOURAGEMENT_OF_SELF_HARM = "ENCOURAGEMENT_OF_SELF_HARM"
CATEGORY_DANGEROUS_BEHAVIOR = "DANGEROUS_BEHAVIOR"
CATEGORY_DISCRIMINATION = "DISCRIMINATION"
CATEGORY_SPAM = "SPAM"
CATEGORY_OTHER = "OTHER"

# Severity Levels
SEVERITY_NONE = "none"
SEVERITY_LOW = "low"
SEVERITY_MEDIUM = "medium"
SEVERITY_HIGH = "high"
SEVERITY_CRITICAL = "critical"

# Actions
ACTION_ALLOW = "allow"
ACTION_WARN = "warn"
ACTION_REVIEW = "review"
ACTION_BLOCK = "block"

# Statuses
STATUS_APPROVED = "APPROVED"
STATUS_REVIEW = "REVIEW"
STATUS_BLOCKED = "BLOCKED"

# Language-aware Rules
RULES_CONFIG: Dict[str, List[Dict[str, Any]]] = {
    # ── Universal Critical Rules (Threats, Violence, Suicide Encouragement) ──
    "universal": [
        {
            "id": "crit_kill_threat",
            "category": CATEGORY_THREAT,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(i('ll| will| am going to| gonna)?\s*(kill|murder|slaughter|shoot|stab|choke|strangle|slit your)\s*(you|u|everyone|him|her|them|all of you))\b",
            "confidence": 0.98,
            "reason": "Direct threat of killing or severe physical violence."
        },
        {
            "id": "crit_suicide_encouragement_en",
            "category": CATEGORY_ENCOURAGEMENT_OF_SELF_HARM,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(kill\s*(your\s*self|urself|ur\s*self)|kys|go\s*(and\s*)?die|go\s*die|drink\s*bleach|hang\s*(your\s*self|urself)|slit\s*(your\s*wrists?|ur\s*wrists?)|jump\s*off\s*(a\s*bridge|a\s*building)|you\s*(should|deserve to)\s*(die|kill yourself)|hope\s*you\s*die)\b",
            "confidence": 0.98,
            "reason": "Dangerous encouragement of suicide or self-harm."
        },
        {
            "id": "crit_self_harm_intent_en",
            "category": CATEGORY_SELF_HARM,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(i\s*(want to|wanna|plan to|will|am going to|gonna)\s*(kill myself|end my life|commit suicide|hang myself|slit my wrists|disappear forever and die))\b",
            "confidence": 0.96,
            "reason": "Direct indication of acute self-harm or suicide intent."
        },
        {
            "id": "crit_rape_threat_en",
            "category": CATEGORY_SEXUAL_HARASSMENT,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(i('ll| will| am going to)?\s*rape\s*(you|u|her|him|someone)|send\s*(nudes|explicit|tits|dick\s*pics?|pussy\s*pics?)|touch\s*you\s*(inappropriately|there))\b",
            "confidence": 0.97,
            "reason": "Sexual violence threat or explicit sexual harassment."
        },
        {
            "id": "crit_slurs_en",
            "category": CATEGORY_HATE,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(nigger|nigga|faggot|fag|tranny|chink|spic|kike)\b",
            "confidence": 0.99,
            "reason": "Explicit hate speech slur."
        }
    ],

    # ── Filipino / Tagalog Rules ──
    "fil": [
        {
            "id": "fil_threat_kill",
            "category": CATEGORY_THREAT,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(papatayin\s*(kita|ka|kayo|siya|sila|nyo)|patayin\s*(kita|ka|kayo|siya|sila|mo)|ipapapatay\s*(kita|kayo)|sasaksakin\s*(kita|ka|kayo)|saksakin\s*(kita|ka|kayo)|babarilin\s*(kita|ka|kayo)|bubugbugin\s*(kita|ka|kayo)|bugbugin\s*(kita|ka|kayo)|sasaktan\s*(kita|ka|kayo|ka)|tatagain\s*(kita|ka|kayo)|lalaslasin\s*(kita|ka|kayo)|durog\s*ka\s*(sa\s*akin|sakin)|lagot\s*ka\s*(sa\s*akin|sakin)|humanda\s*ka)\b",
            "confidence": 0.98,
            "reason": "Explicit physical threat in Filipino."
        },
        {
            "id": "fil_suicide_encouragement",
            "category": CATEGORY_ENCOURAGEMENT_OF_SELF_HARM,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(magpakamatay\s*(ka|kayo|na\s*lang|ka\s*na)?|magbigti\s*(ka|kayo|ka\s*na)?|mamatay\s*ka\s*(na|sana|nalang|na\s*lang)|tumalon\s*ka\s*(sa\s*tulay|sa\s*building)|laslasin\s*mo\s*(ang\s*)?pulso\s*mo|maglaslas\s*ka|sana\s*mamatay\s*ka\s*na|dapat\s*mamatay\s*ka\s*na)\b",
            "confidence": 0.98,
            "reason": "Dangerous encouragement of suicide in Filipino."
        },
        {
            "id": "fil_self_harm_intent",
            "category": CATEGORY_SELF_HARM,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(gusto\s*ko\s*(nang|na)?\s*(magpakamatay|mamatay|mawala\s*sa\s*mundo|patayin\s*ang\s*sarili|magbigti|maglaslas)|ayaw\s*ko\s*nang\s*mabuhay|tapusin\s*ko\s*na\s*ang\s*buhay\s*ko)\b",
            "confidence": 0.95,
            "reason": "Expression of acute self-harm or suicidal distress in Filipino."
        },
        {
            "id": "fil_sexual_harassment",
            "category": CATEGORY_SEXUAL_HARASSMENT,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(kakantutin\s*(kita|kayo|ka)|kantutin\s*(kita|kayo|ka)|chupain\s*(mo|ako)|tsupain\s*(mo|ako)|bastusin\s*(kita|kayo)|hahawakan\s*ko\s*(ang\s*)?(puke|puki|tite|suso|pwet)\s*mo|gagahasain\s*(kita|ka)|hahalayin\s*(kita|ka))\b",
            "confidence": 0.97,
            "reason": "Explicit sexual harassment in Filipino."
        },
        {
            "id": "fil_sexual_content",
            "category": CATEGORY_SEXUAL_CONTENT,
            "severity": SEVERITY_HIGH,
            "action": ACTION_REVIEW,
            "pattern": r"\b(kantot|kantutan|chupa|tsupa|tite|puke|puki|kiki|tamod|jakol|magjakol|burat|bayag|pepe|porn|pornograpiya|iyot|iyutan|pokpok)\b",
            "confidence": 0.92,
            "reason": "Sexually explicit terminology in Filipino."
        },
        {
            "id": "fil_targeted_harassment",
            "category": CATEGORY_HARASSMENT,
            "severity": SEVERITY_HIGH,
            "action": ACTION_REVIEW,
            "pattern": r"\b(bobo|boba|bobong|boplaks|bopols|kabobohan|tanga|tangang|katangahan|gago|gaga|gagong|kagaguhan|ulol|inutil|tarantado|tarantada|salot|siraulo|sira-ulo|sira\s*ulo|walanghiya|walang\s*hiya|walang\s*kwenta|walang\s*silbi|panget\s*(mo|ka)|pangit\s*(mo|ka)|abnoy|mongoloid|timang|ungas|unggoy\s*ka|baboy\s*ka|pakyu|pakyaw|hinayupak|hayop\s*ka|hayup\s*ka)\b",
            "confidence": 0.93,
            "reason": "Harmful insult or targeted personal harassment in Filipino."
        },
        {
            "id": "fil_hate_speech",
            "category": CATEGORY_HATE,
            "severity": SEVERITY_HIGH,
            "action": ACTION_REVIEW,
            "pattern": r"\b(mga\s*(bading|tomboy|bakla|bisaya|igorot|moros?|muslim|kristiyano))\s*(salot|walang\s*silbi|dapat\s*mamatay|masasama|marurumi|patayin)\b",
            "confidence": 0.92,
            "reason": "Identity-based hate speech or discriminatory attack in Filipino."
        },
        {
            "id": "fil_general_profanity",
            "category": CATEGORY_PROFANITY,
            "severity": SEVERITY_MEDIUM,
            "action": ACTION_WARN,
            "pattern": r"\b(putangina|putang\s*ina|tangina|tang\s*ina|taena|tayna|tangena|kingina|amputa|ampota|pukinangina|punyeta|leche|letse|piste|peste|yawa|kupal|ogag|pota|puta|lintik|hudas)\b",
            "confidence": 0.88,
            "reason": "Strong vulgar profanity in Filipino."
        },
        {
            "id": "fil_mild_exclamation",
            "category": CATEGORY_PROFANITY,
            "severity": SEVERITY_LOW,
            "action": ACTION_ALLOW,
            "pattern": r"\b(susmaryosep|anak\s*ng\s*tinapa)\b",
            "confidence": 0.70,
            "reason": "Mild Filipino exclamation or informal expression."
        }
    ],

    # ── English Rules ──
    "en": [
        {
            "id": "en_threat_physical",
            "category": CATEGORY_THREAT,
            "severity": SEVERITY_HIGH,
            "action": ACTION_REVIEW,
            "pattern": r"\b(i('ll| will| gonna)?\s*(beat|hurt|destroy|smash|break)\s*(your\s*(face|head|skull|neck|bones)|you\s*(up|to death))|you('ll| will)?\s*(die|pay for this|regret this|be sorry|not survive))\b",
            "confidence": 0.90,
            "reason": "Threatening or intimidating statement."
        },
        {
            "id": "en_targeted_harassment",
            "category": CATEGORY_HARASSMENT,
            "severity": SEVERITY_HIGH,
            "action": ACTION_REVIEW,
            "pattern": r"\b(stupid|idiot|idiotic|moron|moronic|retard|retarded|imbecile|dumbass|jackass|dipshit|fatass|scumbag|loser|worthless|pathetic|piece\s*of\s*shit|waste\s*of\s*space|fuck\s*(you|u|off)|fck\s*u|stfu|gtfo)\b",
            "confidence": 0.92,
            "reason": "Harmful personal insult or demeaning attack in English."
        },
        {
            "id": "en_bullying_incitement",
            "category": CATEGORY_BULLYING,
            "severity": SEVERITY_HIGH,
            "action": ACTION_REVIEW,
            "pattern": r"\b(everyone\s*(should|must|let'?s)\s*(hate|avoid|bully|ignore|mock|gang up on)|make\s*fun\s*of)\s*(him|her|them|that (student|person|classmate|kid))\b",
            "confidence": 0.90,
            "reason": "Incitement to bully, humiliate, or exclude someone."
        },
        {
            "id": "en_hate_discrimination",
            "category": CATEGORY_DISCRIMINATION,
            "severity": SEVERITY_HIGH,
            "action": ACTION_REVIEW,
            "pattern": r"\b(all\s*(gays|lesbians|blacks|asians|muslims|christians|jews|women|men)\s*(are|should\s*be)\s*(evil|subhuman|eradicated|killed|inferior))\b",
            "confidence": 0.95,
            "reason": "Discriminatory hate speech targeting protected groups."
        },
        {
            "id": "en_vulgar_profanity",
            "category": CATEGORY_PROFANITY,
            "severity": SEVERITY_MEDIUM,
            "action": ACTION_WARN,
            "pattern": r"\b(motherfucker|motherfucking|asshole|bitch|bastard|fuck|fucking|fucker|fucked|cunt|dickhead|cocksucker|bullshit|twat|wanker|slut|whore|pussy|dick|cock)\b",
            "confidence": 0.88,
            "reason": "Explicit vulgar profanity."
        },
        {
            "id": "en_mild_profanity",
            "category": CATEGORY_PROFANITY,
            "severity": SEVERITY_LOW,
            "action": ACTION_ALLOW,
            "pattern": r"\b(crap|pissed)\b",
            "confidence": 0.70,
            "reason": "Mild colloquial expression or informal frustration."
        }
    ],

    # ── Taglish Hybrid Rules (Code-Switching Contexts) ──
    "taglish": [
        {
            "id": "taglish_targeted_insult",
            "category": CATEGORY_HARASSMENT,
            "severity": SEVERITY_HIGH,
            "action": ACTION_REVIEW,
            "pattern": r"\b(you\s*are\s*so\s*(bobo|tanga|inutil|gago|panget|kupal)|sobrang\s*(stupid|loser|idiot|pathetic|ugly)\s*mo|napaka-(stupid|toxic|loser|idiot)\s*mo|ang\s*(stupid|loser|idiot|toxic)\s*mo)\b",
            "confidence": 0.94,
            "reason": "Code-switched Taglish targeted insult."
        },
        {
            "id": "taglish_threat_mix",
            "category": CATEGORY_THREAT,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(i('ll| will)?\s*(make sure\s*)?(sasaktan\s*kita|patayin\s*you|bugbog\s*you)|papatayin\s*kita\s*you\s*will\s*see)\b",
            "confidence": 0.95,
            "reason": "Code-switched threat of violence in Taglish."
        },
        {
            "id": "taglish_self_harm_mix",
            "category": CATEGORY_ENCOURAGEMENT_OF_SELF_HARM,
            "severity": SEVERITY_CRITICAL,
            "action": ACTION_BLOCK,
            "pattern": r"\b(go\s*magpakamatay\s*na|just\s*kill\s*yourself\s*ka\s*na|magbigti\s*you\s*loser)\b",
            "confidence": 0.96,
            "reason": "Code-switched encouragement of self-harm in Taglish."
        }
    ],

    # ── Spam & Malicious Repetition ──
    "spam": [
        {
            "id": "spam_commercial",
            "category": CATEGORY_SPAM,
            "severity": SEVERITY_MEDIUM,
            "action": ACTION_WARN,
            "pattern": r"\b(click\s*(here|now)|free\s*(money|crypto|cash|vbucks)|visit\s*my\s*(site|link)|buy\s*now\s*discount|whatsapp\s*me\s*at|telegram\s*channel)\b",
            "confidence": 0.90,
            "reason": "Promotional or malicious spam pattern."
        },
        {
            "id": "spam_repetition",
            "category": CATEGORY_SPAM,
            "severity": SEVERITY_MEDIUM,
            "action": ACTION_WARN,
            "pattern": r"(\b\w+\b)(\s+\1){4,}",
            "confidence": 0.92,
            "reason": "Excessive repetitive text spam."
        }
    ]
}
