import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronLeft, ChevronRight, Banknote, CreditCard, Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendPushNotification } from "@/hooks/usePushNotifications";
import { format, addDays, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type DbAppointment = { id: string; user_id: string; service_name: string; date: string; time: string; duration_minutes: number; price: number; status: string; animal_type: string; breed: string; payment_method: string; notes: string | null; };

const NegotiatePopover = ({ apt, loading, disabled, onSend, t }: { apt: DbAppointment; loading: boolean; disabled: boolean; onSend: (msg: string) => void; t: any }) => {
  const [open, setOpen] = useState(false);
  const defaultMsg = t("admin.negotiateDefaultMsg");
  const [msg, setMsg] = useState(defaultMsg);
  const handleSend = async () => { await onSend(msg); setOpen(false); setMsg(defaultMsg); };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs rounded-xl w-full sm:w-auto" disabled={disabled}>
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> {t("admin.alternative")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 rounded-xl" side="bottom" align="end">
        <p className="text-xs font-semibold text-foreground mb-2">{t("admin.messageToClient")}</p>
        <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="text-xs min-h-[80px] mb-3 rounded-lg" rows={3} />
        <Button size="sm" className="w-full h-8 text-xs rounded-xl" onClick={handleSend} disabled={loading || !msg.trim()}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />} {t("admin.sendInChat")}
        </Button>
      </PopoverContent>
    </Popover>
  );
};

