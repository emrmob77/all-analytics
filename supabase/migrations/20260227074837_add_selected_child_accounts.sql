-- Add a JSONB array to store multiple selected child accounts from MCCs
ALTER TABLE public.ad_accounts
ADD COLUMN selected_child_accounts JSONB DEFAULT '[]'::jsonb;
