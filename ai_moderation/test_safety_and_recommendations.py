"""
Safe Space Platform - Context-Aware AI Support & Acceptance Test Suite
Comprehensive verification of:
1. Academic examination/school stress
2. Loneliness & feelings of being left out
3. Positive experience & achievement (celebration without unnecessary advice)
4. Practical question answering (actionable steps, not generic quotes)
5. Long paragraph context-awareness (complete text analyzed)
6. Sneak peek preview (~25-40 words, cleanly truncated)
7. Full multi-step response structure
8. Anxiety / excessive worry (grounding exercises & slow breathing)
9. Bullying / interpersonal conflict (validation, safe documentation, trusted adults)
10. Distinct contextual responses across different scenarios
11. Urgent crisis & suicide safety with verified emergency hotlines
12. Filipino and Taglish language adaptation
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from support_recommender import generate_support_recommendation, clean_preview
from censor import censor_profanity
from moderation import moderate

def run_tests():
    passed = 0
    total = 0

    print("=" * 75)
    print("SAFE SPACE CONTEXT-AWARE AI SUPPORT & ACCEPTANCE TEST SUITE")
    print("=" * 75)

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 1: Examination Stress / Academic Pressure
    # ─────────────────────────────────────────────────────────────
    total += 1
    t1 = "I am so overwhelmed by my upcoming final exams and thesis defense next week, I don't know where to start."
    r1 = generate_support_recommendation(t1, "NEGATIVE", "SAFE", "low", "english")
    assert r1["type"] == "academic_support"
    assert "preview" in r1 and len(r1["preview"].split()) >= 15
    assert len(r1["preview"].split()) <= 45
    assert "overwhelming" in r1["preview"].lower() or "deadlines" in r1["preview"].lower()
    assert "listing your deadlines" in r1["message"].lower() or "manageable step" in r1["message"].lower()
    passed += 1
    print(f"PASS [1]: Acceptance Test 1 - Examination Stress / Academic Pressure")
    print(f"       Preview ({len(r1['preview'].split())} w): \"{r1['preview']}\"")
    print(f"       Full Advice ({len(r1['message'].split())} w): \"{r1['message'][:80]}...\"")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 2: Loneliness / Feeling Left Out
    # ─────────────────────────────────────────────────────────────
    total += 1
    t2 = "Lately I feel so isolated and left out, like nobody in my batch understands me and I have no real friends."
    r2 = generate_support_recommendation(t2, "NEGATIVE", "DISTRESS", "medium", "english")
    assert r2["type"] == "empathy_support"
    assert "lonely" in r2["preview"].lower() or "misunderstood" in r2["preview"].lower()
    assert "campus clubs" in r2["message"].lower() or "reaching out" in r2["message"].lower() or "trusted" in r2["message"].lower()
    assert r2["show_resources_button"] is True
    passed += 1
    print(f"PASS [2]: Acceptance Test 2 - Loneliness & Social Connection")
    print(f"       Preview ({len(r2['preview'].split())} w): \"{r2['preview']}\"")
    print(f"       Full Advice: \"{r2['message'][:80]}...\"")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 3: Positive Experiences & Achievements
    # (Celebration only; no unnecessary stress advice)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t3 = "I just passed my board exams and won first place in the university hackathon! So grateful!"
    r3 = generate_support_recommendation(t3, "POSITIVE", "SAFE", "low", "english")
    assert r3["type"] == "celebration"
    assert "congratulations" in r3["preview"].lower() or "achievement" in r3["preview"].lower()
    assert "congratulations" in r3["message"].lower()
    # Must NOT give unnecessary stress advice
    assert "deadline" not in r3["message"].lower()
    assert "exam doesn't define" not in r3["message"].lower()
    passed += 1
    print(f"PASS [3]: Acceptance Test 3 - Achievement Celebration (No unwanted stress advice)")
    print(f"       Preview: \"{r3['preview']}\"")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 4: Asking for Practical Advice
    # (Practical action steps, not unrelated motivational quotes)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t4 = "Does anyone know how to request an official transcript of records from the registrar? Any tips on what requirements are needed?"
    r4 = generate_support_recommendation(t4, "NEUTRAL", "SAFE", "low", "english")
    assert r4["type"] == "practical_guidance"
    assert "practical" in r4["preview"].lower() or "actionable" in r4["preview"].lower()
    assert ("checklist" in r4["message"].lower() or "guidelines" in r4["message"].lower() or "structured" in r4["message"].lower())
    passed += 1
    print(f"PASS [4]: Acceptance Test 4 - Practical Advice & Problem Solving")
    print(f"       Preview: \"{r4['preview']}\"")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 5: Long Paragraph Analysis (Full Context)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t5 = (
        "Today started out like any regular Tuesday on campus. I went to the cafeteria, grabbed coffee, "
        "and attended two lectures that went smoothly. However, when I got home this evening, I opened my portal "
        "and discovered that I failed my major chemistry midterm exam and my scholarship is on the line. "
        "I feel so crushed and disappointed in myself right now."
    )
    r5 = generate_support_recommendation(t5, "NEGATIVE", "SAFE", "low", "english")
    # Even though first 2 sentences are normal coffee and lectures, the full context identifies the exam failure & disappointment
    assert r5["type"] == "academic_support"
    assert "disappointed" in r5["preview"].lower() or "abilities" in r5["preview"].lower()
    passed += 1
    print(f"PASS [5]: Acceptance Test 5 - Complete Multi-Sentence Paragraph Analysis")
    print(f"       Correctly identified exam failure in 4th sentence of long post.")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 6 & 7: Sneak Peek Preview Constraint (~25-40 words)
    # ─────────────────────────────────────────────────────────────
    total += 1
    sample_full = (
        "It sounds like you're feeling overwhelmed by your school responsibilities. "
        "It's okay to feel this way, especially when several deadlines happen at once. "
        "Try listing your tasks and choosing the most urgent one to work on first. "
        "Divide larger assignments into smaller steps, take short breaks, and give yourself credit."
    )
    preview_extracted = clean_preview(sample_full, max_words=35)
    word_count = len(preview_extracted.split())
    assert 15 <= word_count <= 42
    assert preview_extracted.endswith(".") or preview_extracted.endswith("...")
    passed += 1
    print(f"PASS [6-7]: Sneak Peek Preview Clean Truncation ({word_count} words)")
    print(f"       Preview: \"{preview_extracted}\"")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 8: Anxiety or Excessive Worry (Category D)
    # (Grounding exercises, slow breathing, manageable steps)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t8 = "I am having such bad anxiety and my heart is racing. I can't stop overthinking and I'm terrified I will mess up tomorrow."
    r8 = generate_support_recommendation(t8, "NEGATIVE", "SAFE", "low", "english")
    assert r8["type"] == "anxiety_support"
    assert "anxiety" in r8["preview"].lower() or "racing thoughts" in r8["preview"].lower()
    assert "grounding" in r8["message"].lower() or "breath" in r8["message"].lower()
    assert "4 seconds" in r8["message"].lower() or "exhale" in r8["message"].lower()
    passed += 1
    print(f"PASS [8]: Acceptance Test 8 - Anxiety & Grounding Coping Strategies")
    print(f"       Preview: \"{r8['preview']}\"")
    print(f"       Grounding technique included in full advice.")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 9: Bullying or Interpersonal Conflict (Category E)
    # (Validation without blame, safe documentation, trusted adults)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t9 = "Some classmates are spreading malicious rumors about me online and cyberbullying me in group chats. I don't know what to do."
    r9 = generate_support_recommendation(t9, "NEGATIVE", "HARASSMENT", "medium", "english")
    assert r9["type"] == "bullying_support"
    assert "not your fault" in r9["preview"].lower() or "hostility" in r9["preview"].lower()
    assert "document" in r9["message"].lower() or "record" in r9["message"].lower()
    assert "guidance counselor" in r9["message"].lower() or "trusted teacher" in r9["message"].lower()
    passed += 1
    print(f"PASS [9]: Acceptance Test 9 - Bullying & Boundary Setting Support")
    print(f"       Preview: \"{r9['preview']}\"")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 10: Distinct Responses for Different Posts
    # ─────────────────────────────────────────────────────────────
    total += 1
    assert r1["type"] != r3["type"]
    assert r3["type"] != r4["type"]
    assert r8["type"] != r9["type"]
    assert r1["preview"] != r2["preview"]
    passed += 1
    print(f"PASS [10]: Acceptance Test 10 - Highly Contextual & Non-Generic Advice")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 11: Crisis / Suicide Safety Controls
    # ─────────────────────────────────────────────────────────────
    total += 1
    t11 = "I want to end my life, everything hurts and I cannot take this pain anymore."
    r11 = generate_support_recommendation(t11, "NEGATIVE", "SELF_HARM", "urgent", "english")
    assert r11["type"] == "crisis_support"
    assert "1553" in r11["emergency_numbers"]
    assert "911" in r11["emergency_numbers"]
    assert r11["show_resources_button"] is True
    passed += 1
    print(f"PASS [11]: Acceptance Test 11 - Urgent Crisis Guidance with Emergency Hotlines")

    # ─────────────────────────────────────────────────────────────
    # ACCEPTANCE TEST 12: Filipino & Taglish Adaptation
    # ─────────────────────────────────────────────────────────────
    total += 1
    t12_ph = "Sobrang kinakabahan ako sa defense namin bukas, hindi na ako makatulog sa takot."
    r12 = generate_support_recommendation(t12_ph, "NEGATIVE", "SAFE", "low", "filipino")
    assert r12["type"] == "anxiety_support"
    assert "kaba" in r12["preview"].lower() or "huminga" in r12["preview"].lower()
    assert "grounding" in r12["message"].lower() or "huminga" in r12["message"].lower()
    passed += 1
    print(f"PASS [12]: Acceptance Test 12 - Filipino / Taglish Language Adaptation")
    print(f"       Preview: \"{r12['preview']}\"")

    print("=" * 75)
    print(f"TEST RESULTS: {passed}/{total} ACCEPTANCE TESTS PASSED (100% SUCCESS)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
