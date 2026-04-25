
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE public.source_type AS ENUM ('account', 'keyword', 'concept', 'query');
CREATE TYPE public.action_type AS ENUM ('reply', 'quote', 'post', 'ignore');
CREATE TYPE public.draft_status AS ENUM ('pending', 'approved', 'rejected', 'scheduled', 'published', 'failed');
CREATE TYPE public.classification_decision AS ENUM ('ignore', 'review', 'draft_reply', 'draft_quote', 'draft_post');

-- ============ WORKSPACES ============
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  current_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ SECURITY DEFINER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(_workspace_id UUID, _user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_workspace(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id AND role IN ('admin','editor')
  );
$$;

-- ============ PERSONA PROFILES ============
CREATE TABLE public.persona_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tone TEXT,
  expertise_domain TEXT,
  reply_style TEXT,
  risk_tolerance TEXT DEFAULT 'medium',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ CONNECTED ACCOUNTS ============
CREATE TABLE public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'x',
  handle TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  expertise_tags TEXT[] DEFAULT '{}',
  persona_profile_id UUID REFERENCES public.persona_profiles(id) ON DELETE SET NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ WATCH SOURCES ============
CREATE TABLE public.watch_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  source_value TEXT NOT NULL,
  label TEXT,
  priority INT NOT NULL DEFAULT 50,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ TWEETS ============
CREATE TABLE public.tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL,
  source_handle TEXT NOT NULL,
  source_display_name TEXT,
  text TEXT NOT NULL,
  lang TEXT DEFAULT 'en',
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  links TEXT[] DEFAULT '{}',
  raw_json JSONB,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, tweet_id)
);

-- ============ CLASSIFICATIONS ============
CREATE TABLE public.classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id UUID NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  topic_score INT NOT NULL DEFAULT 0,
  source_score INT NOT NULL DEFAULT 0,
  actionability_score INT NOT NULL DEFAULT 0,
  risk_score INT NOT NULL DEFAULT 0,
  final_decision classification_decision NOT NULL DEFAULT 'review',
  matched_keywords TEXT[] DEFAULT '{}',
  reasoning TEXT,
  model_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ DRAFTS ============
CREATE TABLE public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tweet_id UUID REFERENCES public.tweets(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.connected_accounts(id) ON DELETE SET NULL,
  action_type action_type NOT NULL,
  draft_text TEXT NOT NULL,
  status draft_status NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ INDEXES ============
CREATE INDEX idx_tweets_workspace ON public.tweets(workspace_id, ingested_at DESC);
CREATE INDEX idx_classifications_workspace ON public.classifications(workspace_id, created_at DESC);
CREATE INDEX idx_drafts_workspace_status ON public.drafts(workspace_id, status);
CREATE INDEX idx_audit_workspace ON public.audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_members_user ON public.workspace_members(user_id);

-- ============ ENABLE RLS ============
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- workspaces
CREATE POLICY "workspaces_select_member" ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "workspaces_insert_owner" ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "workspaces_update_admin" ON public.workspaces FOR UPDATE
  USING (public.has_workspace_role(id, auth.uid(), 'admin'));
CREATE POLICY "workspaces_delete_owner" ON public.workspaces FOR DELETE
  USING (auth.uid() = owner_id);

-- workspace_members
CREATE POLICY "members_select_own_workspaces" ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members_insert_admin_or_self" ON public.workspace_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR public.has_workspace_role(workspace_id, auth.uid(), 'admin')
  );
CREATE POLICY "members_update_admin" ON public.workspace_members FOR UPDATE
  USING (public.has_workspace_role(workspace_id, auth.uid(), 'admin'));
CREATE POLICY "members_delete_admin" ON public.workspace_members FOR DELETE
  USING (public.has_workspace_role(workspace_id, auth.uid(), 'admin'));

-- generic workspace-scoped policies (helper macro pattern)
-- persona_profiles
CREATE POLICY "personas_select" ON public.persona_profiles FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "personas_insert" ON public.persona_profiles FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "personas_update" ON public.persona_profiles FOR UPDATE USING (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "personas_delete" ON public.persona_profiles FOR DELETE USING (public.has_workspace_role(workspace_id, auth.uid(), 'admin'));

-- connected_accounts
CREATE POLICY "accounts_select" ON public.connected_accounts FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "accounts_insert" ON public.connected_accounts FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "accounts_update" ON public.connected_accounts FOR UPDATE USING (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "accounts_delete" ON public.connected_accounts FOR DELETE USING (public.has_workspace_role(workspace_id, auth.uid(), 'admin'));

-- watch_sources
CREATE POLICY "sources_select" ON public.watch_sources FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "sources_insert" ON public.watch_sources FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "sources_update" ON public.watch_sources FOR UPDATE USING (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "sources_delete" ON public.watch_sources FOR DELETE USING (public.can_edit_workspace(workspace_id, auth.uid()));

-- tweets
CREATE POLICY "tweets_select" ON public.tweets FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "tweets_insert" ON public.tweets FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "tweets_delete" ON public.tweets FOR DELETE USING (public.has_workspace_role(workspace_id, auth.uid(), 'admin'));

-- classifications
CREATE POLICY "class_select" ON public.classifications FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "class_insert" ON public.classifications FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "class_update" ON public.classifications FOR UPDATE USING (public.can_edit_workspace(workspace_id, auth.uid()));

-- drafts
CREATE POLICY "drafts_select" ON public.drafts FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "drafts_insert" ON public.drafts FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "drafts_update" ON public.drafts FOR UPDATE USING (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "drafts_delete" ON public.drafts FOR DELETE USING (public.can_edit_workspace(workspace_id, auth.uid()));

-- audit_logs
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_workspace_id UUID;
  display TEXT;
BEGIN
  display := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, display, NEW.email);

  -- create default workspace
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (display || '''s Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;

  -- add as admin
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'admin');

  -- set as current
  UPDATE public.profiles SET current_workspace_id = new_workspace_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for drafts
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER drafts_touch BEFORE UPDATE ON public.drafts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
