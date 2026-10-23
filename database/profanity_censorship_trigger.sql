-- =============================================================
--  Safe Space — Server-Side PostgreSQL Profanity Censorship Trigger
--  Project: AN AI-POWERED SAFE SPACE PLATFORM
--           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
--
--  PURPOSE:
--  Enforces partial profanity censorship directly at the database level.
--  Even if a malicious user or automated tool disables JavaScript or
--  calls the Supabase REST API directly, this trigger automatically
--  censors prohibited profanities before storing content in PostgreSQL.
-- =============================================================

CREATE OR REPLACE FUNCTION public.censor_profanity_text(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    IF input_text IS NULL OR LENGTH(TRIM(input_text)) = 0 THEN
        RETURN input_text;
    END IF;

    result := input_text;

    -- Filipino & English Profanities (Word boundary & capitalization preserving)
    -- Exactly (length - 2) asterisks for middle letters:
    result := regexp_replace(result, '\b(P)utangina\b', '\1*******a', 'gi');
    result := regexp_replace(result, '\b(P)UTANGINA\b', '\1*******A', 'g');
    result := regexp_replace(result, '\b(p)utangina\b', '\1*******a', 'g');
    result := regexp_replace(result, '\b(P)utang[\s\-_]*ina\b', '\1****g i*a', 'gi');
    result := regexp_replace(result, '\b(P)ukinangina\b', '\1*********a', 'gi');
    result := regexp_replace(result, '\b(T)angina\b', '\1*****a', 'gi');
    result := regexp_replace(result, '\b(T)ang[\s\-_]*ina\b', '\1**g i*a', 'gi');
    result := regexp_replace(result, '\b(T)angena\b', '\1*****a', 'gi');
    result := regexp_replace(result, '\b(T)aena\b', '\1***a', 'gi');
    result := regexp_replace(result, '\b(T)ayna\b', '\1***a', 'gi');
    result := regexp_replace(result, '\b(K)ingina\b', '\1*****a', 'gi');
    result := regexp_replace(result, '\b(A)mputa\b', '\1****a', 'gi');
    result := regexp_replace(result, '\b(A)mpota\b', '\1****a', 'gi');
    result := regexp_replace(result, '\b(P)unyeta\b', '\1*****a', 'gi');
    result := regexp_replace(result, '\b(L)eche\b', '\1***e', 'gi');
    result := regexp_replace(result, '\b(L)etse\b', '\1***e', 'gi');
    result := regexp_replace(result, '\b(P)este\b', '\1***e', 'gi');
    result := regexp_replace(result, '\b(P)iste\b', '\1***e', 'gi');
    result := regexp_replace(result, '\b(Y)awa\b', '\1**a', 'gi');
    result := regexp_replace(result, '\b(K)upal\b', '\1***l', 'gi');
    result := regexp_replace(result, '\b(O)gag\b', '\1**g', 'gi');
    result := regexp_replace(result, '\b(P)ota\b', '\1**a', 'gi');
    result := regexp_replace(result, '\b(P)uta\b', '\1**a', 'gi');
    result := regexp_replace(result, '\b(L)intik\b', '\1****k', 'gi');
    result := regexp_replace(result, '\b(H)udas\b', '\1***s', 'gi');
    result := regexp_replace(result, '\b(G)agong\b', '\1****g', 'gi');
    result := regexp_replace(result, '\b(G)ago\b', '\1**o', 'gi');
    result := regexp_replace(result, '\b(G)aga\b', '\1**a', 'gi');
    result := regexp_replace(result, '\b(K)agaguhan\b', '\1*******n', 'gi');
    result := regexp_replace(result, '\b(T)arantado\b', '\1*******o', 'gi');
    result := regexp_replace(result, '\b(T)arantada\b', '\1*******a', 'gi');
    result := regexp_replace(result, '\b(B)obong\b', '\1****g', 'gi');
    result := regexp_replace(result, '\b(B)obo\b', '\1**o', 'gi');
    result := regexp_replace(result, '\b(B)oba\b(?!\s+(?:tea|milk|drink))', '\1**a', 'gi');
    result := regexp_replace(result, '\b(K)abobohan\b', '\1*******n', 'gi');
    result := regexp_replace(result, '\b(U)lol\b', '\1**l', 'gi');
    result := regexp_replace(result, '\b(I)nutil\b', '\1****l', 'gi');
    result := regexp_replace(result, '\b(T)angang\b', '\1*****g', 'gi');
    result := regexp_replace(result, '\b(T)anga\b', '\1***a', 'gi');
    result := regexp_replace(result, '\b(B)wisit\b', '\1****t', 'gi');
    result := regexp_replace(result, '\b(B)uwisit\b', '\1*****t', 'gi');
    result := regexp_replace(result, '\b(H)inayupak\b', '\1*******k', 'gi');
    result := regexp_replace(result, '\b(K)antot\b', '\1****t', 'gi');
    result := regexp_replace(result, '\b(K)antutan\b', '\1******n', 'gi');
    result := regexp_replace(result, '\b(C)hupa\b', '\1***a', 'gi');
    result := regexp_replace(result, '\b(T)supa\b', '\1***a', 'gi');
    result := regexp_replace(result, '\b(T)ite\b', '\1**e', 'gi');
    result := regexp_replace(result, '\b(P)uke\b', '\1**e', 'gi');
    result := regexp_replace(result, '\b(P)uki\b', '\1**i', 'gi');
    result := regexp_replace(result, '\b(K)iki\b', '\1**i', 'gi');
    result := regexp_replace(result, '\b(T)amod\b', '\1***d', 'gi');
    result := regexp_replace(result, '\b(J)akol\b', '\1***l', 'gi');
    result := regexp_replace(result, '\b(B)urat\b', '\1***t', 'gi');
    result := regexp_replace(result, '\b(B)ayag\b', '\1***g', 'gi');
    result := regexp_replace(result, '\b(P)epe\b', '\1**e', 'gi');
    result := regexp_replace(result, '\b(I)yot\b', '\1**t', 'gi');
    result := regexp_replace(result, '\b(P)okpok\b', '\1****k', 'gi');

    -- English Profanities
    result := regexp_replace(result, '\b(M)otherfucking\b', '\1***********g', 'gi');
    result := regexp_replace(result, '\b(M)otherfuckers\b', '\1***********s', 'gi');
    result := regexp_replace(result, '\b(M)otherfucker\b', '\1**********r', 'gi');
    result := regexp_replace(result, '\b(F)ucking\b', '\1*****g', 'gi');
    result := regexp_replace(result, '\b(F)ucker\b', '\1****r', 'gi');
    result := regexp_replace(result, '\b(F)ucked\b', '\1****d', 'gi');
    result := regexp_replace(result, '\b(F)ucks\b', '\1***s', 'gi');
    result := regexp_replace(result, '\b(F)uck\b', '\1**k', 'gi');
    result := regexp_replace(result, '\b(F)UCK\b', '\1**K', 'g');
    result := regexp_replace(result, '\b(B)ullshit\b', '\1******t', 'gi');
    result := regexp_replace(result, '\b(D)ipshit\b', '\1*****t', 'gi');
    result := regexp_replace(result, '\b(S)hitting\b', '\1******g', 'gi');
    result := regexp_replace(result, '\b(S)hitty\b', '\1****y', 'gi');
    result := regexp_replace(result, '\b(S)hits\b', '\1***s', 'gi');
    result := regexp_replace(result, '\b(S)hit\b', '\1**t', 'gi');
    result := regexp_replace(result, '\b(S)HIT\b', '\1**T', 'g');
    result := regexp_replace(result, '\b(B)itching\b', '\1******g', 'gi');
    result := regexp_replace(result, '\b(B)itches\b', '\1*****s', 'gi');
    result := regexp_replace(result, '\b(B)itchy\b', '\1****y', 'gi');
    result := regexp_replace(result, '\b(B)itch\b', '\1***h', 'gi');
    result := regexp_replace(result, '\b(B)ITCH\b', '\1***H', 'g');
    result := regexp_replace(result, '\b(A)ssholes\b', '\1******s', 'gi');
    result := regexp_replace(result, '\b(A)sshole\b', '\1*****e', 'gi');
    result := regexp_replace(result, '\b(A)SSHOLE\b', '\1*****E', 'g');
    result := regexp_replace(result, '\b(D)umbass\b', '\1*****s', 'gi');
    result := regexp_replace(result, '\b(J)ackass\b', '\1*****s', 'gi');
    result := regexp_replace(result, '\b(F)atass\b', '\1****s', 'gi');
    result := regexp_replace(result, '\b(B)astards\b', '\1******s', 'gi');
    result := regexp_replace(result, '\b(B)astard\b', '\1*****d', 'gi');
    result := regexp_replace(result, '\b(C)unts\b', '\1***s', 'gi');
    result := regexp_replace(result, '\b(C)unt\b', '\1**t', 'gi');
    result := regexp_replace(result, '\b(D)ickheads\b', '\1*******s', 'gi');
    result := regexp_replace(result, '\b(D)ickhead\b', '\1******d', 'gi');
    result := regexp_replace(result, '\b(D)icks\b', '\1***s', 'gi');
    result := regexp_replace(result, '\b(D)ick\b', '\1**k', 'gi');
    result := regexp_replace(result, '\b(C)ocksuckers\b', '\1*********s', 'gi');
    result := regexp_replace(result, '\b(C)ocksucker\b', '\1********r', 'gi');
    result := regexp_replace(result, '\b(C)ocks\b', '\1***s', 'gi');
    result := regexp_replace(result, '\b(C)ock\b', '\1**k', 'gi');
    result := regexp_replace(result, '\b(P)ussies\b', '\1*****s', 'gi');
    result := regexp_replace(result, '\b(P)ussy\b', '\1***y', 'gi');
    result := regexp_replace(result, '\b(T)wats\b', '\1***s', 'gi');
    result := regexp_replace(result, '\b(T)wat\b', '\1**t', 'gi');
    result := regexp_replace(result, '\b(W)ankers\b', '\1*****s', 'gi');
    result := regexp_replace(result, '\b(W)anker\b', '\1****r', 'gi');
    result := regexp_replace(result, '\b(S)luts\b', '\1***s', 'gi');
    result := regexp_replace(result, '\b(S)lut\b', '\1**t', 'gi');
    result := regexp_replace(result, '\b(W)hores\b', '\1****s', 'gi');
    result := regexp_replace(result, '\b(W)hore\b', '\1***e', 'gi');
    result := regexp_replace(result, '(?<![a-zA-Z0-9])([aA])ss(?![a-zA-Z0-9])', '\1*s', 'g');

    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Trigger function for posts
CREATE OR REPLACE FUNCTION public.trigger_censor_post()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content := public.censor_profanity_text(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for post_comments
CREATE OR REPLACE FUNCTION public.trigger_censor_comment()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content := public.censor_profanity_text(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for chat messages
CREATE OR REPLACE FUNCTION public.trigger_censor_message()
RETURNS TRIGGER AS $$
BEGIN
    NEW.message := public.censor_profanity_text(NEW.message);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Apply to Posts
DROP TRIGGER IF EXISTS trg_censor_posts ON public.posts;
CREATE TRIGGER trg_censor_posts
    BEFORE INSERT OR UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_censor_post();

-- 2. Apply to Post Comments
DROP TRIGGER IF EXISTS trg_censor_post_comments ON public.post_comments;
CREATE TRIGGER trg_censor_post_comments
    BEFORE INSERT OR UPDATE ON public.post_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_censor_comment();

-- 3. Apply to Chat Messages
DROP TRIGGER IF EXISTS trg_censor_messages ON public.messages;
CREATE TRIGGER trg_censor_messages
    BEFORE INSERT OR UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_censor_message();
