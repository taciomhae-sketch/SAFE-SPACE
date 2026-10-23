-- =============================================================
-- SAFE SPACE: SENTIMENT ANALYSIS AND CONTENT CLASSIFICATION SCHEMA
-- Three-Tier Classification: Positive, Neutral, Negative
-- Supports Posts, Comments, Replies, and Chat Messages
-- =============================================================

CREATE TABLE IF NOT EXISTS public.sentiment_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'reply', 'message', 'chat')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    text_content TEXT,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
    sentiment_score NUMERIC(5, 4) DEFAULT 0.5000,
    confidence NUMERIC(5, 4) DEFAULT 0.8500,
    method TEXT DEFAULT 'ai_contextual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_content_sentiment UNIQUE (content_id, content_type)
);

-- Enable RLS
ALTER TABLE public.sentiment_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sentiment_analysis_logs' AND policyname = 'Allow authenticated read of sentiment analytics'
    ) THEN
        CREATE POLICY "Allow authenticated read of sentiment analytics"
            ON public.sentiment_analysis_logs FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sentiment_analysis_logs' AND policyname = 'Allow authenticated insert of sentiment analysis'
    ) THEN
        CREATE POLICY "Allow authenticated insert of sentiment analysis"
            ON public.sentiment_analysis_logs FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sentiment_analysis_logs' AND policyname = 'Allow authenticated update of sentiment analysis'
    ) THEN
        CREATE POLICY "Allow authenticated update of sentiment analysis"
            ON public.sentiment_analysis_logs FOR UPDATE
            TO authenticated
            USING (true);
    END IF;
END $$;

-- Indexes for high-performance dashboard analytics
CREATE INDEX IF NOT EXISTS idx_sentiment_logs_content ON public.sentiment_analysis_logs(content_type, sentiment, created_at);
CREATE INDEX IF NOT EXISTS idx_sentiment_logs_user ON public.sentiment_analysis_logs(user_id);
