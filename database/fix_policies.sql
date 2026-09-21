-- =====================================================================
-- SAFE SPACE — FIX SCRIPT (Run this if schema was already partially run)
-- Fixes policies + updates the signup trigger to include all fields
-- =====================================================================

-- 1. DROP all existing policies (safe to re-run)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
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
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
DROP POLICY IF EXISTS "Users view relevant friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update received requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can manage blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System/Users insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public image access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload images" ON storage.objects;

-- 2. Update the signup trigger to include ALL registration fields
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

-- 3. Re-create all RLS policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT USING (archived = FALSE OR auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert like" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own like" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comment" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove saved posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages they sent or received" ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR receiver_id IS NULL);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update messages" ON public.messages FOR UPDATE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users view relevant friendships" ON public.friendships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update received requests" ON public.friendships FOR UPDATE
    USING (auth.uid() = receiver_id OR auth.uid() = requester_id);

CREATE POLICY "Users can manage blocks" ON public.blocks FOR ALL USING (auth.uid() = blocker_id);

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System/Users insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 4. Storage bucket policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('post-photos', 'post-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public image access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'post-photos'));
CREATE POLICY "Authenticated users upload images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id IN ('avatars', 'post-photos') AND auth.role() = 'authenticated'
);

-- Done!
SELECT 'Safe Space database setup complete!' AS status;

