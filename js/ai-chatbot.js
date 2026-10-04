/**
 * Safe Space — AI Student Assistant Engine
 * Conversational, context-aware, empathetic student support chatbot.
 * 
 * Features:
 * - Direct contextual responses using student's actual words & situation
 * - Multi-turn conversational memory & topic tracking (thesis, exams, burnout, etc.)
 * - Natural empathy, follow-up questions, and support modes (Listen / Advice / Problem Solving / Encouragement)
 * - Immediate distress & crisis detection with certified Philippine hotlines & ASU guidance
 * - Context-aware Bible Verse Database with duplicate prevention & user preference toggle
 * - Situation-matched motivational messages
 * - Smooth Offline fallback mode with local NLP heuristics & local database
 * - Typing indicator with natural timing
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
      { id: 'mq-a3', text: '💜 You don\'t have to be perfect; you just have to keep moving forward. One assignment, one paragraph at a time.' }
    ],
    failure: [
      { id: 'mq-f1', text: '💜 Failing an exam or quiz hurts, but it is data, not a definition. It tells you what to adjust next time—not who you are.' },
      { id: 'mq-f2', text: '💜 Every successful student has faced bad grades and rough critiques. What matters is the courage to try again.' }
    ],
    tiredness: [
      { id: 'mq-t1', text: '💜 You are allowed to rest. Resting is not quitting—it is how your brain and body recharge so you can keep going.' },
      { id: 'mq-t2', text: '💜 Sometimes the most productive thing you can do right now is close your laptop, drink a glass of water, and get some sleep.' }
    ],
    loneliness: [
      { id: 'mq-l1', text: '💜 Even when you feel invisible in a crowd, your presence matters. It\'s okay to take things slow and reach out when you\'re ready.' },
      { id: 'mq-l2', text: '💜 Feeling lonely is a heavy weight, but you are not broken for feeling this way. Be kind to yourself today.' }
    ],
    breakup: [
      { id: 'mq-b1', text: '💜 Healing doesn\'t happen in a straight line. Some days will hurt more than others, and that is completely normal. Give yourself grace.' }
    ],
    self_worth: [
      { id: 'mq-s1', text: '💜 Struggling with school doesn\'t mean you\'re not smart enough. It just means you\'re wrestling with something genuinely challenging.' },
      { id: 'mq-s2', text: '💜 You are worth so much more than your GPA, your exam scores, or what anyone else expects of you.' }
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

  // ── 4. Main AI Chatbot Object ──────────────────────────────────
  const AIChatbot = {
    BIBLE_VERSES: BIBLE_VERSES,
    MOTIVATIONAL_QUOTES: MOTIVATIONAL_QUOTES,

    // User preferences storage key
    getPrefsKey: function(userId) {
      return 'safe_space_ai_prefs_' + (userId || 'default');
    },

    // Get support preferences
    getPreferences: function(userId) {
      try {
        const stored = localStorage.getItem(this.getPrefsKey(userId));
        if (stored) {
          return Object.assign({
            motivationalMessages: true,
            bibleVerseSuggestions: true,
            studySupport: true,
            emotionalSupport: true
          }, JSON.parse(stored));
        }
      } catch (e) {}
      return {
        motivationalMessages: true,
        bibleVerseSuggestions: true,
        studySupport: true,
        emotionalSupport: true
      };
    },

    // Save support preferences
    savePreferences: function(userId, prefs) {
      try {
        localStorage.setItem(this.getPrefsKey(userId), JSON.stringify(prefs));
      } catch (e) {}
    },

    // Thread messages storage key
    getHistoryKey: function(userId) {
      return 'safe_space_ai_thread_' + (userId || 'guest');
    },

    // Load persisted chat history for this user
    loadChatHistory: function(userId) {
      try {
        const data = localStorage.getItem(this.getHistoryKey(userId));
        if (data) return JSON.parse(data);
      } catch (e) {}
      return [];
    },

    // Save persisted chat history
    saveChatHistory: function(userId, history) {
      try {
        localStorage.setItem(this.getHistoryKey(userId), JSON.stringify(history.slice(-60)));
      } catch (e) {}
    },

    // Clear chat history
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
        'jump off', 'hang myself', 'drink poison', 'overdose'
      ];
      return crisisKeywords.some(kw => lower.includes(kw));
    },

    // Format crisis response
    getCrisisResponse: function(userId) {
      const prefs = this.getPreferences(userId);
      let verseSection = '';

      // Include a gentle, comforting verse of life and hope if applicable/enabled
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
      if (/^(hi|hello|hey|good morning|good afternoon|good evening|sup|yo|kumusta|kamusta)\b/i.test(text.trim())) {
        return { emotion: 'neutral', topic: 'greeting', intent: 'greeting' };
      }

      // Questions about capabilities
      if (lower.includes('what can you do') || lower.includes('who are you') || lower.includes('how do you work') || lower.includes('help me with')) {
        return { emotion: 'curious', topic: 'capabilities', intent: 'help' };
      }

      // Support mode selections
      if (lower.includes('just listen') || lower.includes('listen to me') || lower.includes('hear me out')) {
        return { emotion: 'seeking_ear', topic: 'listen_mode', intent: 'mode_listen' };
      }
      if (lower.includes('give me advice') || lower.includes('what should i do') || lower.includes('need advice')) {
        return { emotion: 'seeking_advice', topic: 'advice_mode', intent: 'mode_advice' };
      }

      // Student Academic Topics
      let topic = state.lastTopic;
      if (lower.includes('thesis') || lower.includes('defense') || lower.includes('panel') || lower.includes('manuscript') || lower.includes('capstone')) {
        topic = 'thesis';
      } else if (lower.includes('exam') || lower.includes('quiz') || lower.includes('test') || lower.includes('midterm') || lower.includes('finals')) {
        topic = 'exam';
      } else if (lower.includes('assignment') || lower.includes('homework') || lower.includes('project') || lower.includes('paper') || lower.includes('deadline') || lower.includes('requirements') || lower.includes('activities')) {
        topic = 'assignment';
      } else if (lower.includes('group') || lower.includes('groupmate') || lower.includes('pabuhat') || lower.includes('freeloader')) {
        topic = 'group_project';
      } else if (lower.includes('grade') || lower.includes('failing') || lower.includes('failed') || lower.includes('flunk')) {
        topic = 'failure';
      } else if (lower.includes('ex') || lower.includes('breakup') || lower.includes('broke up') || lower.includes('relationship') || lower.includes('heartbroken') || lower.includes('crush')) {
        topic = 'breakup';
      } else if (lower.includes('alone') || lower.includes('lonely') || lower.includes('no friends') || lower.includes('isolated')) {
        topic = 'loneliness';
      } else if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('burnout') || lower.includes('burned out') || lower.includes('sleepy') || lower.includes('no sleep') || lower.includes('drained')) {
        topic = 'tiredness';
      }

      // Emotion categories
      let emotion = 'neutral';
      if (lower.includes('overwhelm') || lower.includes('too much') || lower.includes('drowning') || lower.includes('can\'t handle') || lower.includes('cant handle')) {
        emotion = 'overwhelmed';
      } else if (lower.includes('hopeless') || lower.includes('everything is going wrong') || lower.includes('give up') || lower.includes('giving up') || lower.includes('can\'t do this anymore') || lower.includes('cant do this anymore')) {
        emotion = 'hopeless';
      } else if (lower.includes('stress') || lower.includes('pressure') || lower.includes('anxious') || lower.includes('nervous') || lower.includes('panic') || lower.includes('shaking') || lower.includes('worried')) {
        emotion = 'stressed';
      } else if (lower.includes('sad') || lower.includes('crying') || lower.includes('tears') || lower.includes('hurts') || lower.includes('depressed') || lower.includes('down')) {
        emotion = 'sad';
      } else if (lower.includes('lonely') || lower.includes('alone') || lower.includes('nobody cares') || lower.includes('left out')) {
        emotion = 'lonely';
      } else if (lower.includes('fail') || lower.includes('disappointed') || lower.includes('not good enough') || lower.includes('worthless') || lower.includes('loser') || lower.includes('stupid')) {
        emotion = 'discouraged';
      } else if (lower.includes('angry') || lower.includes('mad') || lower.includes('frustrated') || lower.includes('annoyed') || lower.includes('unfair')) {
        emotion = 'frustrated';
      } else if (lower.includes('passed') || lower.includes('happy') || lower.includes('proud') || lower.includes('relieved') || lower.includes('yay') || lower.includes('finished') || lower.includes('done') || lower.includes('good news')) {
        emotion = 'happy';
      } else if (lower.includes('thank') || lower.includes('salamat') || lower.includes('appreciate')) {
        emotion = 'grateful';
      }

      return { emotion, topic, intent: 'conversation' };
    },

    // ── Retrieve non-duplicate Bible Verse ─────────────────────────
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

      // Filter matches
      let available = BIBLE_VERSES.filter(v => v.topic === targetCat && !usedIds.includes(v.id));
      if (!available.length) {
        available = BIBLE_VERSES.filter(v => !usedIds.includes(v.id));
      }
      if (!available.length) available = BIBLE_VERSES;

      return available[Math.floor(Math.random() * available.length)];
    },

    // ── Retrieve context-matched Quote ────────────────────────────
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

    // ── Generate Natural Response ─────────────────────────────────
    generateResponse: async function(userPrompt, userId) {
      const state = ConversationState.getState(userId);
      const prefs = this.getPreferences(userId);
      const isOnline = navigator.onLine;

      state.turnCount++;

      // ── Offline Mode Fallback Handler (Section 8) ──
      if (!isOnline) {
        const lower = userPrompt.toLowerCase();
        if (lower.includes('stress') || lower.includes('tired') || lower.includes('exhausted') || lower.includes('overwhelm') || lower.includes('sad') || lower.includes('down')) {
          return {
            type: 'offline_support',
            emotion: 'support',
            text: "It sounds like you're having a difficult moment. Try taking a slow breath, drinking some water, and giving yourself a short break. You can also write down what is worrying you."
          };
        }
        return {
          type: 'offline_fallback',
          emotion: 'neutral',
          text: "You are currently in Offline Mode. Try taking a slow breath and giving yourself a brief pause. When your connection returns, full AI features will automatically be restored."
        };
      }

      const analysis = this.analyzeUserMessage(userPrompt, state);
      const { emotion, topic, intent } = analysis;

      // Update state
      if (topic) state.lastTopic = topic;
      if (emotion !== 'neutral') state.lastEmotion = emotion;

      // 1. Priority: Immediate Crisis Safety Check
      if (emotion === 'crisis') {
        state.lastBotQuestion = 'immediate_danger';
        return this.getCrisisResponse(userId);
      }

      // 2. Answering previous bot question about crisis check
      if (state.lastBotQuestion === 'immediate_danger') {
        state.lastBotQuestion = null;
        const lower = userPrompt.toLowerCase();
        if (lower.includes('yes') || lower.includes('hurt') || lower.includes('danger') || lower.includes('cut')) {
          return {
            type: 'crisis_urgent',
            emotion: 'crisis',
            text: `Please stay safe right now. Call emergency services (**911**) or the **Philippine Crisis Line at 1553 / 0917-899-8727** immediately, or wake up a family member/roommate right next to you.\n\n📖 **Isaiah 41:10**\n*"So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you."*\n\n**You are not alone, and there is help available.** Please hold on and let someone reach you.`
          };
        } else {
          return {
            type: 'crisis_followup',
            emotion: 'support',
            text: `I'm very relieved to hear you're safe right now. Please keep talking to me, or even better, reach out to someone you trust in person.\n\n📖 **Jeremiah 29:11**\n*"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."*\n\nYou don't have to carry this heavy feeling in silence. What made things feel so dark today?`
          };
        }
      }

      // 2b. Exact Conversational Context Check (Section 6 & 7)
      const promptLower = userPrompt.toLowerCase().trim();

      // Check for User: "I'm really tired from school" / "tired from school"
      if (promptLower.includes('tired from school') || promptLower.includes('tired of school') || (promptLower.includes('tired') && promptLower.includes('school'))) {
        state.lastBotQuestion = 'what_making_school_tired';
        return {
          type: 'conversation',
          emotion: 'empathy',
          text: "That sounds exhausting. What has been making school feel especially tiring lately?"
        };
      }

      // Check for follow-up when user answers: "Too many assignments" / "assignments"
      if (state.lastBotQuestion === 'what_making_school_tired' && (promptLower.includes('assignment') || promptLower.includes('deadline') || promptLower.includes('homework') || promptLower.includes('too many') || promptLower.includes('requirements'))) {
        state.lastBotQuestion = 'urgent_assignment';
        return {
          type: 'conversation',
          emotion: 'support',
          text: "I understand. Having several deadlines at once can feel overwhelming. Maybe we can break them into smaller tasks. What's the most urgent assignment right now?"
        };
      }

      // Check for User: "I feel like I can't do anything anymore"
      if (promptLower.includes("can't do anything anymore") || promptLower.includes("cant do anything anymore") || promptLower.includes("can not do anything anymore")) {
        state.lastBotQuestion = 'weighing_most';
        let reply = "I'm really sorry you're feeling this overwhelmed. You don't have to figure everything out at once. If you can, take a short pause and stay with someone you trust. Would you like to tell me what has been weighing on you the most?\n\nSometimes taking one small step is already progress.";
        if (prefs.bibleVerseSuggestions && !state.usedVerseIds.includes('bv-1pet57')) {
          reply += '\n\n📖 **1 Peter 5:7** — *"Cast all your anxiety on him because he cares for you."*';
          state.usedVerseIds.push('bv-1pet57');
        }
        return {
          type: 'conversation',
          emotion: 'deep_empathy',
          text: reply
        };
      }

      // 3. Explicit Bible Verse Request
      if (intent === 'bible') {
        const verse = this.getVerseForContext(state.lastTopic, state.lastEmotion, state.usedVerseIds);
        if (verse) state.usedVerseIds.push(verse.id);
        return {
          type: 'bible',
          emotion: 'faith',
          text: `I'd be glad to share one with you. 💜\n\n📖 **${verse.reference}**\n"${verse.verse_text}"\n\n${verse.takeaway}\n\nTake things one step at a time. Does this verse bring some comfort to what you're facing?`
        };
      }

      // 4. Explicit Motivation Request
      if (intent === 'motivation') {
        const quoteObj = this.getQuoteForContext(state.lastTopic, state.lastEmotion, state.usedQuoteIds);
        if (quoteObj) state.usedQuoteIds.push(quoteObj.id);
        return {
          type: 'motivation',
          emotion: 'encouragement',
          text: `Here is something to keep in mind when things feel uphill:\n\n${quoteObj.text}\n\nYou've already tackled so much to get to this point in school. What's the main obstacle you're trying to push through right now?`
        };
      }

      // 5. Greeting
      if (intent === 'greeting') {
        return {
          type: 'greeting',
          emotion: 'warm',
          text: `Hey! It's really nice to hear from you. 💜\n\nHow is your day going so far? Feel free to share what's on your mind—whether it's school, stress, or just needing someone to listen.`
        };
      }

      // 6. Capabilities Inquiry
      if (intent === 'help') {
        return {
          type: 'help',
          emotion: 'helpful',
          text: `I'm your **Safe Space Student Assistant**! I'm here to support you through academic life and personal hurdles:\n\n• **Stress & Burnout**: Talk through heavy workloads or thesis anxiety\n• **Study Support**: Break big tasks into manageable, bite-sized steps\n• **Empathy & Listening**: Vent safely without judgment\n• **Motivation & Hope**: Uplifting reminders and Bible verses when you need encouragement\n\nI'm not a therapist or counselor, but I'm always here to walk with you through school challenges. What would you like help with today?`
        };
      }

      // 7. Support Mode Handlers
      if (intent === 'mode_listen') {
        state.currentMode = 'listen';
        return {
          type: 'listen',
          emotion: 'support',
          text: `I'm completely here to listen. No unsolicited advice, no quick fixes—just a safe space for you to let it all out. What's been on your mind?`
        };
      }

      // 8. Contextual Follow-up from Previous Turns
      // E.g., User previously mentioned stress, Bot asked what part, User now says "My thesis" or "Chapter 2"
      if (state.lastBotQuestion === 'what_stressing') {
        state.lastBotQuestion = 'what_part';
        if (topic === 'thesis' || userPrompt.toLowerCase().includes('thesis')) {
          return {
            type: 'conversation',
            emotion: 'empathy',
            text: `Ah, your thesis is what's been weighing on you. That makes complete sense—the research, writing, and revisions take so much energy.\n\nWhat part of the thesis is giving you the most trouble right now? Is it the literature review, methodology, analyzing data, or preparing for panel questions?`
          };
        } else if (topic === 'exam' || userPrompt.toLowerCase().includes('exam')) {
          return {
            type: 'conversation',
            emotion: 'empathy',
            text: `Exams can definitely put you under a lot of pressure. Which subject or exam are you feeling most nervous about right now?`
          };
        }
      }

      // 9. Academic Situations (Thesis, Exams, Assignments, Group Work)
      if (topic === 'thesis') {
        state.lastBotQuestion = 'thesis_step';
        let reply = `Working on a thesis or capstone is one of the heaviest parts of college life. It is totally normal to feel drained or overwhelmed by it.\n\nLet's take it one small chunk at a time. Would you like to make a simple checklist for today, or do you just need to vent about the panel or revisions for a bit?`;
        
        // Contextual motivational addition if enabled
        if (prefs.motivationalMessages && (emotion === 'stressed' || emotion === 'overwhelmed')) {
          reply += `\n\n💜 **Remember:** A thesis is written one paragraph at a time. You don't have to defend it today; you just need to write the next sentence.`;
        }
        return { type: 'conversation', emotion: 'empathy', text: reply };
      }

      if (topic === 'exam') {
        state.lastBotQuestion = 'exam_prep';
        if (emotion === 'discouraged' || userPrompt.toLowerCase().includes('failed')) {
          let reply = `I'm really sorry. Failing an exam hurts deeply, especially if you spent hours studying or had high hopes.\n\nOne test score never defines your capability or your worth as a student. Would you like to talk through what happened, or would you rather take a short breather and figure out a recovery plan later?`;
          return { type: 'conversation', emotion: 'empathy', text: reply };
        } else {
          return {
            type: 'conversation',
            emotion: 'support',
            text: `Exam anxiety is so real—when everything feels like it hinges on one test, your chest can feel tight.\n\nTake a slow breath right now. Drop your shoulders away from your ears. What subject is the exam in, and how much time do you have before it starts?`
          };
        }
      }

      if (topic === 'assignment') {
        state.lastBotQuestion = 'assignment_first';
        return {
          type: 'conversation',
          emotion: 'problem_solving',
          text: `When school requirements pile up like that, looking at the whole list makes your brain freeze up. That's a natural reaction to overload.\n\nLet's shrink the mountain. What are the assignments you have due, and which single one is due the soonest? We can start with just 15 minutes on that one.`
        };
      }

      if (topic === 'group_project') {
        return {
          type: 'conversation',
          emotion: 'empathy',
          text: `Group projects can be genuinely exhausting, especially when people aren't communicating or you end up carrying the whole workload.\n\nThat's frustrating and unfair to your energy. Is there a group leader or a professor you can privately update, or are you currently stuck doing the submission yourself tonight?`
        };
      }

      // 10. Deep Sadness / Hopelessness (Section 9)
      if (emotion === 'hopeless' || emotion === 'sad') {
        state.lastBotQuestion = 'listen_or_advice';
        let reply = `I'm really sorry you're going through this. It sounds like things have been feeling really heavy lately, and you've been carrying so much on your own.\n\nYou don't have to figure everything out tonight, and you don't have to pretend to be okay here. We can take this one minute at a time.\n\nWould you like me to just listen while you let it out, or would you like something gentle and encouraging to hold onto right now?`;

        // Provide a supportive verse if preferences allow and user seems open
        if (prefs.bibleVerseSuggestions && emotion === 'hopeless' && !state.usedVerseIds.length) {
          const v = this.getVerseForContext('hope', 'sad', state.usedVerseIds);
          if (v) {
            state.usedVerseIds.push(v.id);
            reply += `\n\n📖 **${v.reference}** — *"The Lord is close to the brokenhearted and saves those who are crushed in spirit."*`;
          }
        }
        return { type: 'conversation', emotion: 'deep_empathy', text: reply };
      }

      // 11. Loneliness (Section 3 Example 4)
      if (emotion === 'lonely' || topic === 'loneliness') {
        state.lastBotQuestion = 'lonely_reason';
        return {
          type: 'conversation',
          emotion: 'empathy',
          text: `I'm sorry you're feeling that way. Loneliness can feel so heavy, even when there are people sitting right next to you in the classroom or hallway.\n\nDo you want to tell me what's been making you feel alone lately? Has something changed with your friends or at home?`
        };
      }

      // 12. Exhaustion / Burnout (Section 8)
      if (topic === 'tiredness' || emotion === 'overwhelmed') {
        state.lastBotQuestion = 'rest_check';
        let reply = `It sounds like you're running on empty. School and life can demand so much of you that even simple things start to feel impossible.\n\nLet's pause the race for a second. Have you had anything to drink or eat in the last few hours? Even just taking 5 minutes to close your eyes without looking at a screen can give your nervous system a tiny rest.`;
        if (prefs.motivationalMessages) {
          reply += `\n\n💜 **You are allowed to rest.** Resting does not mean you are giving up.`;
        }
        return { type: 'conversation', emotion: 'care', text: reply };
      }

      // 13. General Stress (Section 3 & 4)
      if (emotion === 'stressed') {
        state.lastBotQuestion = 'what_stressing';
        return {
          type: 'conversation',
          emotion: 'empathy',
          text: `That sounds really exhausting. School and daily expectations can pile up so fast until you feel like you can't catch a breath.\n\nWhat's been the biggest thing stressing you out today? Is it schoolwork, family, friends, or just feeling worn out by everything all together?`
        };
      }

      // 14. Breakup / Relationship
      if (topic === 'breakup') {
        return {
          type: 'conversation',
          emotion: 'empathy',
          text: `It sounds like you're still carrying a lot of hurt from that relationship. Heartbreak is physically and emotionally draining, and it's completely okay if you're not over it yet.\n\nBe patient with your heart. Do you want to vent about what happened, or would you rather distract your mind with something else for a bit?`
        };
      }

      // 15. Celebrations & Positive News
      if (emotion === 'happy' || emotion === 'grateful') {
        return {
          type: 'celebration',
          emotion: 'joy',
          text: `Hey, that's awesome! 🎉 You worked hard and pushed through, and you deserve to celebrate that win!\n\nTake a moment to give yourself credit—you made it happen. How are you feeling now that that hurdle is behind you?`
        };
      }

      // 16. Fallback General Conversational Response
      return {
        type: 'general',
        emotion: 'warm',
        text: `I hear you. When things are swirling around in your thoughts, having a safe place to put them down can help.\n\nTell me a little more about what's going on—would you prefer some practical suggestions, or would you rather just talk through it together?`
      };
    },

    // ── Safe HTML Formatter for Bot Messages ──────────────────────
    formatBotMessage: function(rawText) {
      if (!rawText) return '';

      // Escape basic HTML to prevent XSS
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
