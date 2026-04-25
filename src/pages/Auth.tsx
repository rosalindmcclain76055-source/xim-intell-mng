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

export default function Auth() {
  const { signIn, signUp, session, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("signin");

  // signin
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  // signup
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
    else { toast.success("Welcome back"); navigate("/app"); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    const { error } = await signUp(suEmail, suPass, suName);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created"); navigate("/app"); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: marketing panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-surface relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-accent opacity-15 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center font-display font-bold text-primary-foreground text-lg">
              X
            </div>
            <div>
              <div className="font-display font-semibold text-lg leading-tight">XIM</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Intelligence Manager</div>
            </div>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            AI-assisted X intelligence,<br />
            <span className="text-gradient-primary">human-approved.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Monitor selected accounts and topics. Score every tweet for relevance, source quality, and risk.
            Generate drafts, route the important ones to review, and keep a complete audit trail.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              "Multi-account personas",
              "Topic + risk scoring",
              "Approval queue",
              "Full audit log",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />{f}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-muted-foreground font-mono">
          v0.1 · MVP · no autonomous reply
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md p-8 shadow-elev-md">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-md bg-gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground">X</div>
            <div className="font-display font-semibold">XIM</div>
          </div>
          <h1 className="font-display text-2xl font-semibold mb-1">Sign in to XIM</h1>
          <p className="text-sm text-muted-foreground mb-6">Manage your X intelligence workspace.</p>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 mb-5">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pass">Password</Label>
                  <Input id="si-pass" type="password" required value={siPass} onChange={(e) => setSiPass(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Display name</Label>
                  <Input id="su-name" required value={suName} onChange={(e) => setSuName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">Password</Label>
                  <Input id="su-pass" type="password" required minLength={6} value={suPass} onChange={(e) => setSuPass(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">Min 6 characters. A workspace is created automatically.</p>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
