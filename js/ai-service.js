/**
 * Safe Space — Multilingual AI Moderation & Safety Fallback Service Client
 * BSCS Thesis: An AI-Powered Safe Space Platform with Automated Moderation and Sentiment Analysis
 * 
 * Pipeline:
 * USER CONTENT
 *   ↓
 * Language Detection (English, Filipino, Taglish)
 *   ↓
 * Text Normalization (Unicode NFKC, Repeated Chars, Token Despacing, Leetspeak, Phonetic variants)
 *   ↓
 * Obfuscation Detection (Spacing, Punctuation evasion, Homoglyphs, Substitutions)
 *   ↓
 * Context & Intent Evaluation (Targeting, Academic Stress vs Crisis, Benign Idioms, Educational Quoting)
 *   ↓
 * AI Multilingual Analysis (FastAPI BART-large-mnli + RoBERTa)
 *   ↓
 * Safety Fallback (Comprehensive Multilingual Rules)
 *   ↓
 * Final Decision (Allow / Warn / Review / Block)
 *   ↓
 * Moderation Log
 */
(function(window) {
  'use strict';

  var DEFAULT_API_URL = 'http://127.0.0.1:8000';

  // ─────────────────────────────────────────────────────────────
  // 1. MULTILINGUAL LANGUAGE DETECTOR
  // ─────────────────────────────────────────────────────────────
  var TAGALOG_MARKERS = new Set([
    "ang", "ng", "mga", "sa", "kay", "kina", "para", "ni", "nina",
    "ako", "ko", "akin", "ikaw", "ka", "mo", "iyo", "siya", "niya", "kaniya",
    "kanya", "tayo", "natin", "atin", "kami", "namin", "amin", "kayo", "ninyo",
    "inyo", "sila", "nila", "kanila", "ito", "iyan", "iyon", "dito", "diyan",
    "doon", "nito", "niyan", "noon", "ano", "sino", "saan", "kailan", "bakit",
    "paano", "magkano", "alin", "may", "meron", "wala", "hindi", "huwag", "wag",
    "oo", "opo", "po", "na", "pa", "naman", "din", "rin", "daw", "raw", "pala",
    "kaya", "kasi", "pero", "dahil", "kundi", "upang", "habang", "bago", "pagkatapos",
    "talaga", "sobra", "sobrang", "masyado", "masyadong", "gusto", "ayaw", "puwede",
    "pwede", "dapat", "kailangan", "buhay", "tao", "araw", "oras", "bahay", "eskwela",
    "klase", "guro", "kaibigan", "pamilya", "lods", "lodz", "tol", "pre", "chibog",
    "arat", "tara", "eme", "charot", "char", "luh", "sheesh", "chika", "petmalu",
    "werpa", "skwela", "walwal", "bwisit", "buwisit", "hirap", "lungkot", "pagod",
    "saya", "tulong", "salamat", "bobo", "tanga", "gago", "ulol", "inutil", "salot"
  ]);

  var ENGLISH_MARKERS = new Set([
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her",
    "she", "or", "an", "will", "my", "one", "all", "would", "there",
    "their", "what", "so", "up", "out", "if", "about", "who", "get",
    "which", "go", "me", "when", "make", "can", "like", "time", "no",
    "just", "him", "know", "take", "people", "into", "year", "your",
    "good", "some", "could", "them", "see", "other", "than", "then",
    "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first",
    "well", "way", "even", "new", "want", "because", "any", "these",
    "give", "day", "most", "us", "is", "are", "was", "were", "am"
  ]);

  var FILIPINO_AFFIX_REGEX = /\b(nag|mag|pag|i|in|um|ma|ipag|ipinag|napag|makipag|makapag)[a-z]+|\b[a-z]+(an|han|in|hin)\b/i;
  var TAGLISH_HYBRID_REGEX = /\b(nag|mag|i|pa|ipag)-[a-z]{3,}\b/i;

  var SafeSpaceLanguageDetector = {
    detect: function(text) {
      if (!text || typeof text !== 'string') {
        return { language: 'english', code: 'en', confidence: 1.0, is_multilingual: false };
      }

      var words = text.toLowerCase().match(/[a-z]+/g) || [];
      var totalWords = words.length;
      if (totalWords === 0) {
        return { language: 'english', code: 'en', confidence: 0.5, is_multilingual: false };
      }

      var filCount = 0;
      var enCount = 0;
      var hasTaglishHybrid = TAGLISH_HYBRID_REGEX.test(text);

      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (TAGALOG_MARKERS.has(w)) {
          filCount++;
        } else if (ENGLISH_MARKERS.has(w)) {
          enCount++;
        } else if (FILIPINO_AFFIX_REGEX.test(w)) {
          filCount += 0.8;
        }
      }

      var filRatio = filCount / totalWords;
      var enRatio = enCount / totalWords;

      // Taglish: significant mix or hybrid affixes
      if (hasTaglishHybrid || (filCount >= 1 && enCount >= 1 && (filRatio >= 0.15 || enRatio >= 0.15))) {
        var conf = Math.min(0.98, Math.max(0.85, 0.70 + (filRatio + enRatio) * 0.3));
        return {
          language: 'taglish',
          code: 'taglish',
          confidence: Math.round(conf * 100) / 100,
          is_multilingual: true,
          details: { filRatio: filRatio, enRatio: enRatio }
        };
      }

      // Filipino
      if (filCount > enCount || filRatio >= 0.25) {
        var confFil = Math.min(0.98, Math.max(0.82, 0.65 + filRatio * 0.5));
        return {
          language: 'filipino',
          code: 'fil',
          confidence: Math.round(confFil * 100) / 100,
          is_multilingual: false,
          details: { filRatio: filRatio, enRatio: enRatio }
        };
      }

      // English
      var confEn = Math.min(0.98, Math.max(0.80, 0.65 + enRatio * 0.5));
      return {
        language: 'english',
        code: 'en',
        confidence: Math.round(confEn * 100) / 100,
        is_multilingual: false,
        details: { filRatio: filRatio, enRatio: enRatio }
      };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. TEXT NORMALIZER & OBFUSCATION DETECTOR
  // ─────────────────────────────────────────────────────────────
  var HOMOGLYPH_MAP = {
    '\u0430': 'a', '\u0410': 'A',
    '\u0435': 'e', '\u0415': 'E',
    '\u043e': 'o', '\u041e': 'O',
    '\u0440': 'p', '\u0420': 'P',
    '\u0441': 'c', '\u0421': 'C',
    '\u0443': 'y', '\u0423': 'Y',
    '\u0445': 'x', '\u0425': 'X',
    '\u0456': 'i', '\u0406': 'I',
    '\u03bf': 'o', '\u039f': 'O',
    '\u03b1': 'a', '\u0391': 'A'
  };

  var LEET_MAP = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
    '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i',
    '+': 't', '(': 'c', '<': 'c'
  };

  var PHONETIC_VARIANTS = [
    { pattern: /\b(ptngina|tngina|tang1na|tangena|p-tangina|p\*tangina)\b/gi, replacement: "putangina" },
    { pattern: /\b(pkyu|fck|fckin|fcking|f\*ck|fu\*k|fuk|fcku)\b/gi, replacement: "fuck" },
    { pattern: /\b(b0b0|b-o-b-o|b\*b\*)\b/gi, replacement: "bobo" },
    { pattern: /\b(t4ng4|t-a-n-g-a|tng4)\b/gi, replacement: "tanga" },
    { pattern: /\b(g4g0|g-a-g-o|g@go)\b/gi, replacement: "gago" },
    { pattern: /\b(k1ll|k\*ll|k-i-l-l)\b/gi, replacement: "kill" },
    { pattern: /\b(sh\*t|sh!t|s-h-i-t)\b/gi, replacement: "shit" },
    { pattern: /\b(b\*tch|b!tch|b1tch|b-i-t-c-h)\b/gi, replacement: "bitch" },
    { pattern: /\b(4ssh0le|a\$\$hole|a\*\*hole)\b/gi, replacement: "asshole" },
    { pattern: /\b(k\*ntot|k4nt0t)\b/gi, replacement: "kantot" },
    { pattern: /\b(t\*te|t1te)\b/gi, replacement: "tite" },
    { pattern: /\b(p\*ke|puk1)\b/gi, replacement: "puke" }
  ];

  var KNOWN_SUBWORDS = [
    'bobo', 'tanga', 'gago', 'kill', 'fuck', 'shit', 'ka', 'mo', 'ako',
    'die', 'ulol', 'puke', 'tite', 'inutil', 'salot', 'puta', 'hate',
    'yourself', 'urself', 'bitch', 'asshole', 'bastard'
  ];

  var SafeSpaceNormalizer = {
    normalize: function(text) {
      if (!text || typeof text !== 'string') {
        return {
          original: '', clean: '', collapsed: '', evasion: '',
          deleet: '', deobfuscated: '', has_obfuscation: false, obfuscation_types: []
        };
      }

      var original = text;
      var obfTypes = [];

      // 1. Homoglyphs replacement
      var hasHomoglyphs = false;
      var homoglyphChars = [];
      for (var h = 0; h < original.length; h++) {
        var ch = original[h];
        if (HOMOGLYPH_MAP[ch]) {
          homoglyphChars.push(HOMOGLYPH_MAP[ch]);
          hasHomoglyphs = true;
        } else {
          homoglyphChars.push(ch);
        }
      }
      var homoglyphText = homoglyphChars.join('');
      if (hasHomoglyphs) obfTypes.push('unicode_homoglyphs');

      // 2. Unicode NFKC
      var nfkc = typeof homoglyphText.normalize === 'function' ? homoglyphText.normalize('NFKC') : homoglyphText;
      var lower = nfkc.toLowerCase();

      // 3. Collapse whitespace
      var clean = lower.replace(/\s+/g, ' ').trim();

      // 4. Repeated characters (3+ -> 1)
      var hasExcessRepeats = /(.)\1{2,}/.test(clean);
      var collapsed = clean.replace(/(.)\1{2,}/g, '$1');
      if (hasExcessRepeats) obfTypes.push('repeated_characters');

      // 5. Spacing & Punctuation evasion
      var hasSpacedLetters = false;
      var evasion = collapsed;

      // Intra-word punctuation: b.o.b.o, g_a_g_o, k-a
      if (/(?<=[a-z0-9])[\.\-_*~#|/\\]+(?=[a-z0-9])/.test(evasion)) {
        hasSpacedLetters = true;
        evasion = evasion.replace(/(?<=[a-z0-9])[\.\-_*~#|/\\]+(?=[a-z0-9])/g, '');
      }

      // Spaced single letters: "b o b o", "k i l l"
      evasion = evasion.replace(/\b(?:[a-z0-9]\s+)+[a-z0-9]\b/g, function(match) {
        if (match.split(/\s+/).length <= 1) return match;
        hasSpacedLetters = true;
        var condensed = match.replace(/\s+/g, '');
        for (var k = 0; k < KNOWN_SUBWORDS.length; k++) {
          var kw = KNOWN_SUBWORDS[k];
          if (condensed.indexOf(kw) !== -1 && condensed.length > kw.length) {
            condensed = condensed.replace(new RegExp(kw, 'g'), ' ' + kw + ' ');
            condensed = condensed.replace(/\s+/g, ' ').trim();
          }
        }
        return condensed;
      });

      if (hasSpacedLetters) obfTypes.push('spacing_or_punctuation_evasion');

      // 6. Leetspeak substitution
      var hasLeetspeak = false;
      var deleetChars = [];
      for (var l = 0; l < evasion.length; l++) {
        var lc = evasion[l];
        if (LEET_MAP[lc]) {
          deleetChars.push(LEET_MAP[lc]);
          hasLeetspeak = true;
        } else {
          deleetChars.push(lc);
        }
      }
      var deleet = deleetChars.join('');
      if (hasLeetspeak) obfTypes.push('leetspeak_substitutions');

      // 7. Common phonetic abbreviations
      var deobfuscated = deleet;
      for (var p = 0; p < PHONETIC_VARIANTS.length; p++) {
        var pv = PHONETIC_VARIANTS[p];
        if (pv.pattern.test(deobfuscated)) {
          deobfuscated = deobfuscated.replace(pv.pattern, pv.replacement);
          obfTypes.push('phonetic_misspelling');
        }
      }

      return {
        original: original,
        clean: clean,
        collapsed: collapsed,
        evasion: evasion,
        deleet: deleet,
        deobfuscated: deobfuscated,
        has_obfuscation: obfTypes.length > 0,
        obfuscation_types: Array.from(new Set(obfTypes))
      };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. CONTEXT & INTENT ANALYZER
  // ─────────────────────────────────────────────────────────────
  var BENIGN_WHITELIST = [
    /\b(diet|dieting|balanced diet|healthy diet)\b/i,
    /\b(my\s*(phone|laptop|battery|pc|car|earphones)\s*died)\b/i,
    /\b(died\s*laughing|dying\s*laughing|dead\s*tired)\b/i,
    /\b(roll\s*(the\s*)?die)\b/i,
    /\b(pass|passed|passing|assignment|compassion|assist|assistant|glasses?|grass)\b/i,
    /\b(hello|shell|seashell)\b/i,
    /\b(kill\s*(time|the\s*game|it|the\s*vibe))\b/i,
    /\b(bohol|bobbin)\b/i,
    /\b(tanggap|tanghalian|katangian|patalastas|tanggapan)\b/i,
    /\b(gagawin|magaganda|gaganda|gumaganda)\b/i,
    /\b(tagalog|bagong|bago)\b/i,
    /\b(puto\s*(bumbong|cheese|pao|kutsinta)?)\b/i,
    /\b(reputasyon|kaputol)\b/i,
    /\b(nakakatawa|nakakatuwa)\b/i
  ];

  var SAFE_ACADEMIC_STRESS = [
    /\b(stressed|exhausted|tired|burnout|overwhelmed|worried|anxious)\s*(because of|due to|about|with)?\s*(my|the|our|this|all\s*the)?\s*(exam|assignment|school|study|homework|class|project|thesis|finals|grades?|defense|prof|teacher|subject)\b/i,
    /\b(i('m| am| feel| felt)?\s*(sad|upset|down|frustrated|discouraged|crying))\s*(about|because of|due to|today|lately|right now)?\s*(my|the|our|this)?\s*(exam|grade|score|class|school|failure|project|homework|thesis|defense|interview)\b/i,
    /\b(i\s*(failed|did\s*not\s*pass|did\s*bad\s*on|got\s*a\s*low\s*grade\s*on|struggling\s*with))\b/i,
    /\b(hindi\s*ako\s*(pumasa|nakapasa)|bagsak\s*ako|bumagsak\s*ako|hirap\s*na\s*hirap\s*ako)\b/i,
    /\b(pagod\s*na\s*ako\s*(sa\s*school|sa\s*klase|sa\s*assignments?|sa\s*exams?|sa\s*thesis|sa\s*buhay\s*estudyante))\b/i,
    /\b(ang\s*hirap\s*(ng\s*exam|ng\s*thesis|ng\s*defense|mag-aral|sa\s*school))\b/i,
    /\b(sobrang\s*(dami|hirap)\s*ng\s*(requirements|tasks|exams|assignments))\b/i
  ];

  var EDUCATIONAL_OR_REPORTING = [
    /\b(the\s*(lecture|class|prof|teacher|seminar|lesson|topic|discussion)\s*(is|was|talked|discussed)\s*(about)?)\b/i,
    /\b(what\s*(does|is)\s*(cyberbullying|harassment|bullying|hate speech)\s*mean)\b/i,
    /\b(someone\s*(called\s*me|sent\s*me|messaged\s*me|threatened\s*me))\b/i,
    /\b(how\s*(do\s*i|to)\s*(report|block|handle)\s*(harassment|bullying|threats?))\b/i,
    /\b(may\s*(nagsabi\s*sa\s*akin|nag-message\s*sa\s*akin|nang-away\s*sa\s*akin))\b/i,
    /\b(paano\s*(mag-report|mag-block|isumbong))\b/i
  ];

  var TARGET_PRONOUNS = /\b(you|u|ur|your|you're|yourself|ka|mo|ikaw|kayo|ninyo|iyo|sayo|sa\s*iyo)\b/i;

  var SafeSpaceContextAnalyzer = {
    analyze: function(norm) {
      var clean = norm.clean;
      var deobf = norm.deobfuscated || clean;

      var isWhitelisted = BENIGN_WHITELIST.some(function(re) {
        return re.test(clean) || re.test(deobf);
      });

      var isAcademicStress = SAFE_ACADEMIC_STRESS.some(function(re) {
        return re.test(clean) || re.test(deobf);
      });

      var isEducationalOrReporting = EDUCATIONAL_OR_REPORTING.some(function(re) {
        return re.test(clean) || re.test(deobf);
      });

      var isTargeted = TARGET_PRONOUNS.test(clean) || TARGET_PRONOUNS.test(deobf);

      return {
        is_whitelisted: isWhitelisted,
        is_academic_stress: isAcademicStress,
        is_educational_or_reporting: isEducationalOrReporting,
        is_targeted: isTargeted
      };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. MULTILINGUAL SAFETY FALLBACK RULES
  // ─────────────────────────────────────────────────────────────
  var FALLBACK_RULES = [
    // Physical threats (Critical -> Block)
    {
      id: 'threat_kill_en',
      category: 'THREAT',
      severity: 'critical',
      action: 'block',
      pattern: /\b(i('ll| will| am going to| gonna)?\s*(kill|murder|slaughter|shoot|stab)\s*(you|u|everyone|him|her|them|all of you))\b/i,
      confidence: 0.98,
      reason: 'Direct threat of physical violence or murder.'
    },
    {
      id: 'threat_kill_fil',
      category: 'THREAT',
      severity: 'critical',
      action: 'block',
      pattern: /\b(papatayin\s*(kita|kayo|siya|sila)|ipapapatay\s*(kita|kayo)|sasaksakin\s*kita|babarilin\s*kita|bubugbugin\s*(kita|kayo)|patayin\s*(kita|mo|ka))\b/i,
      confidence: 0.98,
      reason: 'Explicit physical threat in Filipino.'
    },
    {
      id: 'threat_intimidate',
      category: 'THREAT',
      severity: 'high',
      action: 'review',
      pattern: /\b(you('ll| will)?\s*(pay for this|regret this|be sorry)|lagot\s*ka\s*(sa\s*akin|sakin))\b/i,
      confidence: 0.88,
      reason: 'Intimidating or threatening language.'
    },

    // Suicide & Self-Harm Encouragement (Critical -> Block)
    {
      id: 'suicide_encourage_en',
      category: 'ENCOURAGEMENT_OF_SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(kill\s*your\s*self|kill\s*urself|kys|go\s*(and\s*)?die|drink\s*bleach|hang\s*your\s*self)\b/i,
      confidence: 0.98,
      reason: 'Dangerous encouragement of suicide or self-harm.'
    },
    {
      id: 'suicide_encourage_fil',
      category: 'ENCOURAGEMENT_OF_SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(magpakamatay\s*ka|magbigti\s*ka|mamatay\s*ka\s*na|tumalon\s*ka\s*sa\s*tulay|laslasin\s*mo\s*pulso\s*mo)\b/i,
      confidence: 0.98,
      reason: 'Dangerous encouragement of suicide in Filipino.'
    },

    // Self-Harm Intent (Critical -> Block + Supportive Intervention)
    {
      id: 'self_harm_intent_en',
      category: 'SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(i\s*(want to|wanna|plan to|will|am going to)\s*(kill myself|end my life|commit suicide|hang myself|slit my wrists|disappear forever and die))\b/i,
      confidence: 0.96,
      reason: 'Direct indication of acute self-harm or suicide intent.'
    },
    {
      id: 'self_harm_intent_fil',
      category: 'SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(gusto\s*ko\s*(nang|na)?\s*(magpakamatay|mamatay|mawala\s*sa\s*mundo|patayin\s*ang\s*sarili|magbigti)|ayaw\s*ko\s*nang\s*mabuhay)\b/i,
      confidence: 0.95,
      reason: 'Expression of acute self-harm or suicidal distress in Filipino.'
    },

    // Sexual Harassment (Critical -> Block)
    {
      id: 'sexual_harass_en',
      category: 'SEXUAL_HARASSMENT',
      severity: 'critical',
      action: 'block',
      pattern: /\b(i('ll| will| am going to)?\s*rape\s*(you|u|her|him|someone)|send\s*(nudes|explicit|tits|dick\s*pic)|touch\s*you\s*(inappropriately|there))\b/i,
      confidence: 0.97,
      reason: 'Sexual violence threat or explicit sexual harassment.'
    },
    {
      id: 'sexual_harass_fil',
      category: 'SEXUAL_HARASSMENT',
      severity: 'critical',
      action: 'block',
      pattern: /\b(kakantutin\s*kita|kantutin\s*kita|chupain\s*mo|bastusin\s*kita|hahawakan\s*ko\s*(ang\s*)?(puke|tite|suso|pwet)\s*mo)\b/i,
      confidence: 0.97,
      reason: 'Explicit sexual harassment in Filipino.'
    },
    {
      id: 'sexual_content_fil',
      category: 'SEXUAL_CONTENT',
      severity: 'high',
      action: 'review',
      pattern: /\b(kantot|kantutan|chupa|tite|puke|kiki|tamod|jakol|magjakol|porn|pornograpiya)\b/i,
      confidence: 0.92,
      reason: 'Sexually explicit terminology in Filipino.'
    },

    // Targeted Harassment & Bullying
    {
      id: 'harass_targeted_fil',
      category: 'HARASSMENT',
      severity: 'high',
      action: 'review',
      pattern: /\b(bobo\s*(ka|mo|kayo)|tanga\s*(ka|mo|kayo)|inutil\s*(ka|mo|kayo)|ulol\s*(ka|mo|kayo)|gago\s*(ka|mo|kayo)|tarantado\s*(ka|mo|kayo)|salot\s*(ka|kayo)|walang\s*kwenta\s*(ka|mo)|panget\s*(mo|ka)|bwisit\s*ka)\b/i,
      confidence: 0.93,
      reason: 'Targeted personal insult or harassment in Filipino.'
    },
    {
      id: 'harass_targeted_en',
      category: 'HARASSMENT',
      severity: 'high',
      action: 'review',
      pattern: /\b(you\s*(are|'?re)\s*(stupid|an idiot|a retard|worthless|a failure|disgusting|pathetic|a loser|a piece of shit|trash))\b/i,
      confidence: 0.92,
      reason: 'Targeted personal harassment or demeaning attack.'
    },
    {
      id: 'harass_taglish_mix',
      category: 'HARASSMENT',
      severity: 'high',
      action: 'review',
      pattern: /\b(you\s*are\s*so\s*(bobo|tanga|inutil|gago)|sobrang\s*(stupid|loser|idiot|pathetic)\s*mo|napaka-(stupid|toxic|loser)\s*mo)\b/i,
      confidence: 0.94,
      reason: 'Code-switched Taglish targeted insult.'
    },
    {
      id: 'bullying_incitement',
      category: 'BULLYING',
      severity: 'high',
      action: 'review',
      pattern: /\b(everyone\s*(should|must|let'?s)\s*(hate|avoid|bully|ignore|mock|gang up on)|make\s*fun\s*of)\s*(him|her|them|that (student|person|classmate|kid))\b/i,
      confidence: 0.90,
      reason: 'Incitement to bully, humiliate, or exclude someone.'
    },

    // Discriminatory & Hate Speech
    {
      id: 'hate_speech_fil',
      category: 'HATE',
      severity: 'high',
      action: 'review',
      pattern: /\b(mga\s*(bading|tomboy|bakla|bisaya|igorot|moros?|muslim|kristiyano))\s*(salot|walang\s*silbi|dapat\s*mamatay|masasama|marurumi)\b/i,
      confidence: 0.92,
      reason: 'Identity-based hate speech or discriminatory attack in Filipino.'
    },
    {
      id: 'hate_speech_en',
      category: 'DISCRIMINATION',
      severity: 'high',
      action: 'review',
      pattern: /\b(all\s*(gays|lesbians|blacks|asians|muslims|christians|jews|women|men)\s*(are|should\s*be)\s*(evil|subhuman|eradicated|killed|inferior))\b/i,
      confidence: 0.95,
      reason: 'Discriminatory hate speech targeting protected groups.'
    },

    // Profanity
    {
      id: 'profanity_fil',
      category: 'PROFANITY',
      severity: 'medium',
      action: 'warn',
      pattern: /\b(putangina|tangina|kingina|punyeta|leche|letse|piste|peste|yawa|kupal|ogag|pota|puta)\b/i,
      confidence: 0.88,
      reason: 'Strong vulgar profanity in Filipino.'
    },
    {
      id: 'profanity_en',
      category: 'PROFANITY',
      severity: 'medium',
      action: 'warn',
      pattern: /\b(motherfucker|asshole|bitch|bastard|fuck|fucking|cunt|dickhead|cocksucker)\b/i,
      confidence: 0.88,
      reason: 'Explicit vulgar profanity.'
    },
    {
      id: 'profanity_mild',
      category: 'PROFANITY',
      severity: 'low',
      action: 'allow',
      pattern: /\b(bwisit|buwisit|damn|shit|crap|hell)\b/i,
      confidence: 0.70,
      reason: 'Mild exclamation or informal frustration.'
    },

    // Spam
    {
      id: 'spam_commercial',
      category: 'SPAM',
      severity: 'medium',
      action: 'warn',
      pattern: /\b(click\s*(here|now)|free\s*(money|crypto|cash|vbucks)|visit\s*my\s*(site|link)|buy\s*now\s*discount|whatsapp\s*me\s*at|telegram\s*channel)\b/i,
      confidence: 0.90,
      reason: 'Promotional or spam pattern.'
    },
    {
      id: 'spam_repetition',
      category: 'SPAM',
      severity: 'medium',
      action: 'warn',
      pattern: /(\b\w+\b)(\s+\1){4,}/i,
      confidence: 0.92,
      reason: 'Excessive repetitive text spam.'
    }
  ];

  // ─────────────────────────────────────────────────────────────
  // 5. UNIFIED SAFE SPACE AI CLIENT & FALLBACK SERVICE
  // ─────────────────────────────────────────────────────────────
  var AIService = {
    // Status states: 'checking' | 'online' | 'fallback'
    _state: 'checking',
    _statusCache: null,
    _lastCheckTime: 0,
    _checkPromise: null,
    _statusListeners: [],
    _moderationCache: new Map(),
    _cacheLimit: 60,

    getApiUrl: function() {
      if (window.SAFE_SPACE_CONFIG && window.SAFE_SPACE_CONFIG.AI_API_URL) {
        return window.SAFE_SPACE_CONFIG.AI_API_URL;
      }
      return DEFAULT_API_URL;
    },

    onStatusChange: function(listener) {
      if (typeof listener === 'function') {
        this._statusListeners.push(listener);
        try { listener(this.getStatus()); } catch (e) {}
      }
    },

    _notifyStatusChange: function() {
      var current = this.getStatus();
      this._statusListeners.forEach(function(fn) {
        try { fn(current); } catch (e) {}
      });
    },

    /**
     * Get accurate status matching requirements:
     * - 'Checking...'
     * - 'AI Moderation Online'
     * - 'Safety Fallback Active'
     */
    getStatus: function() {
      if (this._state === 'checking') {
        return {
          state: 'checking',
          online: false,
          fallback: false,
          modelTag: 'Checking...',
          statusText: 'Checking...',
          badgeClass: 'ai-pulse-dot checking'
        };
      }

      var online = (this._state === 'online');
      return {
        state: this._state,
        online: online,
        fallback: !online,
        modelTag: online ? 'BART + RoBERTa' : 'Multilingual Shield',
        statusText: online ? 'AI Moderation Online' : 'Safety Fallback Active',
        badgeClass: online ? 'ai-pulse-dot' : 'ai-pulse-dot fallback'
      };
    },

    /**
     * Checks if FastAPI server is reachable at GET /
     */
    checkStatus: async function(forceRefresh) {
      var now = Date.now();
      if (!forceRefresh && this._statusCache && (now - this._lastCheckTime < 15000)) {
        return this.getStatus();
      }

      if (this._checkPromise && !forceRefresh) {
        return this._checkPromise;
      }

      var self = this;
      this._checkPromise = (async function() {
        var url = self.getApiUrl() + '/';
        try {
          var controller = new AbortController();
          var timeoutId = setTimeout(function() { controller.abort(); }, 3000);

          var res = await fetch(url, { method: 'GET', signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            var data = await res.json();
            self._state = 'online';
            self._statusCache = {
              online: true,
              version: data.version || '1.0.0',
              service: data.service || 'Safe Space AI',
              models: 'BART + RoBERTa'
            };
          } else {
            self._state = 'fallback';
            self._statusCache = { online: false };
          }
        } catch (err) {
          self._state = 'fallback';
          self._statusCache = { online: false };
        }

        self._lastCheckTime = Date.now();
        self._checkPromise = null;
        self._notifyStatusChange();
        return self.getStatus();
      })();

      return this._checkPromise;
    },

    normalizeForModeration: function(text) {
      return SafeSpaceNormalizer.normalize(text);
    },

    /**
     * Standard centralized moderation method
     * @param {string} text - The user content to moderate
     * @param {object} [context] - Optional metadata (e.g. { type: 'post'|'comment'|'chat', userId: '...' })
     * @returns {Promise<object>} Standardized moderation decision
     */
    moderate: async function(text, context) {
      if (!text || !text.trim()) {
        return {
          success: true,
          online: this._state === 'online',
          fallback: false,
          allowed: true,
          status: 'APPROVED',
          action: 'allow',
          language: 'english',
          language_confidence: 1.0,
          category: 'SAFE',
          categories: ['SAFE'],
          severity: 'none',
          confidence: 1.0,
          reason: 'Empty content allowed',
          detection_source: 'fallback',
          has_obfuscation: false,
          obfuscation_types: [],
          sentiment: 'NEUTRAL',
          sentiment_score: 0.5,
          elapsedMs: 0
        };
      }

      var originalText = text.trim();
      var norm = SafeSpaceNormalizer.normalize(originalText);

      // LRU cache check
      var cacheKey = norm.clean + '|' + (norm.has_obfuscation ? 'obf' : 'clean');
      if (this._moderationCache.has(cacheKey)) {
        var cached = Object.assign({}, this._moderationCache.get(cacheKey));
        cached.fromCache = true;
        return cached;
      }

      var startTime = Date.now();

      // Step A: Fast Local Evaluation (Context + Rules)
      var fastResult = this._fallbackAnalysis(originalText, norm);

      // Safe stress or benign idiom -> immediate approve
      if (fastResult.is_academic_stress || fastResult.is_whitelisted || fastResult.is_educational_or_reporting) {
        this._setCache(cacheKey, fastResult);
        return fastResult;
      }

      // Critical physical threat or suicide encouragement -> immediate block
      if (fastResult.severity === 'critical') {
        this._setCache(cacheKey, fastResult);
        return fastResult;
      }

      // Step B: If AI is available, attempt inference via FastAPI endpoint
      var url = this.getApiUrl() + '/moderate';
      try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 6000);

        var response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ text: originalText }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('AI Server HTTP ' + response.status);
        }

        var result = await response.json();
        var elapsed = Date.now() - startTime;

        if (this._state !== 'online') {
          this._state = 'online';
          this._notifyStatusChange();
        }

        // Schema validation & synthesis
        var validStatus = ['APPROVED', 'REVIEW', 'BLOCKED'].indexOf(result.status) !== -1 ? result.status : 'APPROVED';
        var validAction = ['allow', 'warn', 'review', 'block'].indexOf(result.action) !== -1 ? result.action : (validStatus === 'APPROVED' ? 'allow' : 'review');
        var validCat = result.category || 'SAFE';
        var validSeverity = result.severity || (validStatus === 'BLOCKED' ? 'critical' : (validCat === 'SAFE' ? 'none' : 'medium'));
        var isAllowed = typeof result.allowed === 'boolean' ? result.allowed : (validStatus === 'APPROVED');
        var conf = typeof result.confidence === 'number' ? result.confidence : 0.85;

        // If local rules caught a severe offense that the neural zero-shot model missed, respect the layered shield
        var finalResult;
        if (!fastResult.allowed && isAllowed) {
          finalResult = fastResult;
        } else {
          finalResult = {
            success: true,
            online: true,
            fallback: false,
            allowed: isAllowed,
            status: validStatus,
            action: validAction,
            language: result.language || fastResult.language,
            language_confidence: result.language_confidence || fastResult.language_confidence,
            category: validCat,
            categories: result.categories || [validCat],
            severity: validSeverity,
            confidence: Math.round(conf * 100) / 100,
            reason: result.reason || 'Content verified by Safe Space AI moderation model.',
            detection_source: result.detection_source || 'ai',
            has_obfuscation: norm.has_obfuscation,
            obfuscation_types: norm.obfuscation_types,
            is_academic_stress: false,
            is_targeted: fastResult.is_targeted,
            sentiment: result.sentiment || 'NEUTRAL',
            sentiment_score: typeof result.sentiment_score === 'number' ? result.sentiment_score : 0.5,
            elapsedMs: elapsed
          };
        }

        this._setCache(cacheKey, finalResult);
        return finalResult;

      } catch (err) {
        // Activate fallback
        if (this._state === 'online') {
          this._state = 'fallback';
          this._notifyStatusChange();
        }
        var fallbackRes = this._fallbackAnalysis(originalText, norm);
        this._setCache(cacheKey, fallbackRes);
        return fallbackRes;
      }
    },

    _setCache: function(key, val) {
      if (this._moderationCache.size >= this._cacheLimit) {
        var firstKey = this._moderationCache.keys().next().value;
        this._moderationCache.delete(firstKey);
      }
      this._moderationCache.set(key, val);
    },

    /**
     * Multilingual Fallback Moderation & Context Engine
     * Operates 100% offline with zero dependencies.
     */
    _fallbackAnalysis: function(text, preNormalized) {
      var norm = preNormalized || SafeSpaceNormalizer.normalize(text);
      var langInfo = SafeSpaceLanguageDetector.detect(norm.has_obfuscation ? norm.deobfuscated : text);
      var ctx = SafeSpaceContextAnalyzer.analyze(norm);

      // 1. Whitelist Safeguard
      if (ctx.is_whitelisted) {
        return {
          success: true,
          online: false,
          fallback: true,
          is_whitelisted: true,
          allowed: true,
          status: 'APPROVED',
          action: 'allow',
          language: langInfo.language,
          language_confidence: langInfo.confidence,
          category: 'SAFE',
          categories: ['SAFE'],
          severity: 'none',
          confidence: 0.98,
          reason: 'Harmless benign phrase or idiom verified safe.',
          detection_source: 'fallback',
          has_obfuscation: norm.has_obfuscation,
          obfuscation_types: norm.obfuscation_types,
          is_academic_stress: false,
          is_targeted: ctx.is_targeted,
          sentiment: 'NEUTRAL',
          sentiment_score: 0.5,
          elapsedMs: 2
        };
      }

      // 2. Academic Stress Sharing Safeguard
      if (ctx.is_academic_stress) {
        return {
          success: true,
          online: false,
          fallback: true,
          is_academic_stress: true,
          allowed: true,
          status: 'APPROVED',
          action: 'allow',
          language: langInfo.language,
          language_confidence: langInfo.confidence,
          category: 'SAFE',
          categories: ['SAFE'],
          severity: 'none',
          confidence: 0.96,
          reason: 'Safe empathetic student stress or academic sharing.',
          detection_source: 'fallback',
          has_obfuscation: norm.has_obfuscation,
          obfuscation_types: norm.obfuscation_types,
          is_targeted: ctx.is_targeted,
          sentiment: 'NEGATIVE',
          sentiment_score: 0.78,
          elapsedMs: 2
        };
      }

      // 3. Educational / Reporting Context
      if (ctx.is_educational_or_reporting) {
        return {
          success: true,
          online: false,
          fallback: true,
          is_educational_or_reporting: true,
          allowed: true,
          status: 'APPROVED',
          action: 'allow',
          language: langInfo.language,
          language_confidence: langInfo.confidence,
          category: 'SAFE',
          categories: ['SAFE'],
          severity: 'none',
          confidence: 0.92,
          reason: 'Legitimate educational discussion or reporting context.',
          detection_source: 'fallback',
          has_obfuscation: norm.has_obfuscation,
          obfuscation_types: norm.obfuscation_types,
          is_academic_stress: false,
          is_targeted: ctx.is_targeted,
          sentiment: 'NEUTRAL',
          sentiment_score: 0.5,
          elapsedMs: 2
        };
      }

      // 4. Test Variants against Rules
      var testStrings = [norm.clean, norm.evasion, norm.deleet, norm.deobfuscated];
      var matchedRule = null;

      for (var r = 0; r < FALLBACK_RULES.length; r++) {
        var rule = FALLBACK_RULES[r];
        for (var s = 0; s < testStrings.length; s++) {
          if (rule.pattern.test(testStrings[s])) {
            matchedRule = rule;
            break;
          }
        }
        if (matchedRule) break;
      }

      if (matchedRule) {
        var cat = matchedRule.category;
        var severity = matchedRule.severity || 'medium';
        var action = matchedRule.action || 'review';
        var status = (severity === 'critical') ? 'BLOCKED' : (severity === 'low' ? 'APPROVED' : 'REVIEW');
        var isAllowed = (status === 'APPROVED');
        var conf = matchedRule.confidence;
        var reason = matchedRule.reason;

        // If mild profanity and not targeted, allow with low severity
        if (cat === 'PROFANITY' && severity === 'low' && !ctx.is_targeted) {
          isAllowed = true;
          action = 'allow';
          status = 'APPROVED';
        }

        if (norm.has_obfuscation) {
          conf = Math.min(0.99, conf + 0.05);
          reason += ' (Evasion attempts detected: ' + norm.obfuscation_types.join(', ') + ')';
        }

        return {
          success: true,
          online: false,
          fallback: true,
          allowed: isAllowed,
          status: status,
          action: action,
          language: langInfo.language,
          language_confidence: langInfo.confidence,
          category: cat,
          categories: [cat],
          severity: severity,
          confidence: conf,
          reason: reason + ' (Multilingual Safety Fallback)',
          detection_source: 'fallback',
          has_obfuscation: norm.has_obfuscation,
          obfuscation_types: norm.obfuscation_types,
          is_academic_stress: false,
          is_targeted: ctx.is_targeted,
          sentiment: 'NEGATIVE',
          sentiment_score: 0.85,
          elapsedMs: 2
        };
      }

      // 5. Safe Default
      return {
        success: true,
        online: false,
        fallback: true,
        allowed: true,
        status: 'APPROVED',
        action: 'allow',
        language: langInfo.language,
        language_confidence: langInfo.confidence,
        category: 'SAFE',
        categories: ['SAFE'],
        severity: 'none',
        confidence: 0.90,
        reason: 'Content verified safe by Safe Space multilingual safety fallback.',
        detection_source: 'fallback',
        has_obfuscation: norm.has_obfuscation,
        obfuscation_types: norm.obfuscation_types,
        is_academic_stress: false,
        is_targeted: ctx.is_targeted,
        sentiment: 'NEUTRAL',
        sentiment_score: 0.50,
        elapsedMs: 2
      };
    },

    renderSentimentBadge: function(sentiment, score) {
      if (!sentiment) return '';
      var s = String(sentiment).toUpperCase();
      var scorePct = typeof score === 'number' ? Math.round(score * 100) : null;
      var scoreText = scorePct ? ' (' + scorePct + '%)' : '';

      switch (s) {
        case 'POSITIVE':
          return '<span class="ai-sentiment-badge positive" title="AI Sentiment: Positive' + scoreText + '">' +
                 '<i class="fa-solid fa-sparkles"></i> Positive</span>';
        case 'NEGATIVE':
          return '<span class="ai-sentiment-badge supportive" title="AI Sentiment: Seeking Support' + scoreText + '">' +
                 '<i class="fa-solid fa-hand-holding-heart"></i> Seeking Support</span>';
        case 'NEUTRAL':
        default:
          return '<span class="ai-sentiment-badge neutral" title="AI Sentiment: Neutral' + scoreText + '">' +
                 '<i class="fa-solid fa-circle-dot"></i> Neutral</span>';
      }
    }
  };

  // Immediate non-blocking status check
  try {
    AIService.checkStatus(false).catch(function() {});
  } catch (e) {}

  window.AIService = AIService;
})(window);
