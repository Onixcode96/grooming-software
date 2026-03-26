import { useRole } from "@/contexts/RoleContext";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, MessageCircle, CreditCard, PawPrint, BarChart3, Users, Scissors } from "lucide-react";
import { motion } from "framer-motion";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const { role } = useRole();
  const location = useLocation();
  const { t } = useTranslation();
  const { unreadCount } = useUnreadMessages();

  const clientLinks = [
    { to: "/dashboard", icon: Home, label: t("nav.home") },
    { to: "/booking", icon: Calendar, label: t("nav.book") },
    { to: "/my-pets", icon: PawPrint, label: t("nav.pets") },
    { to: "/chat", icon: MessageCircle, label: t("nav.chat") },
    { to: "/payments", icon: CreditCard, label: t("nav.payments") },
  ];

  const adminLinks = [
    { to: "/admin-portal-onix", icon: BarChart3, label: t("nav.dashboard") },
    { to: "/admin-portal-onix/appointments", icon: Calendar, label: t("nav.agenda") },
    { to: "/admin-portal-onix/services", icon: Scissors, label: t("nav.services") },
    { to: "/chat", icon: MessageCircle, label: t("nav.chat") },
    { to: "/admin-portal-onix/clients", icon: Users, label: t("nav.clients") },
  ];

  const links = role === "admin" ? adminLinks : clientLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-soft">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          const showBadge = link.to === "/chat" && unreadCount > 0 && !isActive;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 rounded-soft transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-pill gradient-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative">
                <link.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                )}
              </div>
              <span className={`text-[10px] font-semibold font-heading transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
