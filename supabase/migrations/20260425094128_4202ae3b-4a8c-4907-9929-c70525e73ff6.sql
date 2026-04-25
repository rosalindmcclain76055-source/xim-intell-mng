CREATE UNIQUE INDEX IF NOT EXISTS classifications_tweet_id_unique
  ON public.classifications (tweet_id);