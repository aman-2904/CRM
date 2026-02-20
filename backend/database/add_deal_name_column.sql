-- Migration: Add 'name' column to deals table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS name text;
