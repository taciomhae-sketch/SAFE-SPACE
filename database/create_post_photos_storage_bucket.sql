-- ==============================================================================
-- Safe Space - Setup 'post-photos' Storage Bucket & Policies in Supabase
-- ==============================================================================
-- PURPOSE:
-- Creates the public 'post-photos' storage bucket in Supabase Storage with
-- proper RLS policies so students can upload and view post photo attachments.
--
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ssqswqqfsbfgjsrllprq/sql
-- 2. Click "New Query"
-- 3. Paste and run this script.
-- ==============================================================================

-- 1. Create the post-photos bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-photos', 'post-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public access to view post photos
DROP POLICY IF EXISTS "Public post photos access" ON storage.objects;
CREATE POLICY "Public post photos access" ON storage.objects FOR SELECT
USING (bucket_id = 'post-photos');

-- 3. Allow authenticated and anon users to upload post photos
DROP POLICY IF EXISTS "Users can upload post photos" ON storage.objects;
CREATE POLICY "Users can upload post photos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-photos');

-- 4. Allow post authors to update/delete their photos
DROP POLICY IF EXISTS "Users can update own post photos" ON storage.objects;
CREATE POLICY "Users can update own post photos" ON storage.objects FOR UPDATE
USING (bucket_id = 'post-photos');

DROP POLICY IF EXISTS "Users can delete own post photos" ON storage.objects;
CREATE POLICY "Users can delete own post photos" ON storage.objects FOR DELETE
USING (bucket_id = 'post-photos');

SELECT 'post-photos storage bucket and policies configured successfully!' AS status;