const AdminAppointments = () => {
  const { t } = useTranslation();
  const { dateFnsLocale, formatPrice, formatTime } = useLocale();
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [view, setView] = useState<"day" | "week">("day");
  const [currentDate, setCurrentDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const STATUS_CONFIG: Record<string, { label: string; color: string; borderColor: string }> = {
    pending: { label: t("admin.pending"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", borderColor: "border-l-amber-400" },
    confirmed: { label: t("admin.confirmed"), color: "bg-accent/10 text-accent", borderColor: "border-l-accent" },
    rejected: { label: t("admin.rejected"), color: "bg-destructive/10 text-destructive", borderColor: "border-l-destructive" },
    negotiating: { label: t("admin.negotiating"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", borderColor: "border-l-blue-400" },
    cancelled: { label: t("admin.cancelled"), color: "bg-muted text-muted-foreground", borderColor: "border-l-muted-foreground" },
    completed: { label: t("admin.completed"), color: "bg-accent/10 text-accent", borderColor: "border-l-accent" },
  };

  const fetchAppointments = async () => {
    let query = supabase.from("appointments").select("*").order("time", { ascending: true });
    if (view === "day") query = query.eq("date", currentDate);
    else { const weekEnd = format(addDays(new Date(currentDate), 6), "yyyy-MM-dd"); query = query.gte("date", currentDate).lte("date", weekEnd); }
    const { data } = await query;
    const appts = data || [];
    setAppointments(appts);
    const userIds = [...new Set(appts.map((a) => a.user_id))];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      const map: Record<string, string> = {};
      profilesData?.forEach((p) => { map[p.user_id] = p.display_name; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
    const channel = supabase.channel("admin-calendar").on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => { fetchAppointments(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentDate, view]);

  const sendChatMessage = async (userId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: userId, content });
  };

  const optimisticUpdateStatus = (aptId: string, newStatus: string) => {
    setAppointments((prev) => prev.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a)));
  };

  const handleConfirm = async (apt: DbAppointment) => {
    const prev = apt.status; optimisticUpdateStatus(apt.id, "confirmed"); setActionLoading(`${apt.id}-confirm`);
    const { error } = await supabase.from("appointments").update({ status: "confirmed" }).eq("id", apt.id);
    if (error) { optimisticUpdateStatus(apt.id, prev); toast({ title: t("common.error"), description: error.message, variant: "destructive" }); }
    else { await sendChatMessage(apt.user_id, "@@i18n:chatAuto.bookingConfirmed"); sendPushNotification(apt.user_id, t("chatAuto.pushConfirmTitle"), t("chatAuto.pushConfirmBody", { service: apt.service_name }), "/dashboard"); toast({ title: t("admin.confirmedNotif"), description: t("admin.clientNotified") }); }
    setActionLoading(null);
  };

  const handleReject = async (apt: DbAppointment) => {
    const prev = apt.status; optimisticUpdateStatus(apt.id, "rejected"); setActionLoading(`${apt.id}-reject`);
    const { error } = await supabase.from("appointments").update({ status: "rejected" }).eq("id", apt.id);
    if (error) { optimisticUpdateStatus(apt.id, prev); toast({ title: t("common.error"), description: error.message, variant: "destructive" }); }
    else { await sendChatMessage(apt.user_id, "@@i18n:chatAuto.bookingRejected"); toast({ title: t("admin.rejected"), description: t("admin.clientNotified") }); }
    setActionLoading(null);
  };

  const handleNegotiate = async (apt: DbAppointment, customMessage: string) => {
    const prev = apt.status; optimisticUpdateStatus(apt.id, "negotiating"); setActionLoading(`${apt.id}-negotiate`);
    const { error } = await supabase.from("appointments").update({ status: "negotiating" }).eq("id", apt.id);
    if (error) { optimisticUpdateStatus(apt.id, prev); toast({ title: t("common.error"), description: error.message, variant: "destructive" }); }
    else { await sendChatMessage(apt.user_id, customMessage); toast({ title: t("admin.negotiating"), description: t("admin.clientNotified") }); }
    setActionLoading(null);
  };

  const hours = Array.from({ length: 10 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button variant={view === "day" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setView("day")}>{t("admin.day")}</Button>
          <Button variant={view === "week" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setView("week")}>{t("admin.week")}</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(format(subDays(new Date(currentDate), 1), "yyyy-MM-dd"))}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-bold font-heading text-foreground min-w-[110px] text-center capitalize">{format(new Date(currentDate), "EEE d MMM", { locale: dateFnsLocale })}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(format(addDays(new Date(currentDate), 1), "yyyy-MM-dd"))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-0">
        {hours.map((hour) => {
          const hourAppts = appointments.filter((a) => a.time?.startsWith(hour.split(":")[0]));
          return (
            <div key={hour} className="flex gap-3">
              <span className="text-[11px] font-semibold text-muted-foreground/60 w-12 pt-2 text-right shrink-0">{formatTime(hour)}</span>
              <div className="flex-1 min-h-[48px] border-t border-border/40 pt-1">
                {hourAppts.map((apt) => {
                  const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                  const confirmLoading = actionLoading === `${apt.id}-confirm`;
                  const rejectLoading = actionLoading === `${apt.id}-reject`;
                  const negotiateLoading = actionLoading === `${apt.id}-negotiate`;
                  return (
                    <motion.div key={apt.id} layout className={`card-soft p-4 mb-2 border-l-4 ${statusCfg.borderColor}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">{apt.animal_type === "dog" ? "🐕" : apt.animal_type === "cat" ? "🐱" : "🐾"}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold font-heading text-sm text-foreground truncate">{profiles[apt.user_id] || t("common.client")}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-pill shrink-0 ${statusCfg.color}`}>{statusCfg.label}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{formatTime(apt.time?.slice(0, 5))} · {apt.duration_minutes}{t("common.min")} · {apt.breed}</p>
                          </div>
                        </div>
                        <span className="font-bold text-primary text-sm shrink-0">{formatPrice(apt.price)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-muted-foreground truncate">{apt.service_name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-secondary shrink-0">
                          {apt.payment_method === "cash" ? <><Banknote className="w-3 h-3 text-primary" /> {t("payments.cash")}</> : apt.payment_method === "online" ? <><CreditCard className="w-3 h-3 text-accent" /> {t("payments.card")}</> : <span className="text-muted-foreground">—</span>}
                        </span>
                      </div>
                      {(apt.status === "pending" || apt.status === "negotiating") && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-border">
                          <Button variant="success" size="sm" className="h-8 px-3 text-xs rounded-xl w-full sm:w-auto" onClick={() => handleConfirm(apt)} disabled={!!actionLoading}>
                            {confirmLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />} {t("common.confirm")}
                          </Button>
                          <Button variant="destructive" size="sm" className="h-8 px-3 text-xs rounded-xl w-full sm:w-auto" onClick={() => handleReject(apt)} disabled={!!actionLoading}>
                            {rejectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />} {t("admin.rejected")}
                          </Button>
                          {apt.status === "pending" && <NegotiatePopover apt={apt} loading={negotiateLoading} disabled={!!actionLoading} onSend={(msg) => handleNegotiate(apt, msg)} t={t} />}
                        </div>
                      )}
                      {apt.notes && <p className="text-[11px] text-muted-foreground mt-2 italic">📝 {apt.notes}</p>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default AdminAppointments;
