import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, PawPrint, MessageCircle, Clock, Bell, Scissors } from "lucide-react";
import { usePets } from "@/hooks/usePets";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { Skeleton } from "@/components/ui/skeleton";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface NextAppointment {
  id: string;
  service_name: string;
  animal_type: string;
  date: string;
  time: string;
  duration_minutes: number;
  price: number;
  status: string;
}

const ClientDashboard = () => {
  const { t } = useTranslation();
  const { dateFnsLocale, formatPrice, formatTime } = useLocale();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const [nextAppt, setNextAppt] = useState<NextAppointment | null>(null);
  const [apptLoading, setApptLoading] = useState(true);
  const { data: pets = [] } = usePets();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setApptLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.display_name) setDisplayName(profile.display_name);

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, service_name, animal_type, date, time, duration_minutes, price, status")
        .eq("user_id", user.id)
        .in("status", ["confirmed", "pending"])
        .gte("date", today)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(1);

      setNextAppt(appts && appts.length > 0 ? appts[0] : null);
      setApptLoading(false);
    };
    fetchData();
  }, []);

  const formatApptDate = (dateStr: string, timeStr: string) => {
    const date = parseISO(dateStr);
    const time = formatTime(timeStr.slice(0, 5));
    if (isToday(date)) return t("dashboard.today", { time });
    if (isTomorrow(date)) return t("dashboard.tomorrow", { time });
    return `${format(date, "EEE, MMM d", { locale: dateFnsLocale })} ${t("common.at")} ${time}`;
  };

  const getAnimalEmoji = (type: string) => {
    if (type === "dog") return "🐕";
    if (type === "cat") return "🐱";
    return "🐾";
  };

  const quickActions = [
    { to: "/booking", icon: Calendar, label: t("nav.book"), color: "gradient-primary" },
    { to: "/my-pets", icon: PawPrint, label: t("nav.pets"), color: "gradient-accent" },
    { to: "/services", icon: Scissors, label: t("nav.services"), color: "gradient-primary" },
    { to: "/chat", icon: MessageCircle, label: t("dashboard.messages"), color: "gradient-accent" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-extrabold font-heading text-foreground">
          {t("dashboard.greeting", { name: displayName || "there" })}
        </h2>
        {isLoadingSettings ? (
          <Skeleton className="h-4 w-48 mt-2" />
        ) : settings?.tagline ? (
          <p className="text-sm mt-1 italic font-heading text-primary/80 tracking-wide">{settings.tagline}</p>
        ) : null}
      </motion.div>

      <motion.div variants={itemVariants}><PwaInstallBanner /></motion.div>

      <motion.div variants={itemVariants}>
        {apptLoading ? (
          <div className="card-soft p-4 space-y-3">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-soft" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </div>
        ) : nextAppt ? (
          <div className="card-soft p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold font-heading text-primary uppercase tracking-wide">
                {t("dashboard.nextAppointment")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-soft gradient-primary flex items-center justify-center text-2xl">
                {getAnimalEmoji(nextAppt.animal_type)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold font-heading text-foreground">{nextAppt.service_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatApptDate(nextAppt.date, nextAppt.time)} · {nextAppt.duration_minutes} {t("common.mins")}
                </p>
              </div>
              <span className="text-lg font-bold text-primary">{formatPrice(nextAppt.price)}</span>
            </div>
          </div>
        ) : (
          <div className="card-soft p-5 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-soft bg-secondary flex items-center justify-center text-2xl">📅</div>
            <p className="text-sm font-semibold font-heading text-muted-foreground">{t("dashboard.noUpcoming")}</p>
            <Link to="/booking"><Button variant="soft" size="sm">{t("common.bookNow")}</Button></Link>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="font-bold font-heading text-foreground mb-3">{t("dashboard.quickActions")}</h3>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to}>
              <motion.div whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-1.5 p-3 rounded-soft bg-card border border-border hover:shadow-soft transition-all">
                <div className={`w-10 h-10 rounded-soft ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-semibold font-heading text-foreground text-center">{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card-soft p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-soft bg-accent/30 flex items-center justify-center">
          <Bell className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold font-heading text-foreground">{t("dashboard.reminder")}</p>
          <p className="text-xs text-muted-foreground">{t("dashboard.reminderText")}</p>
        </div>
        <Link to="/booking"><Button variant="soft" size="sm">{t("common.book")}</Button></Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold font-heading text-foreground">{t("dashboard.myPets")}</h3>
          <Link to="/my-pets" className="text-xs font-semibold text-primary">{t("dashboard.seeAll")}</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {pets.map((pet) => (
            <Link key={pet.id} to={`/pets/${pet.id}`}>
              <motion.div whileTap={{ scale: 0.97 }} className="card-soft p-3 min-w-[120px] flex flex-col items-center gap-2">
                <span className="text-3xl">{pet.photo}</span>
                <h4 className="font-bold font-heading text-sm text-foreground">{pet.name}</h4>
                <p className="text-[10px] text-muted-foreground">{pet.breed}</p>
              </motion.div>
            </Link>
          ))}
          <Link to="/my-pets">
            <div className="card-soft p-3 min-w-[120px] flex flex-col items-center justify-center gap-2 border-dashed">
              <span className="text-2xl text-muted-foreground">+</span>
              <span className="text-[10px] font-semibold text-muted-foreground">{t("common.add")}</span>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClientDashboard;
