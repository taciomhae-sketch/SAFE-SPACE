-- =====================================================================
-- SAFE SPACE — ASU-IBAJAY STUDENT ID DUAL-SIDED VERIFICATION & UNIQUE CONSTRAINT
-- =====================================================================

-- 1. Add front & back ID image columns and verification metadata to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_card_front_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_card_back_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id_barcode TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id_front_detected TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id_matching_status TEXT DEFAULT 'PENDING';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id_status TEXT DEFAULT 'PENDING_VERIFICATION';

-- 2. Populate id_card_front_url from existing id_card_url if empty
UPDATE public.profiles
SET id_card_front_url = id_card_url
WHERE id_card_front_url IS NULL AND id_card_url IS NOT NULL;

-- 3. Clean up any blank/whitespace student_id strings to NULL so UNIQUE index applies cleanly
UPDATE public.profiles
SET student_id = NULL
WHERE student_id IS NOT NULL AND trim(student_id) = '';

-- 4. Create Partial Unique Index on student_id
-- Ensures active, suspended, or deactivated accounts cannot share the same Student ID,
-- while allowing the ID to be reused only after an account is permanently deleted.
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_active_student_id
ON public.profiles (lower(trim(student_id)))
WHERE student_id IS NOT NULL AND trim(student_id) <> '';

-- 5. RPC function to atomically check Student ID availability before signup
CREATE OR REPLACE FUNCTION public.check_student_id_available(p_student_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_clean TEXT;
    v_count INTEGER;
BEGIN
    IF p_student_id IS NULL OR trim(p_student_id) = '' THEN
        RETURN true;
    END IF;

    v_clean := lower(trim(p_student_id));
    SELECT COUNT(*) INTO v_count
    FROM public.profiles
    WHERE lower(trim(student_id)) = v_clean;

    RETURN (v_count = 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

