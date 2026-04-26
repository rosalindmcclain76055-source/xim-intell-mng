import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Shield, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/app/LanguageSwitcher";

const Index = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/app", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow" />
            <span className="font-display text-lg font-semibold">XIM</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="ghost" size="sm">{t("auth.signIn", "Sign in")}</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                {t("auth.getStarted", "Get started")}
                <ArrowRight className="ms-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {t("landing.badge", "X Intelligence Manager")}
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
            {t("landing.title", "Turn the X firehose into decisions")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            {t(
              "landing.subtitle",
              "Watch sources, classify intent, draft policy-aware replies — all under workspace control."
            )}
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg">
                {t("auth.getStarted", "Get started")}
                <ArrowRight className="ms-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/app">
              <Button size="lg" variant="outline">
                {t("landing.openApp", "Open app")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            { icon: Activity, title: t("landing.f1.title", "Live ingest"), desc: t("landing.f1.desc", "Accounts, keywords, concepts.") },
            { icon: Sparkles, title: t("landing.f2.title", "AI drafting"), desc: t("landing.f2.desc", "Persona-aware, on-demand.") },
            { icon: Shield, title: t("landing.f3.title", "Safe publishing"), desc: t("landing.f3.desc", "Risk ceilings & approvals.") },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
