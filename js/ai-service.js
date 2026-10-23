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
  // 0. PARTIAL PROFANITY CENSORSHIP ENGINE
  // ─────────────────────────────────────────────────────────────
  var PROFANITY_PATTERNS = [
    // Filipino compound / spaced profanities
    '\\bputang[\\s\\-_]*ina\\b',
    '\\bpukinang[\\s\\-_]*ina\\b',
    '\\bpuki[\\s\\-_]*nang[\\s\\-_]*ina\\b',
    '\\btang[\\s\\-_]*ina\\b',
    '\\btang[\\s\\-_]*ena\\b',
    '\\banak[\\s\\-_]*ng[\\s\\-_]*puta\\b',
    '\\bhayop[\\s\\-_]*ka\\b',
    '\\bhayup[\\s\\-_]*ka\\b',

    // Filipino single profanities
    '\\bputangina\\b',
    '\\bpukinangina\\b',
    '\\btangina\\b',
    '\\btangena\\b',
    '\\btaena\\b',
    '\\btayna\\b',
    '\\bkingina\\b',
    '\\bamputa\\b',
    '\\bampota\\b',
    '\\bpunyeta\\b',
    '\\bleche\\b',
    '\\bletse\\b',
    '\\bpiste\\b',
    '\\bpeste\\b',
    '\\byawa\\b',
    '\\bkupal\\b',
    '\\bogag\\b',
    '\\bpota\\b',
    '\\bputa\\b',
    '\\blintik\\b',
    '\\bhudas\\b',
    '\\bgago(?:ng)?\\b',
    '\\bgaga\\b',
    '\\bkagaguhan\\b',
    '\\btarantado\\b',
    '\\btarantada\\b',
    '\\bkatarantadohan\\b',
    '\\bbobo(?:ng)?\\b',
    '\\bboba\\b(?!\\s+(?:tea|milk|drink))',
    '\\bkabobohan\\b',
    '\\bbopols\\b',
    '\\bboplaks\\b',
    '\\bulol\\b',
    '\\binutil\\b',
    '\\btanga(?:ng)?\\b',
    '\\bkatangahan\\b',
    '\\bbwisit\\b',
    '\\bbuwisit\\b',
    '\\bhinayupak\\b',
    '\\bkantot(?:an|in)?\\b',
    '\\bchupa(?:in)?\\b',
    '\\btsupa(?:in)?\\b',
    '\\btite\\b',
    '\\bpuke\\b',
    '\\bpuki\\b',
    '\\bkiki\\b',
    '\\btamod\\b',
    '\\bjakol\\b',
    '\\bburat\\b',
    '\\bbayag\\b',
    '\\bpepe\\b',
    '\\biyot(?:an)?\\b',
    '\\bpokpok\\b',

    // English profanities
    '\\bmotherfuck(?:er|ers|ing)?\\b',
    '\\bfuck(?:ing|ers?|ed|s)?\\b',
    '\\bbullshit(?:s)?\\b',
    '\\bdipshit(?:s)?\\b',
    '\\bhorseshit\\b',
    '\\bshit(?:s|ted|ting|ty)?\\b',
    '\\bbitch(?:es|ing|y)?\\b',
    '\\basshole(?:s)?\\b',
    '\\bdumbass(?:es)?\\b',
    '\\bjackass(?:es)?\\b',
    '\\bfatass(?:es)?\\b',
    '\\bbastard(?:s)?\\b',
    '\\bcunt(?:s)?\\b',
    '\\bdickhead(?:s)?\\b',
    '\\bdick(?:s)?\\b',
    '\\bcocksucker(?:s)?\\b',
    '\\bcock(?:s)?\\b',
    '\\bpuss(?:y|ies)\\b',
    '\\btwat(?:s)?\\b',
    '\\bwanker(?:s)?\\b',
    '\\bslut(?:s|ty)?\\b',
    '\\bwhore(?:s)?\\b',
    '(?<![a-zA-Z0-9])ass(?:es)?(?![a-zA-Z0-9])'
  ];

  var COMPILED_PROFANITY_REGEX = new RegExp(PROFANITY_PATTERNS.join('|'), 'gi');

  var SafeSpaceCensor = {
    censorWord: function(w) {
      if (!w || typeof w !== 'string' || w.length <= 2) return w;
      var asterisks = '*'.repeat ? '*'.repeat(w.length - 2) : new Array(w.length - 1).join('*');
      return w.charAt(0) + asterisks + w.charAt(w.length - 1);
    },

    censor: function(text) {
      if (!text || typeof text !== 'string') return text;
      var self = this;
      return text.replace(COMPILED_PROFANITY_REGEX, function(fullMatch) {
        return fullMatch.replace(/[a-zA-Z]+/g, function(token) {
          return self.censorWord(token);
        });
      });
    },

    hasProfanity: function(text) {
      if (!text || typeof text !== 'string') return false;
      COMPILED_PROFANITY_REGEX.lastIndex = 0;
      return COMPILED_PROFANITY_REGEX.test(text);
    }
  };

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
    { pattern: /\b(ptngina|tngina|tang1na|tangena|p-tangina|p\*tangina|taena|tena|kingina|amputa|ampota|pukinangina)\b/gi, replacement: "putangina" },
    { pattern: /\b(pkyu|fck|fckin|fcking|f\*ck|fu\*k|fuk|fcku|pakyu|pakyow|fakyu)\b/gi, replacement: "fuck" },
    { pattern: /\b(b0b0|b-o-b-o|b\*b\*|bwbw)\b/gi, replacement: "bobo" },
    { pattern: /\b(t4ng4|t-a-n-g-a|tng4|tnga)\b/gi, replacement: "tanga" },
    { pattern: /\b(g4g0|g-a-g-o|g@go|ggo)\b/gi, replacement: "gago" },
    { pattern: /\b(k1ll|k\*ll|k-i-l-l)\b/gi, replacement: "kill" },
    { pattern: /\b(sh\*t|sh!t|s-h-i-t)\b/gi, replacement: "shit" },
    { pattern: /\b(b\*tch|b!tch|b1tch|b-i-t-c-h)\b/gi, replacement: "bitch" },
    { pattern: /\b(4ssh0le|a\$\$hole|a\*\*hole)\b/gi, replacement: "asshole" },
    { pattern: /\b(k\*ntot|k4nt0t)\b/gi, replacement: "kantot" },
    { pattern: /\b(t\*te|t1te)\b/gi, replacement: "tite" },
    { pattern: /\b(p\*ke|puk1)\b/gi, replacement: "puke" },
    { pattern: /\b(st\*pid|stpd|idi0t)\b/gi, replacement: "stupid" }
  ];

  var KNOWN_SUBWORDS = [
    'bobo', 'tanga', 'gago', 'kill', 'fuck', 'shit', 'ka', 'mo', 'ako',
    'die', 'ulol', 'puke', 'tite', 'inutil', 'salot', 'puta', 'hate',
    'yourself', 'urself', 'bitch', 'asshole', 'bastard', 'stupid', 'idiot',
    'moron', 'pakyu', 'tangina', 'amputa'
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
    /\b(my\s*(phone|laptop|battery|pc|car|earphones|device)\s*died)\b/i,
    /\b(died\s*laughing|dying\s*laughing|dead\s*tired)\b/i,
    /\b(roll\s*(the\s*)?die)\b/i,
    /\b(kill\s*(time|the\s*game|it|the\s*vibe))\b/i,
    /\b(puto\s*(bumbong|cheese|pao|kutsinta))\b/i
  ];

  var SAFE_ACADEMIC_STRESS = [
    /\b(stressed|exhausted|tired|burnout|overwhelmed|worried|anxious)\s*(because of|due to|about|with)?\s*(my|the|our|this|all\s*the)?\s*(exam|assignment|school|study|homework|class|project|thesis|finals|grades?|defense|prof|teacher|subject)\b/i,
    /\b(i('m| am| feel| felt)?\s*(sad|upset|down|frustrated|discouraged|crying))\s*(about|because of|due to|today|lately|right now)?\s*(my|the|our|this)?\s*(exam|grade|score|class|school|failure|project|homework|thesis|defense|interview)\b/i,
    /\b(i\s*(failed|did\s*not\s*pass|did\s*bad\s*on|got\s*a\s*low\s*grade\s*on|struggling\s*with))\b/i,
    /\b(can'?t\s*believe\s*i\s*failed|failed\s*again|failing|failed\s*my\s*(exam|test|quiz|subject))\b/i,
    /\b(i\s*(feel|am|feel\s*so)\s*(stupid|dumb|useless|pathetic|worthless|like\s*a\s*failure)\s*(rn|right\s*now|lately)?)\b/i,
    /\b(ang\s*tanga\s*ko|bobo\s*ko|sobrang\s*bobo\s*ko|ang\s*bobo\s*ko|inutil\s*ko)\b/i,
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
      pattern: /\b(i('ll| will| am going to| gonna)?\s*(kill|murder|slaughter|shoot|stab|choke|strangle|slit your)\s*(you|u|everyone|him|her|them|all of you))\b/i,
      confidence: 0.98,
      reason: 'Direct threat of killing or severe physical violence.'
    },
    {
      id: 'threat_kill_fil',
      category: 'THREAT',
      severity: 'critical',
      action: 'block',
      pattern: /\b(papatayin\s*(kita|ka|kayo|siya|sila|nyo)|patayin\s*(kita|ka|kayo|siya|sila|mo)|ipapapatay\s*(kita|kayo)|sasaksakin\s*(kita|ka|kayo)|saksakin\s*(kita|ka|kayo)|babarilin\s*(kita|ka|kayo)|bubugbugin\s*(kita|ka|kayo)|bugbugin\s*(kita|ka|kayo)|sasaktan\s*(kita|ka|kayo|ka)|tatagain\s*(kita|ka|kayo)|lalaslasin\s*(kita|ka|kayo)|durog\s*ka\s*(sa\s*akin|sakin)|lagot\s*ka\s*(sa\s*akin|sakin)|humanda\s*ka)\b/i,
      confidence: 0.98,
      reason: 'Explicit physical threat in Filipino.'
    },
    {
      id: 'threat_physical_en',
      category: 'THREAT',
      severity: 'high',
      action: 'review',
      pattern: /\b(i('ll| will| gonna)?\s*(beat|hurt|destroy|smash|break)\s*(your\s*(face|head|skull|neck|bones)|you\s*(up|to death))|you('ll| will)?\s*(die|pay for this|regret this|be sorry|not survive))\b/i,
      confidence: 0.90,
      reason: 'Threatening or intimidating statement.'
    },
    {
      id: 'taglish_threat_mix',
      category: 'THREAT',
      severity: 'critical',
      action: 'block',
      pattern: /\b(i('ll| will)?\s*(make sure\s*)?(sasaktan\s*kita|patayin\s*you|bugbog\s*you)|papatayin\s*kita\s*you\s*will\s*see)\b/i,
      confidence: 0.95,
      reason: 'Code-switched threat of violence in Taglish.'
    },

    // Suicide & Self-Harm Encouragement (Critical -> Block)
    {
      id: 'suicide_encourage_en',
      category: 'ENCOURAGEMENT_OF_SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(kill\s*(your\s*self|urself|ur\s*self)|kys|go\s*(and\s*)?die|go\s*die|drink\s*bleach|hang\s*(your\s*self|urself)|slit\s*(your\s*wrists?|ur\s*wrists?)|jump\s*off\s*(a\s*bridge|a\s*building)|you\s*(should|deserve to)\s*(die|kill yourself)|hope\s*you\s*die)\b/i,
      confidence: 0.98,
      reason: 'Dangerous encouragement of suicide or self-harm.'
    },
    {
      id: 'suicide_encourage_fil',
      category: 'ENCOURAGEMENT_OF_SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(magpakamatay\s*(ka|kayo|na\s*lang|ka\s*na)?|magbigti\s*(ka|kayo|ka\s*na)?|mamatay\s*ka\s*(na|sana|nalang|na\s*lang)|tumalon\s*ka\s*(sa\s*tulay|sa\s*building)|laslasin\s*mo\s*(ang\s*)?pulso\s*mo|maglaslas\s*ka|sana\s*mamatay\s*ka\s*na|dapat\s*mamatay\s*ka\s*na)\b/i,
      confidence: 0.98,
      reason: 'Dangerous encouragement of suicide in Filipino.'
    },
    {
      id: 'taglish_self_harm_mix',
      category: 'ENCOURAGEMENT_OF_SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(go\s*magpakamatay\s*na|just\s*kill\s*yourself\s*ka\s*na|magbigti\s*you\s*loser)\b/i,
      confidence: 0.96,
      reason: 'Code-switched encouragement of self-harm in Taglish.'
    },

    // Self-Harm Intent (Critical -> Block + Supportive Intervention)
    {
      id: 'self_harm_intent_en',
      category: 'SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(i\s*(want to|wanna|plan to|will|am going to|gonna)\s*(kill myself|end my life|commit suicide|hang myself|slit my wrists|disappear forever and die))\b/i,
      confidence: 0.96,
      reason: 'Direct indication of acute self-harm or suicide intent.'
    },
    {
      id: 'self_harm_intent_fil',
      category: 'SELF_HARM',
      severity: 'critical',
      action: 'block',
      pattern: /\b(gusto\s*ko\s*(nang|na)?\s*(magpakamatay|mamatay|mawala\s*sa\s*mundo|patayin\s*ang\s*sarili|magbigti|maglaslas)|ayaw\s*ko\s*nang\s*mabuhay|tapusin\s*ko\s*na\s*ang\s*buhay\s*ko)\b/i,
      confidence: 0.95,
      reason: 'Expression of acute self-harm or suicidal distress in Filipino.'
    },

    // Nudity & Sexually Explicit Content (Critical -> Block)
    {
      id: 'nudity_solicitation_en',
      category: 'NUDITY',
      severity: 'critical',
      action: 'block',
      pattern: /\b(i\s*(wanna|want\s*to)\s*(have\s*)?sex(\s*with\s*(you|u))?|sex\s*with\s*(you|u)|wanna\s*sex|let'?s\s*(have\s*)?sex)\b/i,
      confidence: 0.98,
      reason: 'Explicit sexual solicitation or proposition identified as nudity.'
    },
    {
      id: 'nudity_single_words_en',
      category: 'NUDITY',
      severity: 'critical',
      action: 'block',
      pattern: /\b(nudity|nude|nudes|naked|sex|porn|porno|pornography|pornographic|nsfw|striptease|topless|bottomless|orgasm|erotic|erotica|masturbat(?:e|ion|ing)|dick|penis|vagina|pussy|clitoris|boobs|boob|boobies|tits|tit|dildo)\b/i,
      confidence: 0.96,
      reason: 'Nudity or sexually explicit content detected.'
    },
    {
      id: 'nudity_single_words_fil',
      category: 'NUDITY',
      severity: 'critical',
      action: 'block',
      pattern: /\b(hubad|nakahubad|bold|kantot|kantutan|jakol|magjakol|tite|puke|puki|kiki|burat|bayag|pepe|iyot|iyutan|pokpok)\b/i,
      confidence: 0.96,
      reason: 'Nudity or sexually explicit terminology in Filipino.'
    },

    // Sexual Harassment (Critical -> Block)
    {
      id: 'sexual_harass_en',
      category: 'SEXUAL_HARASSMENT',
      severity: 'critical',
      action: 'block',
      pattern: /\b(i('ll| will| am going to)?\s*rape\s*(you|u|her|him|someone)|send\s*(nudes|explicit|tits|dick\s*pics?|pussy\s*pics?)|touch\s*you\s*(inappropriately|there))\b/i,
      confidence: 0.97,
      reason: 'Sexual violence threat or explicit sexual harassment.'
    },
    {
      id: 'sexual_harass_fil',
      category: 'SEXUAL_HARASSMENT',
      severity: 'critical',
      action: 'block',
      pattern: /\b(kakantutin\s*(kita|kayo|ka)|kantutin\s*(kita|kayo|ka)|chupain\s*(mo|ako)|tsupain\s*(mo|ako)|bastusin\s*(kita|kayo)|hahawakan\s*ko\s*(ang\s*)?(puke|puki|tite|suso|pwet)\s*mo|gagahasain\s*(kita|ka)|hahalayin\s*(kita|ka))\b/i,
      confidence: 0.97,
      reason: 'Explicit sexual harassment in Filipino.'
    },
    {
      id: 'sexual_content_fil',
      category: 'SEXUAL_CONTENT',
      severity: 'high',
      action: 'review',
      pattern: /\b(kantot|kantutan|chupa|tsupa|tite|puke|puki|kiki|tamod|jakol|magjakol|burat|bayag|pepe|porn|pornograpiya|iyot|iyutan|pokpok)\b/i,
      confidence: 0.92,
      reason: 'Sexually explicit terminology in Filipino.'
    },

    // Slurs & Severe Hate Speech (Critical -> Block)
    {
      id: 'slurs_en',
      category: 'HATE',
      severity: 'critical',
      action: 'block',
      pattern: /\b(nigger|nigga|faggot|fag|tranny|chink|spic|kike)\b/i,
      confidence: 0.99,
      reason: 'Explicit hate speech slur.'
    },

    // Targeted Harassment & Bullying (High -> Review)
    {
      id: 'harass_targeted_fil',
      category: 'HARASSMENT',
      severity: 'high',
      action: 'review',
      pattern: /\b(bobo|boba|bobong|boplaks|bopols|kabobohan|tanga|tangang|katangahan|gago|gaga|gagong|kagaguhan|ulol|inutil|tarantado|tarantada|salot|siraulo|sira-ulo|sira\s*ulo|walanghiya|walang\s*hiya|walang\s*kwenta|walang\s*silbi|panget\s*(mo|ka)|pangit\s*(mo|ka)|abnoy|mongoloid|timang|ungas|unggoy\s*ka|baboy\s*ka|pakyu|pakyaw|hinayupak|hayop\s*ka|hayup\s*ka)\b/i,
      confidence: 0.93,
      reason: 'Harmful insult or targeted personal harassment in Filipino.'
    },
    {
      id: 'harass_targeted_en',
      category: 'HARASSMENT',
      severity: 'high',
      action: 'review',
      pattern: /\b(stupid|idiot|idiotic|moron|moronic|retard|retarded|imbecile|dumbass|jackass|dipshit|fatass|scumbag|loser|worthless|pathetic|piece\s*of\s*shit|waste\s*of\s*space|fuck\s*(you|u|off)|fck\s*u|stfu|gtfo)\b/i,
      confidence: 0.92,
      reason: 'Harmful personal insult or demeaning attack in English.'
    },
    {
      id: 'harass_taglish_mix',
      category: 'HARASSMENT',
      severity: 'high',
      action: 'review',
      pattern: /\b(you\s*are\s*so\s*(bobo|tanga|inutil|gago|panget|kupal)|sobrang\s*(stupid|loser|idiot|pathetic|ugly)\s*mo|napaka-(stupid|toxic|loser|idiot)\s*mo|ang\s*(stupid|loser|idiot|toxic)\s*mo)\b/i,
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
      pattern: /\b(mga\s*(bading|tomboy|bakla|bisaya|igorot|moros?|muslim|kristiyano))\s*(salot|walang\s*silbi|dapat\s*mamatay|masasama|marurumi|patayin)\b/i,
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
      pattern: /\b(putangina|putang\s*ina|tangina|tang\s*ina|taena|tayna|tangena|kingina|amputa|ampota|pukinangina|punyeta|leche|letse|piste|peste|yawa|kupal|ogag|pota|puta|lintik|hudas)\b/i,
      confidence: 0.88,
      reason: 'Strong vulgar profanity in Filipino.'
    },
    {
      id: 'profanity_en',
      category: 'PROFANITY',
      severity: 'medium',
      action: 'warn',
      pattern: /\b(motherfucker|motherfucking|asshole|bitch|bastard|fuck|fucking|fucker|fucked|cunt|dickhead|cocksucker|bullshit|twat|wanker|slut|whore|pussy|dick|cock)\b/i,
      confidence: 0.88,
      reason: 'Explicit vulgar profanity.'
    },
    {
      id: 'profanity_mild',
      category: 'PROFANITY',
      severity: 'low',
      action: 'allow',
      pattern: /\b(crap|pissed|susmaryosep|anak\s*ng\s*tinapa)\b/i,
      confidence: 0.70,
      reason: 'Mild colloquial expression or informal frustration.'
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

  // =============================================================
  // 4. CONTEXT-AWARE MULTILINGUAL SENTIMENT ENGINE
  // Three-Tier Classification: Positive, Neutral, Negative
  // Supports English, Filipino (Tagalog), Taglish, Negation, Emojis
  // =============================================================
  var SafeSpaceSentiment = {
    LABEL_POSITIVE: 'Positive',
    LABEL_NEUTRAL: 'Neutral',
    LABEL_NEGATIVE: 'Negative',

    POSITIVE_EMOJIS: new Set([
      '😊','😁','😃','😄','😀','🙂','🥰','😍','🤩','😘','🤗','🎉','✨','🌟','💖','❤️','💕','👏','🙌','💪','👍','💯','☀️','🌈','🏆'
    ]),

    NEGATIVE_EMOJIS: new Set([
      '😢','😭','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😤','😠','😡','🤬','💔','😿','👎','🌧️','🥀','📉'
    ]),

    NEGATIONS: new Set([
      'not', "don't", 'dont', "didn't", 'didnt', "won't", 'wont', "can't", 'cant',
      "isn't", 'isnt', "aren't", 'arent', "wasn't", 'wasnt', "weren't", 'werent',
      'never', 'no', 'hardly', 'barely', 'scarcely', 'neither', 'nor', 'none',
      'hindi', 'di', 'dinaman', 'dina', 'walang', 'wala', 'wag', "'wag", 'huwag', 'ayaw', 'ayoko'
    ]),

    POSITIVE_WORDS: {
      // English
      'happy': 1.6, 'great': 1.5, 'good': 1.2, 'wonderful': 1.8, 'excellent': 1.8,
      'amazing': 1.8, 'love': 1.8, 'loved': 1.7, 'proud': 1.6, 'blessed': 1.6,
      'thank': 1.5, 'thanks': 1.4, 'grateful': 1.8, 'gratitude': 1.7,
      'appreciate': 1.6, 'appreciated': 1.6, 'accomplished': 1.5, 'accomplishment': 1.5,
      'progress': 1.3, 'succeed': 1.6, 'success': 1.6, 'successful': 1.6,
      'kind': 1.4, 'kindness': 1.5, 'hope': 1.5, 'hopeful': 1.5, 'support': 1.3,
      'supporting': 1.4, 'satisfaction': 1.5, 'satisfied': 1.5, 'encouraged': 1.5,
      'encouragement': 1.5, 'believe': 1.3, 'best': 1.5, 'awesome': 1.7,
      'excited': 1.6, 'cheer': 1.4, 'friendly': 1.3, 'peace': 1.4, 'peaceful': 1.4,
      'joy': 1.7, 'joyful': 1.7, 'relief': 1.4, 'relieved': 1.4, 'inspired': 1.6,

      // Filipino / Tagalog
      'masaya': 1.7, 'masayang': 1.7, 'saya': 1.5,
      'salamat': 1.6, 'pasasalamat': 1.6,
      'galing': 1.5, 'magaling': 1.6, 'napakahusay': 1.8, 'mahusay': 1.7,
      'tagumpay': 1.7, 'nagtagumpay': 1.7, 'panalo': 1.7, 'pag-asa': 1.6,
      'suporta': 1.4, 'tulong': 1.3, 'natutuwa': 1.6, 'tuwa': 1.5,
      'hanga': 1.4, 'pagmamahal': 1.7, 'mahal': 1.3, 'tiwala': 1.5,
      'tiyaga': 1.3, 'sipag': 1.3, 'sulit': 1.4, 'ayos': 1.1, 'mabuti': 1.3,
      'ligaya': 1.7, 'maligaya': 1.7, 'payapa': 1.4, 'kaibigan': 1.2
    },

    NEGATIVE_WORDS: {
      // English
      'sad': 1.6, 'depressed': 2.0, 'depression': 2.0, 'disappointed': 1.8,
      'disappointment': 1.8, 'frustrated': 1.8, 'frustration': 1.8,
      'lonely': 1.8, 'loneliness': 1.8, 'overwhelmed': 1.8, 'difficult': 1.5,
      'angry': 1.8, 'anger': 1.8, 'mad': 1.5, 'upset': 1.6, 'hate': 1.9,
      'hated': 1.8, 'anxious': 1.7, 'anxiety': 1.8, 'worried': 1.6, 'worry': 1.6,
      'stress': 1.5, 'stressed': 1.6, 'exhausted': 1.6, 'tired': 1.3,
      'hopeless': 2.0, 'fail': 1.7, 'failed': 1.8, 'failure': 1.8,
      'pain': 1.6, 'painful': 1.6, 'hurt': 1.7, 'hurting': 1.7, 'terrible': 1.7,
      'awful': 1.7, 'horrible': 1.8, 'ugly': 1.4, 'bad': 1.3, 'worst': 1.8,
      'cry': 1.5, 'crying': 1.6, 'suffer': 1.8, 'suffering': 1.8, 'toxic': 1.8,
      'mean': 1.4, 'ruined': 1.7, 'struggle': 1.5, 'struggling': 1.6,

      // Filipino / Tagalog
      'malungkot': 1.7, 'lungkot': 1.6, 'nalulungkot': 1.7, 'bagsak': 1.8,
      'nakakaiyak': 1.8, 'iyak': 1.5, 'umiiyak': 1.6, 'hirap': 1.5,
      'mahirap': 1.5, 'nahihirapan': 1.7, 'pagod': 1.4,
      'galit': 1.8, 'nagagalit': 1.8, 'inis': 1.5, 'nakakainis': 1.6,
      'bwisit': 1.7, 'asar': 1.4, 'takot': 1.6, 'natatakot': 1.6,
      'kaba': 1.4, 'pangamba': 1.5, 'bigo': 1.7, 'nabigo': 1.7,
      'kabiguan': 1.8, 'sawimpalad': 1.8, 'sawi': 1.6, 'sakit': 1.5,
      'masakit': 1.6, 'nasasaktan': 1.7, 'nag-iisa': 1.6,
      'dusa': 1.8, 'nagdurusa': 1.8, 'sukot': 1.4
    },

    FACTUAL_QUESTION_PATTERNS: [
      /^(what|when|where|who|which|whose|how)\s+(is|are|was|were|do|does|did|can|could|will|would|starts?|completed)/i,
      /^(has|have|had)\s+anyone\b/i,
      /^(is|are)\s+the\s+[a-z0-9_\-\s]+\s+(open|closed|available|scheduled)/i,
      /^(meron|mayroon|may)\s+ba\b/i,
      /^(saan|kailan|paano|sino|alin)\s+(ang|yung|ba|po)/i,
      /^(nasaan|anong\s+oras|magkano)\b/i
    ],

    AFFECTIVE_QUESTION_PATTERNS: [
      /why\s+(is|are|am|do|does)\s+(everyone|people|life|nobody|nothing)/i,
      /why\s+(does\s+it\s+hurt|am\s+i\s+(so\s+)?(sad|lonely|depressed|dumb|stupid|worthless))/i,
      /bakit\s+(ba\s+)?(laging|lahat|ang\s+hirap|ako)/i
    ],

    analyze: function(text) {
      if (!text || typeof text !== 'string' || !text.trim()) {
        return {
          sentiment: this.LABEL_NEUTRAL,
          confidence: 0.80,
          sentiment_score: 0.50,
          details: { pos: 0, neg: 0 }
        };
      }

      var raw = text.trim();
      var lower = raw.toLowerCase();

      // 1. Emoji Valence
      var emojiPos = 0;
      var emojiNeg = 0;
      for (var char of raw) {
        if (this.POSITIVE_EMOJIS.has(char)) emojiPos += 1.3;
        if (this.NEGATIVE_EMOJIS.has(char)) emojiNeg += 1.3;
      }

      // 2. Tokenize words
      var tokens = lower.match(/[a-z0-9_\-'\u00C0-\u024F]+/g) || [];
      var posScore = 0.0;
      var negScore = 0.0;

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        // Check negation in previous 1-3 tokens
        var isNegated = false;
        var windowStart = Math.max(0, i - 3);
        for (var j = windowStart; j < i; j++) {
          if (this.NEGATIONS.has(tokens[j])) {
            isNegated = true;
            break;
          }
        }

        if (this.POSITIVE_WORDS[token] !== undefined) {
          var val = this.POSITIVE_WORDS[token];
          if (isNegated) {
            negScore += val * 1.1; // "not happy" -> Negative
          } else {
            posScore += val;
          }
        } else if (this.NEGATIVE_WORDS[token] !== undefined) {
          var val = this.NEGATIVE_WORDS[token];
          if (isNegated) {
            posScore += val * 0.4; // "not sad" -> dampened
          } else {
            negScore += val;
          }
        }
      }

      // Include emoji scores
      posScore += emojiPos;
      negScore += emojiNeg;

      // 3. Question Awareness
      var isQuestion = raw.indexOf('?') !== -1 || /^(what|when|where|how|has|is|are|kailan|saan|meron)\b/i.test(raw);
      var isFactualQuestion = false;
      var isAffectiveQuestion = false;

      if (isQuestion) {
        for (var p = 0; p < this.FACTUAL_QUESTION_PATTERNS.length; p++) {
          if (this.FACTUAL_QUESTION_PATTERNS[p].test(lower)) {
            isFactualQuestion = true;
            break;
          }
        }
        for (var a = 0; a < this.AFFECTIVE_QUESTION_PATTERNS.length; a++) {
          if (this.AFFECTIVE_QUESTION_PATTERNS[a].test(lower)) {
            isAffectiveQuestion = true;
            break;
          }
        }
      }

      if (isFactualQuestion && !isAffectiveQuestion && posScore < 1.0 && negScore < 1.0) {
        return {
          sentiment: this.LABEL_NEUTRAL,
          confidence: 0.92,
          sentiment_score: 0.50,
          details: { pos: posScore, neg: negScore, is_question: true }
        };
      }

      // 4. Decision Thresholds & Dominant Balancing
      var diff = posScore - negScore;
      var total = posScore + negScore;

      if (total === 0) {
        return {
          sentiment: this.LABEL_NEUTRAL,
          confidence: 0.85,
          sentiment_score: 0.50,
          details: { pos: 0, neg: 0 }
        };
      }

      if (diff >= 0.7) {
        var conf = Math.min(0.98, 0.75 + (diff / 10.0));
        var score = Math.min(0.98, 0.65 + (diff / 10.0));
        return {
          sentiment: this.LABEL_POSITIVE,
          confidence: Math.round(conf * 100) / 100,
          sentiment_score: Math.round(score * 100) / 100,
          details: { pos: posScore, neg: negScore }
        };
      } else if (diff <= -0.7) {
        var conf = Math.min(0.98, 0.75 + (Math.abs(diff) / 10.0));
        var score = Math.max(0.02, 0.35 - (Math.abs(diff) / 10.0));
        return {
          sentiment: this.LABEL_NEGATIVE,
          confidence: Math.round(conf * 100) / 100,
          sentiment_score: Math.round(score * 100) / 100,
          details: { pos: posScore, neg: negScore }
        };
      } else {
        return {
          sentiment: this.LABEL_NEUTRAL,
          confidence: 0.82,
          sentiment_score: 0.50,
          details: { pos: posScore, neg: negScore }
        };
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 5. AI SUPPORTIVE COMMENT RECOMMENDER & RISK EVALUATOR
  // ─────────────────────────────────────────────────────────────
  function computeRiskLevel(cat, sev, status) {
    cat = (cat || '').toUpperCase();
    sev = (sev || '').toLowerCase();
    status = (status || '').toUpperCase();
    if (cat === 'SELF_HARM' || cat === 'ENCOURAGEMENT_OF_SELF_HARM') return 'urgent';
    if (status === 'BLOCKED' || sev === 'critical' || cat === 'THREAT' || cat === 'VIOLENCE' || cat === 'SEXUAL_HARASSMENT' || cat === 'NUDITY') return 'high';
    if (status === 'REVIEW' || sev === 'high' || sev === 'medium' || cat === 'HARASSMENT' || cat === 'BULLYING' || cat === 'HATE') return 'moderate';
    return 'low';
  }

  function getWarningConfig(category, severity, status, reason, isAcademicStress, isTargeted) {
    category = (category || 'HARASSMENT').toUpperCase();
    severity = (severity || 'medium').toLowerCase();
    status = (status || 'REVIEW').toUpperCase();
    var risk = computeRiskLevel(category, severity, status);

    var isSensitive = (category !== 'SAFE' && category !== 'NONE');
    var twLabel = 'Sensitive Content';
    if (category.indexOf('NUDITY') !== -1 || category.indexOf('SEXUAL') !== -1) {
      twLabel = 'Nudity / Explicit Content';
    } else if (category.indexOf('SELF_HARM') !== -1 || category.indexOf('CRISIS') !== -1) {
      twLabel = 'Self-Harm / Crisis Concern';
    } else if (category.indexOf('THREAT') !== -1 || category.indexOf('VIOLEN') !== -1) {
      twLabel = 'Violence or Threatening Content';
    } else if (category.indexOf('BULLY') !== -1 || category.indexOf('HARASS') !== -1 || category.indexOf('HATE') !== -1) {
      twLabel = 'Bullying or Harassment';
    } else if (category.indexOf('TRAUMA') !== -1 || category.indexOf('ABUSE') !== -1) {
      twLabel = 'Trauma or Sensitive Experiences';
    } else if (category.indexOf('DISTRESS') !== -1 || category.indexOf('ALARM') !== -1 || category.indexOf('SENSITIVE') !== -1) {
      twLabel = 'Distressing Emotional Content';
    }

    var config = {
      category: category,
      risk_level: risk,
      title: 'Trigger Warning — Sensitive Content Detected',
      message: 'Your post may contain sensitive or emotionally distressing content related to topics such as self-harm, violence, abuse, nudity, or other difficult experiences. Please review your content before sharing it with the community. You may edit your post, cancel the submission, or continue if the content complies with our community guidelines.',
      can_continue: (status !== 'BLOCKED' && severity !== 'critical' && category !== 'THREAT' && category !== 'VIOLENCE' && category !== 'ENCOURAGEMENT_OF_SELF_HARM' && category !== 'NUDITY'),
      show_support_resources: false,
      show_guidelines_button: false,
      is_imminent_danger: false,
      has_trigger_warning: isSensitive,
      trigger_warning_category: category,
      trigger_warning_label: twLabel,
      primary_button_label: 'Review / Edit Post',
      secondary_button_label: 'Cancel Posting'
    };

    if (category === 'NUDITY' || category === 'SEXUAL_CONTENT' || category === 'SEXUAL_HARASSMENT') {
      config.title = 'Trigger Warning — Nudity Detected';
      config.message = 'Your post contains nudity, sexual solicitation, or explicit content. Safe Space strictly prohibits nudity and sexually explicit content to maintain a safe, respectful environment for students.';
      config.can_continue = false;
      config.show_guidelines_button = true;
      config.show_support_resources = false;
      config.primary_button_label = 'Edit Post';
    } else if (category === 'SELF_HARM' || category === 'ENCOURAGEMENT_OF_SELF_HARM') {
      config.title = 'Trigger Warning — Safety & Crisis Concern';
      config.message = 'Your post may discuss self-harm or suicide-related experiences. Please consider whether you want to share this content publicly. If you are seeking help, support resources are available.';
      config.show_support_resources = true;
      config.show_guidelines_button = false;
      config.is_imminent_danger = (severity === 'critical' || category === 'SELF_HARM');
      config.primary_button_label = 'Review My Post';
      config.can_continue = false;
    } else if (category === 'THREAT' || category === 'VIOLENCE') {
      config.title = 'Trigger Warning — Violence or Threat Detected';
      config.message = 'Your post may contain descriptions of violence or threatening language. Please review it before sharing. Content that threatens or endangers others may be restricted under our community guidelines.';
      config.show_guidelines_button = true;
      config.show_support_resources = false;
      config.can_continue = false;
      config.primary_button_label = 'Edit Post';
    } else if (category === 'BULLYING' || category === 'HARASSMENT' || category === 'HATE') {
      config.title = 'Trigger Warning — Bullying or Harassment';
      config.message = 'Your post may contain language that could target or hurt another person. Please consider revising it to maintain a respectful and supportive community.';
      config.can_continue = (status !== 'BLOCKED');
      config.show_support_resources = false;
      config.show_guidelines_button = false;
      config.primary_button_label = 'Edit Post';
    } else if (category === 'TRAUMA' || category === 'ABUSE') {
      config.title = 'Trigger Warning — Trauma or Abuse';
      config.message = 'Your post may describe traumatic or sensitive experiences. A content warning can help other students make an informed decision before viewing it.';
      config.can_continue = true;
      config.show_support_resources = true;
      config.show_guidelines_button = false;
      config.primary_button_label = 'Review Post';
    } else if (category === 'DISTRESS' || category === 'ALARMING' || category === 'SENSITIVE') {
      config.title = 'Trigger Warning — Distressing Emotional Content';
      config.message = 'Your post may contain emotionally distressing material. Please review your content before publishing.';
      config.can_continue = true;
      config.show_support_resources = true;
      config.show_guidelines_button = false;
      config.primary_button_label = 'Review Post';
    } else {
      config.title = 'Trigger Warning — Sensitive Content Detected';
      config.message = reason || 'Your post may contain sensitive or distressing material. Please review your content before publishing.';
      config.can_continue = (status !== 'BLOCKED');
      config.primary_button_label = 'Review / Edit Post';
    }

    return config;
  }

  var SafeSpaceSupportRecommender = {
    generate: function(text, sentiment, category, riskLevel, language) {
      var cleanText = (text || '').trim();
      var lowerText = cleanText.toLowerCase();
      var sent = (sentiment || 'Neutral');
      var cat = (category || 'SAFE').toUpperCase();
      var risk = (riskLevel || 'low').toLowerCase();
      var lang = (language || 'english').toLowerCase();

      var isFilipinoOrTaglish = lang === 'filipino' || lang === 'tagalog' || lang === 'taglish' ||
        /\b(ako|ko|mo|ka|na|ng|sa|ang|naman|kasi|talaga|sobrang|hirap|pagod|salamat|gusto|ayoko)\b/i.test(lowerText);

      // 1. Potential Self-Harm or Crisis
      var isEducational = /\b(lecture|class|prof|teacher|seminar|lesson|topic|discussion|learned|psychology|prevention|awareness|campaign|project|thesis|research)\b/i.test(lowerText);
      var hasPersonalCrisisIntent = /\b(kill myself|end my life|magpakamatay|gusto ko nang mawala|ayaw ko nang mabuhay|slit my wrists|hang myself|disappear forever|want to die|wanna die|i want to die|i will kill myself)\b/i.test(lowerText) || ((cat === 'SELF_HARM' || cat === 'ENCOURAGEMENT_OF_SELF_HARM') && !isEducational);
      var isCrisis = ((cat === 'SELF_HARM' || cat === 'ENCOURAGEMENT_OF_SELF_HARM') && !isEducational) || risk === 'urgent' || hasPersonalCrisisIntent;

      if (isCrisis) {
        return {
          type: 'crisis_support',
          message: isFilipinoOrTaglish
            ? "Ikinalulungkot ko na dumadaan ka sa napakahirap na sitwasyon. Karapat-dapat kang suportahan, at hindi mo kailangang harapin ito nang mag-isa. Kung maaari, makipag-ugnayan sa isang taong pinagkakatiwalaan mo at sabihin sa kanila ang iyong pinagdaraanan. Kung ikaw ay nasa agarang panganib, mangyaring makipag-ugnayan sa National Center for Mental Health (NCMH) Hotline sa 1553 (toll-free) o 0917-899-USAP (8727), tumawag sa Emergency 911, o humingi ng tulong sa sinumang malapit sa iyo."
            : "I'm sorry you're going through such a difficult time. You deserve support, and you don't have to handle this alone. If you can, reach out to someone you trust and tell them what you're experiencing. If you may be in immediate danger, please contact local emergency services or ask someone nearby to help you get immediate support.",
          show_resources_button: true,
          resource_link: 'resources.html',
          is_sensitive: true,
          emergency_numbers: ['1553', '911', '0917-899-8727'],
          disclaimer: 'Suggested Support from Safe Space AI · Verified crisis support guidance. Not a substitute for professional clinical care or emergency assistance.'
        };
      }

      // 2. Academic Stress & Burnout
      var isAcademicStress = /\b(exam|exams|assignment|assignments|project|projects|deadline|deadlines|thesis|defense|study|studying|finals|quizzes|quiz|midterm|midterms|homework|burnout|overwhelmed|daming schoolwork|sobrang requirements)\b/i.test(lowerText);

      if (isAcademicStress) {
        if (/\b(fail|failed|bagsak|bumagsak|low grade|low score|disappointed|disappointing)\b/i.test(lowerText)) {
          return {
            type: 'academic_support',
            message: isFilipinoOrTaglish
              ? "Pasensya ka na at pinagdaraanan mo ito. Natural lang na malungkot o madismaya matapos ibuhos ang iyong pagsisikap. Ang isang pagsusulit ay hindi nagtatakda ng iyong tunay na kakayahan at halaga. Magpahinga muna sandali, at kapag handa ka na, subukang balikan ang mga paksang nahirapan ka o humingi ng tulong sa kaklase o guro. Kaya mo itong harapin nang dahan-dahan, isa-isang hakbang sa bawat pagkakataon."
              : "Sorry you're going through this. It's understandable to feel disappointed after putting in so much effort. One exam doesn't define your abilities. Take a little time to rest, then consider reviewing the topics you found difficult or asking a classmate or teacher for help. You can take this one step at a time.",
            show_resources_button: false,
            is_sensitive: false,
            disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.'
          };
        }

        return {
          type: 'academic_support',
          message: isFilipinoOrTaglish
            ? "Talagang nakaka-overwhelm ang ganyang sitwasyon. Subukang ilista ang iyong mga deadlines, piliin ang pinaka-urgent, at hati-hatiin ito sa mas maliliit at kayang hakbang. Tandaan ding maglaan ng maiikling pahinga at sapat na tulog. Hindi mo kailangang tapusin ang lahat nang sabay-sabay."
            : "That sounds overwhelming. Try listing your deadlines, choosing the most urgent task, and breaking it into smaller steps. Remember to take short breaks and get enough rest. You don't have to finish everything at once.",
          show_resources_button: false,
          is_sensitive: false,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.'
        };
      }

      // 3. Loneliness / Feeling Misunderstood
      var isLoneliness = /\b(lonely|alone|nobody understands|no friends|left out|isolated|nag-iisa|walang kausap|walang nakakaintindi|hindi ako maintindihan|walang may pake|walang may care)\b/i.test(lowerText);
      if (isLoneliness) {
        return {
          type: 'empathy_support',
          message: isFilipinoOrTaglish
            ? "Ikinalulungkot ko na ganito ang iyong nararamdaman. Masakit maramdamang walang nakakaintindi, ngunit mahalaga ang iyong nararamdaman. Kung komportable ka, isaalang-alang ang pakikipag-ugnayan sa isang taong pinagkakatiwalaan mo at ibahagi ang iyong nararanasan. Karapat-dapat kang marinig at suportahan."
            : "I'm sorry you're feeling this way. Feeling misunderstood can be painful, but your feelings matter. If you feel comfortable, consider reaching out to someone you trust and sharing what you've been experiencing. You deserve to be heard and supported.",
          show_resources_button: true,
          resource_link: 'resources.html',
          is_sensitive: true,
          disclaimer: 'Suggested Support from Safe Space AI · Compassionate peer encouragement.'
        };
      }

      // 4. Negative Emotional Expression
      if (String(sent).toLowerCase().indexOf('neg') !== -1 || /\b(sad|down|crying|upset|hurt|cried|malungkot|umiiyak|nasasaktan|lungkot|heartbroken)\b/i.test(lowerText)) {
        return {
          type: 'comfort_support',
          message: isFilipinoOrTaglish
            ? "Nais naming ipaalam sa iyo na naririnig at pinapahalagahan ang iyong nararamdaman. Normal lang at okay lang na hindi maging okay sa lahat ng pagkakataon. Maging banayad sa iyong sarili ngayong araw, magpahinga, at tandaan na nandito ang Safe Space community para sumuporta sa iyo."
            : "We hear you, and your feelings are completely valid. It is okay not to be okay all the time. Be gentle with yourself today. Take a moment to pause, breathe, and practice a little self-care. Remember that challenging days do pass, and you have a supportive community cheering you on.",
          show_resources_button: true,
          resource_link: 'resources.html',
          is_sensitive: false,
          disclaimer: 'Suggested Support from Safe Space AI · Emotional well-being support.'
        };
      }

      // 5. Positive Experience / Celebration
      if (String(sent).toLowerCase().indexOf('pos') !== -1 || /\b(proud|achieved|passed|won|happy|blessed|thankful|grateful|congratulations|congrats|success|yay|panalo|pumasa|natutuwa|masaya|salamat)\b/i.test(lowerText)) {
        return {
          type: 'celebration',
          message: isFilipinoOrTaglish
            ? "Maligayang pagbati! Ang iyong sipag at pagpupursigi ay nagbunga nang maganda. Maglaan ng sandali upang pahalagahan ang iyong progreso at ipagdiwang ang tagumpay na ito. Patuloy na maniwala sa iyong sarili habang tinatahak ang iyong susunod na layunin!"
            : "Congratulations! Your dedication and effort have paid off. Take a moment to appreciate your progress and celebrate this achievement. Keep believing in yourself as you work toward your next goal.",
          show_resources_button: false,
          is_sensitive: false,
          disclaimer: 'Suggested Support from Safe Space AI · Community celebration & encouragement.'
        };
      }

      // 6. Neutral / Informational / Presentations
      var isPresentation = /\b(presentation|group|groupmates|friday|monday|tuesday|wednesday|thursday|schedule|meeting|room|announcement|question|classmates)\b/i.test(lowerText);
      if (isPresentation) {
        return {
          type: 'general_support',
          message: isFilipinoOrTaglish
            ? "Salamat sa pagbabahagi! Makatutulong kung susuriin mo ang iyong nakatalagang bahagi at makikipag-ugnayan sa iyong mga kagrupo bago ang takdang araw. Nais namin ang tagumpay ng inyong grupo sa inyong presentation!"
            : "Thanks for sharing! You may find it helpful to review your assigned section and coordinate with your groupmates before Friday. Good luck with your presentation!",
          show_resources_button: false,
          is_sensitive: false,
          disclaimer: 'Suggested Support from Safe Space AI · Informational student community response.'
        };
      }

      return {
        type: 'general_support',
        message: isFilipinoOrTaglish
          ? "Salamat sa pagbabahagi sa Safe Space community. Nais naming maging mapayapa at produktibo ang iyong araw sa pag-aaral. Nandito ang ating komunidad upang magbahagi at magtulungan."
          : "Thank you for sharing with the Safe Space community. Wishing you a peaceful and productive day ahead in your studies. Feel free to connect and collaborate with fellow students.",
        show_resources_button: false,
        is_sensitive: false,
        disclaimer: 'Suggested Support from Safe Space AI · Informational student community response.'
      };
    }
  };

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
          risk_level: 'low',
          warning_config: getWarningConfig('SAFE', 'none', 'APPROVED', 'Empty content allowed', false, false),
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
          support_recommendation: SafeSpaceSupportRecommender.generate('', 'Neutral', 'SAFE', 'low', 'english'),
          original_text: text || '',
          censored_text: text || '',
          has_profanity: false,
          elapsedMs: 0
        };
      }

      var originalText = text.trim();
      var censoredText = SafeSpaceCensor.censor(originalText);
      var hasProfanity = (censoredText !== originalText);
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

      // Safe stress or benign idiom -> immediate approve only if allowed (no violation)
      if (fastResult.allowed && (fastResult.is_academic_stress || fastResult.is_whitelisted || fastResult.is_educational_or_reporting)) {
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

        var isProfanityAllowed = (validCat === 'PROFANITY' && !fastResult.is_targeted);
        if (isProfanityAllowed) {
          isAllowed = true;
          validStatus = 'APPROVED';
          validAction = 'allow';
          validSeverity = 'low';
        }

        // If local rules caught a severe offense that the neural zero-shot model missed, respect the layered shield
        var finalResult;
        if (!fastResult.allowed && !isProfanityAllowed && isAllowed) {
          finalResult = fastResult;
        } else {
          var resolvedRisk = result.risk_level || computeRiskLevel(validCat, validSeverity, validStatus);
          var resolvedSentiment = (function() {
            var s = String(result.sentiment || '').toLowerCase();
            if (s.indexOf('pos') !== -1) return 'Positive';
            if (s.indexOf('neg') !== -1) return 'Negative';
            if (s.indexOf('neu') !== -1) return 'Neutral';
            return SafeSpaceSentiment.analyze(originalText).sentiment;
          })();
          var resolvedScore = (typeof result.sentiment_score === 'number') ? result.sentiment_score : SafeSpaceSentiment.analyze(originalText).sentiment_score;

          finalResult = {
            success: true,
            online: true,
            fallback: false,
            allowed: isAllowed,
            status: validStatus,
            action: validAction,
            risk_level: resolvedRisk,
            warning_config: getWarningConfig(validCat, validSeverity, validStatus, result.reason, fastResult.is_academic_stress, fastResult.is_targeted),
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
            original_text: originalText,
            censored_text: result.censored_text || censoredText,
            has_profanity: typeof result.has_profanity === 'boolean' ? result.has_profanity : hasProfanity,
            sentiment: resolvedSentiment,
            sentiment_score: resolvedScore,
            support_recommendation: result.support_recommendation || SafeSpaceSupportRecommender.generate(originalText, resolvedSentiment, validCat, resolvedRisk, result.language || fastResult.language),
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
      var censoredText = SafeSpaceCensor.censor(text);
      var hasProfanity = (censoredText !== text);

      function _wrap(res) {
        res.original_text = text;
        res.censored_text = censoredText;
        res.has_profanity = hasProfanity;
        var sentEval = SafeSpaceSentiment.analyze(text);
        res.sentiment = sentEval.sentiment;
        res.sentiment_score = sentEval.sentiment_score;
        res.sentiment_confidence = sentEval.confidence;
        res.risk_level = computeRiskLevel(res.category, res.severity, res.status);
        res.warning_config = getWarningConfig(res.category, res.severity, res.status, res.reason, res.is_academic_stress, res.is_targeted);
        res.support_recommendation = SafeSpaceSupportRecommender.generate(text, res.sentiment, res.category, res.risk_level, res.language);
        return res;
      }

      // 0. Banned Words & Slang Filter Check (From Admin AI Governance panel)
      var defaultBannedWords = [
        'gago', 'tarantado', 'boboka', 'bobo', 'ulol',
        'kill yourself', 'die', 'worthless', 'loser', 'stupid', 'hate you',
        'tado', 'gagu'
      ];
      var activeBannedWords = defaultBannedWords.slice();
      try {
        if (typeof localStorage !== 'undefined') {
          var customStored = JSON.parse(localStorage.getItem('safe_space_banned_keywords'));
          if (Array.isArray(customStored) && customStored.length > 0) {
            customStored.forEach(function(w) {
              if (w && typeof w === 'string') {
                var wClean = w.trim().toLowerCase();
                if (wClean && activeBannedWords.indexOf(wClean) === -1) {
                  activeBannedWords.push(wClean);
                }
              }
            });
          }
        }
      } catch (e) {}

      var testStrings = [norm.clean, norm.evasion, norm.deleet, norm.deobfuscated];
      var matchedBannedWord = null;

      for (var b = 0; b < activeBannedWords.length; b++) {
        var bw = activeBannedWords[b];
        if (!bw) continue;
        var escapedBw = bw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var bwRegex = new RegExp('(?:^|[\\s.,!?;:_\\-"\'`~()\\/\\[\\]])' + escapedBw + '(?:$|[\\s.,!?;:_\\-"\'`~()\\/\\[\\]])', 'i');
        for (var ts = 0; ts < testStrings.length; ts++) {
          if (bwRegex.test(testStrings[ts]) || (bw.length > 3 && testStrings[ts].indexOf(bw) !== -1)) {
            matchedBannedWord = bw;
            break;
          }
        }
        if (matchedBannedWord) break;
      }

      if (matchedBannedWord) {
        return _wrap({
          success: true,
          online: false,
          fallback: true,
          allowed: false,
          status: 'REVIEW',
          action: 'warn',
          language: langInfo.language,
          language_confidence: langInfo.confidence,
          category: 'HARASSMENT',
          categories: ['HARASSMENT', 'PROFANITY'],
          severity: 'high',
          confidence: 0.98,
          reason: 'Harmful language detected from Banned Words & Slang Filter: "' + matchedBannedWord + '"',
          matched_word: matchedBannedWord,
          detection_source: 'banned_filter',
          has_obfuscation: norm.has_obfuscation,
          obfuscation_types: norm.obfuscation_types,
          is_academic_stress: false,
          is_targeted: ctx.is_targeted,
          sentiment: 'NEGATIVE',
          sentiment_score: 0.90,
          elapsedMs: 1
        });
      }

      // 1. Safety Rules First (Violations always take priority over shortcuts)
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
        // Safeguard: Do not classify self-directed academic frustration/failure as harassment
        if ((ctx.is_academic_stress || !ctx.is_targeted) && (cat === 'HARASSMENT' || cat === 'BULLYING') && !ctx.is_targeted) {
          matchedRule = null;
        }
      }

      if (matchedRule) {
        var cat = matchedRule.category;
        var severity = matchedRule.severity || 'medium';
        var action = matchedRule.action || 'review';
        var status = (severity === 'critical') ? 'BLOCKED' : (severity === 'low' ? 'APPROVED' : 'REVIEW');
        var isAllowed = (status === 'APPROVED');
        var conf = matchedRule.confidence;
        var reason = matchedRule.reason;

        // If profanity: automatically censor with asterisks and approve in censored form
        if (cat === 'PROFANITY') {
          isAllowed = true;
          action = 'allow';
          status = 'APPROVED';
          reason = 'Prohibited profanity automatically censored with asterisks: ' + censoredText;
        }

        if (norm.has_obfuscation) {
          conf = Math.min(0.99, conf + 0.05);
          reason += ' (Evasion attempts detected: ' + norm.obfuscation_types.join(', ') + ')';
        }

        return _wrap({
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
          reason: reason + ' (Multilingual Safety Shield)',
          detection_source: 'fallback',
          has_obfuscation: norm.has_obfuscation,
          obfuscation_types: norm.obfuscation_types,
          is_academic_stress: false,
          is_targeted: ctx.is_targeted,
          sentiment: 'NEGATIVE',
          sentiment_score: 0.85,
          elapsedMs: 2
        });
      }

      // 2. Academic Stress Sharing Safeguard (Only reached if no rule violations)
      if (ctx.is_academic_stress) {
        return _wrap({
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
        });
      }

      // 3. Whitelist Safeguard (Only reached if no rule violations)
      if (ctx.is_whitelisted) {
        return _wrap({
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
        });
      }

      // 4. Educational / Reporting Context
      if (ctx.is_educational_or_reporting) {
        return _wrap({
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
        });
      }

      // 5. Safe Default
      return _wrap({
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
      });
    },

    renderSentimentBadge: function(sentiment, score) {
      if (!sentiment) return '';
      var s = String(sentiment).toLowerCase();
      var scorePct = typeof score === 'number' ? Math.round(score * 100) : null;
      var scoreText = scorePct ? ' (' + scorePct + '%)' : '';

      if (s.indexOf('pos') !== -1) {
        return '<span class="ai-sentiment-badge positive" title="AI Sentiment: Positive' + scoreText + '">' +
               '<i class="fa-solid fa-face-smile"></i> Positive</span>';
      } else if (s.indexOf('neg') !== -1) {
        return '<span class="ai-sentiment-badge supportive" title="AI Sentiment: Negative' + scoreText + '">' +
               '<i class="fa-solid fa-face-frown"></i> Negative</span>';
      } else {
        return '<span class="ai-sentiment-badge neutral" title="AI Sentiment: Neutral' + scoreText + '">' +
               '<i class="fa-solid fa-face-meh"></i> Neutral</span>';
      }
    },

    /**
     * Generate an empathetic, context-aware supportive comment recommendation
     */
    recommendSupport: async function(text, sentiment, category, riskLevel, language) {
      if (!text || !text.trim()) {
        return SafeSpaceSupportRecommender.generate('', sentiment, category, riskLevel, language);
      }
      var self = this;
      if (this._state === 'online') {
        try {
          var controller = new AbortController();
          var timeoutId = setTimeout(function() { controller.abort(); }, 3000);
          var res = await fetch(self.getApiUrl() + '/recommend-support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: text.trim(),
              sentiment: sentiment || 'Neutral',
              category: category || 'SAFE',
              risk_level: riskLevel || 'low',
              language: language || 'english'
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            var data = await res.json();
            if (data.recommendation) return data.recommendation;
          }
        } catch (e) {
          // fallback to client-side recommender
        }
      }
      return SafeSpaceSupportRecommender.generate(text, sentiment, category, riskLevel, language);
    },

    getWarningConfig: getWarningConfig,
    computeRiskLevel: computeRiskLevel
  };

  // Immediate non-blocking status check
  try {
    AIService.checkStatus(false).catch(function() {});
  } catch (e) {}

  AIService.analyzeSentiment = function(t) { return SafeSpaceSentiment.analyze(t); };
  window.SafeSpaceSentiment = SafeSpaceSentiment;
  window.SafeSpaceCensor = SafeSpaceCensor;
  window.censorProfanity = function(t) { return SafeSpaceCensor.censor(t); };
  AIService.censorProfanity = function(t) { return SafeSpaceCensor.censor(t); };
  AIService.containsProfanity = function(t) { return SafeSpaceCensor.hasProfanity(t); };
  window.SafeSpaceSupportRecommender = SafeSpaceSupportRecommender;

  window.AIService = AIService;
})(window);
