"""
Safe Space Platform - AI Safety Warning & Supportive Recommendation Test Suite
Tests:
1. Examples A-E recommendation accuracy
2. High-Risk / Suicide crisis guidance with verified hotlines
3. Bullying / harassment detection and warning modal config
4. Threat / violence detection and warning modal config
5. Distressing / sensitive content warning
6. Educational discussion preservation
7. Filipino and Taglish support
8. Profanity masking preservation before sentiment analysis
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from support_recommender import generate_support_recommendation
from censor import censor_profanity
from moderation import moderate

def run_tests():
    passed = 0
    total = 0

    print("=" * 70)
    print("SAFE SPACE AI SAFETY & SUPPORT RECOMMENDATION TEST SUITE")
    print("=" * 70)

    # TEST 1: Example A - Sadness / Disappointment (Failed Exam)
    total += 1
    t1 = "I'm disappointed because I failed my exam even though I studied hard."
    r1 = generate_support_recommendation(t1, "NEGATIVE", "SAFE", "low", "english")
    assert "Sorry you're going through this" in r1["message"] or "disappointed" in r1["message"].lower()
    assert "One exam doesn't define your abilities" in r1["message"]
    assert "Suggested Support from Safe Space AI" in r1["disclaimer"]
    passed += 1
    print(f"PASS [1]: Example A (Disappointment/Failed Exam)")
    print(f"       AI Recommendation: \"{r1['message'][:90]}...\"")

    # TEST 2: Example B - Academic Stress (Deadlines)
    total += 1
    t2 = "I'm so stressed because I have several deadlines this week."
    r2 = generate_support_recommendation(t2, "NEGATIVE", "SAFE", "low", "english")
    assert "That sounds overwhelming" in r2["message"]
    assert "listing your deadlines" in r2["message"]
    assert "take short breaks" in r2["message"]
    passed += 1
    print(f"PASS [2]: Example B (Academic Stress/Deadlines)")
    print(f"       AI Recommendation: \"{r2['message'][:90]}...\"")

    # TEST 3: Example C - Loneliness (Misunderstood)
    total += 1
    t3 = "I feel like nobody understands me."
    r3 = generate_support_recommendation(t3, "NEGATIVE", "DISTRESS", "medium", "english")
    assert "feeling misunderstood can be painful" in r3["message"].lower() or "feel like nobody understands" in r3["message"].lower()
    assert r3["show_resources_button"] is True
    passed += 1
    print(f"PASS [3]: Example C (Loneliness/Nobody Understands)")
    print(f"       AI Recommendation: \"{r3['message'][:90]}...\"")

    # TEST 4: Example D - Positive Experience (Goal Achieved)
    total += 1
    t4 = "I finally achieved my goal after months of hard work!"
    r4 = generate_support_recommendation(t4, "POSITIVE", "SAFE", "low", "english")
    assert "Congratulations!" in r4["message"]
    assert "dedication and effort have paid off" in r4["message"]
    passed += 1
    print(f"PASS [4]: Example D (Positive Experience/Goal Achieved)")
    print(f"       AI Recommendation: \"{r4['message'][:90]}...\"")

    # TEST 5: Example E - Neutral Post (Group Presentation)
    total += 1
    t5 = "Our group presentation is scheduled for Friday."
    r5 = generate_support_recommendation(t5, "NEUTRAL", "SAFE", "low", "english")
    assert "Thanks for sharing!" in r5["message"] or "presentation" in r5["message"].lower()
    assert "groupmates" in r5["message"].lower()
    assert r5["show_resources_button"] is False
    passed += 1
    print(f"PASS [5]: Example E (Neutral Post/Group Presentation)")
    print(f"       AI Recommendation: \"{r5['message'][:90]}...\"")

    # TEST 6: High-Risk Suicide Post
    total += 1
    t6 = "I want to end my life, everything hurts and I cannot take this pain anymore."
    r6 = generate_support_recommendation(t6, "NEGATIVE", "SELF_HARM", "urgent", "english")
    assert "I'm sorry you're going through such a difficult time" in r6["message"]
    assert "contact local emergency services" in r6["message"]
    assert r6["show_resources_button"] is True
    assert "1553" in r6["emergency_numbers"]
    assert "911" in r6["emergency_numbers"]
    passed += 1
    print(f"PASS [6]: High-Risk Crisis / Suicide Detection")
    print(f"       Hotlines Attached: {r6['emergency_numbers']}")
    print(f"       Guidance: \"{r6['message'][:90]}...\"")

    # TEST 7: Filipino/Taglish High-Risk Crisis
    total += 1
    t7 = "Gusto ko nang magpakamatay at mawala na sa mundo, sobrang sakit na."
    r7 = generate_support_recommendation(t7, "NEGATIVE", "SELF_HARM", "urgent", "filipino")
    assert "1553" in r7["message"]
    assert "0917-899-USAP" in r7["message"]
    assert "Emergency 911" in r7["message"]
    passed += 1
    print(f"PASS [7]: Filipino / Taglish Crisis Guidance")
    print(f"       Message: \"{r7['message'][:90]}...\"")

    # TEST 8: Bullying / Harassment Detection & Warning Config
    total += 1
    t8 = "Napakatanga mo talaga gago boboka ka pa manahimik ka nalang!"
    mod_t8 = moderate(t8)
    assert mod_t8["category"] in ["BULLYING", "PROFANITY", "HARASSMENT"]
    passed += 1
    print(f"PASS [8]: Bullying / Harassment Flagged")
    print(f"       Category: {mod_t8['category']}, Action: {mod_t8['action']}")

    # TEST 9: Threat / Violence
    total += 1
    t9 = "I will kill you all tomorrow at school."
    mod_t9 = moderate(t9)
    assert mod_t9["category"] in ["THREAT", "VIOLENCE"] or mod_t9["status"] in ["BLOCKED", "REVIEW"]
    passed += 1
    print(f"PASS [9]: Threat / Violence Evaluated")
    print(f"       Category: {mod_t9['category']}, Status: {mod_t9['status']}")

    # TEST 10: Educational Discussion of Sensitive Topic (Must Remain Supported)
    total += 1
    t10 = "In our general psychology lecture today, we learned how suicide prevention works in peer communities."
    mod_t10 = moderate(t10)
    assert mod_t10["allowed"] is True
    r10 = generate_support_recommendation(t10, "NEUTRAL", "SAFE", "low", "english")
    assert r10["type"] != "crisis_support"  # Educational discussion must not be falsely treated as crisis
    passed += 1
    print(f"PASS [10]: Educational Discussion Preserved (Non-Crisis)")
    print(f"       Type: {r10['type']}, Message: \"{r10['message'][:70]}...\"")

    # TEST 11: Profanity Filtering before Sentiment / Safe Masking
    total += 1
    t11 = "putangina sobrang hirap ng thesis pero gagawin pa rin namin!"
    censored = censor_profanity(t11)
    assert "p*******a" in censored.lower() or "*" in censored
    assert "thesis" in censored
    passed += 1
    print(f"PASS [11]: Profanity Masked preserving context")
    print(f"       Original: \"{t11}\"")
    print(f"       Masked:   \"{censored}\"")

    print("=" * 70)
    print(f"TEST RESULTS: {passed}/{total} PASSED (100% SUCCESS)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
