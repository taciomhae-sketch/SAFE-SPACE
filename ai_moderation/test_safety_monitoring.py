# =============================================================
#  test_safety_monitoring.py — Test Suite for Safety & Risk Detection
#  Project: AN AI-POWERED SAFE SPACE PLATFORM
# =============================================================

from safety_analyzer import SafetyAnalyzer, RISK_CRITICAL, RISK_HIGH, RISK_MODERATE, RISK_LOW, RISK_NONE

def run_tests():
    print("=" * 70)
    print("SAFE SPACE AI SAFETY & RISK DETECTION TEST SUITE")
    print("=" * 70)
    
    cases = [
        # 1. Positive / Ordinary post -> RISK_NONE
        {
            "name": "Positive / Ordinary Academic Post",
            "text": "Finished our group presentation draft with my groupmates! Looking forward to Friday.",
            "expected_risk": RISK_NONE,
            "expect_alert": False
        },
        # 2. Mild sadness / academic pressure -> RISK_LOW
        {
            "name": "Mild Sadness / Academic Pressure",
            "text": "I feel so stressed because I failed my midterm exam even though I studied all night.",
            "expected_risk": RISK_LOW,
            "expect_alert": False
        },
        # 3. Idiom / benign colloquialism -> RISK_NONE
        {
            "name": "Benign Idiom (Dying of laughter)",
            "text": "Omg my friend told the funniest joke today I was literally dying of laughter!",
            "expected_risk": RISK_NONE,
            "expect_alert": False
        },
        # 4. Educational discussion about suicide prevention -> RISK_NONE
        {
            "name": "Educational Suicide Prevention Discussion",
            "text": "In our psychology class today, we discussed suicide prevention strategies and crisis hotlines.",
            "expected_risk": RISK_NONE,
            "expect_alert": False
        },
        # 5. Repeated Hopelessness -> RISK_MODERATE
        {
            "name": "Repeated Hopelessness & Worthlessness",
            "text": "I feel completely hopeless and worthless. Nothing ever gets better and I am just a burden to everyone.",
            "expected_risk": RISK_MODERATE,
            "expect_alert": True
        },
        # 6. Passive thoughts of death -> RISK_HIGH
        {
            "name": "Passive Suicidal Ideation",
            "text": "I really wish I could just disappear forever and not wake up anymore. What is the point of living?",
            "expected_risk": RISK_HIGH,
            "expect_alert": True
        },
        # 7. Imminent suicide crisis -> RISK_CRITICAL
        {
            "name": "Imminent Suicidal Crisis / Goodbye Note",
            "text": "I can't take this pain anymore. I am going to end my life tonight. Goodbye everyone, this is my final post.",
            "expected_risk": RISK_CRITICAL,
            "expect_alert": True
        },
        # 8. Filipino Imminent crisis -> RISK_CRITICAL
        {
            "name": "Filipino Imminent Crisis Statement",
            "text": "Magpapakamatay na ako mamayang gabi. Paalam sa inyong lahat, huling post ko na ito.",
            "expected_risk": RISK_CRITICAL,
            "expect_alert": True
        },
        # 9. Credible physical violence threat -> RISK_HIGH
        {
            "name": "Credible Physical Threat",
            "text": "I am bringing a knife to campus tomorrow and I will kill you.",
            "expected_risk": RISK_HIGH,
            "expect_alert": True
        }
    ]

    passed = 0
    for idx, c in enumerate(cases, 1):
        res = SafetyAnalyzer.evaluate(c["text"])
        risk_match = res["risk_level"] == c["expected_risk"]
        alert_match = res["alert_required"] == c["expect_alert"]
        
        if risk_match and alert_match:
            print(f"PASS [{idx}]: {c['name']}")
            print(f"       Risk: {res['risk_level'].upper()} | Concern: {res['concern_type']} | Alert Required: {res['alert_required']}")
            passed += 1
        else:
            print(f"FAIL [{idx}]: {c['name']}")
            print(f"       Expected: {c['expected_risk']} (Alert={c['expect_alert']}), Got: {res['risk_level']} (Alert={res['alert_required']})")

    # 10. Longitudinal escalation test
    history = [
        {"content": "I feel a bit lonely lately in the dorms.", "risk_level": "low", "sentiment": "NEGATIVE"},
        {"content": "Nothing seems to get better, feeling completely drained.", "risk_level": "moderate", "sentiment": "NEGATIVE"}
    ]
    escalation_res = SafetyAnalyzer.evaluate(
        "I do not want to be here anymore, I am so hopeless.",
        history=history
    )
    long_passed = escalation_res["longitudinal_risk"]["escalation_detected"] is True
    if long_passed:
        print(f"PASS [10]: Longitudinal Escalation Detected across 3 consecutive distress posts.")
        print(f"       Trend: {escalation_res['longitudinal_risk']['trend']} | Summary: {escalation_res['longitudinal_risk']['summary']}")
        passed += 1
    else:
        print(f"FAIL [10]: Longitudinal Escalation was not detected.")

    total = len(cases) + 1
    print("=" * 70)
    print(f"TEST RESULTS: {passed}/{total} TESTS PASSED ({round(passed/total*100)}% SUCCESS)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
