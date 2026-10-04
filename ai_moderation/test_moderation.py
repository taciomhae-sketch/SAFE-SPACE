# =============================================================
#  test_moderation.py — Comprehensive Test Suite
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
#           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
#
#  HOW TO RUN:
#    Method 1 — Direct module test (no server required):
#      python test_moderation.py
#
#    Method 2 — Test against running API server:
#      1. Start the server:   python app.py
#      2. In another terminal: python test_moderation.py --api
#
#  NOTE: AI model accuracy will vary depending on:
#    - Whether the HuggingFace models have been downloaded
#    - Filipino, Taglish, sarcasm, and slang text
#    - Ambiguous or context-dependent statements
#
#  The AI is designed to ASSIST authorized personnel, not to
#  make automatic disciplinary decisions.
# =============================================================

import sys
import json
import time

# ── Color output helpers ───────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def pass_msg(msg):  print(f"  {GREEN}✓ PASS{RESET}  {msg}")
def fail_msg(msg):  print(f"  {RED}✗ FAIL{RESET}  {msg}")
def info_msg(msg):  print(f"  {CYAN}ℹ INFO{RESET}  {msg}")
def warn_msg(msg):  print(f"  {YELLOW}⚠ NOTE{RESET}  {msg}")

def section(title):
    print(f"\n{BOLD}{CYAN}{'─'*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*60}{RESET}")


# ── Test case structure ────────────────────────────────────────
test_results = []

def run_test(
    test_name: str,
    text: str,
    expected_category=None,
    expected_status=None,
    expected_sentiment=None,
    acceptable_categories=None,  # list of acceptable categories
    acceptable_statuses=None,    # list of acceptable statuses
    note: str = ""
):
    """Run a single test case and record the result."""
    from moderation  import moderate
    from sentiment   import analyze_sentiment

    print(f"\n  {BOLD}► {test_name}{RESET}")
    print(f"    Text: \"{text[:80]}{'...' if len(text) > 80 else ''}\"")

    mod_result  = moderate(text)
    sent_result = analyze_sentiment(text)

    category   = mod_result["category"]
    status     = mod_result["status"]
    confidence = mod_result["confidence"]
    reason     = mod_result.get("reason", "")
    sentiment  = sent_result["sentiment"]
    sent_score = sent_result["sentiment_score"]

    print(f"    Moderation  : {BOLD}{category}{RESET} → {BOLD}{status}{RESET} (confidence: {confidence:.0%})")
    print(f"    Sentiment   : {BOLD}{sentiment}{RESET} (score: {sent_score:.2f})")
    if reason:
        print(f"    Reason      : {reason[:100]}")

    passed = True
    failures = []

    if expected_category and category != expected_category:
        if acceptable_categories and category in acceptable_categories:
            warn_msg(f"Category was '{category}' — acceptable alternative to '{expected_category}'")
        else:
            failures.append(f"Expected category '{expected_category}', got '{category}'")
            passed = False

    if expected_status and status != expected_status:
        if acceptable_statuses and status in acceptable_statuses:
            warn_msg(f"Status was '{status}' — acceptable alternative to '{expected_status}'")
        else:
            failures.append(f"Expected status '{expected_status}', got '{status}'")
            passed = False

    if expected_sentiment and sentiment != expected_sentiment:
        failures.append(f"Expected sentiment '{expected_sentiment}', got '{sentiment}'")
        passed = False

    if passed and not failures:
        pass_msg("Test passed.")
    else:
        for f in failures:
            fail_msg(f)

    if note:
        info_msg(note)

    test_results.append({
        "test":     test_name,
        "passed":   passed and not failures,
        "category": category,
        "status":   status,
        "sentiment": sentiment,
    })

    return passed


