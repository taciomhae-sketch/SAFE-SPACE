-- =====================================================================
-- SAFE SPACE — COMPLETE ALL-IN-ONE SUPABASE DATABASE SCHEMA
-- Project: ssqswqqfsbfgjsrllprq
--
-- INSTRUCTIONS FOR USER:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Go to the "SQL Editor" on the left menu.
-- 3. Click "New Query".
-- 4. Copy and paste THIS ENTIRE FILE into the editor.
-- 5. Click "Run" (or Ctrl + Enter).
-- Everything is idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 2. CORE TABLES
-- =====================================================================

-- 2.1 PROFILES (Connected 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    age INTEGER,
    sex TEXT,
    birthday DATE,
    avatar_url TEXT,
    avatar_type TEXT DEFAULT 'default',
    avatar_value TEXT DEFAULT 'default',
    theme_mode TEXT DEFAULT 'light',
    theme_color TEXT DEFAULT 'purple',
    bio TEXT,
    role TEXT DEFAULT 'student',
    last_active TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    is_online BOOLEAN DEFAULT false,
    is_deactivated BOOLEAN DEFAULT false,
    privacy_anonymous_posting BOOLEAN DEFAULT true,
    privacy_allow_discovery BOOLEAN DEFAULT true,
    privacy_show_profile BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist idempotently
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_value TEXT DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'light';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'purple';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT false;

-- 2.2 CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    is_group BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 CONVERSATION MEMBERS
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(conversation_id, user_id)
);

-- 2.4 MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    is_from_support BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL;

-- 2.5 MESSAGE REACTIONS
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- 2.6 POSTS (Community Feed)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood TEXT,
    category TEXT DEFAULT 'general',
    photo_url TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    archived BOOLEAN DEFAULT false,
    sentiment TEXT,                      -- 'POSITIVE', 'NEUTRAL', 'NEGATIVE'
    sentiment_score FLOAT,               -- 0.0 to 1.0 confidence score
    moderation_status TEXT DEFAULT 'APPROVED', -- 'APPROVED', 'REVIEW', 'BLOCKED'
    moderation_category TEXT DEFAULT 'SAFE',   -- 'SAFE', 'OFFENSIVE', 'BULLYING', etc.
    deleted_at TIMESTAMPTZ NULL,               -- Soft delete timestamp for moderation audit
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deletion_reason TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all post columns exist idempotently
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deletion_reason TEXT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sentiment TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sentiment_score FLOAT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'APPROVED';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_category TEXT DEFAULT 'SAFE';

-- 2.7 POST LIKES
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- 2.8 POST COMMENTS
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9 SAVED / BOOKMARKED POSTS
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- 2.10 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.11 FRIENDSHIPS / CONNECTIONS
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(requester_id, receiver_id)
);

-- 2.12 SAFETY BLOCKS
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(blocker_id, blocked_id)
);

-- Backward compatibility alias view/table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(blocker_id, blocked_id)
);

-- 2.13 SAFETY & CONTENT REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    report_type TEXT,
    details TEXT,
    description TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Resolved', 'Dismissed', 'pending', 'under_review', 'resolved', 'dismissed')),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMPTZ NULL
);

-- Ensure all report columns exist idempotently
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ NULL;
DO $$
BEGIN
    ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
    ALTER TABLE public.reports ADD CONSTRAINT reports_status_check 
        CHECK (status IN ('Pending', 'Reviewed', 'Resolved', 'Dismissed', 'pending', 'under_review', 'resolved', 'dismissed'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2.14 MODERATION ACTIONS (Audit Trail & Disciplinary History)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('warning', 'post_removed', 'temporary_suspension', 'permanent_ban', 'report_dismissed')),
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ NULL
);

-- 2.14 BIBLE VERSES & SAVED VERSES (Public Domain KJV)
CREATE TABLE IF NOT EXISTS public.bible_verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    verse_text TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saved_verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verse_id UUID NOT NULL REFERENCES public.bible_verses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, verse_id)
);

