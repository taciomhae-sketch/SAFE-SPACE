# SYSTEM SPECIFICATION & IMPLEMENTATION PROMPT

**Project Title:** An AI-Powered Safe Space Platform with Automated Moderation and Sentiment Analysis  
**Module:** Pre-Posting Safety Screening & Automated AI Supportive Comment Recommendation  

---

## 1. System Objective & Overview

This document specifies the technical architecture, behavioral rules, and verification criteria for two tightly integrated AI capabilities within the **Safe Space** peer-support platform:

1. **Pre-Posting AI Safety Screening & Contextual Warning Modal:**
   - Intercept student submissions **before** they reach the community feed or database.
   - Screen text for harmful, suicidal, alarming, threatening, bullying, harassing, or abusive content using multi-layered natural language processing (BART zero-shot classification, RoBERTa sentiment analysis, regex pattern matching, and code-switched Filipino/Taglish rules).
   - Display a categorized safety warning modal prompting the author to review, revise, or access urgent crisis resources before the post is published.
   - **Strict Rule:** Never publish the post first and show the warning afterward. Harmful or alarming content must be evaluated and acknowledged prior to appearing in the feed.

2. **Automated AI Supportive Comment Recommendation:**
   - Once a post is permitted and published, generate an empathetic, context-aware, nonjudgmental supportive recommendation.
   - Display this response directly beneath the post in a dedicated, distinct section labeled:  
     `Suggested Support from Safe Space AI`
   - Provide practical coping strategies, peer encouragement, or verified emergency crisis hotlines (e.g., National Center for Mental Health 1553, 911).
   - **Strict Decoupling:** Never save or disguise the AI recommendation as a real student comment. It must not inflate user comment counts or impersonate human accounts.

---

## 2. Feature 1: Pre-Posting Safety Screening & Warning Modals

### A. Execution Workflow
When the student clicks the **Post** (or **Send Comment**) button:
1. **Sanitize & Mask Profanity:** Run partial asterisk censoring (`p*******a`, `g**o`) preserving first and last letters so emotional intent remains intact for sentiment analysis.
2. **Execute AI Moderation:** Send unmasked text securely to the moderation pipeline to evaluate:
   - Moderation Category: `SAFE`, `SELF_HARM`, `THREAT`, `BULLYING`, `DISTRESS`, `PROFANITY`, `DISCRIMINATION`.
   - Severity Level: `none`, `low`, `medium`, `high`, `critical`.
   - Decision Status: `APPROVED`, `REVIEW`, `BLOCKED`.
   - Action: `allow`, `warn`, `review`, `block`.
   - Sentiment: `POSITIVE`, `NEUTRAL`, `NEGATIVE`.
3. **Evaluate Flag Condition:** If status is `BLOCKED`, `REVIEW`, or category is not `SAFE`:
   - Halt immediate publication.
   - Do **not** inject the post into the visible community feed.
   - Trigger the appropriate **Safety Warning Modal** matching the detected risk category.
4. **Author Decision:**
   - **Review / Edit Post:** Closes warning modal, returns focus to post composer with existing draft intact for editing.
   - **Cancel Submission:** Discards post draft and resets composer cleanly.
   - **Continue / Acknowledge (when permitted):** If content is not an immediate critical threat or explicit suicide attempt, allow user acknowledgment, mark post with `is_user_confirmed: true`, and route to counselor triage queue (`moderation_status: 'REVIEW'`).

---

### B. Detected Safety Categories & Warning Modal Configurations

