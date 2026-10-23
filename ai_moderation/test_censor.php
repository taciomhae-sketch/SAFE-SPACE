<?php
function censor_word(string $w): string {
    $len = mb_strlen($w);
    if ($len <= 2) {
        return $w;
    }
    return mb_substr($w, 0, 1) . str_repeat('*', $len - 2) . mb_substr($w, -1, 1);
}

function censor_profanity(string $text): string {
    if (empty($text)) {
        return $text;
    }
    $patterns = [
        '\bputang[\s\-_]*ina\b',
        '\bpukinang[\s\-_]*ina\b',
        '\bpuki[\s\-_]*nang[\s\-_]*ina\b',
        '\btang[\s\-_]*ina\b',
        '\btang[\s\-_]*ena\b',
        '\banak[\s\-_]*ng[\s\-_]*puta\b',
        '\bhayop[\s\-_]*ka\b',
        '\bhayup[\s\-_]*ka\b',
        '\bputangina\b',
        '\bpukinangina\b',
        '\btangina\b',
        '\btangena\b',
        '\btaena\b',
        '\btayna\b',
        '\bkingina\b',
        '\bamputa\b',
        '\bampota\b',
        '\bpunyeta\b',
        '\bleche\b',
        '\bletse\b',
        '\bpiste\b',
        '\bpeste\b',
        '\byawa\b',
        '\bkupal\b',
        '\bogag\b',
        '\bpota\b',
        '\bputa\b',
        '\blintik\b',
        '\bhudas\b',
        '\bgago(?:ng)?\b',
        '\bgaga\b',
        '\bkagaguhan\b',
        '\btarantado\b',
        '\btarantada\b',
        '\bkatarantadohan\b',
        '\bbobo(?:ng)?\b',
        '\bboba\b(?!\s+(?:tea|milk|drink))',
        '\bkabobohan\b',
        '\bbopols\b',
        '\bboplaks\b',
        '\bulol\b',
        '\binutil\b',
        '\btanga(?:ng)?\b',
        '\bkatangahan\b',
        '\bbwisit\b',
        '\bbuwisit\b',
        '\bhinayupak\b',
        '\bkantot(?:an|in)?\b',
        '\bchupa(?:in)?\b',
        '\btsupa(?:in)?\b',
        '\btite\b',
        '\bpuke\b',
        '\bpuki\b',
        '\bkiki\b',
        '\btamod\b',
        '\bjakol\b',
        '\bburat\b',
        '\bbayag\b',
        '\bpepe\b',
        '\biyot(?:an)?\b',
        '\bpokpok\b',
        '\bmotherfuck(?:er|ers|ing)?\b',
        '\bfuck(?:ing|ers?|ed|s)?\b',
        '\bbullshit(?:s)?\b',
        '\bdipshit(?:s)?\b',
        '\bhorseshit\b',
        '\bshit(?:s|ted|ting|ty)?\b',
        '\bbitch(?:es|ing|y)?\b',
        '\basshole(?:s)?\b',
        '\bdumbass(?:es)?\b',
        '\bjackass(?:es)?\b',
        '\bfatass(?:es)?\b',
        '\bbastard(?:s)?\b',
        '\bcunt(?:s)?\b',
        '\bdickhead(?:s)?\b',
        '\bdick(?:s)?\b',
        '\bcocksucker(?:s)?\b',
        '\bcock(?:s)?\b',
        '\bpuss(?:y|ies)\b',
        '\btwat(?:s)?\b',
        '\bwanker(?:s)?\b',
        '\bslut(?:s|ty)?\b',
        '\bwhore(?:s)?\b',
        '(?<![a-zA-Z0-9])ass(?:es)?(?![a-zA-Z0-9])'
    ];

    $regex = '/' . implode('|', $patterns) . '/iu';
    return preg_replace_callback($regex, function($m) {
        return preg_replace_callback('/[a-zA-Z]+/u', function($wm) {
            return censor_word($wm[0]);
        }, $m[0]);
    }, $text);
}

$tests = [
    ["PUTANGINA", "P*******A"],
    ["putangina", "p*******a"],
    ["Putangina", "P*******a"],
    ["FUCK", "F**K"],
    ["SHIT", "S**T"],
    ["BITCH", "B***H"],
    ["ASSHOLE", "A*****E"],
    ["This FUCK and SHIT is crazy, PUTANGINA!", "This F**K and S**T is crazy, P*******A!"],
    ["I love classic art and drinking boba tea with my ina and class.", "I love classic art and drinking boba tea with my ina and class."],
];

foreach ($tests as $pair) {
    $input = $pair[0];
    $expected = $pair[1];
    $actual = censor_profanity($input);
    if ($actual !== $expected) {
        echo "[FAIL] Input: '$input'\nExpected: '$expected'\nActual  : '$actual'\n";
        exit(1);
    }
    echo "[PASS] $input => $actual\n";
}

echo "\nPHP Censorship Tests Passed Successfully!\n";
