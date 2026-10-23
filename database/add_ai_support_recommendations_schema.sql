-- ==============================================================================
-- Safe Space - Add AI Support Recommendations & Safety Review Columns to Posts
-- ==============================================================================
-- PURPOSE:
-- Implements database persistence for:
-- 1. Pre-Posting Safety Warning tracking (moderation_status, moderation_category, moderation_reason, is_user_confirmed)
-- 2. AI-Generated Supportive Comment Recommendations (ai_recommendation, ai_recommendation_status)
-- 3. Sentiment Analysis metrics (sentiment, sentiment_score)
--
-- HOW TO RUN:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ssqswqqfsbfgjsrllprq/sql
-- 2. Click "New Query"
-- 3. Paste and execute this script.
-- ==============================================================================

-- 1. Ensure moderation & sentiment columns exist on public.posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'NEUTRAL';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sentiment_score FLOAT DEFAULT 0.50;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'APPROVED';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_category TEXT DEFAULT 'SAFE';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_confidence FLOAT DEFAULT 0.95;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_reason TEXT DEFAULT 'Approved';

-- 2. Add AI Supportive Comment Recommendation & Trigger Warning columns to public.posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_recommendation JSONB DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_recommendation_status TEXT DEFAULT 'generated';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_user_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS has_trigger_warning BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS trigger_warning_category TEXT DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS trigger_warning_label TEXT DEFAULT NULL;

-- 3. Ensure high-performance indexes for sentiment analytics & safety moderation queries
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON public.posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_category ON public.posts(moderation_category);
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON public.posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON public.posts(created_at DESC);

-- 4. Backfill existing rows with safe defaults so all badges & recommendation slots render consistently
UPDATE public.posts
SET
  sentiment = COALESCE(sentiment, 'NEUTRAL'),
  sentiment_score = COALESCE(sentiment_score, 0.50),
  moderation_status = COALESCE(moderation_status, 'APPROVED'),
  moderation_category = COALESCE(moderation_category, 'SAFE'),
  moderation_confidence = COALESCE(moderation_confidence, 0.95),
  moderation_reason = COALESCE(moderation_reason, 'Approved'),
  ai_recommendation_status = COALESCE(ai_recommendation_status, 'generated'),
  is_user_confirmed = COALESCE(is_user_confirmed, FALSE)
WHERE sentiment IS NULL OR moderation_status IS NULL OR moderation_category IS NULL;

-- 5. Notify PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';
