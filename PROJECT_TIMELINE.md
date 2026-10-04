# Project Timeline & Module Workplan: AI-Powered Safe Space Platform

> **Project Title**: AN AI-POWERED SAFE SPACE PLATFORM WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS  
> **Institution**: Aklan State University – Ibajay Campus, College of Hospitality and Rural Resource Management  
> **Degree**: Bachelor of Science in Computer Science  
> **Authors**: Alpha Joy S. Francisco, Noriel D. Acosta, Lovely Mae T. Gregorio  
> **Adviser**: Reimar R. Tingga, ME  
> **Methodology**: Descriptive-Developmental Research Design / Agile SDLC Model  
> **Quality Evaluation Framework**: ISO/IEC 25010 Software Product Quality Model (Functional Suitability, Performance Efficiency, Interaction Capability, Maintainability, Safety)

---

## 1. System Overview & Core Objectives

As established in the thesis document, the platform is designed to provide a safe, student-centered digital space addressing bullying, discrimination, cyberbullying, academic stress, and lack of emotional support.

The system is organized into **Four (4) Core Modules** supported by automated AI analysis:

```
                               ┌──────────────────────────────────────────────────────────┐
                               │       AI-POWERED SAFE SPACE PLATFORM ARCHITECTURE        │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
         ┌───────────────────────────┬──────────────────────┴─────┬───────────────────────────┐
         │                           │                            │                           │
         ▼                           ▼                            ▼                           ▼
┌──────────────────┐       ┌──────────────────┐         ┌──────────────────┐        ┌──────────────────┐
│     MODULE 1     │       │     MODULE 2     │         │     MODULE 3     │        │     MODULE 4     │
│ User Login, Reg. │       │    Anonymous     │         │   Community &    │        │    Safety &      │
│   & Profile      │       │    Expression    │         │       Chat       │        │  AI Moderation   │
├──────────────────┤       ├──────────────────┤         ├──────────────────┤        ├──────────────────┤
│ • Auth & Security│       │ • Feed & Posting │         │ • Peer Connect   │        │ • Auto-Filter    │
│ • Student Profile│       │ • Identity Toggle│         │ • Direct 1-on-1  │        │ • Sentiment Score│
│ • Avatar & Bio   │       │ • Mood Tagging   │         │ • Support Chat   │        │ • Flag & Report  │
│ • Data Privacy   │       │ • Comments Drawer│         │ • Friends/Requests│       │ • Guidance Queue │
└──────────────────┘       └──────────────────┘         └──────────────────┘        └──────────────────┘
```

---

## 2. Module Work Breakdown Structure (WBS)

### Module 1: User Login, Registration & Profile Module
- **Purpose**: Manage student identity, authenticated sessions, privacy options, and personal profiles in compliance with RA 10173 (Data Privacy Act of 2012).
- **Key Components**:
  - `login.html`: Secure student sign-in with password reveal, credential validation, error feedback.
  - `register.html`: Comprehensive student registration (Name, Age, Sex, Birthday, Username, Email, Password verification, Avatar upload).
  - `profile.html`: Profile card, anonymous identity switch preview, bio editor, account information view, and user security controls.
- **Database Alignment**: `auth.users`, `public.profiles`, Supabase Storage `avatars` bucket.

### Module 2: Anonymous Expression Module
- **Purpose**: Provide a judgment-free public forum allowing students to express emotions, concerns, and stories anonymously or with a handle.
- **Key Components**:
  - `index.html` (Feed): Category pill filters (`All`, `General`, `Support`, `Stories`).
  - Create Post Modal: Dual-identity selector (Anonymous vs. Username), 2000-character counter, photo attachment, mood selector chip list (`Feeling good`, `Loved`, `Supported`, `Amused`, `Down`, `Frustrated`).
  - Interaction: Respectful reactions (likes), bookmarks (saved posts), comments modal drawer.
- **Database Alignment**: `public.posts`, `public.post_likes`, `public.post_comments`, `public.saved_posts`, Storage `post-photos`.

