-- =====================================================================
-- SAFE SPACE — MODULE 2: ANONYMOUS EXPRESSION DATABASE SCHEMA
-- Creates: posts, post_likes, post_comments, saved_posts
-- Includes: Indexes, RLS Policies, Realtime Publication, Storage Rules
-- Safe to run multiple times (idempotent)
-- =====================================================================

-- 1. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood TEXT CHECK (mood IN ('like', 'haha', 'sad', 'angry', 'love', 'support') OR mood IS NULL),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'support', 'stories')),
    photo_url TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. POST LIKES TABLE
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- 3. POST COMMENTS TABLE
-- reactions JSONB structure:
--   { "likes": [uuid, ...], "parent_id": uuid|null, "reply_to": username|null }
--   parent_id and reply_to are set for reply comments to thread them under a parent.
--   likes is an array of user UUIDs who reacted (heart) to this comment.
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reactions JSONB DEFAULT '{"likes":[],"parent_id":null,"reply_to":null}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SAVED / BOOKMARKED POSTS TABLE
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON public.saved_posts(post_id);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so this script is safe to re-run
DROP POLICY IF EXISTS "Posts viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.post_likes;
DROP POLICY IF EXISTS "Users can insert like" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete own like" ON public.post_likes;

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert comment" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete own comment" ON public.post_comments;

DROP POLICY IF EXISTS "Users can view own saved posts" ON public.saved_posts;
DROP POLICY IF EXISTS "Users can save posts" ON public.saved_posts;
DROP POLICY IF EXISTS "Users can remove saved posts" ON public.saved_posts;

-- Create fresh RLS Policies
CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT
    USING (archived = FALSE OR auth.uid() = user_id);

CREATE POLICY "Users can create posts" ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Likes viewable by everyone" ON public.post_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert like" ON public.post_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own like" ON public.post_likes FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Comments viewable by everyone" ON public.post_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can insert comment" ON public.post_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update comment reactions" ON public.post_comments FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete own comment" ON public.post_comments FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" ON public.saved_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved posts" ON public.saved_posts FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================================
-- REALTIME PUBLICATION
-- =====================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- STORAGE BUCKET FOR POST PHOTOS
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-photos', 'post-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public post photos access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload post photos" ON storage.objects;

CREATE POLICY "Public post photos access" ON storage.objects FOR SELECT
    USING (bucket_id = 'post-photos');

CREATE POLICY "Authenticated users upload post photos" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'post-photos' AND auth.role() = 'authenticated');

-- Done notification
SELECT 'Module 2: Anonymous Expression database setup complete!' AS status;

