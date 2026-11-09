-- ==============================================================================
-- SAFE SPACE — AI SAFETY MONITORING, RISK ALERTS & SECURE IDENTITY AUDIT SCHEMA
-- Project: An AI-Powered Safe Space Platform with Automated Moderation & Sentiment Analysis
-- Compliance: Philippine Data Privacy Act of 2012 (Republic Act No. 10173)
-- ==============================================================================

-- 1. SAFETY ALERTS TABLE
-- Stores AI-detected personal safety risks, distress indicators, and incident alerts
CREATE TABLE IF NOT EXISTS public.safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_code VARCHAR(30) UNIQUE NOT NULL,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'reply', 'chat', 'message')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('critical', 'high', 'moderate', 'low', 'none')),
    concern_type TEXT NOT NULL,
    moderation_category TEXT NOT NULL,
    moderation_severity TEXT NOT NULL,
    reason TEXT NOT NULL,
    evidence_text TEXT NOT NULL,
    confidence NUMERIC(4, 2) DEFAULT 0.90,
    urgency TEXT NOT NULL CHECK (urgency IN ('immediate', 'urgent', 'routine', 'none')),
    recommended_action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('new', 'under_review', 'under_investigation', 'referred_for_support', 'awaiting_followup', 'escalated', 'resolved', 'closed')) DEFAULT 'new',
    assigned_to TEXT DEFAULT NULL,
    review_notes TEXT DEFAULT NULL,
    is_escalated BOOLEAN DEFAULT FALSE,
    action_taken TEXT DEFAULT 'pending_review',
    referral_entity TEXT DEFAULT 'none',
    referral_status TEXT DEFAULT 'none',
    followup_date DATE DEFAULT NULL,
    resolution_summary TEXT DEFAULT NULL,
    status_history JSONB DEFAULT '[]'::jsonb,
    longitudinal_context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NULL
);

-- Idempotent column additions for existing tables
ALTER TABLE public.safety_alerts ADD COLUMN IF NOT EXISTS action_taken TEXT DEFAULT 'pending_review';
ALTER TABLE public.safety_alerts ADD COLUMN IF NOT EXISTS referral_entity TEXT DEFAULT 'none';
ALTER TABLE public.safety_alerts ADD COLUMN IF NOT EXISTS referral_status TEXT DEFAULT 'none';
ALTER TABLE public.safety_alerts ADD COLUMN IF NOT EXISTS followup_date DATE DEFAULT NULL;
ALTER TABLE public.safety_alerts ADD COLUMN IF NOT EXISTS resolution_summary TEXT DEFAULT NULL;
ALTER TABLE public.safety_alerts ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;


-- 2. ADMINISTRATIVE IDENTITY AUDIT LOGS TABLE
-- Records every access to an anonymous user's identity under strict justification (RA 10173)
CREATE TABLE IF NOT EXISTS public.admin_identity_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    admin_email TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    alert_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    revealed_user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT DEFAULT '',
    accessed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_safety_alerts_risk ON public.safety_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_status ON public.safety_alerts(status);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_user ON public.safety_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_created ON public.safety_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_anonymous ON public.safety_alerts(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_audit_logs_revealed ON public.admin_identity_audit_logs(revealed_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_accessed ON public.admin_identity_audit_logs(accessed_at DESC);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_identity_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR SAFETY ALERTS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated insert of safety alerts" ON public.safety_alerts;
    DROP POLICY IF EXISTS "Allow authenticated read of safety alerts" ON public.safety_alerts;
    DROP POLICY IF EXISTS "Allow authenticated update of safety alerts" ON public.safety_alerts;

    CREATE POLICY "Allow authenticated insert of safety alerts"
        ON public.safety_alerts FOR INSERT
        TO authenticated
        WITH CHECK (true);

    CREATE POLICY "Allow authenticated read of safety alerts"
        ON public.safety_alerts FOR SELECT
        TO authenticated
        USING (true);

    CREATE POLICY "Allow authenticated update of safety alerts"
        ON public.safety_alerts FOR UPDATE
        TO authenticated
        USING (true);
END $$;

-- 6. RLS POLICIES FOR IDENTITY AUDIT LOGS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated insert of audit logs" ON public.admin_identity_audit_logs;
    DROP POLICY IF EXISTS "Allow authenticated read of audit logs" ON public.admin_identity_audit_logs;

    CREATE POLICY "Allow authenticated insert of audit logs"
        ON public.admin_identity_audit_logs FOR INSERT
        TO authenticated
        WITH CHECK (true);

    CREATE POLICY "Allow authenticated read of audit logs"
        ON public.admin_identity_audit_logs FOR SELECT
        TO authenticated
        USING (true);
END $$;

-- 7. REALTIME NOTIFICATION REGISTRATION
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
