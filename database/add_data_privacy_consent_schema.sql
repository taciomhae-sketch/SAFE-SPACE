-- =====================================================================
-- SAFE SPACE — DATA PRIVACY ACT OF 2012 (RA 10173) CONSENT & COMPLIANCE SCHEMA
-- =====================================================================

-- 1. Add Data Privacy and Terms acknowledgment columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_notice_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_notice_version TEXT DEFAULT '1.0';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_acknowledged_at TIMESTAMPTZ NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ NULL;

-- 2. Create dedicated privacy consent audit trail table for non-repudiation
CREATE TABLE IF NOT EXISTS public.privacy_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    student_id TEXT NULL,
    privacy_notice_version TEXT NOT NULL DEFAULT '1.0',
    privacy_notice_acknowledged BOOLEAN NOT NULL DEFAULT true,
    privacy_acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    terms_version TEXT NOT NULL DEFAULT '1.0',
    terms_accepted BOOLEAN NOT NULL DEFAULT true,
    terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ip_address TEXT NULL,
    user_agent TEXT NULL,
    consent_channel TEXT DEFAULT 'web_registration',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for quick lookups by user and email
CREATE INDEX IF NOT EXISTS idx_privacy_consent_logs_user_id ON public.privacy_consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_logs_email ON public.privacy_consent_logs(email);

-- Enable RLS
ALTER TABLE public.privacy_consent_logs ENABLE ROW LEVEL SECURITY;

-- Policies for privacy_consent_logs:
-- Users can view their own consent logs
CREATE POLICY "Users can read own privacy consent logs"
    ON public.privacy_consent_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- System / authenticated registration can insert logs
CREATE POLICY "Users and system can insert privacy consent logs"
    ON public.privacy_consent_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 3. Update handle_new_user trigger to preserve consent records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, username, email, student_id,
        first_name, middle_name, last_name,
        age, sex, birthday,
        avatar_url, avatar_type, avatar_value, bio,
        approval_status, is_approved,
        privacy_notice_acknowledged, privacy_notice_version, privacy_acknowledged_at,
        terms_accepted, terms_version, terms_accepted_at
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
        COALESCE(NEW.raw_user_meta_data->>'approval_status', 'approved'),
        COALESCE((NEW.raw_user_meta_data->>'is_approved')::BOOLEAN, true),
        COALESCE((NEW.raw_user_meta_data->>'privacy_notice_acknowledged')::BOOLEAN, false),
        COALESCE(NEW.raw_user_meta_data->>'privacy_notice_version', '1.0'),
        CASE WHEN (NEW.raw_user_meta_data->>'privacy_acknowledged_at') IS NOT NULL 
             THEN (NEW.raw_user_meta_data->>'privacy_acknowledged_at')::TIMESTAMPTZ 
             ELSE NULL END,
        COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::BOOLEAN, false),
        COALESCE(NEW.raw_user_meta_data->>'terms_version', '1.0'),
        CASE WHEN (NEW.raw_user_meta_data->>'terms_accepted_at') IS NOT NULL 
             THEN (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ 
             ELSE NULL END
    )
    ON CONFLICT (id) DO UPDATE SET
        student_id = COALESCE(EXCLUDED.student_id, profiles.student_id),
        privacy_notice_acknowledged = COALESCE(EXCLUDED.privacy_notice_acknowledged, profiles.privacy_notice_acknowledged),
        privacy_notice_version = COALESCE(EXCLUDED.privacy_notice_version, profiles.privacy_notice_version),
        privacy_acknowledged_at = COALESCE(EXCLUDED.privacy_acknowledged_at, profiles.privacy_acknowledged_at),
        terms_accepted = COALESCE(EXCLUDED.terms_accepted, profiles.terms_accepted),
        terms_version = COALESCE(EXCLUDED.terms_version, profiles.terms_version),
        terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, profiles.terms_accepted_at);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

