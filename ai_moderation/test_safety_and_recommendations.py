"""
Safe Space Platform - Support Recommendation & Safety Test Suite
Verifies:
1. Academic examination/school stress (ACADEMIC_STRESS)
2. Academic sadness & setback / failed exam (ACADEMIC_SADNESS)
3. Loneliness & feelings of being left out (LONELINESS)
4. Positive experience & achievement (POSITIVE)
5. Neutral practical inquiries / schedules (NEUTRAL)
6. Urgent crisis & suicide safety with verified emergency hotlines (CRISIS)
7. Preview / More / Collapsible contract and non-repeating structure
8. Filipino and Taglish language adaptation
9. Educational suicide awareness posts are NOT treated as crisis
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from support_recommender import generate_support_recommendation, clean_preview

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
    assert r1["type"] == "ACADEMIC_STRESS"
    assert "preview" in r1 and len(r1["preview"]) > 0
    assert "more" in r1 and len(r1["more"]) > 0
    assert r1["collapsible"] is True
    assert "overwhelming" in r1["preview"].lower() or "overwhelm" in r1["preview"].lower()
    assert "deadlines" in r1["more"].lower() or "urgent" in r1["more"].lower()
    assert r1["preview"] not in r1["more"]
    passed += 1
    print(f"PASS [1]: ACADEMIC_STRESS validated.")
    print(f"       Preview: \"{r1['preview']}\"")
    print(f"       More:    \"{r1['more'][:80]}...\"")

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
    assert r2["type"] == "ACADEMIC_SADNESS"
    assert "disappointed" in r2["preview"].lower() or "define" in r2["preview"].lower()
    assert "rest" in r2["more"].lower() or "classmate" in r2["more"].lower()
    assert r2["collapsible"] is True
    passed += 1
    print(f"PASS [2]: ACADEMIC_SADNESS validated.")
    print(f"       Preview: \"{r2['preview']}\"")

    # ─────────────────────────────────────────────────────────────
    # TEST 3: Loneliness / Feeling Left Out
    # ─────────────────────────────────────────────────────────────
    total += 1
    t3 = "Lately I feel so isolated and left out, like nobody in my batch understands me and I have no real friends."
    r3 = generate_support_recommendation(t3, "NEGATIVE", "DISTRESS", "medium", "english")
    assert r3["type"] == "LONELINESS"
    assert "lonely" in r3["preview"].lower() or "misunderstood" in r3["preview"].lower()
    assert r3["show_resources_button"] is True
    assert r3["collapsible"] is True
    passed += 1
    print(f"PASS [3]: LONELINESS validated (show_resources_button is True).")
    print(f"       Preview: \"{r3['preview']}\"")

    # ─────────────────────────────────────────────────────────────
    # TEST 4: Positive Experiences & Achievements
    # ─────────────────────────────────────────────────────────────
    total += 1
    t4 = "I just passed my board exams and won first place in the university hackathon! So grateful!"
    r4 = generate_support_recommendation(t4, "POSITIVE", "SAFE", "low", "english")
    assert r4["type"] == "POSITIVE"
    assert "congratulations" in r4["preview"].lower() or "achievement" in r4["preview"].lower()
    assert "deadline" not in r4["message"].lower()
    assert r4["collapsible"] is True
    passed += 1
    print(f"PASS [4]: POSITIVE validated (celebration without unwanted stress advice).")

    # ─────────────────────────────────────────────────────────────
    # TEST 5: Neutral Questions / Schedules
    # ─────────────────────────────────────────────────────────────
    total += 1
    t5 = "Does anyone know how to request an official transcript of records from the registrar? Any tips on what requirements are needed?"
    r5 = generate_support_recommendation(t5, "NEUTRAL", "SAFE", "low", "english")
    assert r5["type"] == "NEUTRAL"
    assert r5["collapsible"] is True
    passed += 1
    print(f"PASS [5]: NEUTRAL validated.")

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
    assert any("Extension 104" in num or "Ext. 104" in num for num in r6["emergency_numbers"])
    passed += 1
    print(f"PASS [6]: CRISIS validated (collapsible=False, hotlines immediately visible in preview).")

    # ─────────────────────────────────────────────────────────────
    # TEST 7: Educational Discussion is NOT Crisis
    # ─────────────────────────────────────────────────────────────
    total += 1
    t7 = "In our psychology class lecture today, we discussed suicide prevention awareness and mental health advocacy."
    r7 = generate_support_recommendation(t7, "NEUTRAL", "SAFE", "low", "english")
    assert r7["type"] in ["NEUTRAL", "POSITIVE"]
    passed += 1
    print(f"PASS [7]: Educational suicide awareness discussion correctly treated as {r7['type']} (NOT crisis).")

    # ─────────────────────────────────────────────────────────────
    # TEST 8: Filipino & Taglish Adaptation
    # ─────────────────────────────────────────────────────────────
    total += 1
    t8_ph = "Sobrang tambak ng schoolwork at requirements namin sa thesis, hindi na ako makatulog sa stress."
    r8 = generate_support_recommendation(t8_ph, "NEGATIVE", "SAFE", "low", "filipino")
    assert r8["type"] == "ACADEMIC_STRESS"
    assert "overwhelm" in r8["preview"].lower() or "schoolwork" in r8["preview"].lower()
    assert "ilista" in r8["more"].lower() or "pahinga" in r8["more"].lower()
    passed += 1
    print(f"PASS [8]: Filipino / Taglish adaptation validated.")
    print(f"       Preview: \"{r8['preview']}\"")

    # ─────────────────────────────────────────────────────────────
    # TEST 9: Filipino Crisis Protocol
    # ─────────────────────────────────────────────────────────────
    total += 1
    t9_crisis = "Gusto ko nang magpakamatay, pagod na pagod na ako sa lahat."
    r9 = generate_support_recommendation(t9_crisis, "NEGATIVE", "SELF_HARM", "urgent", "filipino")
    assert r9["type"] == "CRISIS"
    assert r9["collapsible"] is False
    assert r9["more"] == ""
    assert "1553" in r9["preview"]
    assert "911" in r9["preview"]
    passed += 1
    print(f"PASS [9]: Filipino CRISIS protocol validated.")

    print("=" * 75)
    print(f"TEST RESULTS: {passed}/{total} TESTS PASSED (100% SUCCESS)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
