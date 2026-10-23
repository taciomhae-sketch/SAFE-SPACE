# =============================================================
#  test_censorship_comprehensive.py
#  Safe Space Thesis — Verification Test Suite for Partial Profanity Censorship
# =============================================================

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from censor import censor_profanity, censor_word, contains_profanity
from moderation import moderate

def run_tests():
    print("=" * 60)
    print("SAFE SPACE — PARTIAL PROFANITY CENSORSHIP VERIFICATION")
    print("=" * 60)

    # -------------------------------------------------------------
    # Test 1: Exact Table Examples from Prompt Specification
    # -------------------------------------------------------------
    print("\n[TEST 1] Verifying exact specification table examples...")
    # Exact prompt example cases
    prompt_cases = [
        ("Example", "E*****e"),
        ("Unkind", "U****d"),
        ("Foulword", "F******d"),
    ]
    for orig, expected in prompt_cases:
        res = censor_word(orig)
        assert res == expected, f"Failed for {orig}: expected {expected}, got {res}"
        print(f"  PASS: {orig:12} -> {res}")

    table_cases = [
        ("PUTANGINA", "P*******A"),
        ("putangina", "p*******a"),
        ("Putangina", "P*******a"),
        ("FUCK", "F**K"),
        ("SHIT", "S**T"),
        ("BITCH", "B***H"),
        ("ASSHOLE", "A*****E"),
    ]
    for orig, expected in table_cases:
        res = censor_profanity(orig)
        assert res == expected, f"Failed for {orig}: expected {expected}, got {res}"
        print(f"  PASS: {orig:12} -> {res}")

    # -------------------------------------------------------------
    # Test 2: Word Length & Asterisk Count Verification
    # Number of asterisks must equal middle letters (len - 2)
    # -------------------------------------------------------------
    print("\n[TEST 2] Verifying middle letter asterisk count...")
    words_to_check = [
        ("fuck", 2, "f**k"),
        ("shit", 2, "s**t"),
        ("bitch", 3, "b***h"),
        ("asshole", 5, "a*****e"),
        ("bastard", 5, "b*****d"),
        ("gago", 2, "g**o"),
        ("tarantado", 7, "t*******o"),
        ("ulol", 2, "u**l"),
        ("tangina", 5, "t*****a"),
        ("leche", 3, "l***e"),
        ("yawa", 2, "y**a"),
        ("kupal", 3, "k***l"),
        ("putangina", 7, "p*******a"),
    ]
    for word, expected_asterisks, expected_censored in words_to_check:
        res = censor_profanity(word)
        actual_asterisks = res.count("*")
        assert actual_asterisks == expected_asterisks, (
            f"Asterisk count mismatch for {word}: expected {expected_asterisks}, got {actual_asterisks}"
        )
        assert res == expected_censored, f"Mismatch for {word}: expected {expected_censored}, got {res}"
        print(f"  PASS: {word:12} ({actual_asterisks} asterisks) -> {res}")

    # -------------------------------------------------------------
    # Test 3: Capitalization Preservation
    # -------------------------------------------------------------
    print("\n[TEST 3] Verifying visible letters capitalization preservation...")
    cases = [
        ("fuck", "f**k"),
        ("Fuck", "F**k"),
        ("FUCK", "F**K"),
        ("fUcK", "f**K"),
        ("putangina", "p*******a"),
        ("Putangina", "P*******a"),
        ("PUTANGINA", "P*******A"),
        ("pUTANGINa", "p*******a"),
        ("Asshole", "A*****e"),
        ("ASSHOLE", "A*****E"),
    ]
    for orig, expected in cases:
        res = censor_profanity(orig)
        assert res == expected, f"Failed for {orig}: expected {expected}, got {res}"
        print(f"  PASS: {orig:12} -> {res}")

    # -------------------------------------------------------------
    # Test 4: Harmless Words Unchanged (Scunthorpe Prevention)
    # -------------------------------------------------------------
    print("\n[TEST 4] Verifying harmless words remain 100% unchanged...")
    harmless_cases = [
        "I love classic art and my class in school.",
        "Please pass the compass and grass.",
        "He has many financial assets and an assistant.",
        "The peacock is very colorful in the sanctuary.",
        "I can predict the verdict using a dictionary.",
        "I would like some boba tea please.",
        "Mahal ko ang aking ina.",
        "Kumain kami ng masarap na puto bumbong kanina.",
        "Hello to everyone in the safe space!",
        "This is a massive accomplishment.",
        "Her title is Associate Director of Nursing.",
    ]
    for sent in harmless_cases:
        res = censor_profanity(sent)
        assert res == sent, f"Harmless word modified!\nOriginal: {sent}\nResult  : {res}"
        print(f"  PASS: \"{sent}\"")

    # -------------------------------------------------------------
    # Test 5: Multiple Profanity Words in Single Message
    # -------------------------------------------------------------
    print("\n[TEST 5] Verifying multiple profanities in single message...")
    multi_input = "This FUCK and SHIT is crazy, PUTANGINA! Anong gago ang gumawa nito? Tangina."
    expected_multi = "This F**K and S**T is crazy, P*******A! Anong g**o ang gumawa nito? T*****a."
    multi_res = censor_profanity(multi_input)
    assert multi_res == expected_multi, f"Failed multi:\nExpected: {expected_multi}\nActual  : {multi_res}"
    print(f"  PASS: \"{multi_input}\"\n     -> \"{multi_res}\"")

    # -------------------------------------------------------------
    # Test 6: Emojis, Punctuation, Spacing Preserved
    # -------------------------------------------------------------
    print("\n[TEST 6] Verifying emojis, punctuation and spacing preservation...")
    emoji_input = "OMG 😭 FUCK!! (what a shit...) 🤬 PUTANGINA ❤️"
    expected_emoji = "OMG 😭 F**K!! (what a s**t...) 🤬 P*******A ❤️"
    emoji_res = censor_profanity(emoji_input)
    assert emoji_res == expected_emoji, f"Failed emoji:\nExpected: {expected_emoji}\nActual  : {emoji_res}"
    print(f"  PASS: \"{emoji_input}\"\n     -> \"{emoji_res}\"")

    # -------------------------------------------------------------
    # Test 7: Integration with AI Moderation Pipeline
    # -------------------------------------------------------------
    print("\n[TEST 7] Verifying integration with AI moderation pipeline...")
    mod_out = moderate("Sobrang pagod na ako sa exam putangina.")
    assert mod_out["has_profanity"] == True, "Expected has_profanity == True"
    assert "p*******a" in mod_out["censored_text"].lower(), f"Expected p*******a in censored_text, got {mod_out['censored_text']}"
    assert mod_out["allowed"] == True, "Expected allowed == True for censored profanity"
    print(f"  PASS: Moderation output contains censored_text: \"{mod_out['censored_text']}\" (allowed: {mod_out['allowed']})")

    # Critical threat must still be blocked even if profanity is present
    threat_out = moderate("I will kill you putangina.")
    assert threat_out["allowed"] == False, "Expected threat to be blocked"
    assert "p*******a" in threat_out["censored_text"].lower(), "Expected profanity to be censored even in blocked threat"
    print(f"  PASS: Severe threat remains blocked (allowed: {threat_out['allowed']}) with profanity censored: \"{threat_out['censored_text']}\"")

    print("\n" + "=" * 60)
    print("ALL 7 TEST SUITES PASSED FLAWLESSLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
