-- ==============================================================================
-- IN THE MEANTIME - SUPABASE DATABASE SCHEMA
-- Run this complete script in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Create Entries Table
CREATE TABLE IF NOT EXISTS public.entries (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    entry_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    for_you BOOLEAN NOT NULL DEFAULT false,
    for_them BOOLEAN NOT NULL DEFAULT false,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'instant',
    tags TEXT[] NOT NULL DEFAULT '{}',
    paper_style TEXT DEFAULT 'a4',
    backdrop_color TEXT DEFAULT '#8B4513',
    font_family TEXT DEFAULT 'Schoolbell',
    font_size NUMERIC DEFAULT 18,
    text_align TEXT DEFAULT 'left',
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    stickers JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 2. Create App Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'app_settings',
    user_name TEXT DEFAULT '',
    partner_salutation TEXT DEFAULT 'To you, in the meantime',
    theme TEXT DEFAULT 'paper',
    passcode_enabled BOOLEAN DEFAULT true,
    passcode TEXT DEFAULT '1805',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Indexes for fast querying & sorting
CREATE INDEX IF NOT EXISTS entries_entry_date_idx ON public.entries (entry_date DESC);
CREATE INDEX IF NOT EXISTS entries_for_you_idx ON public.entries (for_you);
CREATE INDEX IF NOT EXISTS entries_for_them_idx ON public.entries (for_them);
CREATE INDEX IF NOT EXISTS entries_created_at_idx ON public.entries (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies for Anon & Authenticated users
-- (Ensures your publishable/anon key can read, insert, update and delete seamlessly)
CREATE POLICY "Allow anon and authenticated full access to entries" 
    ON public.entries 
    FOR ALL 
    TO public 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow anon and authenticated full access to settings" 
    ON public.settings 
    FOR ALL 
    TO public 
    USING (true) 
    WITH CHECK (true);

-- 6. Insert Default Settings Row with 1805 Passcode
INSERT INTO public.settings (id, user_name, partner_salutation, theme, passcode_enabled, passcode)
VALUES ('app_settings', '', 'To you, in the meantime', 'paper', true, '1805')
ON CONFLICT (id) DO UPDATE SET
    passcode = '1805',
    passcode_enabled = true;

-- 7. (Optional) Storage bucket for attachments and photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public access to media bucket"
    ON storage.objects
    FOR ALL
    TO public
    USING (bucket_id = 'media')
    WITH CHECK (bucket_id = 'media');

-- ==============================================================================
-- 8. INCREMENTAL MIGRATIONS (Run if updating an existing database)
-- ==============================================================================
-- Add 'For Them' column for letters written to future kids:
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS for_them BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS entries_for_them_idx ON public.entries (for_them);
