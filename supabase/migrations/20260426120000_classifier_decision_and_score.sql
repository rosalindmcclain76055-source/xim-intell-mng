ALTER TABLE public.classifications
  ADD COLUMN IF NOT EXISTS final_score double precision NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'classification_decision'
  ) THEN
    CREATE TYPE public.classification_decision_new AS ENUM ('ignore', 'review', 'draft');

    ALTER TABLE public.classifications
      ALTER COLUMN final_decision DROP DEFAULT;

    ALTER TABLE public.classifications
      ALTER COLUMN final_decision TYPE public.classification_decision_new
      USING (
        CASE
          WHEN final_decision::text IN ('draft_reply', 'draft_quote', 'draft_post', 'draft') THEN 'draft'
          ELSE final_decision::text
        END
      )::public.classification_decision_new;

    DROP TYPE public.classification_decision;
    ALTER TYPE public.classification_decision_new RENAME TO classification_decision;

    ALTER TABLE public.classifications
      ALTER COLUMN final_decision SET DEFAULT 'review';
  END IF;
END $$;
