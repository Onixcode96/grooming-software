import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const PwaInstallBanner = () => {
  const { t } = useTranslation();
  const { shouldShowBanner, isPwaInstalled, isSupported, subscribe, permission } =
    usePushNotifications();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const raw = localStorage.getItem("pwa-banner-dismissed-until");
      if (!raw) return false;
      return Date.now() < Number(raw);
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);

  if (!shouldShowBanner || dismissed) return null;

  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem("pwa-banner-dismissed-until", String(Date.now() + sevenDays));
    } catch {
      // ignore
    }
  };

  const handleAction = async () => {
    if (!isPwaInstalled && isIos) {
      toast({
        title: t("pwa.installTitle"),
        description: t("pwa.iosInstructions"),
      });
      return;
    }

    if (!isPwaInstalled && !isIos) {
      const deferredPrompt = (window as any).__pwaInstallPrompt;
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        (window as any).__pwaInstallPrompt = null;
        if (outcome === "accepted") {
          toast({ title: t("pwa.installed"), description: t("pwa.activatingNotifications") });
          setLoading(true);
          const ok = await subscribe();
          setLoading(false);
          if (ok) {
            toast({ title: t("pwa.notificationsEnabled"), description: t("pwa.realTimeUpdates") });
          }
        }
        return;
      } else {
        setLoading(true);
        const ok = await subscribe();
        setLoading(false);
        if (ok) {
          toast({ title: t("pwa.notificationsEnabled"), description: t("pwa.realTimeUpdates") });
        } else if (permission === "denied") {
          toast({
            title: t("pwa.permissionDenied"),
            description: t("pwa.enableFromSettings"),
            variant: "destructive",
          });
        }
        return;
      }
    }

    if (isPwaInstalled && isSupported) {
      setLoading(true);
      const ok = await subscribe();
      setLoading(false);
      if (ok) {
        toast({ title: t("pwa.notificationsEnabled"), description: t("pwa.realTimeUpdates") });
      } else if (permission === "denied") {
        toast({
          title: t("pwa.permissionDenied"),
          description: t("pwa.enableFromSettings"),
          variant: "destructive",
        });
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className="card-soft p-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary transition-colors z-10"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-soft gradient-primary flex items-center justify-center shrink-0">
            {isPwaInstalled ? (
              <Bell className="w-5 h-5 text-primary-foreground" />
            ) : (
              <Download className="w-5 h-5 text-primary-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold font-heading text-foreground leading-tight">
              {isPwaInstalled ? t("pwa.enableNotificationsTitle") : t("pwa.stayUpdated")}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isPwaInstalled ? t("pwa.enableNotificationsDesc") : t("pwa.installDesc")}
            </p>

            <Button
              variant="hero"
              size="sm"
              className="mt-3 h-8 text-xs"
              onClick={handleAction}
              disabled={loading}
            >
              {loading ? (
                t("pwa.activating")
              ) : isPwaInstalled ? (
                <>
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  {t("pwa.enableNotificationsBtn")}
                </>
              ) : isIos ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                  {t("pwa.howToInstall")}
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {t("pwa.installApp")}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PwaInstallBanner;
