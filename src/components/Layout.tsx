import { useRole } from "@/contexts/RoleContext";
import { useLocation, Link, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import { ArrowLeft, Settings, Info, LogOut } from "lucide-react";
import Footer from "./Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAdmin } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: t("auth.disconnected"), description: t("auth.disconnectedDesc") });
    navigate("/auth", { replace: true });
  };

  const pageTitles: Record<string, string> = {
    "/dashboard": t("nav.home"),
    "/booking": t("nav.book"),
    "/my-pets": t("pets.title"),
    "/services": t("nav.services"),
    "/chat": t("nav.chat"),
    "/payments": t("nav.payments"),
    "/admin-portal-onix": t("nav.dashboard"),
    "/admin-portal-onix/appointments": t("nav.agenda"),
    "/admin-portal-onix/clients": t("nav.clients"),
    "/admin-portal-onix/services": t("nav.services"),
    "/admin-portal-onix/settings": t("nav.settings"),
  };

  const homePath = isAdmin ? "/admin-portal-onix" : "/dashboard";
  const showBackButton = location.pathname !== homePath;
  const defaultTitle = settings?.business_name || "Pet Grooming";
  const title = pageTitles[location.pathname] || (location.pathname.startsWith("/pets/") ? "Pet Details" : location.pathname === "/salon-info" ? "Salon Info" : defaultTitle);
  const backTarget = location.pathname.startsWith("/pets/") ? "/my-pets" : homePath;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            {showBackButton && (
              location.pathname === "/booking" ? (
                <button onClick={() => window.history.back()} className="p-0.5">
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
              ) : (
                <Link to={backTarget}>
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </Link>
              )
            )}
            <h1 className="text-lg font-bold font-heading text-foreground">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAdmin && !location.pathname.endsWith("/settings") && (
              <Link to="/admin-portal-onix/settings">
                <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            )}
            {!isAdmin && location.pathname !== "/salon-info" && (
              <Link to="/salon-info">
                <Info className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            )}
            <button onClick={handleLogout} title={t("auth.disconnect")}>
              <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="max-w-lg mx-auto px-4 py-4"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <div><Footer /></div>
      <div><BottomNav /></div>
    </div>
  );
};

export default Layout;
