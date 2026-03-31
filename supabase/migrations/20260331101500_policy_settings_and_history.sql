-- Policy settings for real-time review threshold management
CREATE TABLE IF NOT EXISTS public.policy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE DEFAULT 'default_policy',
  confidence_threshold NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 100),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view policy settings"
ON public.policy_settings
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin or officer can update policy settings"
ON public.policy_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));

CREATE POLICY "Admin or officer can insert policy settings"
ON public.policy_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));

CREATE POLICY "Admin can delete policy settings"
ON public.policy_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_policy_settings_updated_at
BEFORE UPDATE ON public.policy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.policy_settings (name, confidence_threshold)
VALUES ('default_policy', 70)
ON CONFLICT (name) DO NOTHING;

-- Policy history for governance and auditability
CREATE TABLE IF NOT EXISTS public.policy_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_setting_id UUID REFERENCES public.policy_settings(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_threshold NUMERIC(5,2),
  new_threshold NUMERIC(5,2) NOT NULL CHECK (new_threshold >= 0 AND new_threshold <= 100),
  projected_flagged INTEGER NOT NULL DEFAULT 0,
  projected_approved INTEGER NOT NULL DEFAULT 0,
  projected_risk_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view policy history"
ON public.policy_history
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin or officer can insert policy history"
ON public.policy_history
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));

CREATE INDEX IF NOT EXISTS idx_policy_history_created_at
ON public.policy_history(created_at DESC);