### Module 3: Community & Chat Module
- **Purpose**: Foster peer connection and confidential 1-on-1 private messaging with peers and campus counselors/support representatives.
- **Key Components**:
  - `community.html`: Directory with tabs (`People`, `Requests`, `Friends`), instant search, and friend request workflows.
  - `chat.html`: Chat inbox with "Recent conversations" and "Find people" states, real-time message bubble stream, online indicators, and quick-access counselor channel.
  - `resources.html`: Student welfare educational materials, mental health grounding techniques (5-4-3-2-1), and crisis hotlines (Trevor Project, Trans Lifeline, Hopeline PH 1553, 988).
- **Database Alignment**: `public.messages`, `public.friendships`, `public.blocks`, `public.chat_nicknames`.

### Module 4: Safety, Automated Moderation & Sentiment Analysis Module
- **Purpose**: Protect students through proactive AI analysis of user-generated content, automated detection of harmful language/bullying, sentiment tone tracking, and confidential reporting to school guidance.
- **Key Components**:
  - **AI Automated Moderation Engine**: Analyzes text submitted in posts and comments before or upon posting against toxicity, harassment, and bullying indicators.
  - **Sentiment Analysis Engine**: Evaluates emotional valence and flags severe negative distress triggers for guidance review.
  - **Confidential Reporting Flow**: Allows students to report abusive, harassing, or discriminatory content.
  - **Moderator/Guidance Queue**: Portal/view for authorized personnel to inspect flagged content and take corrective action.
- **Database Alignment**: `public.notifications`, content flagging attributes in `public.posts`, `public.reports` (or audit logs).

---

## 3. Agile Sprints & Step-by-Step Roadmap

| Phase / Sprint | Focus Area | Status | Verification Checkpoint |
|---|---|---|---|
| **Sprint 0: Architecture & Foundation** | PWA shell, shared CSS tokens, database schema, local demo seed engine | ✅ Complete | Mobile viewport rendering, local offline storage, schema syntax |
| **Sprint 1: Module 1 — Auth & Profile** | Login, registration (10 fields + avatar), profile screen, bio editing, Supabase Auth & Schema | ✅ **COMPLETE** | welcome.html → login.html/register.html → home.html flow verified; DB schema updated; Supabase trigger fixed; Demo mode & live DB both supported |
| **Sprint 2: Module 2 — Anonymous Expression** | Community feed, mood tags, create post modal, comments drawer, bookmarks | ✅ **COMPLETE** | Live Supabase + demo sync; feed category filter; create modal (anonymous/user identity, mood tags, category chips, photo upload); like/bookmark toggles; comments drawer; options sheet; profile My Posts & Saved Posts; verified 100% |
| **Sprint 3: Module 3 — Community & Chat** | Member directory, friend requests, real-time chat bubbles, crisis resources | ✅ **COMPLETE** | Member search directory, pending incoming requests with accept/decline, friends directory, recent conversations list, slide-in chat thread overlay with real-time Supabase subscriptions, message bubble exchange, crisis hotline guides & tap-to-call; verified 100% |
| **Sprint 4: Module 4 — AI Moderation & Sentiment** | Toxicity filter rules, sentiment classification, reporting system, notification alerts | 📋 Queued (Awaiting Signal) | Automated flagging accuracy, reporting flow, guidance dashboard view |
| **Sprint 5: System Evaluation & Quality Audit** | ISO/IEC 25010 testing (Functional Suitability, Performance, Security, Usability) | 📋 Queued (Final) | 30-respondent simulation, response time benchmarks, thesis defense prep |

---

## 4. Execution Protocol: Step-by-Step Rule

To ensure quality and prevent regressions:
1. **No Unauthorized Leaps**: Only one module will be developed or refined at any given time upon the user's explicit signal.
2. **Thorough Component Verification**: Before concluding a module, every button, form input, database write/read, and UI state must be tested and confirmed operational.
3. **Progress Documentation**: Every change must be recorded in [`FEATURES.md`](file:///c:/Users/tacio/OneDrive/Desktop/SAFE%20SPACE%20THESIS/FEATURES.md) with implementation notes, database alignment, and rollback procedures.
4. **Strict UI Fidelity**: All visual components must strictly adhere to the mockups in `UI SAFE SPACE/` and mobile container responsiveness.

