import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Calendar, CalendarDays, Banknote, CreditCard, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type DbAppointment = { id: string; user_id: string; service_name: string; date: string; time: string; duration_minutes: number; price: number; status: string; animal_type: string; breed: string; payment_method: string; notes: string | null; };

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { dateFnsLocale, formatPrice, formatTime } = useLocale();
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const [monthRevenue, setMonthRevenue] = useState(0);

  const fetchData = async () => {
    const { data: todayAppts } = await supabase.from("appointments").select("*").eq("date", today).in("status", ["confirmed", "pending", "completed"]).order("time", { ascending: true });
    const { data: monthAppts } = await supabase.from("appointments").select("id, price, payment_method, status, date").gte("date", monthStart).in("status", ["confirmed", "pending", "completed"]);
    const allAppts = todayAppts || [];
    const monthData = monthAppts || [];
    const userIds = [...new Set(allAppts.map((a) => a.user_id))];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      const map: Record<string, string> = {};
      profilesData?.forEach((p) => { map[p.user_id] = p.display_name; });
      setProfiles(map);
    }
    setAppointments(allAppts);
    setMonthRevenue(monthData.filter((a) => a.status !== "cancelled").reduce((sum, a) => sum + Number(a.price), 0));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel("admin-dashboard-appointments").on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => { fetchData(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const todayCount = appointments.length;
  const todayRevenue = appointments.filter((a) => a.status !== "cancelled").reduce((sum, a) => sum + Number(a.price), 0);
  const nextAppointments = appointments.filter((a) => a.status !== "cancelled").slice(0, 5);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-extrabold font-heading text-foreground">{t("admin.greeting", { name: "Mariyam" })}</h2>
        <p className="text-muted-foreground text-sm mt-1">{format(new Date(), "EEEE d MMMM yyyy", { locale: dateFnsLocale })}</p>
      </motion.div>
      <motion.div variants={itemVariants} className="card-soft p-5 text-center">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3"><CalendarDays className="w-7 h-7 text-primary-foreground" /></div>
        <p className="text-5xl font-extrabold font-heading text-foreground">{todayCount}</p>
        <p className="text-sm font-semibold text-muted-foreground mt-1">{t("admin.bookingsToday")}</p>
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <div className="card-soft p-4">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center mb-2"><DollarSign className="w-4 h-4 text-primary-foreground" /></div>
          <p className="text-2xl font-extrabold font-heading text-foreground">{formatPrice(todayRevenue)}</p>
          <p className="text-[11px] text-muted-foreground font-semibold">{t("admin.revenueToday")}</p>
        </div>
        <div className="card-soft p-4">
          <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center mb-2"><TrendingUp className="w-4 h-4 text-primary-foreground" /></div>
          <p className="text-2xl font-extrabold font-heading text-foreground">{formatPrice(monthRevenue)}</p>
          <p className="text-[11px] text-muted-foreground font-semibold">{t("admin.revenueMonth")}</p>
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3"><h3 className="font-bold font-heading text-foreground">{t("admin.nextAppointments")}</h3></div>
        {nextAppointments.length === 0 ? (
          <div className="card-soft p-6 text-center"><p className="text-muted-foreground font-semibold">{t("admin.noAppointments")}</p></div>
        ) : (
          <div className="space-y-2">
            {nextAppointments.map((apt) => (
              <motion.div key={apt.id} variants={itemVariants} className="card-soft p-3 flex items-center gap-3">
                <div className="text-center min-w-[50px]">
                  <p className="text-sm font-bold font-heading text-foreground">{formatTime(apt.time?.slice(0, 5))}</p>
                  <p className="text-[10px] text-muted-foreground">{apt.duration_minutes} {t("common.min")}</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{apt.animal_type === "dog" ? "🐕" : apt.animal_type === "cat" ? "🐱" : "🐾"}</span>
                    <span className="font-bold font-heading text-sm text-foreground">{profiles[apt.user_id] || t("common.client")}</span>
                    {apt.status === "pending" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-pill bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">{t("admin.pending")}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{apt.service_name} · {apt.breed}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-primary text-sm">{formatPrice(apt.price)}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-secondary">
                    {apt.payment_method === "cash" ? <><Banknote className="w-3 h-3 text-primary" /> {t("payments.cash")}</> : apt.payment_method === "online" ? <><CreditCard className="w-3 h-3 text-accent" /> {t("payments.card")}</> : <span className="text-muted-foreground">{t("payments.pending")}</span>}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      <motion.div variants={itemVariants}>
        <Link to="/admin-portal-onix/appointments">
          <Button variant="hero" size="lg" className="w-full"><Calendar className="w-5 h-5 mr-2" />{t("admin.viewAgenda")}</Button>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
