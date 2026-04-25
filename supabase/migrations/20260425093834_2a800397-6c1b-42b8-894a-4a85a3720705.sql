ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS automation_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_risk_ceiling integer NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS default_persona_id uuid NULL;

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_risk_ceiling_range
  CHECK (default_risk_ceiling BETWEEN 0 AND 100);