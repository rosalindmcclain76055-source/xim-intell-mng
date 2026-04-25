import { supabase } from "@/integrations/supabase/client";

const PERSONAS = [
  { name: "Crypto Analyst", tone: "analytical, data-driven", expertise_domain: "DeFi, on-chain analytics, market structure", reply_style: "concise, cite numbers", risk_tolerance: "low", description: "Senior crypto market analyst." },
  { name: "SaaS Operator", tone: "pragmatic, growth-focused", expertise_domain: "B2B SaaS, PLG, retention", reply_style: "actionable, no fluff", risk_tolerance: "medium", description: "Operator's perspective on SaaS." },
  { name: "AI Researcher", tone: "curious, technical", expertise_domain: "LLMs, evaluations, agents", reply_style: "ask sharp questions", risk_tolerance: "low", description: "Independent AI researcher." },
];

const ACCOUNTS = [
  { handle: "cryptoanalyst", display_name: "Crypto Analyst", expertise_tags: ["defi", "onchain", "macro"], bio: "On-chain & macro analysis." },
  { handle: "saas_ops", display_name: "SaaS Ops Daily", expertise_tags: ["saas", "growth", "plg"], bio: "Tactical SaaS operator." },
  { handle: "ai_research", display_name: "AI Research", expertise_tags: ["ai", "llm", "agents"], bio: "Frontier AI commentary." },
];

const SOURCES = [
  { source_type: "account" as const, source_value: "VitalikButerin", label: "Vitalik Buterin", priority: 95 },
  { source_type: "account" as const, source_value: "balajis", label: "Balaji", priority: 88 },
  { source_type: "account" as const, source_value: "naval", label: "Naval", priority: 80 },
  { source_type: "keyword" as const, source_value: "stablecoin depeg", label: "Stablecoin risk", priority: 90 },
  { source_type: "keyword" as const, source_value: "agent framework", label: "AI agents", priority: 75 },
  { source_type: "concept" as const, source_value: "B2B SaaS retention benchmarks", label: "Retention", priority: 70 },
  { source_type: "query" as const, source_value: "from:OpenAI gpt", label: "OpenAI launches", priority: 85 },
];

const TWEETS = [
  { handle: "VitalikButerin", display: "Vitalik Buterin", text: "L2 fees are now ~100x cheaper than mainnet. The real bottleneck for adoption has shifted from cost to UX — wallets, account abstraction, and recovery flows.", topic: 88, source: 95, action: 80, risk: 10, decision: "draft_reply" as const, kw: ["L2", "account abstraction"] },
  { handle: "balajis", display: "Balaji", text: "Stablecoin volume just crossed $1.5T monthly. This is now larger than Visa in some corridors. The dollarization of the internet is happening quietly.", topic: 92, source: 88, action: 75, risk: 15, decision: "draft_quote" as const, kw: ["stablecoin"] },
  { handle: "OpenAI", display: "OpenAI", text: "We're rolling out a new agent framework with native tool-calling, persistent memory, and structured outputs. Starts in beta today.", topic: 95, source: 90, action: 88, risk: 8, decision: "draft_reply" as const, kw: ["agent framework"] },
  { handle: "naval", display: "Naval", text: "Distribution is the only moat. Product-market fit gets you in the game; distribution decides who wins.", topic: 70, source: 80, action: 60, risk: 20, decision: "review" as const, kw: ["distribution"] },
  { handle: "random_user", display: "Random User", text: "buy $XYZ now, going 100x this week 🚀🚀🚀", topic: 5, source: 10, action: 20, risk: 95, decision: "ignore" as const, kw: [] },
  { handle: "saas_founder", display: "SaaS Founder", text: "Net revenue retention dropped from 118% to 102% this quarter. Anyone seen similar in mid-market B2B post-2023?", topic: 90, source: 65, action: 92, risk: 10, decision: "draft_reply" as const, kw: ["retention", "NRR"] },
  { handle: "ml_eng", display: "ML Engineer", text: "Evaluating agents is still mostly vibes. We need standardized benchmarks for tool-use and long-horizon tasks.", topic: 85, source: 60, action: 80, risk: 12, decision: "draft_post" as const, kw: ["agent", "evaluation"] },
  { handle: "crypto_news", display: "Crypto News", text: "Major exchange reports unusual outflows; community concerned about solvency. Reserves dashboard down for maintenance.", topic: 80, source: 50, action: 70, risk: 70, decision: "review" as const, kw: ["solvency"] },
  { handle: "indie_hacker", display: "Indie Hacker", text: "Hit $10K MRR with no funding, no team, no ads. Just SEO + a tiny niche. AMA.", topic: 75, source: 55, action: 78, risk: 15, decision: "draft_reply" as const, kw: ["MRR", "indie"] },
  { handle: "spam_bot", display: "Bot", text: "Check my profile for free crypto signals!! DM me", topic: 2, source: 5, action: 10, risk: 98, decision: "ignore" as const, kw: [] },
  { handle: "tech_journalist", display: "Tech Journalist", text: "Sources tell me a major LLM provider will announce on-device inference for consumer devices next month.", topic: 88, source: 75, action: 70, risk: 25, decision: "draft_quote" as const, kw: ["LLM", "on-device"] },
  { handle: "vc_partner", display: "VC Partner", text: "Seeing a wave of AI-native CRMs. Most are wrappers. The ones that win will rebuild the data model from scratch.", topic: 82, source: 78, action: 75, risk: 18, decision: "draft_reply" as const, kw: ["AI", "CRM"] },
];

