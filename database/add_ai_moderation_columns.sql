-- ==============================================================================
-- Safe Space - Add AI Moderation & Sentiment Analysis Columns to Posts Table
-- ==============================================================================
-- PURPOSE:
-- Fixes the issue where Neutral and Safe badges disappear after a refresh
-- or after 1 minute by permanently persisting sentiment and moderation status
-- directly inside the Supabase 'posts' database table.
--
-- HOW TO RUN:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ssqswqqfsbfgjsrllprq/sql
-- 2. Click "New Query"
-- 3. Paste and run this script.
-- ==============================================================================

-- 1. Add AI moderation & sentiment columns if they do not exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'NEUTRAL';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sentiment_score FLOAT DEFAULT 0.5;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'APPROVED';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_category TEXT DEFAULT 'SAFE';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_confidence FLOAT DEFAULT 0.95;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_reason TEXT DEFAULT 'Approved';

-- 2. Populate existing posts with default safe and sentiment values so they display badges
UPDATE public.posts 
SET 
  sentiment = COALESCE(sentiment, 'NEUTRAL'),
  sentiment_score = COALESCE(sentiment_score, 0.5),
  moderation_status = COALESCE(moderation_status, 'APPROVED'),
  moderation_category = COALESCE(moderation_category, 'SAFE')
WHERE sentiment IS NULL OR moderation_status IS NULL;

-- 3. Notify schema cache reload
NOTIFY pgrst, 'reload schema';