| Category | Modal Title | Modal Message | Primary Action Buttons | Can Bypass / Continue? |
| :--- | :--- | :--- | :--- | :--- |
| **Potential Self-Harm or Suicide-Related** | *Your Post May Indicate a Safety Concern* | "Some parts of your post suggest that you may be experiencing serious distress. You deserve support, and you do not have to face difficult moments alone. Would you like to review your post or explore available support resources before continuing?" | • **Review My Post**<br>• **View Support Resources** (links to NCMH 1553, 911)<br>• **Cancel Posting** | **No** (`can_continue: false`). Immediate safety resources must be prioritized. |
| **Threatening or Violent Language** | *Potentially Harmful Content Detected* | "Your post may contain language that threatens or could endanger someone. Content that violates community safety rules cannot be published. Please revise your message." | • **Edit Post**<br>• **View Community Guidelines**<br>• **Cancel Posting** | **No** (`can_continue: false`). Strictly blocked from public feed. |
| **Bullying, Harassment & Targeted Abuse** | *Please Review Your Post* | "Your post may contain language that could hurt or target another person. Consider revising it to help maintain a respectful and supportive community." | • **Edit Post**<br>• **Cancel Posting**<br>• **Continue Posting** (Sends to Counselor Queue) | **Conditional** (Allowed only after explicit user confirmation; logged for review). |
| **Distressing, Alarming or Sensitive Content** | *Sensitive Content Detected* | "Your post may contain sensitive or distressing material. Please review it before sharing it with the community." | • **Review Post**<br>• **Cancel Posting**<br>• **Continue Posting** | **Yes** (With counselor review tag). |

---

### C. Contextual Intelligence & Educational Safeguard
The AI system distinguishes between harmful intent and healthy emotional or academic expression:
- **Academic Distress & Sadness:** Posts like *"I failed my exam even though I studied hard"* or *"I am so stressed with deadlines"* express normal student struggles. They are approved as safe peer expressions with supportive advice.
- **Educational / Awareness Discussions:** Statements like *"In our psychology class today, we discussed suicide prevention strategies"* contain sensitive keywords (`suicide`, `prevention`) but have zero personal crisis intent. The model recognizes educational context and allows direct publication.
- **Multilingual & Taglish Support:** Accurately detects English, Filipino, and Taglish expressions (e.g., *"bagsak ako sa exam"*, *"pagod na ako pero laban lang"*, *"gusto ko nang magpakamatay"*).

---

## 3. Feature 2: Automated Supportive Comment Recommendations

### A. Display & Interface Requirements
1. **Placement:** Render directly beneath post content/media and **above** the likes/reactions bar.
2. **Container Title:** `Suggested Support from Safe Space AI`
3. **Visual Distinction:**
   - Elegant purple/blue tinted container (`background: #FAF8FF; border: 1px solid #E8E1FA;`).
   - Distinctive AI badge with robot/sparkle icon: `AI Generated`.
   - Clear footer disclaimer:  
     `Suggested Support from Safe Space AI · Practical student coping recommendation.`
   - Optional button for crisis cases: `View Verified Support Resources`.
4. **Behavioral Boundary:** The recommendation is **not** a database record in `comments` or `post_comments`. It does not increase the comment bubble counter and cannot be edited or deleted by other students.

---

### B. Standardized Coping Guidance Matrix

#### Scenario A: Sadness or Disappointment (Failed Exam / Academic Setback)
- **Sample User Post:** *"I'm disappointed because I failed my exam even though I studied hard."*
- **AI Recommendation:**  
  > *"Sorry you're going through this. It's understandable to feel disappointed after putting in so much effort. One exam doesn't define your abilities. Take a little time to rest, then consider reviewing the topics you found difficult or asking a classmate or teacher for help. You can take this one step at a time."*

#### Scenario B: Academic Stress & Overwhelming Deadlines
- **Sample User Post:** *"I'm so stressed because I have several deadlines this week."*
- **AI Recommendation:**  
  > *"That sounds overwhelming. Try listing your deadlines, choosing the most urgent task, and breaking it into smaller steps. Remember to take short breaks and get enough rest. You don't have to finish everything at once."*

#### Scenario C: Loneliness & Feeling Misunderstood
- **Sample User Post:** *"I feel like nobody understands me."*
- **AI Recommendation:**  
  > *"I'm sorry you're feeling this way. Feeling misunderstood can be painful, but your feelings matter. If you feel comfortable, consider reaching out to someone you trust and sharing what you've been experiencing. You deserve to be heard and supported."*
  - *Action:* Display `View Support Resources` button.

