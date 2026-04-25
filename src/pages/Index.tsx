import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Radar, Shield, Sparkles, GitBranch, Inbox, ScrollText } from "lucide-react";

const Index = () => {
  const { session, loading } = useAuth();
  if (!loading && session) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full bg-gradient-primary opacity-[0.08] blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-accent opacity-10 blur-3xl" />

      {/* nav */}
      <header className="relative max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-gradient-primary shadow-glow flex items-center justify-center font-display font-bold text-primary-foreground">X</div>
          <div>
            <div className="font-display font-semibold leading-tight">XIM</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Intelligence Manager</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/auth"><Button size="sm">Get started <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur text-xs font-mono text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          MVP · human-approved automation
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-semibold leading-[1.05] tracking-tight max-w-4xl mx-auto">
          AI-assisted X intelligence,<br />
          <span className="text-gradient-primary">human-approved.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Monitor accounts, keywords, and concepts. Score every tweet for relevance, source quality, and risk.
          Generate drafts, route the important ones to review, never spam.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth"><Button size="lg" className="shadow-glow">Start free <ArrowRight className="w-4 h-4 ml-1.5" /></Button></Link>
          <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>
      </section>

      {/* features */}
      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Radar, title: "Source watchlists", desc: "Track curated accounts, keywords, concepts, and X-style queries with per-source priority." },
            { icon: GitBranch, title: "Hybrid classifier", desc: "Topic + source + actionability − risk. Only high-signal tweets become drafts." },
            { icon: Sparkles, title: "Persona drafting", desc: "Each connected account writes in its own tone, expertise, and reply style." },
            { icon: Inbox, title: "Approval queue", desc: "Approve, edit, schedule, or reject. Nothing gets posted without intent." },
            { icon: Shield, title: "Safety guardrails", desc: "No mass replies. No unsolicited mentions. Auto-reply is opt-in only." },
            { icon: ScrollText, title: "Full audit log", desc: "Every ingestion, classification, draft, and publish is traceable." },
          ].map((f) => (
            <div key={f.title} className="p-5 rounded-lg border border-border bg-card hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-md bg-gradient-primary/15 border border-primary/20 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>© XIM · v0.1</span>
          <span>Built on Lovable Cloud</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
