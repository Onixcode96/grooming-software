import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { PawPrint, Mail, Lock, User, LogOut } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrivacyContent } from "@/components/PrivacyContent";
import type { User as SupaUser, Session } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const AuthPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isAdminFlow = searchParams.get("admin") === "true";
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupaUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, roleLoading } = useRole();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setCheckingSession(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setCheckingSession(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    setLoading(false);
    toast({ title: t("auth.disconnected"), description: t("auth.disconnectedDesc") });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: t("common.error"), description: t("auth.fillAllFields"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({
        title: t("auth.loginError"),
        description: error.message === "Invalid login credentials" ? t("auth.invalidCredentials") : error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: t("common.error"), description: t("auth.fillAllFields"), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t("common.error"), description: t("auth.passwordMinLength"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) {
        toast({ title: t("common.error"), description: t("auth.alreadyRegistered"), variant: "destructive" });
      } else {
        toast({ title: t("auth.signupError"), description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: t("auth.signupSuccess"), description: t("auth.signupSuccessDesc") });
      setIsLogin(true);
    }
  };

  const openPrivacy = (e: React.MouseEvent) => { e.preventDefault(); setPrivacyOpen(true); };

  useEffect(() => {
    if (!checkingSession && currentUser && !roleLoading) {
      const destination = isAdmin ? "/admin-portal-onix" : "/dashboard";
      navigate(destination, { replace: true });
    }
  }, [checkingSession, currentUser, roleLoading, isAdmin, navigate]);

  if (checkingSession || (currentUser && roleLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-soft border-border">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-end"><LanguageSwitcher /></div>
            <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-2">
              <PawPrint className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-heading">
              {isAdminFlow ? t("auth.adminLogin") : isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
            </CardTitle>
            <CardDescription>
              {isAdminFlow ? t("auth.adminLoginDesc") : isLogin ? t("auth.loginDesc") : t("auth.signupDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
              {!isLogin && !isAdminFlow && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t("auth.name")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="displayName" type="text" placeholder={t("auth.yourName")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder={t("auth.minChars")} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
                </div>
              </div>
              {!isLogin && !isAdminFlow && (
                <div className="flex items-start gap-2 mt-2">
                  <Checkbox id="privacy" checked={acceptedPrivacy} onCheckedChange={(v) => setAcceptedPrivacy(v === true)} className="mt-0.5" />
                  <label htmlFor="privacy" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                    {t("auth.privacyAccept")}{" "}
                    <a href="#" onClick={openPrivacy} className="text-primary underline">{t("common.privacyPolicy")}</a>{" "}
                    {t("auth.andThe")} {t("common.termsOfService")}
                  </label>
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading || (!isLogin && !isAdminFlow && !acceptedPrivacy)}>
                {loading ? t("common.loading") : isLogin ? t("auth.login") : t("auth.signup")}
              </Button>
            </form>
            {!isLogin && !isAdminFlow && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                {t("auth.signingUp")}{" "}
                <a href="#" onClick={openPrivacy} className="text-primary underline">{t("common.privacyPolicy")}</a>
              </p>
            )}
            {!isAdminFlow && (
              <div className="mt-6 text-center">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Sheet open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="text-base font-heading">{t("common.privacyPolicy")}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-5 py-4"><PrivacyContent /></ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AuthPage;
