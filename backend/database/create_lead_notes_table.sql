-- CREATE TABLE FOR LEAD NOTES
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADD INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);

-- ENABLE RLS (Row Level Security)
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- POLICIES (Assuming basic authenticated access for now, similar to leads)
-- You can further refine these in your Supabase dashboard
CREATE POLICY "Allow authenticated access to lead_notes"
ON public.lead_notes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
