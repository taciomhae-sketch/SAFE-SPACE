# Safe Space AI Moderation Module
## AN AI-POWERED SAFE SPACE PLATFORM WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
**Aklan State University – Ibajay | BSCS Thesis Project**

---

> **IMPORTANT:** This Python module is a **SEPARATE AI COMPONENT** only.
> It does NOT replace your existing PHP Safe Space platform.
> It only adds AI moderation and sentiment analysis capabilities
> that your existing PHP system can call through a local API.

---

## TABLE OF CONTENTS

- [Part 1 — Recommended AI Model](#part-1--recommended-ai-model)
- [Part 2 — Project Structure](#part-2--project-structure)
- [Part 3 — Installation Instructions (Windows)](#part-3--installation-instructions-windows)
- [Part 4 — How Content Moderation Works](#part-4--how-content-moderation-works)
- [Part 5 — How Sentiment Analysis Works](#part-5--how-sentiment-analysis-works)
- [Part 6 — API Endpoints](#part-6--api-endpoints)
- [Part 7 — PHP Connection Example](#part-7--php-connection-example)
- [Part 8 — Error Handling](#part-8--error-handling)
- [Part 9 — Security](#part-9--security)
- [Part 10 — Testing](#part-10--testing)
- [Part 11 — AI Limitations](#part-11--ai-limitations)
- [Part 12 — Privacy](#part-12--privacy)
- [Part 13 — Thesis Integration](#part-13--thesis-integration)
- [Part 14 — Architecture Diagram](#part-14--architecture-diagram)
- [Part 15 — Thesis Defense Q&A](#part-15--thesis-defense-qa)

---

## PART 1 — RECOMMENDED AI MODEL

### Selected Models (Both FREE, Both Local, Both Offline After First Download)

### Model 1: Content Moderation
| Property | Details |
|---|---|
| **Name** | `facebook/bart-large-mnli` |
| **Type** | Zero-Shot Text Classification |
| **Size** | ~1.63 GB (downloaded once automatically) |
| **RAM Required** | ~2-3 GB RAM (CPU mode) |
| **Works Locally?** | YES |
| **Internet After Install?** | NO (offline after first download) |
| **API Key Required?** | NO |
| **Cost** | FREE |

**Why this model?**
Zero-shot classification means it can categorize text into any label (SAFE, OFFENSIVE, BULLYING, etc.) **without needing to retrain the model** with your own data. It runs on CPU — no GPU required — so it works on any ordinary student laptop.

---

### Model 2: Sentiment Analysis
| Property | Details |
|---|---|
| **Name** | `cardiffnlp/twitter-roberta-base-sentiment-latest` |
| **Type** | Sentiment Classification (POSITIVE / NEUTRAL / NEGATIVE) |
| **Size** | ~500 MB (downloaded once automatically) |
| **RAM Required** | ~1-2 GB RAM (CPU mode) |
| **Works Locally?** | YES |
| **Internet After Install?** | NO (offline after first download) |
| **API Key Required?** | NO |
| **Cost** | FREE |

**Why this model?**
Trained on Twitter/social media text — which is similar to informal student posts and comments. Handles short sentences, slang, and casual language better than models trained only on formal text.

---

### Fallback: TextBlob
If the HuggingFace models are unavailable during demo, TextBlob provides lightweight rule-based sentiment analysis with zero additional download.

---

## PART 2 — PROJECT STRUCTURE

```
ai_moderation/
|
|-- app.py                <-- Main FastAPI server (start this to run the AI)
|-- moderation.py         <-- Content moderation logic and AI classification
|-- sentiment.py          <-- Sentiment analysis logic
|-- config.py             <-- All settings and constants (edit here)
|-- requirements.txt      <-- Python packages to install
|-- test_moderation.py    <-- Test suite for all moderation cases
|-- php_ai_connector.php  <-- Example PHP code for connecting to the AI API
|-- start_ai.bat          <-- Double-click to start the AI server on Windows
|
+-- models/
    +-- README.txt        <-- Notes about AI model storage
```

---

## PART 3 — INSTALLATION INSTRUCTIONS (WINDOWS)

### Prerequisites
- Windows 10 or 11
- VS Code (recommended)
- Python 3.10, 3.11, or 3.12
- At least 6 GB free disk space (for AI models)
- At least 4 GB RAM
- Internet connection for the first setup only

### Step-by-Step

**STEP 1 - Install Python**
Download from https://www.python.org/downloads/
During installation, check "Add Python to PATH"

```cmd
python --version
```

**STEP 2 - Open the ai_moderation folder in VS Code**
File > Open Folder > SAFE SPACE THESIS > ai_moderation

**STEP 3 - Open Terminal in VS Code**
Press Ctrl + ` (backtick)

**STEP 4 - Create a Virtual Environment**
```cmd
python -m venv venv
```

**STEP 5 - Activate the Virtual Environment**
```cmd
venv\Scripts\activate
```
You should see (venv) at the start of your terminal.

> IMPORTANT: Every time you open a new terminal, run this activate command first.

**STEP 6 - Install Python Dependencies**
```cmd
pip install -r requirements.txt
```
This installs FastAPI, Uvicorn, HuggingFace Transformers, PyTorch, and TextBlob.
This may take 5-15 minutes.

**STEP 7 - Download TextBlob Corpora**
```cmd
python -m textblob.download_corpora
```

**STEP 8 - Pre-download AI Models (First Time)**
```cmd
python -c "from transformers import pipeline; pipeline('zero-shot-classification', model='facebook/bart-large-mnli')"
python -c "from transformers import pipeline; pipeline('sentiment-analysis', model='cardiffnlp/twitter-roberta-base-sentiment-latest')"
```
Total download: approximately 2.1 GB.
After this, the AI works completely OFFLINE.

**STEP 9 - Start the Python AI Server**
```cmd
python app.py
```

**STEP 10 - Verify It Is Working**
Open browser: http://127.0.0.1:8000/
You should see: {"status": "online", "service": "Safe Space AI Moderation Service"}

---

## PART 4 — HOW CONTENT MODERATION WORKS

### Two-Layer System

**Layer 1: Rule-Based Keyword Detection (Fast)**
Pattern matching using regular expressions covering:
- Filipino threatening phrases: patayin kita, saktan kita
- Filipino offensive words: bobo, gago, tanga, putangina
- English bullying patterns: make fun of, everyone should avoid
- Spam detection: excessive word repetition
- Self-harm keywords (only first-person, specific language)

**Layer 2: AI Zero-Shot Classifier (Intelligent)**
When rules are unclear, the AI model reads the full text and determines the most likely category.

### Categories and Default Statuses

| Category | Default Status |
|---|---|
| SAFE | APPROVED |
| OFFENSIVE | REVIEW |
| BULLYING_HARASSMENT | REVIEW |
| DISCRIMINATORY | REVIEW |
| THREATENING | BLOCKED |
| SELF_HARM_CONCERN | REVIEW |
| SEXUAL_EXPLICIT | BLOCKED |
| SPAM | REVIEW |

### Context Over Keywords

Normal academic stress is NOT flagged as self-harm:
- "I am tired of school" - SAFE (academic frustration)
- "I feel exhausted because of exams" - SAFE / NEGATIVE sentiment
- "I want to end my life" - SELF_HARM_CONCERN - REVIEW

---

## PART 5 — HOW SENTIMENT ANALYSIS WORKS

### Three-Class Output

| Sentiment | Example |
|---|---|
| POSITIVE | "I am happy today and I enjoyed class." |
| NEUTRAL | "I went to school today." |
| NEGATIVE | "I feel exhausted because of too many assignments." |

### CRITICAL: Sentiment NOT EQUAL to Moderation Status

```
"I am sad because I failed my exam."
  -> Sentiment : NEGATIVE (emotional tone)
  -> Category  : SAFE     (no harmful content)
  -> Status    : APPROVED (can be published)
```

Negative sentiment means the student is feeling negative emotions, NOT that the content is harmful. The AI correctly distinguishes between emotional tone (sentiment) and content safety (moderation).

---

## PART 6 — API ENDPOINTS

Base URL: http://127.0.0.1:8000

### GET /
Health check. Verifies the service is running.

### POST /moderate
Combined content moderation + sentiment analysis.

Request:
```json
{"text": "I hate going to school because everyone makes fun of me."}
```

Response:
```json
{
  "success": true,
  "category": "BULLYING_HARASSMENT",
  "status": "REVIEW",
  "confidence": 0.91,
  "reason": "Detected bullying or harassment language.",
  "sentiment": "NEGATIVE",
  "sentiment_score": 0.89,
  "note": "AI results are advisory only. Final decisions require human review."
}
```

### POST /sentiment
Sentiment analysis only.

### POST /moderation-only
Content moderation only.

### GET /docs
Interactive API documentation — open in browser while server is running.

---

## PART 7 — PHP CONNECTION EXAMPLE

See php_ai_connector.php for the complete example.

Basic usage:
```php
function moderate_with_ai($text) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => 'http://127.0.0.1:8000/moderate',
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(['text' => $text]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}
```

### Integration Flow

```
Student submits post
      |
PHP receives $_POST['content']
      |
PHP sends text to Python AI (cURL POST to /moderate)
      |
Python AI analyzes text
      |
Python returns JSON (category, status, sentiment)
      |
PHP reads result and decides:
  - APPROVED -> Publish to database
  - REVIEW   -> Save pending, notify admin
  - BLOCKED  -> Do not save, message student
      |
Admin reviews flagged content
      |
Admin makes the FINAL decision (not the AI)
```

---

## PART 8 — ERROR HANDLING

| Error | Response |
|---|---|
| Empty text | success: false, error: "Text is required and cannot be empty." |
| Text too long | success: false, error: "Text exceeds maximum allowed length." |
| Missing text field | success: false, error: "Invalid request body." |
| AI model unavailable | Uses rule-based fallback, returns valid result |
| Server error | success: false, error: "An internal error occurred." |

If the AI service is offline, PHP receives:
```json
{
  "success": false,
  "ai_offline": true,
  "status": "REVIEW",
  "error": "AI service unavailable. Post queued for manual review."
}
```

---

## PART 9 — SECURITY

| Practice | Implementation |
|---|---|
| Input validation | Max 5,000 characters, empty text rejected |
| Local only | Listens on 127.0.0.1 only, not internet-accessible |
| No credentials | No API keys or passwords in code |
| No student data stored | Text processed in memory only |
| No code execution | Text is analyzed as plain text only |
| Safe error messages | Internal errors are logged, not exposed to users |

---

## PART 10 — TESTING

```cmd
python test_moderation.py
```

### Test Cases Summary

| Test | Input | Expected Category | Expected Status |
|---|---|---|---|
| Safe | "Today was a great day..." | SAFE | APPROVED |
| Academic stress | "Stressed because of exams..." | SAFE | APPROVED |
| Bullying | "Everyone should make fun of..." | BULLYING_HARASSMENT | REVIEW |
| Offensive | "You are stupid and worthless." | OFFENSIVE | REVIEW |
| Threat | "I will hurt you if..." | THREATENING | REVIEW/BLOCKED |
| Discriminatory | "All gay students should not..." | DISCRIMINATORY | REVIEW |
| Self-harm | "I want to end my life." | SELF_HARM_CONCERN | REVIEW |
| Spam | "CLICK NOW CLICK NOW..." | SPAM | REVIEW |
| Filipino threat | "Patayin kita bukas." | THREATENING | REVIEW/BLOCKED |
| Taglish bullying | "Lahat mag-ignore kay Maria..." | BULLYING_HARASSMENT | REVIEW |
| Filipino slang | "grabe mag give up sa school" | SAFE | APPROVED |
| Emoji positive | "So happy to finish! 🎉" | SAFE | APPROVED |

---

## PART 11 — AI LIMITATIONS

| Limitation | Example |
|---|---|
| Sarcasm | "Oh sure, school is SO fun." (meant negatively) - reads as positive |
| Filipino slang | "grabe", "char", "hala" - not always in training data |
| Taglish | Mixed Filipino-English - model mostly trained on English |
| Misspellings | "stup1d", "b0b0" - bypasses keyword detection |
| Humor | "I could kill for some pizza" - may flag as threatening |
| Cultural context | "Bakla siya" - may misidentify |

> The AI is a tool to ASSIST authorized personnel - not a replacement for human judgment. No AI is 100% accurate.

---

## PART 12 — PRIVACY

### Student Text Flow

```
Student submits text
      |
PHP system receives it
      |
PHP sends to LOCAL Python AI (127.0.0.1 - stays on same computer)
      |
AI analyzes in memory (not saved to disk)
      |
AI returns only the result (category, status, sentiment)
      |
PHP stores the result in database
```

### Key Privacy Points
- No external servers - text never leaves the school's computer
- No paid cloud AI - no OpenAI, no Google Cloud
- In-memory processing - Python AI does not store submitted text
- Storage decisions managed by PHP system

---

## PART 13 — THESIS INTEGRATION

### How the Two Systems Connect

| Component | Role |
|---|---|
| PHP + HTML/CSS/JS | Main web platform - login, posts, profiles, chat, admin |
| MySQL/Database | Stores all data - users, posts, moderation records |
| Python AI Module | Analyzes text for moderation and sentiment |
| HuggingFace Models | The actual AI intelligence |
| FastAPI | The local bridge between PHP and Python |

### System-Level Flow

```
1. Student posts on Safe Space platform (PHP/HTML/CSS/JS)
2. PHP receives submitted text
3. PHP sends text to Python AI via cURL
4. Python AI analyzes:
   a. Content Moderation: Category + Status
   b. Sentiment Analysis: Emotional Tone
5. Python returns JSON to PHP
6. PHP acts on result:
   a. APPROVED -> Publish to database
   b. REVIEW   -> Pending + notify admin
   c. BLOCKED  -> Do not save + message student
7. Admin reviews flagged content in admin panel
8. Admin makes the FINAL decision
```

---

## PART 14 — ARCHITECTURE DIAGRAM

```
[STUDENT - Browser]
        |
        | HTTP (submit post)
        v
[SAFE SPACE WEB PLATFORM - PHP System]
  - HTML Pages
  - CSS Styles
  - JavaScript
  - PHP Backend (posts, login, admin)
        |
        | cURL POST -> {"text": "student post..."}
        v
[PYTHON AI SERVICE - 127.0.0.1:8000]
  +---[FastAPI Server (app.py)]---+
  |                               |
  [Content Moderation]    [Sentiment Analysis]
  (moderation.py)         (sentiment.py)
  |                               |
  Rule Layer:             RoBERTa Model
  - English keywords      Output:
  - Filipino keywords     POSITIVE
  - Pattern matching      NEUTRAL
  |                       NEGATIVE
  AI Layer:
  - BART-MNLI model
  - Zero-shot classify
  Output:
  SAFE / OFFENSIVE /
  BULLYING / THREATENING /
  SELF_HARM / etc.
        |
        | JSON Response
        | {"category":"SAFE","status":"APPROVED","sentiment":"POSITIVE"}
        v
[PHP SYSTEM]
  Reads JSON -> Decides -> Saves to Database
  APPROVED -> Publish
  REVIEW   -> Pending + Notify Admin
  BLOCKED  -> Do not save
        |
        v
[DATABASE - MySQL]
  Posts, Users, Moderation Logs, Admin Actions
        |
        v
[ADMIN PANEL - PHP]
  Reviews flagged content
  Makes FINAL decision (NOT the AI)
```

---

## PART 15 — THESIS DEFENSE Q&A

**Q1: What AI did you use?**
We used two free, local AI models from HuggingFace. First, facebook/bart-large-mnli for zero-shot content moderation - this can classify text into categories like SAFE, OFFENSIVE, or BULLYING without retraining. Second, cardiffnlp/twitter-roberta-base-sentiment-latest for detecting POSITIVE, NEUTRAL, or NEGATIVE sentiment. Both are free and run on the local computer.

**Q2: Why Python?**
Python has the best AI/machine learning ecosystem including HuggingFace Transformers and PyTorch. These allow free AI models to run on an ordinary laptop. PHP does not have these capabilities.

**Q3: Is the AI free?**
Yes. All models and libraries are free and open-source. There are no subscriptions, API keys, or ongoing costs.

**Q4: Does it require internet?**
Only for the first-time model download (~2.1 GB total). After that, the AI works completely offline - ideal for thesis demonstration.

**Q5: How does moderation work?**
When a student submits a post, PHP sends the text to the Python AI. The AI checks for keyword patterns first, then uses the AI model to determine the category. Based on the category, the system assigns APPROVED, REVIEW, or BLOCKED.

**Q6: How does sentiment analysis work?**
The sentiment model reads the text and determines if the emotional tone is POSITIVE, NEUTRAL, or NEGATIVE. Importantly, NEGATIVE sentiment alone does NOT make content harmful. A student saying "I'm stressed about exams" is NEGATIVE sentiment but SAFE content.

**Q7: How does PHP connect to Python?**
The Python AI runs as a local web service on port 8000. PHP sends HTTP POST requests with JSON using cURL. Python returns a JSON result. PHP reads the JSON to get the moderation category and sentiment.

**Q8: Does the AI automatically punish students?**
No. The AI only provides analysis and flags content for human review. All final decisions are made by authorized school personnel. The AI is a tool to assist moderators, not to replace them.

**Q9: Can the AI make mistakes?**
Yes. It may struggle with sarcasm, Filipino slang, Taglish, humor, misspellings, and ambiguous statements. This is why every flagged result requires human review before any action is taken.

**Q10: How do you protect student privacy?**
Student text is processed locally on the school's own computer and never sent to external servers. The AI processes text in memory only and does not permanently store it. We use no paid cloud AI that would require sending data to external companies.

**Q11: What is the role of AI in Safe Space?**
The AI serves as an automated first layer of content analysis, helping authorized school personnel manage a safe online community. It is not a counselor, therapist, or judge. It is a tool that helps identify content that may need human attention, for students of Aklan State University-Ibajay.

---

## QUICK START SUMMARY

```cmd
:: 1. Navigate to ai_moderation folder
cd "C:\Users\YourName\OneDrive\Desktop\SAFE SPACE THESIS\ai_moderation"

:: 2. Activate virtual environment
venv\Scripts\activate

:: 3. Start the AI server
python app.py

:: 4. In another terminal - run tests
python test_moderation.py

:: 5. In your browser - verify API
:: Open: http://127.0.0.1:8000/
```

---

*Aklan State University - Ibajay | BSCS Thesis | Academic Year 2026*
*Python AI Module - for thesis demonstration purposes*
