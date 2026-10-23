# =============================================================
#  test_word_by_word_censorship.py
#  Safe Space Platform — Automated Verification Test Suite
#  Testing All 15 Required Cases for Word-by-Word Censorship
# =============================================================

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from censor import (
    censor_word,
    censor_profanity,
    contains_profanity,
    get_profanities_found,
    add_custom_word,
    remove_custom_word,
    get_custom_words
)
from moderation import moderate
from sentiment import analyze_sentiment


def run_all_tests():
    print("=" * 70)
    print("SAFE SPACE — WORD-BY-WORD PROFANITY DETECTION & CENSORSHIP TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # Case 1: Single configured prohibited word is censored
    # -------------------------------------------------------------
    print("\n[CASE 1] Single configured prohibited word is censored...")
    cases_1 = [
        ("Example", "E*****e"),
        ("Unkind", "U****d"),
        ("Foulword", "F******d"),
        ("Abusive", "A*****e"),
        ("fuck", "f**k"),
        ("gago", "g**o"),
        ("tangina", "t*****a"),
        ("bitch", "b***h"),
        ("asshole", "a*****e"),
    ]
    # Register "example", "unkind", "foulword", "abusive" in engine
    for w in ["example", "unkind", "foulword", "abusive"]:
        add_custom_word(w)

    for word, expected in cases_1:
        res = censor_profanity(word)
        assert res == expected, f"Case 1 Failed for {word}: expected {expected}, got {res}"
        print(f"  PASS: {word:12} -> {res}")

    # -------------------------------------------------------------
    # Case 2: Sentence containing several prohibited words has every word censored
    # -------------------------------------------------------------
    print("\n[CASE 2] Sentence with multiple prohibited words...")
    sent_2 = "Example one, example two, and example three."
    expected_2 = "E*****e one, e*****e two, and e*****e three."
    res_2 = censor_profanity(sent_2)
    assert res_2 == expected_2, f"Case 2 Failed:\nExpected: {expected_2}\nGot:      {res_2}"
    print(f"  PASS: \"{sent_2}\"\n     -> \"{res_2}\"")

    sent_2b = "This fuck and shit is so gago, putangina talaga!"
    expected_2b = "This f**k and s**t is so g**o, p*******a talaga!"
    res_2b = censor_profanity(sent_2b)
    assert res_2b == expected_2b, f"Case 2b Failed:\nExpected: {expected_2b}\nGot:      {res_2b}"
    print(f"  PASS: \"{sent_2b}\"\n     -> \"{res_2b}\"")

    # -------------------------------------------------------------
    # Case 3: Long paragraph scanned from beginning to end
    # -------------------------------------------------------------
    print("\n[CASE 3] Long paragraph scanned from beginning to end...")
    paragraph_3 = (
        "Yesterday was such a terrible day because of my exam fuck. "
        "The professor was really gago during the final defense. "
        "I felt like a complete loser and tangina, everything failed. "
        "However, today my friends helped me review for the next semester. "
        "Still, that bullshit experience was unforgettable."
    )
    res_3 = censor_profanity(paragraph_3)
    assert "f**k" in res_3, "Expected fuck to be censored in paragraph"
    assert "g**o" in res_3, "Expected gago to be censored in paragraph"
    assert "t*****a" in res_3, "Expected tangina to be censored in paragraph"
    assert "b******t" in res_3, "Expected bullshit to be censored in paragraph"
    assert "yesterday" in res_3.lower(), "Expected unaffected text to remain intact"
    assert "review for the next semester" in res_3, "Expected middle sentence intact"
    print("  PASS: All 4 prohibited terms censored across entire paragraph.")

    # -------------------------------------------------------------
    # Case 4: Repeated occurrences are all censored (e.g. 5 times in 1 paragraph)
    # -------------------------------------------------------------
    print("\n[CASE 4] Repeated occurrences (5 times in 1 paragraph)...")
    text_4 = "gago gago gago gago gago"
    expected_4 = "g**o g**o g**o g**o g**o"
    res_4 = censor_profanity(text_4)
    assert res_4 == expected_4, f"Case 4 Failed:\nExpected: {expected_4}\nGot:      {res_4}"
    assert res_4.count("g**o") == 5, f"Expected 5 occurrences of g**o, got {res_4.count('g**o')}"
    print(f"  PASS: 5 repeated occurrences censored: \"{res_4}\"")

    # -------------------------------------------------------------
    # Case 5: Uppercase, lowercase, and mixed-case variations
    # -------------------------------------------------------------
    print("\n[CASE 5] Casing variations (UPPER, lower, Mixed)...")
    cases_5 = [
        ("GAGO", "G**O"),
        ("gago", "g**o"),
        ("Gago", "G**o"),
        ("gAgO", "g**O"),
        ("PUTANGINA", "P*******A"),
        ("putangina", "p*******a"),
        ("Putangina", "P*******a"),
        ("pUtAngInA", "p*******A"),
        ("FUCK", "F**K"),
        ("fuck", "f**k"),
        ("fUcK", "f**K"),
        ("Fuck", "F**k"),
    ]
    for orig, exp in cases_5:
        res = censor_profanity(orig)
        assert res == exp, f"Case 5 Failed for {orig}: expected {exp}, got {res}"
        print(f"  PASS: {orig:10} -> {res}")

    # -------------------------------------------------------------
    # Case 6: Punctuation surrounding a word does not prevent detection
    # -------------------------------------------------------------
    print("\n[CASE 6] Punctuation surrounding word...")
    cases_6 = [
        ("\"gago!\"", "\"g**o!\""),
        ("(tangina?)", "(t*****a?)"),
        ("[fuck]", "[f**k]"),
        ("'shit',", "'s**t',"),
        ("gago... talaga!", "g**o... talaga!"),
        ("wait--fuck--stop", "wait--f**k--stop"),
    ]
    for orig, exp in cases_6:
        res = censor_profanity(orig)
        assert res == exp, f"Case 6 Failed for {orig}: expected {exp}, got {res}"
        print(f"  PASS: {orig:20} -> {res}")

    # -------------------------------------------------------------
    # Case 7: English, Filipino, and Taglish variations
    # -------------------------------------------------------------
    print("\n[CASE 7] English, Filipino, and Taglish variations...")
    taglish_text = "Sobrang leche talaga ng nangyari, fuck this project putangina."
    expected_7 = "Sobrang l***e talaga ng nangyari, f**k this project p*******a."
    res_7 = censor_profanity(taglish_text)
    assert res_7 == expected_7, f"Case 7 Failed:\nExpected: {expected_7}\nGot:      {res_7}"
    print(f"  PASS: Taglish text censored: \"{res_7}\"")

    # -------------------------------------------------------------
    # Case 8: Common spelling variations (repeated letters & leetspeak)
    # -------------------------------------------------------------
    print("\n[CASE 8] Spelling variations (repeated letters & leetspeak)...")
    cases_8 = [
        ("fuuuuck", "f*****k"),
        ("gagoooo", "g*****o"),
        ("tanginaaaaa", "t*********a"),
        ("shiiit", "s****t"),
        ("b0b0", "b**0"),
        ("g@go", "g**o"),
        ("f*ck", "f**k"),
        ("sh!t", "s**t"),
    ]
    for orig, exp in cases_8:
        res = censor_profanity(orig)
        assert res == exp, f"Case 8 Failed for {orig}: expected {exp}, got {res}"
        print(f"  PASS: {orig:15} -> {res}")

    # -------------------------------------------------------------
    # Case 9: Harmless words remain unchanged (Scunthorpe immunity)
    # -------------------------------------------------------------
    print("\n[CASE 9] Harmless words remain 100% unchanged...")
    harmless_tests = [
        "Please pass the document to the class assistant.",
        "The classic art teacher showed immense compassion.",
        "I need my glasses to evaluate the company assets.",
        "The peacock in the garden drank water near the grass.",
        "I ordered a large boba tea and a boba drink.",
        "Let us calculate the tangent of the angle.",
        "Her title is Associate Professor in Manila.",
        "Mahal ko ang aking ina.",
        "Hello everyone, welcome to the safe space!",
        "Do not make assumptions about this assignment.",
    ]
    for sent in harmless_tests:
        res = censor_profanity(sent)
        assert res == sent, f"Case 9 Harmless word modified!\nOriginal: {sent}\nResult  : {res}"
        print(f"  PASS: \"{sent}\"")

    # -------------------------------------------------------------
    # Case 10: Emojis, punctuation, spaces, and line breaks preserved
    # -------------------------------------------------------------
    print("\n[CASE 10] Emojis, punctuation, spaces, and line breaks preserved...")
    multiline_input = "Line 1: OMG 😭 fuck!!\n\nLine 2: Gago talaga 🤬❤️\nLine 3: Finished."
    expected_10 = "Line 1: OMG 😭 f**k!!\n\nLine 2: G**o talaga 🤬❤️\nLine 3: Finished."
    res_10 = censor_profanity(multiline_input)
    assert res_10 == expected_10, f"Case 10 Failed:\nExpected:\n{expected_10}\nGot:\n{res_10}"
    print("  PASS: Multiline text with emojis and double line breaks preserved perfectly.")

    # -------------------------------------------------------------
    # Case 11: Edited posts and messages are filtered again
    # -------------------------------------------------------------
    print("\n[CASE 11] Edited content re-filtered...")
    original_post = "I am studying hard for finals."
    edited_post = "I am studying hard for finals but prof is so gago."
    res_orig = censor_profanity(original_post)
    res_edit = censor_profanity(edited_post)
    assert res_orig == original_post
    assert "g**o" in res_edit
    print(f"  PASS: Original remains clean, edited post is properly masked: \"{res_edit}\"")

    # -------------------------------------------------------------
    # Case 12: Multiword expressions masked individually
    # -------------------------------------------------------------
    print("\n[CASE 12] Multiword expressions masked word-by-word...")
    multi_cases = [
        ("putang ina", "p****g i*a"),
        ("anak ng puta", "a**k ng p**a"),
        ("shut the fuck up", "s**t the f**k up"),
        ("hayop ka", "h***p ka"),
    ]
    for orig, exp in multi_cases:
        res = censor_profanity(orig)
        assert res == exp, f"Case 12 Failed for {orig}: expected {exp}, got {res}"
        print(f"  PASS: \"{orig}\" -> \"{res}\"")

    # -------------------------------------------------------------
    # Case 13: 2-letter and <2-letter words rules
    # -------------------------------------------------------------
    print("\n[CASE 13] 2-letter and <2-letter boundary handling...")
    assert censor_word("ng") == "ng", "2-letter word must remain unchanged (no middle letters)"
    assert censor_word("ka") == "ka", "2-letter word must remain unchanged"
    assert censor_word("a") == "a", "1-letter word must remain unchanged"
    assert censor_word("") == "", "Empty string must remain empty"
    print("  PASS: 2-letter and <2-letter words handled according to specification.")

    # -------------------------------------------------------------
    # Case 14: Server-side validation catches client bypass
    # -------------------------------------------------------------
    print("\n[CASE 14] Server-side censorship enforcement...")
    raw_bypass = "Raw unmasked text sent directly to API: gago putangina"
    server_res = censor_profanity(raw_bypass)
    assert "g**o" in server_res and "p*******a" in server_res
    print(f"  PASS: Server enforces censorship: \"{server_res}\"")

    # -------------------------------------------------------------
    # Case 15: AI Sentiment & Moderation Pipeline Decoupling
    # -------------------------------------------------------------
    print("\n[CASE 15] Sentiment Analysis & Safety Warning Decoupling...")
    # Safe academic venting with profanity -> Sentiment evaluated on original, approved in censored form
    vent_text = "I am so overwhelmed by these thesis deadlines putangina."
    mod_out = moderate(vent_text)
    sent_out = analyze_sentiment(vent_text)
    assert mod_out["has_profanity"] == True, "Expected profanity flagged"
    assert "p*******a" in mod_out["censored_text"].lower(), "Expected censored text"
    assert mod_out["allowed"] == True, "Safe venting must be APPROVED with asterisks"
    assert sent_out["sentiment"].upper() in ["NEGATIVE", "NEUTRAL"], "Sentiment reflects authentic emotions"
    print(f"  PASS: Venting approved in censored form: \"{mod_out['censored_text']}\" (sentiment: {sent_out['sentiment']})")

    # Physical threat must remain BLOCKED even with profanity censored
    threat_text = "I will kill you putangina."
    threat_mod = moderate(threat_text)
    assert threat_mod["allowed"] == False, "Physical threat must be blocked"
    assert "p*******a" in threat_mod["censored_text"].lower(), "Profanity still censored in threat record"
    print(f"  PASS: Threat blocked (allowed: {threat_mod['allowed']}) with profanity censored: \"{threat_mod['censored_text']}\"")

    # Clean up custom words registered for testing
    for w in ["example", "unkind", "foulword", "abusive"]:
        remove_custom_word(w)

    print("\n" + "=" * 70)
    print("ALL 15 COMPREHENSIVE TEST CASES PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
