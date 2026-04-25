import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/app/LanguageSwitcher";

export default function Auth() {
  const { signIn, signUp, session, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("signin");

  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");

  useEffect(() => {
    if (!loading && session) navigate("/app", { replace: true });
  }, [session, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(siEmail, siPass);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(t("auth.welcomeBack")); navigate("/app"); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suPass.length < 6) { toast.error(t("auth.passwordTooShort")); return; }
    setBusy(true);
    const { error } = await signUp(suEmail, suPass, suName);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(t("auth.accountCreated")); navigate("/app"); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-surface relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-accent opacity-15 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center font-display font-bold text-primary-foreground text-lg">
              X
            </div>
            <div>
              <div className="font-display font-semibold text-lg leading-tight">{t("brand.name")}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("brand.fullTagline")}</div>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="relative space-y-6 max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            {t("auth.heroTitle")}<br />
            <span className="text-gradient-primary">{t("auth.heroTitleAccent")}</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("auth.heroDesc")}
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              t("auth.features.personas"),
              t("auth.features.scoring"),
              t("auth.features.queue"),
              t("auth.features.audit"),
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />{f}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-muted-foreground font-mono">
          {t("auth.version")}
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md p-8 shadow-elev-md">
          <div className="lg:hidden flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md bg-gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground">X</div>
              <div className="font-display font-semibold">{t("brand.name")}</div>
            </div>
            <LanguageSwitcher />
          </div>
          <h1 className="font-display text-2xl font-semibold mb-1">{t("auth.title")}</h1>
          <p className="text-sm text-muted-foreground mb-6">{t("auth.subtitle")}</p>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 mb-5">
              <TabsTrigger value="signin">{t("common.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("common.signUp")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">{t("common.email")}</Label>
                  <Input id="si-email" type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pass">{t("common.password")}</Label>
                  <Input id="si-pass" type="password" required value={siPass} onChange={(e) => setSiPass(e.target.value)} dir="ltr" />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {t("common.signIn")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">{t("auth.displayName")}</Label>
                  <Input id="su-name" required value={suName} onChange={(e) => setSuName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">{t("common.email")}</Label>
                  <Input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">{t("common.password")}</Label>
                  <Input id="su-pass" type="password" required minLength={6} value={suPass} onChange={(e) => setSuPass(e.target.value)} dir="ltr" />
                  <p className="text-[11px] text-muted-foreground">{t("auth.passwordHint")}</p>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {t("common.signUp")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
