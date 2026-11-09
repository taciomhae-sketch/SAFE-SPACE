-- ==============================================================================
-- Safe Space - Add Automatic Sensitive Content Detection & Blur Effect Columns to Posts
-- ==============================================================================
-- PURPOSE:
-- Implements database persistence for:
-- 1. Sensitive Content Detection (sensitive_content, sensitive_categories, sensitive_warning)
-- 2. User-Controlled Blur Effect in Community Feed (blur_enabled)
-- 3. Safety Assessment Timestamp (assessed_at)
--
-- HOW TO RUN:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ssqswqqfsbfgjsrllprq/sql
-- 2. Click "New Query"
-- 3. Paste and execute this script.
-- ==============================================================================

-- 1. Ensure sensitive content & blur columns exist on public.posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sensitive_content BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sensitive_categories TEXT DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sensitive_warning TEXT DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS blur_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS assessed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. High-performance index for filtering sensitive posts in Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_posts_sensitive_content ON public.posts(sensitive_content);
CREATE INDEX IF NOT EXISTS idx_posts_blur_enabled ON public.posts(blur_enabled);

-- 3. Populate existing rows with default values
UPDATE public.posts
SET
  sensitive_content = COALESCE(sensitive_content, FALSE),
  blur_enabled = COALESCE(blur_enabled, FALSE),
  assessed_at = COALESCE(assessed_at, created_at, timezone('utc'::text, now()))
WHERE sensitive_content IS NULL OR blur_enabled IS NULL;

-- 4. Notify PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';

