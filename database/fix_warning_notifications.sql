-- ============================================================
-- SAFE SPACE NOTIFICATIONS SYSTEM FIX
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. Ensure the 'message' column exists on notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message TEXT;

-- 2. Drop the restrictive CHECK constraint on notification types if present.
-- This allows: 'like', 'reaction', 'comment', 'friend_request', 'friend_accept',
-- 'support_message', 'moderation_warning', 'moderation_notice', 'account_suspended', etc.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- If a check constraint is desired, use an inclusive list:
-- ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
--   CHECK (type IN ('like', 'reaction', 'comment', 'friend_request', 'friend_accept', 'support_message', 'moderation_warning', 'moderation_notice', 'account_suspended', 'system'));

-- 3. Ensure Row Level Security (RLS) is enabled and properly configured
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3.1 Recipients can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 3.2 Recipients can update (mark as read) their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 3.3 Any authenticated user can insert notifications (for likes, comments, warnings, etc.)
-- as long as they are the actor (actor_id = auth.uid()) OR an admin
DROP POLICY IF EXISTS "Authenticated users can trigger notifications" ON public.notifications;
CREATE POLICY "Authenticated users can trigger notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = actor_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'administrator', 'counselor', 'moderator')
    )
  );

-- 4. Enable Realtime on notifications table so the bell updates live
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 5. Force PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
