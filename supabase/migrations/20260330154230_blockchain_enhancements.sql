
-- Enable pgvector if available (for future vector search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add blockchain-related columns to audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS previous_hash TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS hash TEXT;

-- Add verification and search columns to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS metadata_embedding vector(1536); -- Assuming OpenAI embeddings size

-- Create a function to help fetch the last hash for a user/document chain
CREATE OR REPLACE FUNCTION public.get_last_audit_hash(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT hash FROM public.audit_logs 
  WHERE user_id = _user_id 
  ORDER BY created_at DESC 
  LIMIT 1
$$;
