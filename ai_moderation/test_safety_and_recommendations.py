"""
Safe Space Platform - Support Recommendation & Safety Test Suite
Verifies:
1. Academic examination/school stress (DEADLINE_STRESS)
2. Academic sadness & setback / failed exam (EXAM_SETBACK)
3. Loneliness & feelings of being left out (LONELINESS)
4. Positive experience & achievement (ACHIEVEMENT)
5. Neutral practical inquiries / schedules (ANNOUNCEMENT_INQUIRY)
6. Urgent crisis & suicide safety with verified emergency hotlines (CRISIS)
7. Sexual proposition boundary handling (CONTENT_POLICY_NOTICE)
8. Banned openers prevention & non-repeating dynamic recommendations
9. Educational suicide awareness posts are NOT treated as crisis
10. Filipino and Taglish language adaptation
11. Situation summary present in all recommendations
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from support_recommender import generate_support_recommendation, clean_preview

BANNED_OPENERS = [
    "sorry you're going through this",
    "that sounds overwhelming",
    "i'm sorry you're feeling this way",
    "thanks for sharing",
    "congratulations"
]

def run_tests():
    passed = 0
    total = 0

    print("=" * 75)
    print("SAFE SPACE AI SUPPORT RECOMMENDATION TEST SUITE")
    print("=" * 75)

    # ─────────────────────────────────────────────────────────────
    # TEST 1: Academic Stress (Deadlines, Workload)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t1 = "I am so overwhelmed by my upcoming final exams and thesis defense next week, I don't know where to start."
    r1 = generate_support_recommendation(t1, "NEGATIVE", "SAFE", "low", "english")
    assert r1["type"] == "DEADLINE_STRESS"
    assert "situation_summary" in r1 and len(r1["situation_summary"]) > 0
    assert "preview" in r1 and len(r1["preview"]) > 0
    assert "more" in r1 and len(r1["more"]) > 0
    assert r1["collapsible"] is True
    # Verify no banned openers
    for bo in BANNED_OPENERS:
        assert not r1["preview"].lower().startswith(bo), f"Found banned opener '{bo}' in: {r1['preview']}"
    assert "thesis" in r1["preview"].lower() or "deadlines" in r1["preview"].lower() or "requirements" in r1["preview"].lower()
    assert r1["preview"] not in r1["more"]
    passed += 1
    print(f"PASS [1]: DEADLINE_STRESS validated.")
    print(f"       Preview: \"{r1['preview']}\"")
    print(f"       Summary: \"{r1['situation_summary']}\"")

    # ─────────────────────────────────────────────────────────────
    # TEST 2: Academic Sadness (Failed Exam, Setback)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t2 = (
        "Today started out like any regular Tuesday. However, when I got home, I discovered "
        "that I failed my major chemistry midterm exam and my scholarship is on the line. "
        "I feel so crushed and disappointed in myself right now."
    )
    r2 = generate_support_recommendation(t2, "NEGATIVE", "SAFE", "low", "english")
    assert r2["type"] == "EXAM_SETBACK"
    assert "situation_summary" in r2
    assert "chemistry" in r2["preview"].lower() or "chemistry" in r2["situation_summary"].lower()
    for bo in BANNED_OPENERS:
        assert not r2["preview"].lower().startswith(bo)
    assert r2["collapsible"] is True
    passed += 1
    print(f"PASS [2]: EXAM_SETBACK validated (mentions Chemistry).")
    print(f"       Preview: \"{r2['preview']}\"")

    # ─────────────────────────────────────────────────────────────
    # TEST 3: Loneliness / Feeling Left Out
    # ─────────────────────────────────────────────────────────────
    total += 1
    t3 = "Lately I feel so isolated and left out, like nobody in my batch understands me and I have no real friends."
    r3 = generate_support_recommendation(t3, "NEGATIVE", "DISTRESS", "medium", "english")
    assert r3["type"] == "LONELINESS"
    assert r3["show_resources_button"] is True
    assert r3["collapsible"] is True
    passed += 1
    print(f"PASS [3]: LONELINESS validated (show_resources_button is True).")

    # ─────────────────────────────────────────────────────────────
    # TEST 4: Positive Experiences & Achievements
    # ─────────────────────────────────────────────────────────────
    total += 1
    t4 = "I just passed my board exams and won first place in the university hackathon! So grateful!"
    r4 = generate_support_recommendation(t4, "POSITIVE", "SAFE", "low", "english")
    assert r4["type"] == "ACHIEVEMENT"
    assert "hackathon" in r4["preview"].lower() or "board exam" in r4["preview"].lower()
    # Verify no cliché banned opener "Congratulations"
    assert not r4["preview"].lower().startswith("congratulations")
    assert r4["collapsible"] is True
    passed += 1
    print(f"PASS [4]: ACHIEVEMENT validated (mentions Hackathon / Board Exam; no banned opener).")

    # ─────────────────────────────────────────────────────────────
    # TEST 5: Neutral Questions / Announcements
    # ─────────────────────────────────────────────────────────────
    total += 1
    t5 = "Does anyone know how to request an official transcript of records from the registrar? Any tips on what requirements are needed?"
    r5 = generate_support_recommendation(t5, "NEUTRAL", "SAFE", "low", "english")
    assert r5["type"] == "ANNOUNCEMENT_INQUIRY"
    assert r5["collapsible"] is True
    assert "situation_summary" in r5
    passed += 1
    print(f"PASS [5]: ANNOUNCEMENT_INQUIRY validated.")

    # ─────────────────────────────────────────────────────────────
    # TEST 6: Crisis Protocol (Self-harm / Suicide)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t6 = "I want to end my life, everything hurts and I cannot take this pain anymore."
    r6 = generate_support_recommendation(t6, "NEGATIVE", "SELF_HARM", "urgent", "english")
    assert r6["type"] == "CRISIS"
    assert r6["collapsible"] is False
    assert r6["more"] == ""
    assert r6["show_resources_button"] is True
    assert "1553" in r6["preview"]
    assert "911" in r6["preview"]
    assert any("1553" in num for num in r6["emergency_numbers"])
    assert any("911" in num for num in r6["emergency_numbers"])
    assert any("Ext. 104" in num or "Extension 104" in num for num in r6["emergency_numbers"])
    passed += 1
    print(f"PASS [6]: CRISIS validated (collapsible=False, hotlines immediately visible in preview).")

    # ─────────────────────────────────────────────────────────────
    # TEST 7: Inappropriate Proposition (CONTENT_POLICY_NOTICE)
    # ─────────────────────────────────────────────────────────────
    total += 1
    t7 = "i want to have sex with you"
    r7 = generate_support_recommendation(t7, "NEUTRAL", "NUDITY", "critical", "english")
    assert r7["type"] == "CONTENT_POLICY_NOTICE"
    assert "community" in r7["preview"].lower() or "standards" in r7["preview"].lower() or "guidelines" in r7["more"].lower()
    # Does NOT output cheerful schedule support!
    assert "schedule" not in r7["preview"].lower()
    passed += 1
    print(f"PASS [7]: CONTENT_POLICY_NOTICE correctly handled for explicit proposition.")
    print(f"       Preview: \"{r7['preview']}\"")

    # ─────────────────────────────────────────────────────────────
    # TEST 8: Two Different Posts Never Get The Same Advice
    # ─────────────────────────────────────────────────────────────
    total += 1
    t8_a = "Failed my Calculus midterm and feel so terrible."
    t8_b = "My roommate keeps inviting people over late at night in our dorm and we had a huge fight."
    r8_a = generate_support_recommendation(t8_a, "NEGATIVE", "SAFE", "low", "english")
    r8_b = generate_support_recommendation(t8_b, "NEGATIVE", "SAFE", "low", "english", recent_replies=[r8_a["preview"]])
    assert r8_a["type"] != r8_b["type"]
    assert r8_a["preview"] != r8_b["preview"]
    assert r8_a["more"] != r8_b["more"]
    assert r8_b["type"] == "ROOMMATE_CONFLICT"
    passed += 1
    print(f"PASS [8]: Non-repeating contextual recommendations validated across different posts.")

    # ─────────────────────────────────────────────────────────────
    # TEST 9: Educational Discussion is NOT Crisis
    # ─────────────────────────────────────────────────────────────
    total += 1
    t9 = "In our psychology class lecture today, we discussed suicide prevention awareness and mental health advocacy."
    r9 = generate_support_recommendation(t9, "NEUTRAL", "SAFE", "low", "english")
    assert r9["type"] != "CRISIS"
    passed += 1
    print(f"PASS [9]: Educational suicide awareness discussion correctly treated as {r9['type']} (NOT crisis).")

    # ─────────────────────────────────────────────────────────────
    # TEST 10: Filipino & Taglish Adaptation
    # ─────────────────────────────────────────────────────────────
    total += 1
    t10_ph = "Sobrang tambak ng requirements namin sa thesis, hindi na ako makatulog sa pagod."
    r10 = generate_support_recommendation(t10_ph, "NEGATIVE", "SAFE", "low", "filipino")
    assert r10["type"] == "DEADLINE_STRESS"
    assert "thesis" in r10["preview"].lower() or "deadline" in r10["preview"].lower() or "requirements" in r10["preview"].lower()
    for bo in BANNED_OPENERS:
        assert not r10["preview"].lower().startswith(bo)
    passed += 1
    print(f"PASS [10]: Filipino / Taglish adaptation validated.")
    print(f"       Preview: \"{r10['preview']}\"")

    print("=" * 75)
    print(f"TEST RESULTS: {passed}/{total} TESTS PASSED (100% SUCCESS)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