# ══════════════════════════════════════════════════════════════
def run_all_tests():
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  SAFE SPACE AI — MODERATION TEST SUITE{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")
    print("  Institution : Aklan State University – Ibajay")
    print("  Purpose     : Thesis demonstration test cases")
    print("  REMINDER    : AI results are advisory only.")
    print(f"{BOLD}{'='*60}{RESET}")

    # ── TEST 1: SAFE CONTENT ─────────────────────────────────
    section("TEST 1 — SAFE Content")
    run_test(
        test_name="Safe positive post",
        text="Today was a great day. I enjoyed studying with my classmates and learned so much.",
        expected_category="SAFE",
        expected_status="APPROVED",
        expected_sentiment="POSITIVE",
        note="Normal positive student content should always be APPROVED."
    )

    # ── TEST 2: NEGATIVE BUT SAFE ────────────────────────────
    section("TEST 2 — Negative Sentiment, Safe Content")
    run_test(
        test_name="Academic stress — NOT harmful",
        text="I am so stressed because I have many assignments due this week. I barely slept.",
        expected_category="SAFE",
        expected_status="APPROVED",
        expected_sentiment="NEGATIVE",
        acceptable_categories=["SAFE", "SELF_HARM_CONCERN"],  # AI may vary
        acceptable_statuses=["APPROVED", "REVIEW"],
        note=(
            "IMPORTANT: Negative sentiment does NOT mean harmful content. "
            "Academic stress is normal. Status should be APPROVED or at most REVIEW. "
            "This text should NEVER be BLOCKED."
        )
    )

    # ── TEST 3: BULLYING ─────────────────────────────────────
    section("TEST 3 — Bullying / Harassment")
    run_test(
        test_name="Incitement to bully a student",
        text="Everyone should make fun of that student because she thinks she is smart.",
        expected_category="BULLYING_HARASSMENT",
        acceptable_statuses=["REVIEW", "BLOCKED"],
        note=(
            "Direct incitement to bully should be at minimum REVIEW. "
            "A human admin should review before any disciplinary action."
        )
    )

    # ── TEST 4: OFFENSIVE ────────────────────────────────────
    section("TEST 4 — Offensive Language")
    run_test(
        test_name="Personal insult in English",
        text="You are stupid and completely worthless. Nobody wants you here.",
        expected_category="OFFENSIVE",
        expected_status="REVIEW",
        acceptable_categories=["OFFENSIVE", "BULLYING_HARASSMENT"],
        note="Offensive insults should be flagged for admin review."
    )

    # ── TEST 5: THREATENING ──────────────────────────────────
    section("TEST 5 — Threatening Language")
    run_test(
        test_name="Direct threat",
        text="I will hurt you if you do not stop talking to me.",
        expected_category="THREATENING",
        acceptable_statuses=["REVIEW", "BLOCKED"],
        note=(
            "Explicit threats should be escalated to at least REVIEW. "
            "Very clear threats may be BLOCKED automatically."
        )
    )

    # ── TEST 6: DISCRIMINATORY ───────────────────────────────
    section("TEST 6 — Discriminatory Content")
    run_test(
        test_name="Discriminatory generalization",
        text="All gay students should not be allowed to join any school activity.",
        expected_category="DISCRIMINATORY",
        acceptable_categories=["DISCRIMINATORY", "OFFENSIVE"],
        acceptable_statuses=["REVIEW", "BLOCKED"],
        note=(
            "Discriminatory statements based on identity should be flagged. "
            "Note: The AI may not always catch subtle discrimination."
        )
    )

    # ── TEST 7: SELF-HARM CONCERN ────────────────────────────
    section("TEST 7 — Self-Harm Concern")
    run_test(
        test_name="Explicit self-harm statement",
        text="I want to disappear forever. I have been thinking about ending my life.",
        expected_category="SELF_HARM_CONCERN",
        expected_status="REVIEW",
        acceptable_statuses=["REVIEW", "BLOCKED"],
        note=(
            "Self-harm concern should always be flagged for immediate human review. "
            "The AI does NOT diagnose mental health conditions. "
            "Results should be reviewed by a qualified school counselor."
        )
    )

    # ── TEST 8: SPAM ─────────────────────────────────────────
    section("TEST 8 — Spam Content")
    run_test(
        test_name="Promotional spam",
        text="CLICK NOW CLICK NOW CLICK NOW!!! FREE MONEY CLICK HERE FREE MONEY",
        expected_category="SPAM",
        expected_status="REVIEW",
        acceptable_statuses=["REVIEW", "BLOCKED"],
        note="Repeated promotional/spam text should be flagged."
    )

    # ── TEST 9: FILIPINO ─────────────────────────────────────
    section("TEST 9 — Filipino Language")
    run_test(
        test_name="Filipino threatening language",
        text="Patayin kita pag hindi ka tumigil.",
        expected_category="THREATENING",
        acceptable_statuses=["REVIEW", "BLOCKED"],
        note=(
            "The keyword rule layer specifically covers common Filipino threatening phrases. "
            "AI accuracy on Filipino text varies. The rule layer improves detection."
        )
    )
    run_test(
        test_name="Filipino offensive language",
        text="Bobo mo talaga at walang kwenta.",
        expected_category="OFFENSIVE",
        acceptable_categories=["OFFENSIVE", "BULLYING_HARASSMENT"],
        acceptable_statuses=["REVIEW", "BLOCKED"],
        note="Filipino slurs and offensive words are covered by the rule layer."
    )

    # ── TEST 10: TAGLISH ─────────────────────────────────────
    section("TEST 10 — Taglish (Mixed Filipino-English)")
    run_test(
        test_name="Taglish bullying statement",
        text="Lahat dapat mag-ignore kay Maria kasi ang arte-arte niya. Make fun of her lagi.",
        expected_category="BULLYING_HARASSMENT",
        acceptable_categories=["BULLYING_HARASSMENT", "OFFENSIVE"],
        acceptable_statuses=["REVIEW", "BLOCKED"],
        note=(
            "Taglish (mixed Filipino-English) is common among Filipino students. "
            "The AI may have reduced accuracy on Taglish. Results should be "
            "reviewed by a human familiar with the cultural context."
        )
    )

    # ── TEST 11: STUDENT SLANG ───────────────────────────────
    section("TEST 11 — Informal Student Language / Slang")
    run_test(
        test_name="Informal stress expression",
        text="grabe feeling ko mag give up na sa school huhu sobrang daming assignments",
        expected_category="SAFE",
        expected_status="APPROVED",
        expected_sentiment="NEGATIVE",
        acceptable_categories=["SAFE", "SELF_HARM_CONCERN"],
        acceptable_statuses=["APPROVED", "REVIEW"],
        note=(
            "'Give up sa school' means quitting school, not self-harm. "
            "This is a common Filipino student expression. "
            "Context is important — AI may struggle with informal slang."
        )
    )

    # ── TEST 12: EMOJIS ──────────────────────────────────────
    section("TEST 12 — Text with Emojis")
    run_test(
        test_name="Positive emoji-heavy post",
        text="So happy to finally finish my project!!! 🎉🎊 Best day ever with my blockmates 😊💕",
        expected_category="SAFE",
        expected_status="APPROVED",
        expected_sentiment="POSITIVE",
        note="Emojis do not negatively impact moderation. Positive context is recognized."
    )
    run_test(
        test_name="Negative emoji expression — student frustration",
        text="Can't believe I failed again 😭😭 I feel so stupid and useless rn",
        expected_category="OFFENSIVE",
        acceptable_categories=["OFFENSIVE", "SAFE", "SELF_HARM_CONCERN"],
        acceptable_statuses=["REVIEW", "APPROVED"],
        expected_sentiment="NEGATIVE",
        note=(
            "Self-directed frustration ('I feel useless') is different from "
            "directing insults at others. AI interpretation may vary. "
            "Human review is always recommended for ambiguous cases."
        )
    )

    # ── SUMMARY ──────────────────────────────────────────────
    total  = len(test_results)
    passed = sum(1 for r in test_results if r["passed"])
    failed = total - passed

    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  TEST SUMMARY{RESET}")
    print(f"{'='*60}")
    print(f"  Total tests : {total}")
    print(f"  {GREEN}Passed      : {passed}{RESET}")
    if failed:
        print(f"  {RED}Failed      : {failed}{RESET}")
    else:
        print(f"  {GREEN}All tests passed!{RESET}")
    print(f"{'='*60}")

    # ── Accuracy Limitation Reminder ─────────────────────────
    print(f"""
{YELLOW}{BOLD}  AI LIMITATION REMINDERS:{RESET}
{YELLOW}
  1. The AI may misunderstand sarcasm, humor, and irony.
  2. Filipino and Taglish accuracy depends on the base model.
     The rule layer improves detection for common phrases.
  3. Misspellings and creative spelling (e.g. "supr00b") may
     bypass keyword detection.
  4. Cultural expressions may be misclassified.
  5. Ambiguous statements may return unexpected results.
  6. NEGATIVE sentiment does NOT equal harmful content.
  7. The AI should ASSIST, not REPLACE, human decision-making.
  8. No AI is 100% accurate. Final decisions must be made
     by authorized school personnel.
{RESET}""")

    return passed == total


# ── API Test Mode ─────────────────────────────────────────────
def run_api_tests():
    """Test the running FastAPI server via HTTP requests."""
    try:
        import httpx
    except ImportError:
        print(f"{RED}ERROR: httpx is not installed. Run: pip install httpx{RESET}")
        return

    base_url = "http://127.0.0.1:8000"
    section("API SERVER TESTS")

    try:
        r = httpx.get(f"{base_url}/", timeout=5)
        data = r.json()
        if data.get("status") == "online":
            pass_msg(f"Health check: {data['service']}")
        else:
            fail_msg("Health check failed.")
    except Exception as e:
        print(f"{RED}Cannot connect to API server at {base_url}{RESET}")
        print(f"Make sure 'python app.py' is running in another terminal.")
        print(f"Error: {e}")
        return

    test_cases = [
        ("SAFE content", "Today was a great day studying with my classmates."),
        ("Offensive language", "You are stupid and worthless."),
        ("Filipino threat", "Patayin kita bukas."),
        ("Academic stress", "I am stressed because of my final exams this week."),
    ]

    for name, text in test_cases:
        try:
            r = httpx.post(f"{base_url}/moderate", json={"text": text}, timeout=30)
            result = r.json()
            print(f"\n  {BOLD}► {name}{RESET}")
            print(f"    Category  : {result.get('category')}")
            print(f"    Status    : {result.get('status')}")
            print(f"    Sentiment : {result.get('sentiment')}")
            print(f"    Confidence: {result.get('confidence', 0):.0%}")
        except Exception as e:
            fail_msg(f"API call failed for '{name}': {e}")


# ── Entry Point ───────────────────────────────────────────────
if __name__ == "__main__":
    if "--api" in sys.argv:
        run_api_tests()
    else:
        all_passed = run_all_tests()
        sys.exit(0 if all_passed else 1)