const DRAFT_SAMPLES = [
  "Strong point — and I'd add that wallet UX is the next 10x unlock. Without good recovery + session keys, even free txs won't drive mainstream adoption.",
  "The corridor data is wild. The interesting follow-up: how much of that volume is real commerce vs. internal exchange settlement? Anyone seen a clean breakdown?",
  "Excited to dig into this. Two questions: (1) how does state persist across sessions? (2) any benchmarks vs. open agent frameworks like LangGraph?",
  "Seeing the same — NRR compression in mid-market is mostly seat-based pricing colliding with hiring freezes. Usage-based tiers seem to recover ~5–8 pts on average.",
  "Agreed. Building an open eval harness for tool-use chains. The tricky part isn't single-step accuracy, it's compounding error over 10+ steps.",
  "Distribution > product is half-true. The deeper truth: distribution shapes which products are even buildable. The channel is the constraint.",
];

export async function seedWorkspace(workspaceId: string) {
  // wipe existing seed data first (idempotent demo)
  await supabase.from("drafts").delete().eq("workspace_id", workspaceId);
  await supabase.from("classifications").delete().eq("workspace_id", workspaceId);
  await supabase.from("tweets").delete().eq("workspace_id", workspaceId);
  await supabase.from("watch_sources").delete().eq("workspace_id", workspaceId);
  await supabase.from("connected_accounts").delete().eq("workspace_id", workspaceId);
  await supabase.from("persona_profiles").delete().eq("workspace_id", workspaceId);
  await supabase.from("audit_logs").delete().eq("workspace_id", workspaceId);

  // personas
  const { data: personas } = await supabase
    .from("persona_profiles")
    .insert(PERSONAS.map((p) => ({ ...p, workspace_id: workspaceId })))
    .select();

  // accounts
  await supabase.from("connected_accounts").insert(
    ACCOUNTS.map((a, i) => ({
      ...a,
      workspace_id: workspaceId,
      persona_profile_id: personas?.[i]?.id ?? null,
      enabled: true,
      auto_reply_enabled: false,
    }))
  );

  // sources
  await supabase
    .from("watch_sources")
    .insert(SOURCES.map((s) => ({ ...s, workspace_id: workspaceId, enabled: true })));

  // tweets + classifications + drafts
  const now = Date.now();
  const tweetRows = TWEETS.map((t, i) => ({
    workspace_id: workspaceId,
    tweet_id: `seed_${now}_${i}`,
    source_handle: t.handle,
    source_display_name: t.display,
    text: t.text,
    lang: "en",
    hashtags: [],
    mentions: [],
    links: [],
    ingested_at: new Date(now - i * 1000 * 60 * 17).toISOString(),
  }));
  const { data: tweets } = await supabase.from("tweets").insert(tweetRows).select();
  if (!tweets) return;

  const classRows = tweets.map((tw, i) => ({
    workspace_id: workspaceId,
    tweet_id: tw.id,
    topic_score: TWEETS[i].topic,
    source_score: TWEETS[i].source,
    actionability_score: TWEETS[i].action,
    risk_score: TWEETS[i].risk,
    final_decision: TWEETS[i].decision,
    matched_keywords: TWEETS[i].kw,
    reasoning:
      TWEETS[i].decision === "ignore"
        ? "Low topic + high risk → ignore"
        : TWEETS[i].decision === "review"
        ? "Mixed signals — manual review"
        : "High topic + low risk → draft",
    model_version: "v1",
  }));
  await supabase.from("classifications").insert(classRows);

  const draftRows = tweets
    .map((tw, i) => {
      const d = TWEETS[i].decision;
      if (d === "ignore" || d === "review") return null;
      const action: "reply" | "quote" | "post" =
        d === "draft_reply" ? "reply" : d === "draft_quote" ? "quote" : "post";
      const status =
        i % 5 === 0 ? "approved" : i % 7 === 0 ? "published" : "pending";
      return {
        workspace_id: workspaceId,
        tweet_id: tw.id,
        action_type: action,
        draft_text: DRAFT_SAMPLES[i % DRAFT_SAMPLES.length],
        status,
        published_at: status === "published" ? new Date(now - i * 60000).toISOString() : null,
      };
    })
    .filter(Boolean) as any[];
  if (draftRows.length) await supabase.from("drafts").insert(draftRows);

  // audit logs
  await supabase.from("audit_logs").insert([
    { workspace_id: workspaceId, event_type: "seed.loaded", entity_type: "workspace", summary: "Demo data seeded", metadata: { tweets: tweets.length } },
    { workspace_id: workspaceId, event_type: "ingestion.batch", entity_type: "tweets", summary: `Ingested ${tweets.length} tweets from watchlist` },
    { workspace_id: workspaceId, event_type: "classifier.run", entity_type: "classifications", summary: `Classified ${tweets.length} tweets (model v1)` },
  ]);
}
