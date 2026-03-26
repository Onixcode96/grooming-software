import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Star, Shield, Heart, Sparkles, Share, MoreVertical, Smartphone, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";

import heroImage from "@/assets/hero-grooming.jpg";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { data: settings } = useSettings();
  

  const features = [
    { icon: Calendar, title: t("landing.smartBooking"), description: t("landing.smartBookingDesc") },
    { icon: Star, title: t("landing.premiumServices"), description: t("landing.premiumServicesDesc") },
    { icon: Shield, title: t("landing.securePetProfiles"), description: t("landing.securePetProfilesDesc") },
    { icon: Heart, title: t("landing.professionalCare"), description: t("landing.professionalCareDesc") },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle();
        if (data?.role === "admin") navigate("/admin-portal-onix", { replace: true });
        else navigate("/dashboard", { replace: true });
      } else setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <section className="relative gradient-hero">
        <div className="max-w-lg mx-auto px-5 pt-4 pb-4">
          {/* Language switcher on landing */}
          <div className="flex justify-end mb-2"><LanguageSwitcher /></div>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center">
            <motion.div variants={itemVariants} className="mb-1"><span className="text-3xl">🐾</span></motion.div>
            <motion.h1 variants={itemVariants} className="text-2xl font-bold font-heading text-foreground mb-1 leading-snug">{t("landing.heroTitle")}</motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-sm mb-5 leading-relaxed max-w-xs mx-auto italic">{t("landing.heroSubtitle")}</motion.p>
            <motion.div variants={itemVariants} className="flex gap-3 justify-center mb-4">
              <Link to="/auth">
                <Button variant="hero" size="lg" className="gap-2">
                  <Sparkles className="w-4 h-4" /> {t("landing.getStarted")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="max-w-xs mx-auto px-8 pb-6">
          <div className="rounded-[24px] overflow-hidden shadow-hover border border-border">
            <img src={heroImage} alt="Puppy during grooming session" className="w-full h-36 object-cover" loading="eager" />
          </div>
        </motion.div>
      </section>

      <section className="bg-secondary">
        <div className="max-w-lg mx-auto px-5 py-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold font-heading text-foreground">{t("landing.addToHomeScreen")}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="card-soft p-4 flex flex-col items-center text-center gap-3 border-2 border-primary/40">
                  <div className="w-10 h-10 rounded-soft bg-card flex items-center justify-center"><Share className="w-5 h-5 text-primary" /></div>
                  <h3 className="font-bold font-heading text-sm text-foreground">{t("landing.appleIos")}</h3>
                  <ol className="text-xs text-muted-foreground leading-relaxed text-left space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: `1. ${t("landing.tapShare")}` }} />
                    <li dangerouslySetInnerHTML={{ __html: `2. ${t("landing.addToHome")}` }} />
                  </ol>
                </div>
                <div className="card-soft p-4 flex flex-col items-center text-center gap-3 border-2 border-primary/40">
                  <div className="w-10 h-10 rounded-soft bg-card flex items-center justify-center"><MoreVertical className="w-5 h-5 text-primary" /></div>
                  <h3 className="font-bold font-heading text-sm text-foreground">{t("landing.android")}</h3>
                  <ol className="text-xs text-muted-foreground leading-relaxed text-left space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: `1. ${t("landing.tapMenu")}` }} />
                    <li dangerouslySetInnerHTML={{ __html: `2. ${t("landing.addToHome")}` }} />
                  </ol>
                </div>
                <div className="card-soft p-4 flex flex-col items-center text-center gap-3 border-2 border-primary/40 col-span-2 md:col-span-1">
                  <div className="w-10 h-10 rounded-soft bg-card flex items-center justify-center"><Monitor className="w-5 h-5 text-primary" /></div>
                  <h3 className="font-bold font-heading text-sm text-foreground">{t("landing.desktop")}</h3>
                  <ol className="text-xs text-muted-foreground leading-relaxed text-left space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: `1. ${t("landing.desktopInstall")}` }} />
                  </ol>
                </div>
              </div>
            </motion.div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <motion.div key={i} variants={itemVariants} className="card-soft p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-soft gradient-primary flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold font-heading text-sm text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="max-w-lg mx-auto px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-soft gradient-primary p-6 text-center">
          <h2 className="text-xl font-bold font-heading text-primary-foreground mb-2">{t("landing.readyForGrooming")}</h2>
          <p className="text-primary-foreground/80 text-sm mb-4">{t("landing.bookInSeconds")}</p>
          <Link to="/auth">
            <Button variant="outline" size="lg" className="bg-card text-foreground border-card hover:bg-card/90">{t("common.bookNow")}</Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;
