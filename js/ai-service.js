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
  // 0. PARTIAL PROFANITY CENSORSHIP ENGINE (WORD-BY-WORD SCANNER)
  // ─────────────────────────────────────────────────────────────
  var BASE_PROFANITY_PATTERNS = [
    // Filipino Multiword Expressions
    '(?<![a-zA-Z0-9])p+u+t+[a@4]+n+g+[\\s\\-_]+[i1!]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+u+k+[i1!]+n+[a@4]+n+g+[\\s\\-_]+[i1!]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+u+k+[i1!]+[\\s\\-_]+n+[a@4]+n+g+[\\s\\-_]+[i1!]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+n+g+[\\s\\-_]+[i1!e3]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+[\\s\\-_]+[e3]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])a+n+[a@4]+k+[\\s\\-_]+n+g+[\\s\\-_]+p+[uUoO*]+t+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])h+[a@4]+y+[uUoO]+p+[\\s\\-_]+k+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])l+[e3]+[ct]+s?h+[e3]+[\\s\\-_]+k+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+[a@4]+k+[\\s\\-_]+y+[uU]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])f+[a@4]+k+[\\s\\-_]+y+[uU]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+u+t+[a@4]+n+g+[\\s\\-_]*i+n+[a@4]+(?![a-zA-Z0-9])',

    // Filipino Single Profanities & Local Variations
    '(?<![a-zA-Z0-9])p+u+t+[a@4]+n+g+[i1!]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+u+k+[i1!]+n+[a@4]+n+g+[i1!]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+n+g+[i1!]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+n+g+[e3]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+[e3]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+y+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])k+[i1!]+n+g+[i1!]+n+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])a+m+p+[uUoO*]+t+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+u+n+y+[e3]+t+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])l+[e3]+[ct]+s?h+[e3]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+[ei]+s+t+[e3]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])y+[a@4]+w+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])k+u+p+[a@4]+l+(?:s)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])o+g+[a@4]+g+(?:s)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+[uUoO*]+t+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])l+[i1!]+n+t+[i1!]+k+(?:s)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])h+u+d+[a@4]+s+(?:s)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])g+[a@4]+g+[oO0uU]+(?:ng)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])g+[a@4]+g+[a@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])k+[a@4]+g+[a@4]+g+u+h+[a@4]+n+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+r+[a@4]+n+t+[a@4]+d+[oO0uUa@4]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])k+[a@4]+t+[a@4]+r+[a@4]+n+t+[a@4]+d+[oO0]+h+[a@4]+n+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+[oO0]+b+[oO0]+(?:ng)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+[oO0]+b+[aA@4]+(?!\\s*(?:tea|milk|drink))(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])k+[a@4]+b+[oO0]+b+[oO0]+h+[a@4]+n+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+[oO0]+p+[oO0]+l+s+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+[oO0]+p+l+[a@4]+k+s+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])u+l+[oO0]+l+(?:s)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])i+n+u+t+[i1!]+l+(?:s)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+n+g+[a@4]+(?:ng)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])k+[a@4]+t+[a@4]+n+g+[a@4]+h+[a@4]+n+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+u*w+[i1!]+s+[i1!]+t+(?:s)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])h+[i1!]+n+[a@4]+y+u+p+[a@4]+k+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])k+[a@4]+n+t+[o0]+t+(?:an|in)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])c+h+u+p+[a@4]+(?:in)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+s+u+p+[a@4]+(?:in)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[i1!]+t+[e3]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+u+k+[e3i1!]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])k+[i1!]+k+[i1!]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+[a@4]+m+[o0]+d+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])j+[a@4]+k+[o0]+l+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+u+r+[a@4]+t+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+[a@4]+y+[a@4]+g+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+[e3]+p+[e3]+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])i+y+[o0]+t+(?:an)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+[o0]+k+p+[o0]+k+(?![a-zA-Z0-9])',

    // English Profanities, Vulgarities & Leetspeak
    '(?<![a-zA-Z0-9])s+h+u+t+[\\s\\-_]+t+h+e+[\\s\\-_]+f+[uU*vV]+c+k+[\\s\\-_]+u+p+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])f+[uU*vV]+c+k+[\\s\\-_]+(?:y+o+u+|o+f+f+|u+)(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])m+[o0]+t+h+e+r+f+[uU*vV]+c+k+(?:e+r+s?|i+n+g+|e+d+|s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])f+[uU*vV]+c+k+(?:i+n+g+|e+r+s?|e+d+|s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])f+[\\*]+c*k+(?:i+n+g+|e+r+s?|e+d+|s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])f+u+k+(?:i+n+g+|e+r+s?|e+d+|s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+u+l+l+s+h+[iI1!*]+t+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])d+[i1!]+p+s+h+[iI1!*]+t+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])h+[o0]+r+s+e+s+h+[iI1!*]+t+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])s+h+[iI1!*]+t+(?:s+|t+e+d+|t+i+n+g+|t+y+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+[iI1!*]+t+c+h+(?:e+s+|i+n+g+|y+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+[iI1!*]+c+h+(?:e+s+|i+n+g+|y+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])a+[s$5]+h+[o0]+l+e+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])d+u+m+b+a+[s$5]{2,}(?:e+s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])j+[a@4]+c+k+a+[s$5]{2,}(?:e+s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])f+[a@4]+t+a+[s$5]{2,}(?:e+s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])b+[a@4]+s+t+[a@4]+r+d+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])c+u+n+t+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])d+[iI1!*]+c+k+h+e+[a@4]+d+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])d+[iI1!*]+c+k+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])c+[o0]+c+k+s+u+c+k+e+r+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])c+[o0]+c+k+(?:s+)?(?!(?:tail|roach|[a-zA-Z0-9]))',
    '(?<![a-zA-Z0-9])p+u+s+s+y+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])p+u+s+s+i+e+s+(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])t+w+[a@4]+t+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])w+[a@4]+n+k+e+r+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])s+l+u+t+(?:s+|t+y+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])w+h+[o0]+r+e+(?:s+)?(?![a-zA-Z0-9])',
    '(?<![a-zA-Z0-9])s+t+f+u+(?![a-zA-Z0-9])',
    // Standalone 'ass' without colliding with classic, pass, assistant, compassion, asset
    '(?<![a-zA-Z0-9])a+[s$5]{2,}(?:es)?(?![a-zA-Z0-9])'
  ];

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getStoredCustomKeywords() {
    try {
      if (typeof localStorage !== 'undefined') {
        var stored = JSON.parse(localStorage.getItem('safe_space_banned_keywords'));
        if (Array.isArray(stored)) {
          return stored.map(function(w) { return String(w || '').trim().toLowerCase(); }).filter(Boolean);
        }
      }
    } catch (e) {}
    return [];
  }

  var SafeSpaceCensor = {
    customWords: [],
    compiledRegex: null,

    init: function() {
      this.customWords = getStoredCustomKeywords();
      this.recompile();
    },

    recompile: function() {
      var patterns = BASE_PROFANITY_PATTERNS.slice();
      var seen = {};
      for (var i = 0; i < this.customWords.length; i++) {
        var w = this.customWords[i];
        if (w && !seen[w]) {
          seen[w] = true;
          if (w.indexOf(' ') !== -1) {
            var parts = w.split(/\s+/).map(escapeRegex);
            patterns.push('(?<![a-zA-Z0-9])' + parts.join('\\s+') + '(?![a-zA-Z0-9])');
          } else {
            patterns.push('(?<![a-zA-Z0-9])' + escapeRegex(w) + '(?:s|es)?(?![a-zA-Z0-9])');
          }
        }
      }
      this.compiledRegex = new RegExp(patterns.join('|'), 'gi');
    },

    addWord: function(w) {
      var word = String(w || '').trim().toLowerCase();
      if (!word || this.customWords.indexOf(word) !== -1) return false;
      this.customWords.push(word);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('safe_space_banned_keywords', JSON.stringify(this.customWords));
        }
      } catch (e) {}
      this.recompile();
      return true;
    },

    removeWord: function(w) {
      var word = String(w || '').trim().toLowerCase();
      var idx = this.customWords.indexOf(word);
      if (idx !== -1) {
        this.customWords.splice(idx, 1);
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('safe_space_banned_keywords', JSON.stringify(this.customWords));
          }
        } catch (e) {}
        this.recompile();
        return true;
      }
      return false;
    },

    getWords: function() {
      return this.customWords.slice();
    },

    censorWord: function(w) {
      if (!w || typeof w !== 'string' || w.length <= 2) return w;
      var asterisks = '*'.repeat ? '*'.repeat(w.length - 2) : new Array(w.length - 1).join('*');
      return w.charAt(0) + asterisks + w.charAt(w.length - 1);
    },

    maskExpression: function(raw) {
      var self = this;
      var stopWords = {
        'the': 1, 'of': 1, 'and': 1, 'or': 1, 'to': 1, 'in': 1, 'on': 1, 'at': 1,
        'by': 1, 'for': 1, 'with': 1, 'about': 1, 'ng': 1, 'mga': 1, 'sa': 1, 'kay': 1,
        'ni': 1, 'na': 1, 'ang': 1
      };
      var parts = raw.split(/(\s+|[-_]+)/);
      var censored = [];
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!p || /^\s+$/.test(p) || p === '-' || p === '_') {
          censored.push(p);
        } else if (stopWords[p.toLowerCase()]) {
          censored.push(p);
        } else {
          censored.push(self.censorWord(p));
        }
      }
      return censored.join('');
    },

    censor: function(text) {
      if (!text || typeof text !== 'string') return text;
      if (!this.compiledRegex) this.init();
      var self = this;
      return text.replace(this.compiledRegex, function(fullMatch) {
        return self.maskExpression(fullMatch);
      });
    },

    hasProfanity: function(text) {
      if (!text || typeof text !== 'string') return false;
      if (!this.compiledRegex) this.init();
      this.compiledRegex.lastIndex = 0;
      return this.compiledRegex.test(text);
    }
  };

  SafeSpaceCensor.init();

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
      title: 'Sensitive Content Detected',
      message: 'Your post may contain sensitive or distressing material. Please review it before sharing it with the community.',
      can_continue: (status !== 'BLOCKED' && severity !== 'critical' && category !== 'THREAT' && category !== 'VIOLENCE' && category !== 'ENCOURAGEMENT_OF_SELF_HARM' && category !== 'NUDITY'),
      show_support_resources: false,
      show_guidelines_button: false,
      is_imminent_danger: false,
      has_trigger_warning: isSensitive,
      trigger_warning_category: category,
      trigger_warning_label: twLabel,
      primary_button_label: 'Review Post',
      secondary_button_label: 'Cancel Posting',
      continue_label: 'Continue, if permitted by the moderation policy'
    };

    if (category === 'SELF_HARM' || category === 'ENCOURAGEMENT_OF_SELF_HARM') {
      config.title = 'Your Post May Indicate a Safety Concern';
      config.message = 'Some parts of your post suggest that you may be experiencing serious distress. You deserve support, and you do not have to face difficult moments alone. Would you like to review your post or explore available support resources before continuing?';
      config.show_support_resources = true;
      config.show_guidelines_button = false;
      config.is_imminent_danger = (severity === 'critical' || category === 'SELF_HARM');
      config.primary_button_label = 'Review My Post';
      config.secondary_button_label = 'Cancel Posting';
      config.can_continue = false;
    } else if (category === 'BULLYING' || category === 'HARASSMENT' || category === 'HATE') {
      config.title = 'Please Review Your Post';
      config.message = 'Your post may contain language that could hurt or target another person. Consider revising it to help maintain a respectful and supportive community.';
      config.can_continue = (status !== 'BLOCKED');
      config.show_support_resources = false;
      config.show_guidelines_button = false;
      config.primary_button_label = 'Edit Post';
      config.secondary_button_label = 'Cancel Posting';
      config.continue_label = 'Continue, if permitted by the moderation policy';
    } else if (category === 'THREAT' || category === 'VIOLENCE') {
      config.title = 'Potentially Harmful Content Detected';
      config.message = 'Your post may contain content that could put someone at risk. Please review it before continuing. Content that violates community safety rules cannot be published.';
      config.show_guidelines_button = true;
      config.show_support_resources = false;
      config.can_continue = false;
      config.primary_button_label = 'Edit Post';
      config.secondary_button_label = 'Cancel Posting';
    } else if (category === 'NUDITY' || category === 'SEXUAL_CONTENT' || category === 'SEXUAL_HARASSMENT') {
      config.title = 'Potentially Harmful Content Detected';
      config.message = 'Your post contains nudity, sexual solicitation, or explicit content. Safe Space strictly prohibits nudity and sexually explicit content to maintain a safe, respectful environment for students.';
      config.can_continue = false;
      config.show_guidelines_button = true;
      config.show_support_resources = false;
      config.primary_button_label = 'Edit Post';
      config.secondary_button_label = 'Cancel Posting';
    } else if (category === 'TRAUMA' || category === 'ABUSE' || category === 'DISTRESS' || category === 'ALARMING' || category === 'SENSITIVE') {
      config.title = 'Sensitive Content Detected';
      config.message = 'Your post may contain sensitive or distressing material. Please review it before sharing it with the community.';
      config.can_continue = (status !== 'BLOCKED');
      config.show_support_resources = true;
      config.show_guidelines_button = false;
      config.primary_button_label = 'Review Post';
      config.secondary_button_label = 'Cancel Posting';
      config.continue_label = 'Continue, if permitted by the moderation policy';
    } else {
      config.title = 'Sensitive Content Detected';
      config.message = reason || 'Your post may contain sensitive or distressing material. Please review it before sharing it with the community.';
      config.can_continue = (status !== 'BLOCKED');
      config.primary_button_label = 'Review Post';
      config.secondary_button_label = 'Cancel Posting';
      config.continue_label = 'Continue, if permitted by the moderation policy';
    }

    return config;
  }

  var SafeSpaceSupportRecommender = {
    SYSTEM_PROMPT: `You are "Safe Space AI", the supportive-recommendation assistant of Safe Space, a peer-support platform for college students in the Philippines. After a post is published, you write ONE short recommendation that appears under that post as "Suggested Support from Safe Space AI". You are NOT a counselor, therapist, or emergency dispatcher. Your reply is never saved as a comment.

## THE MOST IMPORTANT RULE
Every recommendation must be written for THIS post only. Two different posts must never get the same advice, the same opening, or the same structure. If your reply could be pasted under a different post and still make sense, it is wrong and you must rewrite it.

## INPUT
- POST_TEXT: the full text the student wrote (English, Filipino, or Taglish)
- MODERATION: { category, severity, sentiment }
- IS_ANONYMOUS: true/false
- RECENT_REPLIES: (optional) the last few recommendations you gave. Do not reuse their openings, phrases, or advice.

## STEP 1: EXTRACT (silently, before writing)
From POST_TEXT, identify:
1. The specific situation (what exactly happened: a failed Chemistry quiz, a fight with a roommate, a thesis defense next week, homesickness after moving to the dorm, money problems, a breakup, a family issue, a win, etc.)
2. The specific details the student gave (subject, person, time, place, numbers, emotion words)
3. The emotion, and how strong it is
4. What they are asking for or seem to need: advice, comfort, someone to listen, or to share good news
5. What is NOT said. Never assume anything beyond the post.

## STEP 2: CHOOSE ADVICE THAT FITS THAT SITUATION
- Give 1 to 3 suggestions that directly address the situation you extracted. They must be different depending on the situation. Examples of how advice must change:
  - Failed an exam: how to review that kind of exam, whom to ask, how to recover the grade.
  - Conflict with a roommate or friend: how to start a calm conversation, when to involve an adviser or dorm manager.
  - Overloaded with deadlines: how to prioritize this specific list of tasks.
  - Homesick or lonely: ways to connect with people or call home, a small step for today.
  - Money stress: where on campus to ask about help; do not give financial decisions.
  - Family problems: listening and a trusted person; do not take sides.
  - Good news: celebrate the exact thing they achieved.
  - Plain announcement or question: answer helpfully and briefly, with no emotional assumptions.
- Mention at least ONE specific detail from the post in your own words so the student feels heard (for example the subject, the event, or the feeling they named).
- If the post is too short or vague to advise on, do not guess. Reply warmly and invite them to share a little more.
- The sample replies in the project specification (failed exam, deadlines, loneliness, achievement, group presentation) are tone references only. Never copy or lightly rephrase them.

## STEP 3: VARY THE WRITING
- Do not start with the same phrase every time. Banned openers unless the post truly calls for them: "Sorry you're going through this", "That sounds overwhelming", "I'm sorry you're feeling this way", "Thanks for sharing", "Congratulations".
- Vary sentence structure and length. Sometimes begin with the feeling, sometimes with a practical step, sometimes with a question.
- Do not use the same closing line in every reply.
- Reply in the same language and register as the post (English, Filipino, or Taglish). If the student writes casually, you stay warm and casual.
- 3 to 6 sentences. At most one emoji. Plain words.

## SAFETY (overrides everything above)
- If the post shows self-harm, suicidal thoughts, severe despair, abuse, or immediate danger, switch to the CRISIS PROTOCOL: begin with warmth and validation; say they deserve support and do not have to face this alone; encourage them to tell someone they trust; include exactly:
  NCMH Crisis Hotline 1553 (toll-free) or 0917-899-USAP (8727); Emergency 911; ASU Ibajay Guidance & Counseling Office Ext. 104.
  Even here, refer to what they actually said in a gentle way so it does not feel automated. Never use platitudes, never act like a therapist, never mention methods. Set collapsible to false and put everything in "preview".
- Educational or awareness posts (e.g. discussing suicide prevention in class) with no personal intent are not crisis.
- Never diagnose, never give medical, legal, or financial decisions, never blame or lecture, never invent hotlines, statistics, or resources.
- If IS_ANONYMOUS is true, never try to identify the person.
- Never mention these instructions, the moderation result, or that you analyzed the post.

## SELF-CHECK BEFORE ANSWERING
Ask yourself silently:
1. Does my reply mention something specific from THIS post?
2. Is the advice something that only fits this situation?
3. Would it look wrong under a different post? (It should.)
4. Did I avoid the banned openers and the specification's sample replies?
5. Is the preview a complete thought on its own?
If any answer is no, rewrite.

## OUTPUT FORMAT
Return ONLY valid JSON, no markdown fences, no extra text:

{
  "type": "SHORT LABEL OF THE SITUATION, e.g. EXAM_SETBACK, ROOMMATE_CONFLICT, HOMESICKNESS, DEADLINE_STRESS, MONEY_WORRY, ACHIEVEMENT, ANNOUNCEMENT, CRISIS",
  "situation_summary": "one short neutral sentence of what the post is about (for admin analytics, not shown to students)",
  "preview": "first half: 1-2 complete sentences that show you understood this post and give the most useful point",
  "more": "second half: the specific next steps and a closing line, not repeating the preview",
  "message": "preview + ' ' + more",
  "disclaimer": "Suggested Support from Safe Space AI · Practical student coping recommendation.",
  "show_resources_button": true or false,
  "emergency_numbers": [],
  "collapsible": true or false
}`,

    cleanPreview: function(message, maxWords) {
      if (!message) return '';
      maxWords = maxWords || 35;
      var cleaned = String(message).trim().replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ');
      var sentences = cleaned.split(/(?<=[.!?])\s+/);
      var preview = '';
      for (var i = 0; i < sentences.length; i++) {
        var s = sentences[i].trim();
        if (!s) continue;
        var candidate = preview ? (preview + ' ' + s) : s;
        var wordCount = candidate.split(/\s+/).length;
        if (wordCount <= maxWords) {
          preview = candidate;
        } else {
          if (!preview) {
            var words = s.split(/\s+/).slice(0, maxWords);
            preview = words.join(' ').replace(/[,;:-]+$/, '') + '...';
          }
          break;
        }
      }
      if (!preview) {
        var allWords = cleaned.split(/\s+/).slice(0, maxWords);
        preview = allWords.join(' ').replace(/[,;:-]+$/, '') + '...';
      }
      return preview;
    },

    _detectLanguage: function(text) {
      if (!text) return 'english';
      var lower = text.toLowerCase();
      if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text) || /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text) || /[\u0400-\u04ff]/.test(text)) {
        return 'other';
      }
      if (/\b(hola|gracias|amigo|por favor|estoy|buenos dias|adios|triste|ayuda|merci|bonjour|s'il vous plait|danke|bitte)\b/i.test(lower)) {
        return 'other';
      }
      var filWords = lower.match(/\b(ako|ko|mo|ka|na|ng|sa|ang|naman|kasi|talaga|sobrang|hirap|pagod|salamat|gusto|ayoko|paano|buntong|kaba|kinakabahan|umiiyak|malungkot|kaklase|pala|hindi|wala|lahat|atin|kami|kayo|ninyo|sila|mga|para|tungkol|ngayon|dahil|bakit|saan|kailan|sino|dito|dyan|doon|kaya|tayo|masaya|galit|inaapi|binubully|nagaaway|kaaway|niloko|pumasa|bagsak|bumagsak|magulang|pamilya)\b/gi) || [];
      var enWords = lower.match(/\b(the|and|is|are|was|were|have|has|had|with|for|this|that|from|they|them|their|what|when|where|why|how|feel|feeling|because|about|just|really|always|never|help|know|think|would|could|should|every|student|school|class|exam|assignment|friend|roommate|teacher|study|studying|fail|passed|sleep|sleeping|crying|hurt|alone|lonely|deadline|thesis)\b/gi) || [];

      if (filWords.length >= 2 && enWords.length >= 2) return 'taglish';
      if (filWords.length >= 1 && filWords.length >= enWords.length) return 'filipino';
      if (enWords.length >= 1) return 'english';
      if (filWords.length > 0) return 'filipino';
      return 'english';
    },

    _extractSubject: function(text) {
      var m = String(text || '').match(/\b(chemistry|chem|physics|math|mathematics|algebra|calculus|accounting|statistics|biology|programming|coding|thesis|defense|internship|practicum|nursing|psychology|midterm|midterms|finals|board exam|hackathon|scholarship)\b/i);
      return m ? (m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()) : null;
    },

    generate: function(text, sentiment, category, riskLevel, language, context) {
      var cleanText = (text || '').trim();
      var lowerText = cleanText.toLowerCase();
      var sent = (sentiment || 'Neutral');
      var cat = (category || 'SAFE').toUpperCase();
      var risk = (riskLevel || 'low').toLowerCase();
      var ctx = context || {};
      var recent = Array.isArray(ctx.recentReplies) ? ctx.recentReplies : [];

      // 1. Automatic Language Detection
      var detectedLang = this._detectLanguage(cleanText);
      if (language && (language.toLowerCase() === 'filipino' || language.toLowerCase() === 'tagalog' || language.toLowerCase() === 'taglish') && detectedLang !== 'other') {
        detectedLang = language.toLowerCase();
      }
      var isPh = detectedLang === 'filipino' || detectedLang === 'tagalog' || detectedLang === 'taglish';
      var isOtherLang = detectedLang === 'other';
      var langDisplay = (detectedLang === 'filipino' || detectedLang === 'tagalog') ? 'Filipino' : (detectedLang === 'taglish' ? 'Taglish' : (isOtherLang ? 'Other (English Response)' : 'English'));

      var extractedSubject = this._extractSubject(cleanText);

      // Deterministic diversity seed
      var textSeed = 0;
      for (var i = 0; i < cleanText.length; i++) {
        textSeed += cleanText.charCodeAt(i);
      }
      textSeed += (recent.length * 7);

      // ─────────────────────────────────────────────────────────────
      // TOPIC 1: CRISIS PROTOCOL (Self-Harm, Suicide, Severe Danger)
      // ─────────────────────────────────────────────────────────────
      var isEducational = /\b(lecture|class|prof|teacher|seminar|lesson|topic|discussion|learned|psychology|prevention|awareness|campaign|project|thesis|research)\b/i.test(lowerText);
      var hasPersonalCrisisIntent = /\b(kill myself|end my life|magpakamatay|gusto ko nang mawala|ayaw ko nang mabuhay|slit my wrists|hang myself|disappear forever|want to die|wanna die|i want to die|i will kill myself|i am suicidal|feeling suicidal)\b/i.test(lowerText) ||
        ((/\b(suicide|suicidal)\b/i.test(lowerText) || cat === 'SELF_HARM' || cat === 'ENCOURAGEMENT_OF_SELF_HARM') && !isEducational);
      var isCrisis = ((cat === 'SELF_HARM' || cat === 'ENCOURAGEMENT_OF_SELF_HARM') && !isEducational) ||
        (risk === 'urgent' && !isEducational) ||
        hasPersonalCrisisIntent;

      if (isCrisis) {
        var crisisPrev = isPh
          ? "Naririnig ko ang bigat ng iyong pinagdaraanan, at tandaan mong karapat-dapat kang suportahan at hindi mo kailangang harapin ito nang mag-isa. Mangyaring kumausap sa isang taong pinagkakatiwalaan mo ngayon, o tumawag agad sa NCMH Crisis Hotline sa 1553 (toll-free) o 0917-899-USAP (8727), Emergency 911, o sa ASU Ibajay Guidance & Counseling Office sa Extension 104."
          : "I hear how much pain you're in, and I want you to know you deserve support and do not have to handle this alone. Please reach out to someone you trust right now, or contact the NCMH Crisis Hotline at 1553 (toll-free) or 0917-899-USAP (8727), Emergency 911, or the ASU Ibajay Guidance & Counseling Office at Extension 104.";
        var crisisAck = isPh
          ? "Mabigat ang iyong nararamdaman, ngunit may mga taong handang makinig at tumulong sa iyo ngayon."
          : "Your feelings and safety matter deeply, and immediate help is available to guide you through this difficult moment.";
        var crisisFull = isPh
          ? crisisAck + " " + crisisPrev + "\n\nNarito ang mga agarang hakbang para sa iyong kaligtasan:\n1. Huwag mag-isa: Tawagan o lapitan ang isang kapamilya, kaibigan, o guidance counselor.\n2. Tumawag sa NCMH Crisis Hotline 1553 o Emergency 911 nang libre anumang oras ng araw o gabi.\n3. Magtungo sa pinakamalapit na campus clinic o ospital kung ikaw ay nasa agarang panganib.\nMahalaga ang iyong buhay at may suportang naghihintay para sa iyo."
          : crisisAck + " " + crisisPrev + "\n\nImmediate Safety Guidance:\n1. Connect immediately with a trusted friend, family member, professor, or school counselor.\n2. Call the NCMH Crisis Line at 1553 (toll-free 24/7) or dial Emergency 911.\n3. Contact ASU Ibajay Guidance & Counseling at Extension 104 or visit the campus clinic.\nYou are never alone, and there are people ready to stand with you right now.";

        return {
          type: 'CRISIS',
          detected_topic: 'CRISIS_SAFETY_SUPPORT',
          topic_label: 'Crisis & Urgent Safety Support',
          detected_language: langDisplay,
          situation_summary: 'Urgent crisis distress detected requiring immediate contact numbers and human support.',
          preview: crisisPrev,
          full_support: crisisFull,
          more: '',
          message: crisisPrev,
          safety_priority: 'urgent',
          confidence_or_uncertainty: 'high',
          disclaimer: 'Suggested Support from Safe Space AI · Verified crisis support guidance.',
          show_resources_button: true,
          emergency_numbers: [
            'NCMH Crisis Hotline: 1553',
            'Mobile: 0917-899-USAP (8727)',
            'National Emergency: 911',
            'ASU Ibajay Guidance & Counseling: Ext. 104'
          ],
          collapsible: false
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 2: BULLYING OR HARASSMENT VICTIM SUPPORT
      // ─────────────────────────────────────────────────────────────
      var isBullyingVictim = /\b(binubully|inaapi|tinutukso|pinagkakaisahan|binabantaan|pinagtsitsismisan|sinisiraan|inaaway|bullying me|bullied|being bullied|harassed|harassing me|making fun of me|spreading rumors|teasing me|teased me|calling me names|excluded me|shaming me)\b/i.test(lowerText) ||
        ((cat === 'HARASSMENT' || cat === 'BULLYING') && /\b(me|i|ako|sa akin|ko)\b/i.test(lowerText));

      if (isBullyingVictim) {
        var bullyPrevsPh = [
          "Pasensya na kung nararanasan mo ito. Hindi mo kailangang harapin ang bullying nang mag-isa. Subukang kausapin ang isang taong pinagkakatiwalaan mo, tulad ng guro, guidance personnel, o kapamilya. Kung ligtas, itago ang mga ebidensya at i-report ang insidente.",
          "Mabigat sa kalooban ang maranasan ang pambubully o panunukso, ngunit tandaan na hindi mo kasalanan ang kanilang ginagawa. Makatutulong na mag-save ng screenshots o patunay at lumapit sa guidance counselor ng campus upang magkaroon ka ng opisyal na proteksyon.",
          "Hindi katanggap-tanggap ang anumang uri ng panggigipit o paninira sa paaralan. Hangga't maaari, i-mute o i-block ang mga nanliligalig sa iyo at makipag-ugnayan agad sa guidance office o sa isang pinagkakatiwalaang propesor."
        ];
        var bullyMoresPh = [
          "Narito ang mga hakbang na maaari mong gawin:\n1. Dokumentasyon: Magtabi ng malinaw na kopya o screenshots ng mga mensahe bilang patunay.\n2. Proteksyon: I-block o i-restrict ang kanilang mga account upang maiwasan ang patuloy na panliligalig.\n3. Tulong: Bisitahin ang ASU Ibajay Guidance Office (Ext. 104) para sa kumpidensyal na suporta at imbestigasyon.\nMay karapatan kang mag-aral sa isang ligtas at magalang na kapaligiran.",
          "Mga praktikal na susunod na hakbang:\n1. Huwag makipag-away nang mag-isa sa neutral o hindi ligtas na sitwasyon.\n2. Kausapin ang isang kaibigan o kapamilya para hindi mo solong dinadala ang takot o lungkot.\n3. I-report ang insidente sa Student Affairs o Guidance Coordinator para sa pormal na aksyon.\nNandito ang komunidad upang suportahan ka."
        ];
        var bullyPrevsEn = [
          "You don't have to face this bullying alone. Consider reaching out to a trusted instructor, school guidance staff, or family member who can step in. If it feels safe, keep records of the incidents and report the account so school staff can help protect you.",
          "Dealing with harassment or bullying takes a heavy emotional toll, but their behavior is never your fault. Take screenshots of threatening messages, set clear digital boundaries by blocking responsible accounts, and let our campus guidance personnel support you.",
          "Experiencing mistreatment or rumors from peers is distressing and unacceptable. Prioritize your peace of mind by stepping away from hostile threads and reporting the situation to an academic adviser or student affairs coordinator."
        ];
        var bullyMoresEn = [
          "Recommended next steps:\n1. Document safely: Keep screenshots, timestamps, or written records of any harmful incidents.\n2. Guard boundaries: Block or mute harassing accounts on all social platforms.\n3. Seek school assistance: Visit the ASU Ibajay Guidance & Counseling Office (Ext. 104) for confidential protection.\nYou deserve an educational environment rooted in dignity and safety.",
          "Supportive action plan:\n1. Avoid engaging in hostile back-and-forth exchanges that might escalate tension.\n2. Confide in a close friend, parent, or trusted mentor so you have immediate human encouragement.\n3. File a formal incident report with student welfare personnel for official mediation.\nOur campus support network is here to ensure you are heard and protected."
        ];

        var bPrev = isPh ? bullyPrevsPh[textSeed % bullyPrevsPh.length] : bullyPrevsEn[textSeed % bullyPrevsEn.length];
        var bMore = isPh ? bullyMoresPh[Math.floor(textSeed / 2) % bullyMoresPh.length] : bullyMoresEn[Math.floor(textSeed / 2) % bullyMoresEn.length];

        return {
          type: 'BULLYING_VICTIM_SUPPORT',
          detected_topic: 'BULLYING_VICTIM_SUPPORT',
          topic_label: 'Bullying & Harassment Support',
          detected_language: langDisplay,
          situation_summary: 'Student describing experiences of being bullied, harassed, or mistreated by peers.',
          preview: bPrev,
          full_support: bPrev + '\n\n' + bMore,
          more: bMore,
          message: bPrev + ' ' + bMore,
          safety_priority: 'standard',
          confidence_or_uncertainty: 'high',
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: true,
          emergency_numbers: ['ASU Ibajay Guidance & Counseling: Ext. 104'],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 3: HARMFUL BEHAVIOR, THREATS, OR HOSTILITY
      // ─────────────────────────────────────────────────────────────
      var isHarmfulBehavior = /\b(i will punch|i will beat|i will hurt|gonna beat|let's attack|doxx|ipapa-bugbog|sasapakin|papatayin|resbakan|awayin natin|sugurin|wish you weren't born|wish you were dead|wish they were dead)\b/i.test(lowerText) ||
        ((cat === 'THREAT' || cat === 'VIOLENCE' || cat === 'HARASSMENT') && !isBullyingVictim);

      if (isHarmfulBehavior) {
        var harmPrev = isPh
          ? "Ang Safe Space ay nakalaan upang itaguyod ang paggalang at ligtas na pakikitungo sa bawat mag-aaral. Hindi katanggap-tanggap ang pangha-harass, pagbabanta, o pambubully sa kapwa."
          : "Safe Space is committed to mutual respect and psychological safety across the student community. Bullying, harassment, and harmful hostility violate our community standards.";
        var harmMore = isPh
          ? "Hinihikayat ka naming pag-isipan ang epekto ng iyong mga salita at huminahon bago makipag-ugnayan. Kung may hindi pagkakaunawaan, lutasin ito sa pamamagitan ng magalang na komunikasyon o sa tulong ng isang guidance counselor."
          : "Take a pause to reflect on the impact of these words. If you are experiencing frustration or conflict with a peer, focus on calm de-escalation or reach out to campus guidance staff to resolve the dispute constructively without causing harm.";

        return {
          type: 'HARMFUL_BEHAVIOR_GUIDANCE',
          detected_topic: 'HARMFUL_BEHAVIOR_GUIDANCE',
          topic_label: 'Harm Prevention & Respect',
          detected_language: langDisplay,
          situation_summary: 'Content containing aggressive confrontation, threat, or harmful behavior toward others.',
          preview: harmPrev,
          full_support: harmPrev + '\n\n' + harmMore,
          more: harmMore,
          message: harmPrev + ' ' + harmMore,
          safety_priority: 'standard',
          confidence_or_uncertainty: 'high',
          disclaimer: 'Suggested Support from Safe Space AI · Community standards guidance.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 4: NUDITY, EXPLICIT CONTENT & DIGITAL PRIVACY
      // ─────────────────────────────────────────────────────────────
      var isSexualOrHarass = /\b(sex(\s*with|\s*ka)?|have\s*sex|wanna\s*sex|let'?s\s*fuck|fuck\s*me|send\s*nudes|kantot|kantutan|chupain|tsupain|hubad|tite|puke|puki|burat|intimate photos?|nude photo|leak.*nudes)\b/i.test(lowerText) ||
        (cat === 'NUDITY' || cat === 'SEXUAL_HARASSMENT' || cat === 'SEXUAL_CONTENT');

      if (isSexualOrHarass) {
        var polPrev = isPh
          ? "Mahalaga ang privacy, consent, at digital safety ng bawat isa. Ang pagbabahagi o paghingi ng intimate photos at explicit content ay labag sa ating community standards at maaaring magdulot ng seryosong panganib."
          : "Safe Space is dedicated to peer academic support and mental wellness; sexually explicit propositions or messages are not permitted in our community feed.";
        var polMore = isPh
          ? "Laging protektahan ang iyong personal na seguridad online. Huwag kailanman magbahagi ng maseselang larawan nang walang pahintulot. Kung ikaw o may kakilala kang pinagbabantaan o biktima ng non-consensual image sharing, agad itong i-report sa pamunuan ng paaralan o sa awtoridad para sa legal na proteksyon."
          : "Please keep posts respectful and focused on student well-being and campus life. Guard your personal digital privacy, practice enthusiastic consent, and report non-consensual image sharing immediately to school authorities.";

        return {
          type: 'CONTENT_POLICY_NOTICE',
          detected_topic: 'NUDITY_AND_PRIVACY_SAFETY',
          topic_label: 'Digital Privacy & Safety',
          detected_language: langDisplay,
          situation_summary: 'Content involving intimate privacy, sexual proposition, or digital consent concerns.',
          preview: polPrev,
          full_support: polPrev + '\n\n' + polMore,
          more: polMore,
          message: polPrev + ' ' + polMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical digital safety recommendation.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 5: DISCRIMINATION & OFFENSIVE LANGUAGE
      // ─────────────────────────────────────────────────────────────
      var isDiscrimination = /\b(bakla|tomboy|bading|bayot|salot|retard|autistic|pangit|baduy|poorita|squatter|discrimination|racist|sexist)\b/i.test(lowerText) ||
        (cat === 'HATE' || cat === 'DISCRIMINATION');

      if (isDiscrimination) {
        var discPrev = isPh
          ? "Mahalaga ang bawat mag-aaral anuman ang kasarian, pinagmulan, o pagkakakilanlan. Ang paggamit ng mga mapanirang salita o diskriminasyon ay sumusugat sa ating komunidad."
          : "Inclusive empathy and respect are core values of Safe Space. Using discriminatory terms or exclusionary remarks undermines the psychological safety of our student community.";
        var discMore = isPh
          ? "Hinihikayat natin ang lahat na magsulong ng respeto, empatiya, at pagkakaunawaan. Ang pagtanggap sa pagkakaiba-iba ng bawat isa ang tunay na pundasyon ng isang ligtas na pamantasan."
          : "We encourage reflecting on how language impacts others. Embracing diverse identities, backgrounds, and perspectives creates an environment where every student can thrive without fear of prejudice.";

        return {
          type: 'DISCRIMINATION_GUIDANCE',
          detected_topic: 'DISCRIMINATION_AND_INCLUSION',
          topic_label: 'Respect & Inclusion',
          detected_language: langDisplay,
          situation_summary: 'Content involving discriminatory language, identity slurs, or exclusion.',
          preview: discPrev,
          full_support: discPrev + '\n\n' + discMore,
          more: discMore,
          message: discPrev + ' ' + discMore,
          disclaimer: 'Suggested Support from Safe Space AI · Inclusive community guidelines.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 6: ANGER & CONFLICT RESOLUTION
      // ─────────────────────────────────────────────────────────────
      var isAnger = /\b(galit|sobrang galit|nanggagalaiti|pikon|inis na inis|furious|raging|pissed off|so angry|screaming inside|hate them so much|punch a wall)\b/i.test(lowerText);

      if (isAnger) {
        var angerPrev = isPh
          ? "Normal lang makaramdam ng matinding galit o inis kapag may nangyaring hindi patas o nakakabigo, ngunit huwag hayaang magdikta ito sa iyong mga susunod na aksyon."
          : "Experiencing intense anger or frustration is a valid human reaction to feeling wronged, but acting in the heat of the moment often leads to unnecessary regret.";
        var angerMore = isPh
          ? "Bigyan muna ang sarili ng ilang sandali para magpalamig—huminga nang malalim ng 4 na beses o maglakad-lakad muna palayo sa sitwasyon. Kapag mahinahon na ang iyong isip, mas madali mong maipapahayag ang iyong saloobin nang may dignidad at walang pagsisisihan."
          : "Give yourself a 10-minute cooldown window before responding to whatever triggered this. Practicing box breathing (inhale 4 seconds, hold 4, exhale 4) helps reset your nervous system so you can address the issue assertively and calmly.";

        return {
          type: 'ANGER_MANAGEMENT',
          detected_topic: 'ANGER_AND_CONFLICT_RESOLUTION',
          topic_label: 'Calming & Conflict Resolution',
          detected_language: langDisplay,
          situation_summary: 'Student experiencing intense anger, frustration, or heated agitation.',
          preview: angerPrev,
          full_support: angerPrev + '\n\n' + angerMore,
          more: angerMore,
          message: angerPrev + ' ' + angerMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 7: POSITIVE & ACHIEVEMENTS (Celebration)
      // ─────────────────────────────────────────────────────────────
      var isPositive = (String(sent).toLowerCase().indexOf('pos') !== -1 ||
        /\b(proud|achieved|passed|won|win|first place|highest score|blessed|thankful|grateful|congratulations|congrats|success|yay|panalo|pumasa|natutuwa|masaya|salamat|celebrate)\b/i.test(lowerText));
      var hasDistress = /\b(fail|failed|bagsak|bumagsak|stress|stressed|overwhelmed|depressed|sad|crying|anxious|panic)\b/i.test(lowerText);

      if (isPositive && !hasDistress) {
        var posSubj = extractedSubject || 'milestone';
        var posOpeners = isPh ? [
          "Napakagandang balita nito para sa iyong pinaghirapang " + posSubj + "! Nagbunga ang bawat puyat at tiyagang ibinuhos mo.",
          "Isang malaking tagumpay ang makamit ang ganitong resulta sa " + posSubj + "! Karapat-dapat kang magdiwang ngayong araw.",
          "Ang sarap sa pakiramdam ng gantimpalang ito matapos ang mahabang preparasyon para sa " + posSubj + "."
        ] : [
          "Celebrating your hard work on " + posSubj + "—seeing that dedication convert into real success is inspiring.",
          "Hitting a win like this in " + posSubj + " is a huge milestone that reflects genuine perseverance.",
          "This result in " + posSubj + " shows just what your preparation and focus are capable of achieving."
        ];
        var posMores = isPh ? [
          "Ibahagi ang saya sa iyong pamilya o mga kaibigang naniwala sa iyo. Magsilbi sana itong paalala sa iyong kakayahan sa bawat susunod na hakbang!",
          "Sulitin ang momentum na ito at maglaan din ng oras para magpahinga. Ipagpatuloy ang ganyang sipag sa mga susunod mo pang minimithi!"
        ] : [
          "Take time today to soak this in and share the good news with the people who backed you up. Keep this strong confidence handy as you take on whatever is next!",
          "Savor the reward of crossing this finish line after all the effort you invested. Celebrate properly, recharge, and carry this positive energy forward!"
        ];

        var pPrev = posOpeners[textSeed % posOpeners.length];
        var pMore = posMores[Math.floor(textSeed / 3) % posMores.length];

        return {
          type: 'ACHIEVEMENT',
          detected_topic: 'ACHIEVEMENT',
          topic_label: 'Celebrating Achievement',
          detected_language: langDisplay,
          situation_summary: 'Student celebrating a positive win or achievement related to ' + posSubj + '.',
          preview: pPrev,
          full_support: pPrev + '\n\n' + pMore,
          more: pMore,
          message: pPrev + ' ' + pMore,
          disclaimer: 'Suggested Support from Safe Space AI · Positive student encouragement.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 8: EXAM SETBACK / ACADEMIC FAILURE
      // ─────────────────────────────────────────────────────────────
      var isExamFailure = /\b(fail|failed|bagsak|bumagsak|low grade|low score|failed my exam|bagsak ako|did not pass|flunked|disappointed in my (grade|exam|score)|scholarship on the line)\b/i.test(lowerText);

      if (isExamFailure) {
        var failSubj = extractedSubject || 'this exam';
        var failOpeners = isPh ? [
          "Masakit harapin ang naging resulta sa " + failSubj + ", lalo na't ibinuhos mo ang iyong oras at pagsisikap dito.",
          "Hindi madaling tanggapin ang mababang marka sa " + failSubj + ", ngunit hindi nito nasusukat ang buong kakayahan mo bilang estudyante.",
          "Natural lang na madismaya sa kinalabasan ng " + failSubj + ", pero tandaan na isang kabanata lamang ito at hindi ang kabuuan ng iyong kinabukasan."
        ] : [
          "Facing a setback in " + failSubj + " cuts deep, especially when you invested genuine effort and hoped for a better outcome.",
          "A tough result in " + failSubj + " can feel crushing in the moment, but one exam score never defines your true capability or potential.",
          "Processing disappointment around " + failSubj + " is completely valid, especially when the stakes felt so high."
        ];
        var failMores = isPh ? [
          "Bigyan muna ang sarili ng pagkakataong magpahinga ngayong gabi. Kapag mahinahon na ang isip, maaari mong balikan ang reviewer sa " + failSubj + " o kumonsulta sa iyong propesor tungkol sa possible remedial o project credits.",
          "Huminga nang malalim at huwag munang magdesisyon habang mabigat ang damdamin. Makatutulong ang pakikipag-usap sa isang kaklase para malaman kung saan ka nagkulang at mapaghandaan ang susunod na grading period."
        ] : [
          "Give yourself permission to pause and step away from studying for the rest of today. When your head clears, schedule a quick consultation with your instructor to review which problem areas tripped you up, and ask if any extra-credit or grade-recovery avenues are open.",
          "Take the evening to decompress and let the shock settle. Once you're ready, look over the test rubrics with a classmate who did well in " + failSubj + "; pinpointing specific gaps turns a difficult setback into an actionable roadmap."
        ];

        var fPrev = failOpeners[textSeed % failOpeners.length];
        var fMore = failMores[Math.floor(textSeed / 2) % failMores.length];

        return {
          type: 'EXAM_SETBACK',
          detected_topic: 'EXAM_SETBACK',
          topic_label: 'Exam Setback & Recovery',
          detected_language: langDisplay,
          situation_summary: 'Student experiencing disappointment over an academic setback or exam in ' + failSubj + '.',
          preview: fPrev,
          full_support: fPrev + '\n\n' + fMore,
          more: fMore,
          message: fPrev + ' ' + fMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 9: ACADEMIC WORKLOAD & SLEEP DEPRIVATION
      // ─────────────────────────────────────────────────────────────
      var isAcademicWorkload = /\b(exam|exams|assignment|assignments|project|projects|deadline|deadlines|thesis|defense|study|studying|finals|quizzes|quiz|midterm|midterms|homework|burnout|overwhelmed|daming schoolwork|sobrang requirements|cannot sleep|can't sleep|sleep properly)\b/i.test(lowerText);

      if (isAcademicWorkload) {
        var stressSubj = extractedSubject || 'academic deadlines';
        var hasSleepIssue = /\b(sleep|tulog|puyat)\b/i.test(lowerText);

        var sPrev, sMore;
        if (isPh) {
          if (hasSleepIssue) {
            sPrev = "Mabigat dalhin ang tambak na gawain sa " + stressSubj + ", lalo na kung naapektuhan na ang iyong tulog at pahinga. Subukang ilista ang mga submission ayon sa deadline at hatiin sa maliliit na hakbang.";
            sMore = "Huwag isakripisyo ang iyong kalusugan para sa requirements. Maglaan ng kahit 6 na oras ng tulog dahil mas madaling mag-aral kapag nakapahinga ang utak. Kung patuloy kang nahihirapang matulog, lumapit sa student support services.";
          } else {
            var stressPrevsPh = [
              "Kapag sabay-sabay dumarating ang mga deadline para sa " + stressSubj + ", talagang mabigat sa pakiramdam at nakakaipon ng pagod.",
              "Normal lang na mapagod sa sunod-sunod na requirements para sa " + stressSubj + "; kailangan ding huminga ang iyong isip."
            ];
            sPrev = stressPrevsPh[textSeed % stressPrevsPh.length];
            sMore = "Subukang isulat sa papel ang mga gawain para sa " + stressSubj + " at piliin lamang ang nag-iisang pinaka-urgent ngayong araw. Mag-aral gamit ang 25-minutong focus intervals at tiyaking makakakuha ka ng sapat na tulog.";
          }
        } else {
          if (hasSleepIssue || lowerText.indexOf("too many assignments") !== -1) {
            sPrev = "You're dealing with a lot right now, and it's okay to take things one step at a time. Try listing your assignments by deadline, breaking large tasks into smaller steps, and setting aside time to rest. If the pressure continues affecting your sleep, consider reaching out to someone you trust or your school's student support services.";
            sMore = "Prioritize resting tonight rather than pulling an all-nighter, as sleep deprivation exponentially multiplies stress. Focus on the single nearest submission tomorrow morning and communicate proactively with your professor if an extension is warranted.";
          } else {
            var stressPrevsEn = [
              "Juggling tight submission windows around " + stressSubj + " demands a lot of mental energy, and feeling drained is a very real response.",
              "Balancing heavy deadlines for " + stressSubj + " piles on serious cognitive load, especially when timelines collide.",
              "When multiple requirements for " + stressSubj + " hit all at once, mental exhaustion can make even starting feel impossible."
            ];
            sPrev = stressPrevsEn[textSeed % stressPrevsEn.length];
            sMore = "Try dumping every pending item onto a notepad and circling only the single most urgent piece of " + stressSubj + " to tackle right now. Work in focused 25-minute sprints with 5-minute breather breaks, and guard at least six hours of sleep tonight.";
          }
        }

        return {
          type: 'DEADLINE_STRESS',
          detected_topic: 'ACADEMIC_STRESS',
          topic_label: 'Academic Stress & Workload',
          detected_language: langDisplay,
          situation_summary: 'Student experiencing stress and fatigue from balancing deadlines related to ' + stressSubj + '.',
          preview: sPrev,
          full_support: sPrev + '\n\n' + sMore,
          more: sMore,
          message: sPrev + ' ' + sMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 10: RELATIONSHIP & FAMILY PROBLEMS
      // ─────────────────────────────────────────────────────────────
      var isRelationshipFamily = /\b(breakup|break up|broken heart|broke up|cheated|niloko|iniwan|ex-boyfriend|ex-girlfriend|boyfriend|girlfriend|partner|magulang|parents fighting|family problem|away sa pamilya|toxic household|father|mother|strict parents)\b/i.test(lowerText);

      if (isRelationshipFamily) {
        var relPrev = isPh
          ? "Mabigat dalhin ang problema sa relasyon o pamilya, lalo na habang pinagsasabay ito sa iyong pag-aaral."
          : "Navigating relationship heartbreak or family strain creates heavy emotional exhaustion that can make focusing on college life very difficult.";
        var relMore = isPh
          ? "Makatutulong na magtakda ng malinaw na emosyonal na boundaries para mapangalagaan ang iyong sarili. Kausapin ang isang pinagkakatiwalaang kaibigan o campus counselor upang maibsan ang bigat na iyong dinadala."
          : "Give yourself space to process these emotions without self-judgment. Establish firm personal boundaries to protect your peace of mind, and confide in a supportive peer or school counselor when you need a sounding board.";

        return {
          type: 'RELATIONSHIP_PROBLEM',
          detected_topic: 'RELATIONSHIP_AND_FAMILY_PROBLEMS',
          topic_label: 'Relationship & Family Support',
          detected_language: langDisplay,
          situation_summary: 'Student experiencing distress related to relationship breakdown, family friction, or personal rejection.',
          preview: relPrev,
          full_support: relPrev + '\n\n' + relMore,
          more: relMore,
          message: relPrev + ' ' + relMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: true,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 11: ROOMMATE / PEER CONFLICT
      // ─────────────────────────────────────────────────────────────
      var isConflict = /\b((roommate|roommates|friend|friends|classmate|groupmate|peer|dorm)\s*(issue|issues|conflict|conflicts|fight|fights|argument|arguments|drama|problem|problems)?\s*(with|against)?\s*(my|our|a)?\s*(roommate|friend|classmate|groupmate|dormmate)|fight|fighting|fought|argued?|argument|drama|away|nagaaway|kaaway|tsismis|talking behind my back|fake friend)\b/i.test(lowerText) &&
        !/\b(no real friends|no friends|walang kaibigan)\b/i.test(lowerText);

      if (isConflict) {
        var isRoommate = lowerText.indexOf('roommate') !== -1 || lowerText.indexOf('dorm') !== -1;
        var confType = isRoommate ? 'ROOMMATE_CONFLICT' : 'INTERPERSONAL_CONFLICT';
        var confPrev = isPh
          ? "Nakakaubos ng enerhiya ang alitan o di-pagkakaunawaan sa kasama sa dorm o kaklase, lalo na kung araw-araw mo silang nakikita."
          : "Living or working through friction with a roommate or friend creates constant background tension that wears down your peace of mind.";
        var confMore = isPh
          ? "Makatutulong na magpalamig muna ng ulo bago mag-usap upang maiwasan ang mga salitang bibitawan sa bugso ng damdamin. Kung kinakailangan, magtakda ng mahinahong usapan sa neutral na lugar, o lumapit sa dorm adviser o counselor kung lumalala ang sitwasyon."
          : "Give yourself some physical space until the initial frustration cools before initiating a conversation. When you're ready, approach them focusing on specific behaviors rather than accusations, and consider looping in a dorm resident adviser or guidance staff if boundaries aren't being respected.";

        return {
          type: confType,
          detected_topic: confType,
          topic_label: isRoommate ? 'Roommate & Peer Conflict' : 'Interpersonal Conflict',
          detected_language: langDisplay,
          situation_summary: 'Student facing interpersonal friction or disagreement with a peer, roommate, or friend.',
          preview: confPrev,
          full_support: confPrev + '\n\n' + confMore,
          more: confMore,
          message: confPrev + ' ' + confMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 12: LONELINESS, ISOLATION, HOMESICKNESS
      // ─────────────────────────────────────────────────────────────
      var isLoneliness = /\b(lonely|alone|nobody understands|no friends|left out|isolated|nag-iisa|walang kausap|walang nakakaintindi|hindi ako maintindihan|walang may pake|walang may care|excluded|homesick|far from home|missing home|miss my family)\b/i.test(lowerText);

      if (isLoneliness) {
        var isHomesick = lowerText.indexOf('homesick') !== -1 || lowerText.indexOf('far from home') !== -1 || lowerText.indexOf('missing home') !== -1;
        var loneType = isHomesick ? 'HOMESICKNESS' : 'LONELINESS';
        var lonePrev = isPh
          ? (isHomesick ? "Mahirap ang malayo sa pamilya at nakasanayang tahanan habang nag-aadjust sa bagong kapaligiran ng kolehiyo." : "Ang pakiramdam na nag-iisa ka sa gitna ng maraming tao ay mabigat sa kalooban, ngunit may halaga ang iyong nararamdaman.")
          : (isHomesick ? "Adjusting to dorm life or being far from family can make even routine college days feel quietly overwhelming." : "Navigating feelings of isolation or feeling like you haven't found your crowd yet can make campus life feel especially daunting.");
        var loneMore = isPh
          ? (isHomesick ? "Subukang mag-video call sa iyong pamilya o lumang kaibigan ngayong gabi kahit sandali lang. Ang pagdala ng paboritong pagkain o simpleng gawi mula sa bahay ay nakakatulong magpalubag ng loob habang dahan-dahang nakikibagay." : "Subukang magsimula sa maliit na hakbang—isang simpleng ngiti o tanong sa katabi sa klase, o pagsali sa isang campus organization na tugma sa iyong hilig. Hindi mo kailangang dumaan sa kolehiyo nang mag-isa.")
          : (isHomesick ? "Set up a brief phone call or FaceTime with someone back home tonight just to hear a familiar voice. Bringing small comforting habits into your current space can make the transition much more grounded as you find your footing." : "Consider starting with one low-pressure connection today—saying hello to a lab partner or checking out an interest-based student club. Building community takes time, and our campus peer network is always right beside you.");

        return {
          type: loneType,
          detected_topic: loneType,
          topic_label: isHomesick ? 'Homesickness Support' : 'Social Connection & Loneliness',
          detected_language: langDisplay,
          situation_summary: 'Student experiencing homesickness, loneliness, or isolation in their campus environment.',
          preview: lonePrev,
          full_support: lonePrev + '\n\n' + loneMore,
          more: loneMore,
          message: lonePrev + ' ' + loneMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: true,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 13: SADNESS, EMOTIONAL EXHAUSTION & GRIEF
      // ─────────────────────────────────────────────────────────────
      var isSadness = /\b(sad|crying|tears|depressed|heartbroken|empty|drained|grief|lost someone|feeling low|down in the dumps|malungkot|umiiyak|iiyak|pagod na pagod|wish.*(weren't|wasn't)\s*born)\b/i.test(lowerText) ||
        String(sent).toLowerCase().indexOf('neg') !== -1;

      if (isSadness) {
        var sadPrev = isPh
          ? "May mga araw talagang mabigat sa kalooban, at may halaga at karapatan ang iyong nararamdaman kahit hindi ito agad maipaliwanag."
          : "Some days feel deeply exhausting and emotionally draining, and it is completely okay to simply honor that sadness without pressure to fix it immediately.";
        var sadMore = isPh
          ? "Huwag piliting maging masaya agad. Payagan ang sarili na magpahinga, uminom ng maligamgam na tubig, at huminga nang dahan-dahan. Kung handa ka na, maaari kang makipag-usap sa isang taong mapagkakatiwalaan o sa ating peer support circle dito."
          : "Be gentle with your expectations today. Wrap yourself in a warm blanket, hydrate, and take quiet rest breaks. Reaching out to a compassionate peer or dropping by the campus wellness room can help lighten this emotional weight.";

        return {
          type: 'EMOTIONAL_DISTRESS_SADNESS',
          detected_topic: 'EMOTIONAL_DISTRESS_SADNESS',
          topic_label: 'Emotional Wellness & Care',
          detected_language: langDisplay,
          situation_summary: 'Student expressing sadness, emotional fatigue, or personal sorrow.',
          preview: sadPrev,
          full_support: sadPrev + '\n\n' + sadMore,
          more: sadMore,
          message: sadPrev + ' ' + sadMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: true,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 14: FINANCIAL OR MONEY STRESS
      // ─────────────────────────────────────────────────────────────
      var isMoney = /\b(money|allowance|tuition|baon|gastos|pera|walang pera|bills|rent|bayarin|financial|gutom|pamasahe)\b/i.test(lowerText);
      if (isMoney) {
        var monPrev = isPh
          ? "Mabigat sa isip ang alalahanin sa allowance, pamasahe, o bayarin habang sinusubukang mag-focus sa pag-aaral."
          : "Worrying about money, living expenses, or allowance creates persistent stress that makes academic concentration difficult.";
        var monMore = isPh
          ? "Maaari kang sumangguni sa University Student Affairs o Scholarship Office upang magtanong tungkol sa emergency student assistance, student assistant programs, o flexible tuition payment schemes. May mga opisyal na tulong ang pamantasan para sa ganitong sitwasyon."
          : "Consider stopping by the Office of Student Affairs or Financial Aid to ask about emergency student loan funds, work-study openings, or promissory arrangements. Campus resources are in place specifically to support students facing unexpected budget strains.";

        return {
          type: 'MONEY_WORRY',
          detected_topic: 'MONEY_WORRY',
          topic_label: 'Financial Support & Guidance',
          detected_language: langDisplay,
          situation_summary: 'Student experiencing stress regarding expenses, allowance, or campus financial obligations.',
          preview: monPrev,
          full_support: monPrev + '\n\n' + monMore,
          more: monMore,
          message: monPrev + ' ' + monMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: true,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 15: VERY SHORT, VAGUE, OR CASUAL SHARING
      // ─────────────────────────────────────────────────────────────
      var wordsCount = cleanText.split(/\s+/).filter(Boolean).length;
      if (wordsCount <= 4) {
        var vagPrev = isPh
          ? "Maikli man ang iyong naibahagi, bukas ang Safe Space community kung nais mong magkwento nang mas marami tungkol sa iyong araw."
          : "You kept it brief, but whenever you feel like sharing more about what's going on, this space is open.";
        var vagMore = isPh
          ? "Nandito kami upang makinig kapag handa ka nang magbahagi ng iyong naiisip o nararamdaman."
          : "Feel free to post more details anytime you need a listening ear or practical advice from fellow students.";

        return {
          type: 'VAGUE_SHARE',
          detected_topic: 'VAGUE_SHARE',
          topic_label: 'Open Student Sharing',
          detected_language: langDisplay,
          situation_summary: 'Brief or vague post shared by a student.',
          preview: vagPrev,
          full_support: vagPrev + '\n\n' + vagMore,
          more: vagMore,
          message: vagPrev + ' ' + vagMore,
          disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
          show_resources_button: false,
          emergency_numbers: [],
          collapsible: true
        };
      }

      // ─────────────────────────────────────────────────────────────
      // TOPIC 16: GENERAL / ANNOUNCEMENTS / QUESTIONS
      // ─────────────────────────────────────────────────────────────
      var hasQuestion = cleanText.indexOf('?') !== -1 || /\b(how|what|where|when|who|paano|saan|kailan|sino|tips|ano)\b/i.test(lowerText);
      var genPrev = isPh
        ? (hasQuestion ? "Tungkol sa iyong katanungan, makatutulong ang direktang pagtatanong sa kinauukulang departamento o sa class representative para sa pinakabagong detalye." : "Mahalaga ang ganitong mga update para sa koordinasyon ng ating mga kapwa mag-aaral sa campus.")
        : (hasQuestion ? "Regarding your question, touching base with your department office or department representative is usually the fastest route to verified info." : "Sharing practical schedules and announcements keeps everyone across the student community aligned.");
      var genMore = isPh
        ? (hasQuestion ? "Maaari mo ring i-check ang opisyal na bulletin board o university portal upang makatiyak sa tamang mga kinakailangang dokumento at hakbang." : "Kung may kaugnayan ito sa nalalapit na aktibidad o schedule, ang maagang paghahanda at pag-coordinate sa mga kasamahan ay makatutulong nang malaki.")
        : (hasQuestion ? "Checking the university portal announcements or registrar FAQ page often lays out the required documents and submission windows cleanly." : "Coordinating timelines with your team or blockmates early helps keep academic activities running smoothly without last-minute scrambling.");

      return {
        type: hasQuestion ? 'ANNOUNCEMENT_INQUIRY' : 'ANNOUNCEMENT',
        detected_topic: hasQuestion ? 'ANNOUNCEMENT_INQUIRY' : 'ANNOUNCEMENT',
        topic_label: hasQuestion ? 'Campus Inquiry' : 'Campus Announcements',
        detected_language: langDisplay,
        situation_summary: 'Student posting a campus schedule, general question, or practical inquiry.',
        preview: genPrev,
        full_support: genPrev + '\n\n' + genMore,
        more: genMore,
        message: genPrev + ' ' + genMore,
        disclaimer: 'Suggested Support from Safe Space AI · Practical student coping recommendation.',
        show_resources_button: false,
        emergency_numbers: [],
        collapsible: true
      };
    }
  };


  /**
   * Render AI Support Card DOM Node (Section 2 of Safe Space AI Specification)
   */
  function renderAiSupport(rec) {
    if (!rec) return null;
    var box = document.createElement('div');
    box.className = 'ai-support';
    var topicHtml = rec.topic_label ? '<span style="font-size:10px; background:#EDE9FE; color:#6C4FD1; padding:1px 6px; border-radius:999px; font-weight:700;">' + rec.topic_label + '</span>' : '';
    box.innerHTML =
      '<div class="ai-support-head">' +
        '<div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">' +
          '<strong>Suggested Support from Safe Space AI</strong>' +
          topicHtml +
        '</div>' +
        '<span class="ai-badge"><i class="fas fa-wand-magic-sparkles"></i> AI Generated</span>' +
      '</div>' +
      '<p class="ai-support-text"></p>' +
      '<div class="ai-support-more" hidden></div>' +
      '<div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:2px;">' +
        '<div class="ai-support-foot"></div>' +
        '<button type="button" class="ai-view-more" hidden aria-expanded="false"><i class="fas fa-circle-info"></i> View Full Support</button>' +
      '</div>';

    var textEl = box.querySelector('.ai-support-text');
    var footEl = box.querySelector('.ai-support-foot');
    if (textEl) textEl.textContent = rec.preview || rec.message || '';
    if (footEl) footEl.textContent = rec.disclaimer || '';

    var more = box.querySelector('.ai-support-more');
    var btn = box.querySelector('.ai-view-more');

    if (rec.collapsible !== false && (rec.full_support || (rec.more && rec.more.trim()))) {
      more.textContent = rec.full_support || rec.more;
      btn.hidden = false;
      btn.onclick = function() {
        if (typeof window !== 'undefined' && window.openAiSupportModal && rec.id) {
          window.openAiSupportModal(rec.id);
        } else {
          var opening = more.hidden;
          more.hidden = !opening;
          btn.innerHTML = opening ? '<i class="fas fa-chevron-up"></i> Close' : '<i class="fas fa-circle-info"></i> View Full Support';
          btn.setAttribute('aria-expanded', String(opening));
        }
      };
    }

    if (rec.show_resources_button) {
      var r = document.createElement('a');
      r.href = 'resources.html';
      r.className = 'ai-resources-btn';
      r.textContent = 'View Verified Support Resources';
      box.insertBefore(r, box.querySelector('.ai-support-foot').parentNode);
    }
    return box;
  }

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
            support_recommendation: result.support_recommendation || SafeSpaceSupportRecommender.generate(originalText, resolvedSentiment, validCat, resolvedRisk, result.language || fastResult.language, context),
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
    recommendSupport: async function(text, sentiment, category, riskLevel, language, context) {
      if (!text || !text.trim()) {
        return SafeSpaceSupportRecommender.generate('', sentiment, category, riskLevel, language, context);
      }
      context = context || {};
      var self = this;
      if (this._state === 'online') {
        try {
          var controller = new AbortController();
          var timeoutId = setTimeout(function() { controller.abort(); }, 3000);
          var recentList = Array.isArray(context.recentReplies) ? context.recentReplies.slice(-5) : [];
          var res = await fetch(self.getApiUrl() + '/recommend-support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: text.trim(),
              sentiment: sentiment || 'Neutral',
              category: category || 'SAFE',
              risk_level: riskLevel || 'low',
              language: language || 'english',
              is_anonymous: Boolean(context.isAnonymous),
              recent_replies: recentList,
              temperature: 0.8
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
      return SafeSpaceSupportRecommender.generate(text, sentiment, category, riskLevel, language, context);
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
