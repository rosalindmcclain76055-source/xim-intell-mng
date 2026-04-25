import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Radar, Shield, Sparkles, GitBranch, Inbox, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/app/LanguageSwitcher";

const Index = () => {
  const { session, loading } = useAuth();
  const { t } = useTranslation();
  if (!loading && session) return <Navigate to="/app" replace />;

  const features = [
    { icon: Radar, key: "sources" },
    { icon: GitBranch, key: "classifier" },
    { icon: Sparkles, key: "personas" },
    { icon: Inbox, key: "queue" },
    { icon: Shield, key: "safety" },
    { icon: ScrollText, key: "audit" },
  ] as const;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full bg-gradient-primary opacity-[0.08] blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-accent opacity-10 blur-3xl" />

      <header className="relative max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-gradient-primary shadow-glow flex items-center justify-center font-display font-bold text-primary-foreground">X</div>
          <div>
            <div className="font-display font-semibold leading-tight">{t("brand.name")}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("brand.fullTagline")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link to="/auth"><Button variant="ghost" size="sm">{t("common.signIn")}</Button></Link>
          <Link to="/auth"><Button size="sm">{t("common.getStarted")} <ArrowRight className="w-3.5 h-3.5 ml-1 rtl:rotate-180" /></Button></Link>
        </div>
      </header>

      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur text-xs font-mono text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {t("landing.badge")}
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-semibold leading-[1.05] tracking-tight max-w-4xl mx-auto">
          {t("auth.heroTitle")}<br />
          <span className="text-gradient-primary">{t("auth.heroTitleAccent")}</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("landing.heroDesc")}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth"><Button size="lg" className="shadow-glow">{t("landing.startFree")} <ArrowRight className="w-4 h-4 ml-1.5 rtl:rotate-180" /></Button></Link>
          <Link to="/auth"><Button size="lg" variant="outline">{t("common.signIn")}</Button></Link>
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.key} className="p-5 rounded-lg border border-border bg-card hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-md bg-gradient-primary/15 border border-primary/20 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-1">{t(`landing.features.${f.key}.title`)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`landing.features.${f.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>{t("landing.footer")}</span>
          <span>{t("landing.builtOn")}</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
