-- =====================================================================
-- SAFE SPACE — ADD STUDENT ID & APPROVAL COLUMNS TO SUPABASE
-- Project: ssqswqqfsbfgjsrllprq
--
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ssqswqqfsbfgjsrllprq/sql
-- 2. Click "New Query"
-- 3. Paste and run this SQL script.
-- =====================================================================

-- 1. Add student_id and approval columns to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reject_reason TEXT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL;

-- 2. Update handle_new_user trigger to save student_id & approval_status from registration metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, username, email, student_id,
        first_name, middle_name, last_name,
        age, sex, birthday,
        avatar_url, avatar_type, avatar_value, bio,
        approval_status, is_approved
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'student_id', NEW.raw_user_meta_data->>'studentId'),
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'middle_name',
        NEW.raw_user_meta_data->>'last_name',
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'sex',
        (NEW.raw_user_meta_data->>'birthday')::DATE,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'assets/avatars/default-avatar.png'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_type', 'default'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_value', 'default'),
        COALESCE(NEW.raw_user_meta_data->>'bio', 'Hello, Safe Space!'),
        COALESCE(NEW.raw_user_meta_data->>'approval_status', 'pending'),
        COALESCE((NEW.raw_user_meta_data->>'is_approved')::BOOLEAN, false)
    )
    ON CONFLICT (id) DO UPDATE SET
        student_id = COALESCE(EXCLUDED.student_id, profiles.student_id),
        approval_status = COALESCE(EXCLUDED.approval_status, profiles.approval_status),
        is_approved = COALESCE(EXCLUDED.is_approved, profiles.is_approved);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
