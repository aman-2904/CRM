-- Migration: Add 'attempt_to_call' to leads status check constraint
-- Run this in your Supabase SQL Editor

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'attempt_to_call', 'contacted', 'interested', 'converted', 'lost'));