#### Scenario D: Positive Experience & Milestone Achievement
- **Sample User Post:** *"I finally achieved my goal after months of hard work!"*
- **AI Recommendation:**  
  > *"Congratulations! Your dedication and effort have paid off. Take a moment to appreciate your progress and celebrate this achievement. Keep believing in yourself as you work toward your next goal."*

#### Scenario E: Neutral / Informational Post (Group Project / Class Announcement)
- **Sample User Post:** *"Our group presentation is scheduled for Friday."*
- **AI Recommendation:**  
  > *"Thanks for sharing! You may find it helpful to review your assigned section and coordinate with your groupmates before Friday. Good luck with your presentation!"*

---

### C. Critical Emergency Protocol: Suicide-Related & High-Risk Statements
When content expresses self-harm intent, suicidal thoughts, or severe despair:
- **Never** provide generic cheerful platitudes (e.g., *"Cheer up, tomorrow is a brighter day"*).
- **Never** attempt to act as a clinical therapist or emergency dispatcher.
- **Provide Urgent Crisis Information:** Include direct crisis hotline numbers:
  - **National Center for Mental Health (NCMH) Crisis Hotline:** `1553` (Toll-Free Nationwide) or `0917-899-USAP (8727)`
  - **Philippine Emergency Hotline:** `911`
  - **ASU Ibajay Guidance & Counseling Office:** Extension 104
- **Example Response:**  
  > *"I'm sorry you're going through such a difficult time. You deserve support, and you don't have to handle this alone. If you can, reach out to someone you trust and tell them what you're experiencing. If you may be in immediate danger, please contact local emergency services or call the NCMH Crisis Hotline at 1553 or 0917-899-USAP (8727) for immediate confidential help."*

---

## 4. Technical Integration & Database Schema

### A. Database Storage (`posts` Table)
Store the generated recommendation and moderation audit metadata directly on the post record:
```sql
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS ai_recommendation JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_recommendation_status VARCHAR(50) DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS is_user_confirmed BOOLEAN DEFAULT FALSE;
```
- `ai_recommendation` contains: `{ type, message, disclaimer, show_resources_button, emergency_numbers }`.
- `ai_recommendation_status`: `'GENERATED'`, `'FALLBACK'`, `'SUPPRESSED'`, or `'NONE'`.
- `is_user_confirmed`: Boolean indicating whether the author saw a warning modal and chose to confirm submission.

### B. Post Editing Protocol
When an author edits an existing post:
1. Re-run the moderation pipeline on the modified content.
2. Regenerate `ai_recommendation` to ensure guidance remains relevant.
3. Update `ai_recommendation_status` and update timestamp.

---

## 5. Administrative Governance & Analytics

In the **Admin Dashboard (AI Governance Tab)**, aggregate and display:
1. **Posts Analyzed:** Total pre-publication safety screenings executed.
2. **Safety Warnings Displayed:** Count of warning modals shown to students.
3. **Posts Blocked / Revised:** Total harmful submissions stopped or discarded.
4. **Requiring Counselor Review:** Submissions flagged with `REVIEW` awaiting human counselor sign-off.
5. **AI Support Recommendations Generated:** Total empathetic recommendations rendered.
6. **Sentiment Distribution:** Visual percentage breakdown of `Positive`, `Neutral`, and `Negative (Seeking Support)` posts.
7. **Detected Safety Categories Breakdown:** Real-time distribution across Safe, Self-Harm, Bullying, Threat, and Distress.

---

## 6. Acceptance & Testing Criteria

The implementation passes 100% of the following verification checks:
1. **Pre-Posting Gate:** No flagged post appears in the feed before the author resolves the warning modal.
2. **Zero False Penalty on Academic Stress:** Failed exams, heavy schoolwork, and emotional sadness are classified as safe for peer support and receive relevant coping advice.
3. **Emergency Escalation:** Content with self-harm expressions immediately shows hotlines (`1553`, `911`) and suppresses the "Continue" bypass.
4. **Decoupled Comment Architecture:** The AI recommendation never exists in the student comments list or increments comment counts.
5. **Graceful Fallback:** If the primary neural model API is offline, client-side safety heuristics and rule engines immediately take over so safe posts are never stuck indefinitely.
