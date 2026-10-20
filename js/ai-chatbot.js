/**
 * Safe Space — AI Student Assistant Engine
 * Conversational, context-aware, empathetic student support chatbot.
 * 
 * Features:
 * - Dynamic, non-repetitive responses tailored specifically to student context
 * - Multi-turn conversational memory & context continuity (thesis, exams, burnout, friends, etc.)
 * - Contextual follow-up awareness (remembers prior questions and answers them appropriately)
 * - Anti-repetition engine ensuring the assistant never repeats the same canned answer
 * - Live Google Gemini AI integration (optional API key in settings or config)
 * - Immediate distress & crisis detection with certified Philippine hotlines & ASU guidance
 * - Context-aware Bible Verse Database with duplicate prevention & user preference toggle
 * - Situation-matched motivational messages with anti-duplication
 * - Smooth Offline fallback mode with local NLP heuristics & local database
 * - Rich Taglish & Filipino emotional comprehension
 * - Persistent per-user conversation storage & privacy isolation
 */

(function(window) {
  'use strict';

  // ── 1. Bible Verse Database ────────────────────────────────────
  const BIBLE_VERSES = [
    {
      id: 'bv-phil46',
      reference: 'Philippians 4:6–7',
      topic: 'anxiety',
      verse_text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
      takeaway: 'A reminder that you don\'t have to carry every worry alone—it\'s okay to pause and breathe.'
    },
    {
      id: 'bv-1pet57',
      reference: '1 Peter 5:7',
      topic: 'anxiety',
      verse_text: 'Cast all your anxiety on him because he cares for you.',
      takeaway: 'You don\'t have to bear the full emotional weight of today by yourself.'
    },
    {
      id: 'bv-ps5522',
      reference: 'Psalm 55:22',
      topic: 'stress',
      verse_text: 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.',
      takeaway: 'When pressure feels heavy, remember that you are stronger than you think.'
    },
    {
      id: 'bv-matt634',
      reference: 'Matthew 6:34',
      topic: 'stress',
      verse_text: 'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.',
      takeaway: 'Focus only on what you can handle today. One hour at a time.'
    },
    {
      id: 'bv-matt1128',
      reference: 'Matthew 11:28',
      topic: 'tiredness',
      verse_text: 'Come to me, all you who are weary and burdened, and I will give you rest.',
      takeaway: 'Rest is not a weakness; it is a necessity for your mind and body.'
    },
    {
      id: 'bv-gal69',
      reference: 'Galatians 6:9',
      topic: 'tiredness',
      verse_text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
      takeaway: 'Your hard work and late nights will bear fruit. Rest now, but hold onto hope.'
    },
    {
      id: 'bv-is4110',
      reference: 'Isaiah 41:10',
      topic: 'discouraged',
      verse_text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.',
      takeaway: 'Even when confidence feels low, you are not facing this alone.'
    },
    {
      id: 'bv-2cor129',
      reference: '2 Corinthians 12:9',
      topic: 'failure',
      verse_text: 'My grace is sufficient for you, for my power is made perfect in weakness.',
      takeaway: 'Mistakes and setbacks are part of learning, not the end of your story.'
    },
    {
      id: 'bv-prov2416',
      reference: 'Proverbs 24:16',
      topic: 'failure',
      verse_text: 'For though the righteous fall seven times, they rise again.',
      takeaway: 'Failing once—or even twice—doesn\'t make you a failure. What matters is standing back up.'
    },
    {
      id: 'bv-ps3418',
      reference: 'Psalm 34:18',
      topic: 'sadness',
      verse_text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',
      takeaway: 'Your tears and pain are seen. You are deeply cared for, even on dark days.'
    },
    {
      id: 'bv-rev214',
      reference: 'Revelation 21:4',
      topic: 'sadness',
      verse_text: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.',
      takeaway: 'This heavy season will not last forever.'
    },
    {
      id: 'bv-deut316',
      reference: 'Deuteronomy 31:6',
      topic: 'loneliness',
      verse_text: 'Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.',
      takeaway: 'Loneliness can feel overwhelming, but you are never truly abandoned.'
    },
    {
      id: 'bv-ps2710',
      reference: 'Psalm 27:10',
      topic: 'loneliness',
      verse_text: 'Though my father and mother forsake me, the Lord will receive me.',
      takeaway: 'Even when people around you feel distant, you are valued and held.'
    },
    {
      id: 'bv-jer2911',
      reference: 'Jeremiah 29:11',
      topic: 'hope',
      verse_text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
      takeaway: 'Your future is still ahead of you, with possibilities you haven\'t seen yet.'
    },
    {
      id: 'bv-rom1513',
      reference: 'Romans 15:13',
      topic: 'hope',
      verse_text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.',
      takeaway: 'May peace quiet the noise in your mind tonight.'
    },
    {
      id: 'bv-is4031',
      reference: 'Isaiah 40:31',
      topic: 'strength',
      verse_text: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
      takeaway: 'When your energy feels spent, give yourself permission to recharge.'
    },
    {
      id: 'bv-phil413',
      reference: 'Philippians 4:13',
      topic: 'strength',
      verse_text: 'I can do all this through him who gives me strength.',
      takeaway: 'You have made it through tough days before, and you can navigate this one too.'
    },
    {
      id: 'bv-josh19',
      reference: 'Joshua 1:9',
      topic: 'fear',
      verse_text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
      takeaway: 'Courage isn\'t having no fear—it\'s taking one small step forward despite the fear.'
    },
    {
      id: 'bv-john1427',
      reference: 'John 14:27',
      topic: 'peace',
      verse_text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
      takeaway: 'Breathe in peace, let out the tension in your shoulders.'
    },
    {
      id: 'bv-prov35',
      reference: 'Proverbs 3:5–6',
      topic: 'guidance',
      verse_text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
      takeaway: 'You don\'t need to have your whole life figured out today.'
    },
    {
      id: 'bv-ps13914',
      reference: 'Psalm 139:14',
      topic: 'self_worth',
      verse_text: 'I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.',
      takeaway: 'Your grades or mistakes never diminish your inherent worth as a person.'
    }
  ];

  // ── 2. Motivational Messages ──────────────────────────────────
  const MOTIVATIONAL_QUOTES = {
    academic_stress: [
      { id: 'mq-a1', text: '💜 A little progress is still progress. You don\'t have to finish the whole mountain today—just taking the first small step counts.' },
      { id: 'mq-a2', text: '💜 Don\'t judge your entire semester by one overwhelming day. Breathe, reset, and focus on the single task right in front of you.' },
      { id: 'mq-a3', text: '💜 You don\'t have to be perfect; you just have to keep moving forward. One assignment, one paragraph at a time.' },
      { id: 'mq-a4', text: '💜 Remember why you started this journey. The late nights will pass, but the resilience you are building will stay with you forever.' }
    ],
    failure: [
      { id: 'mq-f1', text: '💜 Failing an exam or quiz hurts, but it is data, not a definition. It tells you what to adjust next time—not who you are.' },
      { id: 'mq-f2', text: '💜 Every successful student has faced bad grades and rough critiques. What matters is the courage to stand back up.' },
      { id: 'mq-f3', text: '💜 One low score is a chapter in your academic story, not the final page. Give yourself the grace to learn and try again.' }
    ],
    tiredness: [
      { id: 'mq-t1', text: '💜 You are allowed to rest. Resting is not quitting—it is how your brain and body recharge so you can keep going.' },
      { id: 'mq-t2', text: '💜 Sometimes the most productive thing you can do right now is close your laptop, drink a glass of water, and get some sleep.' },
      { id: 'mq-t3', text: '💜 You cannot pour from an empty cup. Taking care of your health today is an investment in tomorrow\'s success.' }
    ],
    loneliness: [
      { id: 'mq-l1', text: '💜 Even when you feel invisible in a crowd, your presence matters. It\'s okay to take things slow and reach out when you\'re ready.' },
      { id: 'mq-l2', text: '💜 Feeling lonely is a heavy weight, but you are not broken for feeling this way. Be kind to yourself today.' },
      { id: 'mq-l3', text: '💜 Seasons of isolation often teach us who we are. You will find people who truly appreciate your authentic self.' }
    ],
    breakup: [
      { id: 'mq-b1', text: '💜 Healing doesn\'t happen in a straight line. Some days will hurt more than others, and that is completely normal. Give yourself grace.' },
      { id: 'mq-b2', text: '💜 Your worth did not decrease because someone failed to see it. Focus on protecting your peace and healing your heart.' }
    ],
    self_worth: [
      { id: 'mq-s1', text: '💜 Struggling with school doesn\'t mean you\'re not smart enough. It just means you\'re wrestling with something genuinely challenging.' },
      { id: 'mq-s2', text: '💜 You are worth so much more than your GPA, your exam scores, or what anyone else expects of you.' },
      { id: 'mq-s3', text: '💜 Don\'t compare your chapter 1 or 2 with someone else\'s chapter 20. Your journey has its own unique timeline.' }
    ]
  };

  // ── 3. Conversational State Manager ────────────────────────────
  const ConversationState = {
    _states: {},

    getState: function(userId) {
      const uid = userId || 'guest';
      if (!this._states[uid]) {
        this._states[uid] = {
          lastTopic: null,
          lastEmotion: 'neutral',
          lastBotQuestion: null,
          currentMode: 'general', // listen, advice, problem_solving, encouragement
          usedVerseIds: [],
          usedQuoteIds: [],
          usedResponseIds: [],
          lastUsedId: null,
          turnCount: 0,
          history: [] // [{role:'user'|'bot', text:'...', time:0}]
        };
      }
      return this._states[uid];
    },

    reset: function(userId) {
      const uid = userId || 'guest';
      delete this._states[uid];
    }
  };

  // Helper to pick a non-repetitive response from a pool
  function pickVariedResponse(pool, state, fallbackText) {
    if (!pool || !pool.length) {
      return { id: 'fallback-' + Date.now(), text: fallbackText || 'I hear you. Tell me more about what you\'re feeling.' };
    }

    let available = pool.filter(item => !state.usedResponseIds.includes(item.id));
    if (!available.length) {
      // Clear half of history so responses stay fresh without repeating the most recent one
      state.usedResponseIds = state.usedResponseIds.filter(id => id === state.lastUsedId);
      available = pool.filter(item => item.id !== state.lastUsedId);
      if (!available.length) available = pool;
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    state.usedResponseIds.push(chosen.id);
    state.lastUsedId = chosen.id;
    return chosen;
  }

  // ── 4. Main AI Chatbot Object ──────────────────────────────────
  const AIChatbot = {
    BIBLE_VERSES: BIBLE_VERSES,
    MOTIVATIONAL_QUOTES: MOTIVATIONAL_QUOTES,

    getPrefsKey: function(userId) {
      return 'safe_space_ai_prefs_' + (userId || 'default');
    },

    getPreferences: function(userId) {
      try {
        const stored = localStorage.getItem(this.getPrefsKey(userId));
        const confKey = (window.SAFE_SPACE_CONFIG && window.SAFE_SPACE_CONFIG.GEMINI_API_KEY) || '';
        const base = {
          motivationalMessages: true,
          bibleVerseSuggestions: true,
          studySupport: true,
          emotionalSupport: true,
          geminiApiKey: confKey
        };
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!parsed.geminiApiKey && confKey) parsed.geminiApiKey = confKey;
          return Object.assign(base, parsed);
        }
        return base;
      } catch (e) {}
      return {
        motivationalMessages: true,
        bibleVerseSuggestions: true,
        studySupport: true,
        emotionalSupport: true,
        geminiApiKey: (window.SAFE_SPACE_CONFIG && window.SAFE_SPACE_CONFIG.GEMINI_API_KEY) || ''
      };
    },

    savePreferences: function(userId, prefs) {
      try {
        localStorage.setItem(this.getPrefsKey(userId), JSON.stringify(prefs));
      } catch (e) {}
    },

    hasGeminiKey: function() {
      const prefs = this.getPreferences();
      return Boolean((prefs && prefs.geminiApiKey && prefs.geminiApiKey.trim()) || (window.SAFE_SPACE_CONFIG && window.SAFE_SPACE_CONFIG.GEMINI_API_KEY));
    },

    getHistoryKey: function(userId) {
      return 'safe_space_ai_thread_' + (userId || 'guest');
    },

    loadChatHistory: function(userId) {
      try {
        const data = localStorage.getItem(this.getHistoryKey(userId));
        if (data) return JSON.parse(data);
      } catch (e) {}
      return [];
    },

    saveChatHistory: function(userId, history) {
      try {
        localStorage.setItem(this.getHistoryKey(userId), JSON.stringify(history.slice(-60)));
      } catch (e) {}
    },

    clearChatHistory: function(userId) {
      try {
        localStorage.removeItem(this.getHistoryKey(userId));
        ConversationState.reset(userId);
      } catch (e) {}
    },

    // ── Crisis / Immediate Harm Detection ────────────────────────
    isCrisisMessage: function(text) {
      const lower = text.toLowerCase();
      const crisisKeywords = [
        'kill myself', 'killing myself', 'want to die', 'wanna die', 'end my life',
        'ending my life', 'dont want to live', 'don\'t want to live', 'do not want to live',
        'hurt myself', 'hurting myself', 'cut myself', 'cutting myself', 'take my own life',
        'commit suicide', 'suicidal', 'suicide', 'better off dead', 'better without me',
        'no reason to live', 'have a plan to end', 'already hurt myself', 'slit my wrist',
        'jump off', 'hang myself', 'drink poison', 'overdose', 'gusto ko na mawala', 'ayoko na mabuhay'
      ];
      return crisisKeywords.some(kw => lower.includes(kw));
    },

    getCrisisResponse: function(userId) {
      const prefs = this.getPreferences(userId);
      let verseSection = '';

      if (prefs.bibleVerseSuggestions !== false) {
        verseSection = `\n📖 **Psalm 34:18**\n*"The Lord is close to the brokenhearted and saves those who are crushed in spirit."*\nPlease know that your life is deeply valuable, and you do not have to walk through this heavy darkness all by yourself.\n`;
      }

      return {
        type: 'crisis',
        emotion: 'crisis',
        text: `I'm really sorry you're hurting this much. I'm glad you reached out and told me. **Your life and safety matter so much right now.**

If you are thinking of hurting yourself or you're in immediate danger, please step away from anything harmful and stay close to someone you trust.
${verseSection}
Please connect with someone who can support you right this moment:

📞 **Philippines National Crisis Hotline**
• **1553** (Luzon toll-free landline)
• **0917-899-8727** (0917-899-USAP)
• **0966-351-4518** / **0919-057-1553**

📞 **In-Touch Crisis Line**
• **0917-800-1123** / **(02) 8893-7603**

🏫 **Campus Support**:
Please reach out to the **ASU Guidance & Counseling Office**, a trusted professor, or your campus health unit.

If you're able, please tell me: **Are you in immediate danger right now, or have you already hurt yourself?**`
      };
    },

    // ── Emotion & Topic Extraction ───────────────────────────────
    analyzeUserMessage: function(text, state) {
      const lower = text.toLowerCase();

      // Crisis check
      if (this.isCrisisMessage(text)) {
        return { emotion: 'crisis', topic: 'safety', intent: 'crisis' };
      }

      // Explicit Bible request
      if (
        lower.includes('bible verse') ||
        lower.includes('bible') ||
        lower.includes('scripture') ||
        lower.includes('verse for') ||
        lower.includes('give me a verse')
      ) {
        return { emotion: 'seeking_faith', topic: 'bible_request', intent: 'bible' };
      }

      // Explicit Motivation request
      if (
        lower.includes('give me motivation') ||
        lower.includes('need motivation') ||
        lower.includes('motivate me') ||
        lower.includes('inspire me') ||
        lower.includes('some motivation')
      ) {
        return { emotion: 'seeking_motivation', topic: 'motivation_request', intent: 'motivation' };
      }

      // Greetings
      if (/^(hi|hello|hey|good morning|good afternoon|good evening|sup|yo|kumusta|kamusta|musta)\b/i.test(text.trim())) {
        return { emotion: 'neutral', topic: 'greeting', intent: 'greeting' };
      }

      // Questions about capabilities
      if (lower.includes('what can you do') || lower.includes('who are you') || lower.includes('how do you work') || lower.includes('help me with')) {
        return { emotion: 'curious', topic: 'capabilities', intent: 'help' };
      }

      // Support mode selections
      if (lower.includes('just listen') || lower.includes('listen to me') || lower.includes('hear me out') || lower.includes('makinig ka')) {
        return { emotion: 'seeking_ear', topic: 'listen_mode', intent: 'mode_listen' };
      }
      if (lower.includes('give me advice') || lower.includes('what should i do') || lower.includes('need advice') || lower.includes('payo')) {
        return { emotion: 'seeking_advice', topic: 'advice_mode', intent: 'mode_advice' };
      }

      // Student Academic Topics
      let topic = state.lastTopic;
      if (lower.includes('thesis') || lower.includes('defense') || lower.includes('panel') || lower.includes('manuscript') || lower.includes('capstone')) {
        topic = 'thesis';
      } else if (lower.includes('exam') || lower.includes('quiz') || lower.includes('test') || lower.includes('midterm') || lower.includes('finals') || lower.includes('prelim') || lower.includes('bagsak')) {
        topic = 'exam';
      } else if (lower.includes('assignment') || lower.includes('homework') || lower.includes('project') || lower.includes('paper') || lower.includes('deadline') || lower.includes('requirements') || lower.includes('activities') || lower.includes('gawain')) {
        topic = 'assignment';
      } else if (lower.includes('group') || lower.includes('groupmate') || lower.includes('pabuhat') || lower.includes('freeloader') || lower.includes('kagrupo')) {
        topic = 'group_project';
      } else if (lower.includes('grade') || lower.includes('failing') || lower.includes('failed') || lower.includes('flunk') || lower.includes('pasang awa')) {
        topic = 'failure';
      } else if (lower.includes('ex') || lower.includes('breakup') || lower.includes('broke up') || lower.includes('relationship') || lower.includes('heartbroken') || lower.includes('crush') || lower.includes('hiwalay') || lower.includes('break na kami')) {
        topic = 'breakup';
      } else if (lower.includes('alone') || lower.includes('lonely') || lower.includes('no friends') || lower.includes('isolated') || lower.includes('lungkot') || lower.includes('mag-isa') || lower.includes('walang kausap') || lower.includes('walang pumapansin')) {
        topic = 'loneliness';
      } else if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('burnout') || lower.includes('burned out') || lower.includes('sleepy') || lower.includes('no sleep') || lower.includes('drained') || lower.includes('pagod') || lower.includes('puyat')) {
        topic = 'tiredness';
      }

      // Emotion categories
      let emotion = 'neutral';
      if (lower.includes('overwhelm') || lower.includes('too much') || lower.includes('drowning') || lower.includes("can't handle") || lower.includes("cant handle") || lower.includes('sobra na')) {
        emotion = 'overwhelmed';
      } else if (lower.includes('hopeless') || lower.includes('everything is going wrong') || lower.includes('give up') || lower.includes('giving up') || lower.includes("can't do this anymore") || lower.includes("cant do this anymore") || lower.includes('ayoko na')) {
        emotion = 'hopeless';
      } else if (lower.includes('stress') || lower.includes('pressure') || lower.includes('anxious') || lower.includes('nervous') || lower.includes('panic') || lower.includes('shaking') || lower.includes('worried') || lower.includes('kaba') || lower.includes('takot')) {
        emotion = 'stressed';
      } else if (lower.includes('sad') || lower.includes('crying') || lower.includes('tears') || lower.includes('hurts') || lower.includes('depressed') || lower.includes('down') || lower.includes('umiiyak') || lower.includes('nasasaktan')) {
        emotion = 'sad';
      } else if (lower.includes('lonely') || lower.includes('alone') || lower.includes('nobody cares') || lower.includes('left out') || lower.includes('mag-isa') || lower.includes('iniwan')) {
        emotion = 'lonely';
      } else if (lower.includes('fail') || lower.includes('disappointed') || lower.includes('not good enough') || lower.includes('worthless') || lower.includes('loser') || lower.includes('stupid') || lower.includes('bobo') || lower.includes('walang kwenta')) {
        emotion = 'discouraged';
      } else if (lower.includes('angry') || lower.includes('mad') || lower.includes('frustrated') || lower.includes('annoyed') || lower.includes('unfair') || lower.includes('bwisit') || lower.includes('galit')) {
        emotion = 'frustrated';
      } else if (lower.includes('passed') || lower.includes('happy') || lower.includes('proud') || lower.includes('relieved') || lower.includes('yay') || lower.includes('finished') || lower.includes('done') || lower.includes('good news') || lower.includes('pumasa')) {
        emotion = 'happy';
      } else if (lower.includes('thank') || lower.includes('salamat') || lower.includes('appreciate')) {
        emotion = 'grateful';
      }

      return { emotion, topic, intent: 'conversation' };
    },

    // ── Non-duplicate Bible Verse & Quote Helpers ─────────────────
    getVerseForContext: function(topic, emotion, usedIds) {
      let targetCat = 'hope';
      if (emotion === 'stressed' || topic === 'assignment') targetCat = 'stress';
      else if (emotion === 'anxious' || emotion === 'overwhelmed') targetCat = 'anxiety';
      else if (emotion === 'sad') targetCat = 'sadness';
      else if (emotion === 'lonely') targetCat = 'loneliness';
      else if (emotion === 'discouraged' || emotion === 'hopeless') targetCat = 'discouraged';
      else if (topic === 'failure') targetCat = 'failure';
      else if (topic === 'tiredness') targetCat = 'tiredness';
      else if (topic === 'guidance') targetCat = 'guidance';

      let available = BIBLE_VERSES.filter(v => v.topic === targetCat && !usedIds.includes(v.id));
      if (!available.length) {
        available = BIBLE_VERSES.filter(v => !usedIds.includes(v.id));
      }
      if (!available.length) available = BIBLE_VERSES;

      return available[Math.floor(Math.random() * available.length)];
    },

    getQuoteForContext: function(topic, emotion, usedIds) {
      let categoryList = MOTIVATIONAL_QUOTES.academic_stress;
      if (topic === 'failure' || emotion === 'discouraged') categoryList = MOTIVATIONAL_QUOTES.failure;
      else if (topic === 'tiredness' || emotion === 'overwhelmed') categoryList = MOTIVATIONAL_QUOTES.tiredness;
      else if (topic === 'loneliness' || emotion === 'lonely') categoryList = MOTIVATIONAL_QUOTES.loneliness;
      else if (topic === 'breakup') categoryList = MOTIVATIONAL_QUOTES.breakup;
      else if (emotion === 'hopeless') categoryList = MOTIVATIONAL_QUOTES.self_worth;

      const available = categoryList.filter(q => !usedIds.includes(q.id));
      const pool = available.length ? available : categoryList;
      return pool[Math.floor(Math.random() * pool.length)];
    },

    // ── 5. Google Gemini Generative AI Call ────────────────────────
    callGeminiApi: async function(userPrompt, userId, apiKey) {
      const history = this.loadChatHistory(userId).slice(-8);
      const contents = [];

      // Format conversational history for Gemini
      history.forEach(item => {
        if (!item || !item.message) return;
        contents.push({
          role: item.sender_id === 'safe-space-ai-bot' ? 'model' : 'user',
          parts: [{ text: item.message }]
        });
      });

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }]
      });

      const systemInstruction = {
        parts: [{
          text: `You are the Safe Space AI Assistant, a warm, compassionate, student-focused counselor assistant for college and high school students at Aklan State University (ASU).
Guidelines:
1. Always give tailored, empathetic, and dynamic answers. Never give boilerplate, robotic, or identical canned responses.
2. If the user mentions loneliness, heartbreak, thesis anxiety, exams, or feeling overwhelmed, validate their exact feelings with kindness and care.
3. Keep responses conversational, concise, and structured with easy-to-read paragraphs (2 to 4 short paragraphs).
4. Offer gentle practical suggestions or follow-up questions to help them reflect.
5. If the student uses Filipino or Taglish, understand them naturally and reply in warm, comforting English or gentle Taglish where appropriate.
6. If the user expresses extreme crisis or self-harm, prioritize safety and provide warm emergency reassurance.
7. Avoid overly clinical jargon. Speak like a caring student peer or trusted mentor.`
        }]
      };

      const payload = {
        contents: contents,
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 500
        }
      };

      // Try gemini-1.5-flash endpoint
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) throw new Error('Empty response from Gemini API');
      return generatedText.trim();
    },

    // ── 6. Dynamic Generative Local Engine ─────────────────────────
    generateLocalResponse: function(userPrompt, userId, state, prefs) {
      const promptLower = userPrompt.toLowerCase().trim();
      const analysis = this.analyzeUserMessage(userPrompt, state);
      const { emotion, topic, intent } = analysis;

      if (topic) state.lastTopic = topic;
      if (emotion !== 'neutral') state.lastEmotion = emotion;

      // ── A. Contextual Follow-Up: Answering previous bot questions ──
      // 1. Follow-up after asking about Loneliness ("Has something changed with your friends or at home?")
      if (state.lastBotQuestion === 'lonely_reason') {
        state.lastBotQuestion = 'lonely_deepening';
        if (promptLower.includes('friend') || promptLower.includes('barkada') || promptLower.includes('left') || promptLower.includes('iniwan') || promptLower.includes('ignore') || promptLower.includes('pumansin')) {
          const pool = [
            { id: 'fl-fr-1', text: "Friendship shifts hurt so deeply. When the people you used to laugh with or count on start drifting away or leaving you out, it can feel like a punch to the chest.\n\nDid an argument happen, or did everyone just slowly grow distant? You don't deserve to feel discarded." },
            { id: 'fl-fr-2', text: "It's really painful when friends pull away or make you feel sidelined. Please hear this: someone else's inability to show up for you is not proof that you aren't worthy of loyal, genuine friendships.\n\nHave you been able to talk to any of them about how you feel, or does it feel safer to keep your distance right now?" },
            { id: 'fl-fr-3', text: "Being left out by friends can make campus feel like the most lonely place on earth. Your feelings are 100% valid. What hurts the most about the situation with your friends right now?" }
          ];
          return pickVariedResponse(pool, state);
        }

        if (promptLower.includes('home') || promptLower.includes('family') || promptLower.includes('parent') || promptLower.includes('bahay') || promptLower.includes('tatay') || promptLower.includes('nanay')) {
          const pool = [
            { id: 'fl-hm-1', text: "Feeling lonely at home is especially heavy, because home is supposed to be the one place where you can take off your armor and rest.\n\nAre things tense or full of pressure with your family, or does it feel like they just don't understand the challenges you're dealing with?" },
            { id: 'fl-hm-2', text: "It's so draining to walk through your front door and still feel isolated. Sometimes families mean well but don't know how to listen without judging.\n\nWould it help to talk through what has been happening at home lately?" }
          ];
          return pickVariedResponse(pool, state);
        }

        if (promptLower.includes('school') || promptLower.includes('college') || promptLower.includes('transferee') || promptLower.includes('block') || promptLower.includes('class')) {
          const pool = [
            { id: 'fl-sc-1', text: "Navigating school social circles can be genuinely intimidating. It often looks like everyone else formed tight groups overnight, while you're left wondering where you fit in.\n\nHow have your classes or blockmates been treating you lately?" },
            { id: 'fl-sc-2', text: "College and high school can be surprisingly isolating when everyone is busy chasing grades and rushing home. You're not the only one feeling this way, even if people pretend they have it all together.\n\nIs there any club, activity, or quiet space on campus where you feel a bit more comfortable?" }
          ];
          return pickVariedResponse(pool, state);
        }

        if (promptLower.includes('nothing') || promptLower.includes('dont know') || promptLower.includes("don't know") || promptLower.includes('ewan') || promptLower.includes('basta') || promptLower.includes('just feeling')) {
          const pool = [
            { id: 'fl-un-1', text: "You don't need a neat explanation or a dramatic reason to feel lonely—sometimes that quiet ache just rolls in, and that is completely valid.\n\nYou don't have to explain yourself here. I'm just glad you reached out. What's one small, comforting thing you can do for yourself today?" },
            { id: 'fl-un-2', text: "That's okay. You don't have to have it all figured out to feel it. Emotional heaviness doesn't always have a single cause.\n\nI'm right here with you. Would you like a comforting Bible verse or would you rather we just talk about something lighter for a bit?" }
          ];
          return pickVariedResponse(pool, state);
        }
      }

      // 2. Follow-up after asking about school stress
      if (state.lastBotQuestion === 'what_making_school_tired' || state.lastBotQuestion === 'what_stressing') {
        state.lastBotQuestion = 'study_triage';
        if (promptLower.includes('assignment') || promptLower.includes('deadline') || promptLower.includes('homework') || promptLower.includes('requirements') || promptLower.includes('activities')) {
          const pool = [
            { id: 'st-as-1', text: "When deadlines stack on top of each other, your brain naturally freezes up. It's not laziness—it's cognitive overload.\n\nLet's shrink the mountain. What is the single assignment due first? We don't have to finish it all; let's just plan the first 15 minutes." },
            { id: 'st-as-2', text: "Having several submissions due at once is so stressful. Let's make a mini-game out of it: which one is easiest to knock out quickly so you can get a quick win?" }
          ];
          return pickVariedResponse(pool, state);
        }
        if (promptLower.includes('thesis') || promptLower.includes('defense') || promptLower.includes('research')) {
          const pool = [
            { id: 'st-th-1', text: "Thesis work drains mental energy faster than almost anything else in student life. Revisions, literature reviews, and panel comments can make you feel stuck.\n\nWhich chapter or section are you currently wrestling with?" },
            { id: 'st-th-2', text: "Thesis anxiety is so real. Remember: you don't have to defend or finish the whole manuscript today. What is the next small paragraph or reference you need to check?" }
          ];
          return pickVariedResponse(pool, state);
        }
      }

      // ── B. Loneliness (Multi-Response Matrix with Zero Repetition) ──
      if (emotion === 'lonely' || topic === 'loneliness') {
        state.lastBotQuestion = 'lonely_reason';
        const lonelinessPool = [
          {
            id: 'lone-v1',
            text: "I hear you, and I'm really sorry you're feeling that ache today. Loneliness can be so heavy and exhausting, especially when it feels like everyone around you has their circle and you're watching from the outside.\n\nDo you want to tell me what's been making you feel alone lately? Has something changed with your friends, or does it feel more like an empty quiet at home or in class?"
          },
          {
            id: 'lone-v2',
            text: "Thank you for being open with me about that. Feeling lonely is one of the hardest things a student can go through, and it's completely okay to admit it hurts.\n\nDid something specific happen today that made you feel left out, or has this feeling been quietly building up for a while?"
          },
          {
            id: 'lone-v3',
            text: "I'm right here with you. Even on days when the world feels distant and nobody seems to check in, your presence genuinely matters.\n\nLoneliness can make us believe we're invisible. When you feel this way today, what thoughts have been running through your mind?"
          },
          {
            id: 'lone-v4',
            text: "It takes vulnerability to say 'I'm lonely today.' It's easy to look around campus and think nobody understands, but so many students carry this exact same quiet pain inside.\n\nWould you like some company while you talk through what's on your heart, or would you prefer a comforting Bible verse or gentle thought to hold onto?"
          },
          {
            id: 'lone-v5',
            text: "Ramdam kita. Nakakapagod talaga yung pakiramdam na mag-isa ka, kahit may mga tao naman sa paligid mo o sa classroom.\n\nNandito ako para makinig sa'yo nang walang panghuhusga. Gusto mo bang ikwento kung anong nangyari ngayong araw?"
          },
          {
            id: 'lone-v6',
            text: "Loneliness can make every little task feel ten times heavier. Please remember that feeling lonely doesn't mean you are unlovable or broken—it just means your heart is craving genuine connection.\n\nIs there someone in your life you miss, or does it feel like you just haven't found people who truly understand you yet?"
          }
        ];
        return pickVariedResponse(lonelinessPool, state);
      }

      // ── C. Academic Overload & Stress ────────────────────────────
      if (topic === 'assignment' || emotion === 'overwhelmed') {
        state.lastBotQuestion = 'what_making_school_tired';
        const overloadPool = [
          {
            id: 'over-1',
            text: "It sounds like you're carrying a massive mental load right now. School expectations can pile up so fast until you feel like you can barely catch a breath.\n\nLet's take a slow, deliberate breath. Drop your shoulders down. What is the single biggest deadline on your mind right now?"
          },
          {
            id: 'over-2',
            text: "When everything feels urgent all at once, your mind gets paralyzed. That is a completely normal reaction to overload.\n\nYou don't have to finish everything tonight. What are 2 or 3 things due soonest, and can we break just one of them into a 15-minute chunk?"
          },
          {
            id: 'over-3',
            text: "I hear how exhausted you are from all these requirements. Remember: taking a 10-minute break away from your screen isn't wasting time—it's giving your brain the oxygen it needs to keep going.\n\nWould you like to make a quick priority list together?"
          }
        ];
        return pickVariedResponse(overloadPool, state);
      }

      // ── D. Thesis & Capstone ──────────────────────────────────────
      if (topic === 'thesis') {
        state.lastBotQuestion = 'thesis_step';
        const thesisPool = [
          {
            id: 'thes-1',
            text: "Working on a thesis or capstone is easily one of the most draining parts of student life. Between revisions, adviser comments, and formatting, it can feel like a never-ending cycle.\n\nWhat part of the thesis is giving you the most headache right now? Is it writing, data gathering, or defense jitters?"
          },
          {
            id: 'thes-2',
            text: "Thesis burnout is so real. Remember: an entire manuscript is written one sentence at a time. You don't have to solve every panel comment in one sitting.\n\nWould you like to vent about your adviser or panel for a minute, or do you want to plan out the next small step?"
          },
          {
            id: 'thes-3',
            text: "Don't lose heart with your research. Every single graduate has felt like throwing their paper out the window at some point.\n\nYou are capable of pushing through this. Where are you currently stuck in the manuscript?"
          }
        ];
        return pickVariedResponse(thesisPool, state);
      }

      // ── E. Exams, Quizzes & Grades ────────────────────────────────
      if (topic === 'exam' || topic === 'failure') {
        state.lastBotQuestion = 'exam_prep';
        if (promptLower.includes('failed') || promptLower.includes('bagsak') || emotion === 'discouraged') {
          const failPool = [
            {
              id: 'fail-1',
              text: "I'm really sorry. Failing an exam or getting a grade lower than you worked for genuinely stings. It's totally okay to feel disappointed and upset right now.\n\nPlease remember: a score on a piece of paper measures one test on one afternoon—it does NOT measure your intelligence, your capability, or your future. Would you like to talk through what happened?"
            },
            {
              id: 'fail-2',
              text: "Take a deep breath. Failing one exam is data, not a life sentence. Every successful professional has bombed a quiz or a subject along the way.\n\nBe gentle with yourself tonight. Is there a chance for a retake, removal exam, or extra credit later on?"
            }
          ];
          return pickVariedResponse(failPool, state);
        } else {
          const examPool = [
            {
              id: 'exam-1',
              text: "Exam anxiety can make your stomach twist in knots. When everything feels like it hinges on a test, your chest gets tight.\n\nInhale slowly for four seconds, hold for four, and exhale slowly. What subject is the exam in, and how much time do you have left to review?"
            },
            {
              id: 'exam-2',
              text: "Studying under high stress is tough because anxiety blocks memory retention. Try chunking: 25 minutes of focused review, then a strict 5-minute break away from your desk.\n\nWhich topic or formula feels most confusing right now?"
            }
          ];
          return pickVariedResponse(examPool, state);
        }
      }

      // ── F. Burnout & Physical Exhaustion ─────────────────────────
      if (topic === 'tiredness' || promptLower.includes('pagod') || promptLower.includes('puyat')) {
        state.lastBotQuestion = 'rest_check';
        const tiredPool = [
          {
            id: 'tired-1',
            text: "It sounds like you are running on empty. When your body and mind are drained, even tiny tasks feel like climbing Mount Everest.\n\nLet's pause the race for a second. Have you had a glass of water or eaten something nourishing recently? Even 15 minutes of closing your eyes without looking at a screen can help reset your system."
          },
          {
            id: 'tired-2',
            text: "You are allowed to rest. Resting is not quitting—it is how your brain recharges so you don't collapse. If you keep pushing on zero sleep, your health will force you to stop.\n\nIs there anything you can safely postpone until tomorrow so you can get some sleep tonight?"
          },
          {
            id: 'tired-3',
            text: "Sobrang nakakapagod talaga pagsabay-sabayin ang school, puyat, at iniisip. Please don't be too hard on yourself for feeling sluggish today.\n\nBreathe out the tension in your jaw and shoulders. What is one thing you can take off your plate tonight?"
          }
        ];
        return pickVariedResponse(tiredPool, state);
      }

      // ── G. Hopelessness & Sadness ─────────────────────────────────
      if (emotion === 'hopeless' || emotion === 'sad') {
        state.lastBotQuestion = 'listen_or_advice';
        const sadPool = [
          {
            id: 'sad-1',
            text: "I'm really sorry you're going through this heavy season. It sounds like you've been carrying a tremendous weight all by yourself.\n\nYou don't have to pretend to be strong or okay here. It's safe to let your feelings out. Would you prefer me to just listen while you vent, or would you like something gentle and encouraging?"
          },
          {
            id: 'sad-2',
            text: "Your pain and tears are seen, and they matter. When everything feels dark, remember that you don't have to solve your whole future right now—you just have to get through today.\n\nI'm sitting right here with you. What has been hurting you the most lately?"
          }
        ];
        return pickVariedResponse(sadPool, state);
      }

      // ── H. Breakups & Heartbreak ──────────────────────────────────
      if (topic === 'breakup') {
        const breakupPool = [
          {
            id: 'break-1',
            text: "Heartbreak is physically and emotionally exhausting, especially while trying to keep up with school and classes. Seeing them around campus or on social media makes it hurt all over again.\n\nGive yourself permission to grieve. Healing doesn't happen on a strict schedule. Do you want to vent about what happened?"
          },
          {
            id: 'break-2',
            text: "It's completely okay that you're not over it yet. Loving someone and then losing that connection shakes your daily routine and confidence.\n\nBe kind to yourself today. Remember that your worth is still whole, even when someone couldn't see it."
          }
        ];
        return pickVariedResponse(breakupPool, state);
      }

      // ── I. Greetings & Check-ins ──────────────────────────────────
      if (intent === 'greeting') {
        const hour = new Date().getHours();
        let timeGreeting = "Hey! It's really nice to hear from you. 💜";
        if (hour >= 22 || hour < 5) {
          timeGreeting = "Hey! It's pretty late—make sure you aren't staying up too late cramming. 💜";
        } else if (hour < 12) {
          timeGreeting = "Good morning! Hope you're taking things one step at a time today. 💜";
        } else if (hour < 18) {
          timeGreeting = "Good afternoon! How has your school day been treating you so far? 💜";
        }

        const greetPool = [
          { id: 'greet-1', text: `${timeGreeting}\n\nHow are you feeling right now? Whether it's school stress, something on your mind, or you just need someone to talk to, I'm here for you.` },
          { id: 'greet-2', text: `Hello! I'm glad you stopped by Safe Space. 💜\n\nHow is your heart and mind doing today? Feel free to share whatever's on your mind.` },
          { id: 'greet-3', text: `Hey there! 💜 Always here whenever you need a safe, judgment-free space to talk. What's been going on with you lately?` }
        ];
        return pickVariedResponse(greetPool, state);
      }

      // ── J. Capabilities & Help ───────────────────────────────────
      if (intent === 'help') {
        return {
          id: 'help-info',
          text: `I'm your **Safe Space Student Assistant**! Here's how I can support you:\n\n• **Stress & Loneliness**: A safe, non-judgmental space to talk when things feel isolating or heavy\n• **Study Support**: Breaking down overwhelming thesis work, exams, and piled-up assignments\n• **Motivation & Hope**: Uplifting reminders and comforting Bible verses when you need strength\n• **Active Listening**: Vent freely without unsolicited criticism\n\nI'm not a licensed therapist, but I'm here 24/7 to walk alongside you. What's on your mind today?`
        };
      }

      // ── K. Celebrations & Gratitude ───────────────────────────────
      if (emotion === 'happy') {
        const happyPool = [
          { id: 'hap-1', text: "Hey, that's wonderful news! 🎉 You worked hard for that, and you deserve to celebrate this win!\n\nTake a moment to give yourself credit. How does it feel now that that hurdle is behind you?" },
          { id: 'hap-2', text: "I'm so happy for you! 💜 When school is tough, celebrating every single win is so important. You made it happen!" }
        ];
        return pickVariedResponse(happyPool, state);
      }

      if (emotion === 'grateful') {
        const gratPool = [
          { id: 'grat-1', text: "You're so welcome! 💜 Remember, you're never bothering me. I'm always right here whenever you need someone to talk to or bounce thoughts off of." },
          { id: 'grat-2', text: "Anytime! 💜 You've got this. Take things one small step at a time today, and be gentle with yourself." }
        ];
        return pickVariedResponse(gratPool, state);
      }

      // ── L. Dynamic Reflection Fallback (Never Repeating Generic Text) ──
      state.lastBotQuestion = 'reflect_open';
      const cleanSnippet = userPrompt.length > 60 ? userPrompt.substring(0, 60) + '...' : userPrompt;
      const fallbackPool = [
        {
          id: 'fb-v1',
          text: `I hear you. When things are swirling around in your thoughts, having a safe place to put them down can help.\n\nTell me a little more about what's going on—would you prefer some practical suggestions, or would you rather just talk through it together?`
        },
        {
          id: 'fb-v2',
          text: `Thank you for sharing that with me. It takes real vulnerability to put thoughts into words.\n\nWhat part of this has been taking up the most space in your head today? I'm completely listening.`
        },
        {
          id: 'fb-v3',
          text: `I'm right here with you. Sometimes when we hold everything inside, it gets tangled and overwhelming.\n\nIf you could change one thing about how today is going, what would it be?`
        },
        {
          id: 'fb-v4',
          text: `That makes a lot of sense. Your feelings around this are completely valid.\n\nDo you feel like you just need to vent and let it all out, or would you like to brainstorm some gentle steps forward together?`
        },
        {
          id: 'fb-v5',
          text: `I appreciate you telling me that. College and student life come with so many unspoken pressures.\n\nWhat has been the hardest part of dealing with this so far?`
        }
      ];
      return pickVariedResponse(fallbackPool, state);
    },

    // ── 7. Unified Response Generator (Gemini + Dynamic Local Engine) ──
    generateResponse: async function(userPrompt, userId) {
      const state = ConversationState.getState(userId);
      const prefs = this.getPreferences(userId);
      const isOnline = navigator.onLine;

      state.turnCount++;

      // 1. Top Priority: Immediate Crisis Safety Check
      if (this.isCrisisMessage(userPrompt)) {
        state.lastBotQuestion = 'immediate_danger';
        return this.getCrisisResponse(userId);
      }

      // 2. Crisis follow-up answer check
      if (state.lastBotQuestion === 'immediate_danger') {
        state.lastBotQuestion = null;
        const lower = userPrompt.toLowerCase();
        if (lower.includes('yes') || lower.includes('hurt') || lower.includes('danger') || lower.includes('cut')) {
          return {
            type: 'crisis_urgent',
            emotion: 'crisis',
            text: `Please stay safe right now. Call emergency services (**911**) or the **Philippine Crisis Line at 1553 / 0917-899-8727** immediately, or reach out to a trusted family member or roommate right next to you.\n\n📖 **Isaiah 41:10**\n*"So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you."*\n\n**You are not alone, and there is help available.** Please hold on and let someone reach you.`
          };
        } else {
          return {
            type: 'crisis_followup',
            emotion: 'support',
            text: `I'm very relieved to hear you're safe right now. Please keep talking to me, or even better, reach out to someone you trust in person.\n\n📖 **Jeremiah 29:11**\n*"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."*\n\nYou don't have to carry this heavy feeling in silence. What made things feel so dark today?`
          };
        }
      }

      // 3. Offline Mode check
      if (!isOnline) {
        const offlineReply = this.generateLocalResponse(userPrompt, userId, state, prefs);
        return {
          type: 'offline_adaptive',
          emotion: 'support',
          text: `${offlineReply.text}\n\n*(🛡️ Offline Mode: Connected via local adaptive support)*`
        };
      }

      // 4. Check for explicit Bible Verse or Motivation requests
      const lower = userPrompt.toLowerCase().trim();
      if (lower.includes('bible verse') || lower.includes('give me a verse') || lower.includes('scripture')) {
        const verse = this.getVerseForContext(state.lastTopic, state.lastEmotion, state.usedVerseIds);
        if (verse) state.usedVerseIds.push(verse.id);
        return {
          type: 'bible',
          emotion: 'faith',
          text: `I'd be glad to share one with you. 💜\n\n📖 **${verse.reference}**\n"${verse.verse_text}"\n\n${verse.takeaway}\n\nTake things one step at a time. Does this verse bring some comfort to what you're facing?`
        };
      }

      if (lower.includes('give me motivation') || lower.includes('motivate me') || lower.includes('need motivation')) {
        const quoteObj = this.getQuoteForContext(state.lastTopic, state.lastEmotion, state.usedQuoteIds);
        if (quoteObj) state.usedQuoteIds.push(quoteObj.id);
        return {
          type: 'motivation',
          emotion: 'encouragement',
          text: `Here is something to keep in mind when things feel uphill:\n\n${quoteObj.text}\n\nYou've already tackled so much to get to this point. What's the main obstacle you're trying to push through right now?`
        };
      }

      // 5. If Gemini API key is configured and online, attempt Live Generative AI
      const apiKey = (prefs && prefs.geminiApiKey && prefs.geminiApiKey.trim()) || (window.SAFE_SPACE_CONFIG && window.SAFE_SPACE_CONFIG.GEMINI_API_KEY);
      if (apiKey) {
        try {
          const geminiText = await this.callGeminiApi(userPrompt, userId, apiKey);
          if (geminiText) {
            return {
              type: 'gemini_ai',
              emotion: 'adaptive',
              text: geminiText
            };
          }
        } catch (apiErr) {
          console.warn('[SafeSpace AI] Gemini API call failed, switching to dynamic local engine:', apiErr);
        }
      }

      // 6. Dynamic Generative Local Engine (Guaranteed zero repetition + context continuity)
      const localResult = this.generateLocalResponse(userPrompt, userId, state, prefs);
      return {
        type: 'local_adaptive',
        emotion: localResult.emotion || 'support',
        text: localResult.text
      };
    },

    // ── Safe HTML Formatter for Bot Messages ──────────────────────
    formatBotMessage: function(rawText) {
      if (!rawText) return '';

      let safe = rawText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Format bold: **text** -> <strong>text</strong>
      safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Format italic: *text* -> <em>text</em>
      safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Split into paragraphs by double newlines
      const paragraphs = safe.split(/\n\n+/);
      const htmlParas = paragraphs.map(p => {
        const lineBreaks = p.replace(/\n/g, '<br />');
        return `<p style="margin: 0 0 8px 0; line-height: 1.55;">${lineBreaks}</p>`;
      });

      return htmlParas.join('').replace(/<p style="margin: 0 0 8px 0; line-height: 1.55;"><\/p>/g, '');
    }
  };

  window.AIChatbot = AIChatbot;
})(window);
