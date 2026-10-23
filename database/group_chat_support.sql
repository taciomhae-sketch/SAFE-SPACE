-- =====================================================================
-- SAFE SPACE - GROUP CHAT DATABASE SUPPORT
-- Creates/ensures tables for Group Conversations, Members, and Group Messages
-- =====================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NULL,
    is_group BOOLEAN DEFAULT true,
    avatar_url TEXT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created earlier
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS description TEXT NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT true;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. CONVERSATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. ENSURE MESSAGES TABLE HAS conversation_id
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- 4. DISABLE RLS OR GRANT OPEN ACCESS TO PERMIT SMOOTH CHAT SYNC
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.conversations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversation_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;

-- 5. ENABLE REALTIME PUBLICATION FOR GROUP CONVERSATIONS & MEMBERS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

SELECT 'Group chat database schema initialized successfully!' AS status;