-- =====================================================================
-- 3. PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_convo_members_lookup ON public.conversation_members(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_post ON public.reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_post_report ON public.reports (reporter_id, post_id) 
    WHERE status IN ('pending', 'under_review', 'Pending', 'Reviewed');
CREATE INDEX IF NOT EXISTS idx_mod_actions_user ON public.moderation_actions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mod_actions_report ON public.moderation_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_post ON public.moderation_actions(post_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON public.posts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_created_active ON public.posts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_category_created ON public.posts(category, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bible_verses_category ON public.bible_verses(category);

-- Admin verification helper function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND (role IN ('admin', 'counselor', 'moderator') OR is_admin = true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 4. AUTOMATIC PROFILE CREATION TRIGGER (ON SIGNUP)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, username, email,
        first_name, middle_name, last_name,
        age, sex, birthday,
        avatar_url, bio
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'middle_name',
        NEW.raw_user_meta_data->>'last_name',
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'sex',
        (NEW.raw_user_meta_data->>'birthday')::DATE,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'bio', 'Hello, Safe Space!')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_verses ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 5.2 Conversations & Members
DROP POLICY IF EXISTS "Users can view conversations they belong to" ON public.conversations;
CREATE POLICY "Users can view conversations they belong to" ON public.conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = id AND cm.user_id = auth.uid()) 
    OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Members can view conversation memberships" ON public.conversation_members;
CREATE POLICY "Members can view conversation memberships" ON public.conversation_members FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.conversation_members cm2 WHERE cm2.conversation_id = conversation_id AND cm2.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can join or add members" ON public.conversation_members;
CREATE POLICY "Users can join or add members" ON public.conversation_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5.3 Messages
DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.messages;
CREATE POLICY "Users can view their conversation messages" ON public.messages FOR SELECT USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    (conversation_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Receivers can update message read status" ON public.messages;
CREATE POLICY "Receivers can update message read status" ON public.messages FOR UPDATE USING (
    auth.uid() = receiver_id OR auth.uid() = sender_id
);

DROP POLICY IF EXISTS "Users can manage message reactions" ON public.message_reactions;
CREATE POLICY "Users can manage message reactions" ON public.message_reactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Message reactions viewable by everyone" ON public.message_reactions;
CREATE POLICY "Message reactions viewable by everyone" ON public.message_reactions FOR SELECT USING (true);

-- 5.4 Posts, Likes, Comments
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts 
    FOR SELECT USING ((archived = false AND deleted_at IS NULL) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins or owners can update posts" ON public.posts;
CREATE POLICY "Admins or owners can update posts" ON public.posts 
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins or owners can delete posts" ON public.posts;
CREATE POLICY "Admins or owners can delete posts" ON public.posts 
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.post_likes;
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can toggle their own likes" ON public.post_likes;
CREATE POLICY "Users can toggle their own likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments are viewable by everyone" ON public.post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update or delete own comments" ON public.post_comments;
CREATE POLICY "Users can update or delete own comments" ON public.post_comments FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage saved posts" ON public.saved_posts;
CREATE POLICY "Users can manage saved posts" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);

-- 5.5 Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can trigger notifications" ON public.notifications;
CREATE POLICY "Authenticated users can trigger notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5.6 Friendships & Blocks
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can manage their friendships" ON public.friendships;
CREATE POLICY "Users can manage their friendships" ON public.friendships FOR ALL USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can manage their blocks" ON public.blocks;
CREATE POLICY "Users can manage their blocks" ON public.blocks FOR ALL USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can manage blocked_users alias" ON public.blocked_users;
CREATE POLICY "Users can manage blocked_users alias" ON public.blocked_users FOR ALL USING (auth.uid() = blocker_id);

-- 5.7 Reports
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Reporters can view their reports" ON public.reports;
DROP POLICY IF EXISTS "Admins and reporters can view reports" ON public.reports;
CREATE POLICY "Admins and reporters can view reports" ON public.reports 
    FOR SELECT USING (public.is_admin(auth.uid()) OR auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports 
    FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports" ON public.reports 
    FOR DELETE USING (public.is_admin(auth.uid()));

-- 5.8 Moderation Actions (Audit Log & Disciplinary Notices)
DROP POLICY IF EXISTS "Admins can manage moderation actions" ON public.moderation_actions;
CREATE POLICY "Admins can manage moderation actions" ON public.moderation_actions 
    FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view their own moderation notices" ON public.moderation_actions;
CREATE POLICY "Users can view their own moderation notices" ON public.moderation_actions 
    FOR SELECT USING (auth.uid() = user_id);

-- 5.9 Bible Verses
DROP POLICY IF EXISTS "Anyone can view bible verses" ON public.bible_verses;
CREATE POLICY "Anyone can view bible verses" ON public.bible_verses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage saved verses" ON public.saved_verses;
CREATE POLICY "Users can manage saved verses" ON public.saved_verses FOR ALL USING (auth.uid() = user_id);

-- =====================================================================
-- 6. SUPABASE STORAGE BUCKETS (Public Avatars & Post Photos)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true), ('post-photos', 'post-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public image access" ON storage.objects;
CREATE POLICY "Public image access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'post-photos'));

DROP POLICY IF EXISTS "Authenticated users upload images" ON storage.objects;
CREATE POLICY "Authenticated users upload images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id IN ('avatars', 'post-photos') AND auth.role() = 'authenticated'
);

-- =====================================================================
-- 7. REALTIME WEBSOCKETS PUBLICATION
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- =====================================================================
-- 8. SEED DATA: 23 BIBLE GROUNDING VERSES (Public Domain)
-- =====================================================================
INSERT INTO public.bible_verses (book, chapter, verse, verse_text, category) VALUES
('Philippians', 4, 6, 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.', 'Anxiety'),
('1 Peter', 5, 7, 'Casting all your care upon him; for he careth for you.', 'Anxiety'),
('Matthew', 11, 28, 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', 'Stress'),
('John', 14, 27, 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.', 'Peace'),
('Jeremiah', 29, 11, 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.', 'Hope'),
('Romans', 15, 13, 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.', 'Hope'),
('Isaiah', 40, 31, 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', 'Strength'),
('Philippians', 4, 13, 'I can do all things through Christ which strengtheneth me.', 'Strength'),
('Psalm', 23, 4, 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.', 'Fear'),
('2 Timothy', 1, 7, 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', 'Fear'),
('Psalm', 34, 18, 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.', 'Sadness'),
('Revelation', 21, 4, 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain.', 'Sadness'),
('Joshua', 1, 9, 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.', 'Encouragement'),
('Deuteronomy', 31, 8, 'And the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed.', 'Encouragement'),
('1 Corinthians', 13, 4, 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.', 'Love'),
('1 John', 4, 19, 'We love him, because he first loved us.', 'Love'),
('Ephesians', 4, 32, 'And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ''s sake hath forgiven you.', 'Forgiveness'),
('Colossians', 3, 13, 'Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.', 'Forgiveness'),
('Proverbs', 3, 5, 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.', 'Guidance'),
('Psalm', 119, 105, 'Thy word is a lamp unto my feet, and a light unto my path.', 'Guidance'),
('1 Thessalonians', 5, 18, 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.', 'Gratitude'),
('Romans', 8, 28, 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', 'Difficult Times'),
('Psalm', 46, 1, 'God is our refuge and strength, a very present help in trouble.', 'Difficult Times')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 9. ADMIN ROLES & MODERATION EXTENSIONS
-- =====================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Grant primary administrator privileges to thesis owner
UPDATE public.profiles
SET role = 'admin', is_admin = true
WHERE email = 'taciomhae@gmail.com' OR username = 'taciomhae';
