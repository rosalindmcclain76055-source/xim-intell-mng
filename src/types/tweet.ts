export type Tweet = {
  id: string;
  workspace_id: string;
  text: string;
  source_handle?: string | null;
  hashtags?: string[] | null;
};
