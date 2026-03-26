import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Star, Gift, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SendDiscountDialog from "@/components/admin/SendDiscountDialog";
import { useTranslation } from "react-i18next";

interface Client { user_id: string; display_name: string; avatar_url: string | null; visits: number; lastVisit: string | null; }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminClients = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountClient, setDiscountClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const { data: adminId } = await supabase.rpc("get_admin_user_id");
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url");
      if (!profiles) { setLoading(false); return; }
      const { data: appointments } = await supabase.from("appointments").select("user_id, date, status").order("date", { ascending: false });
      const clientList: Client[] = profiles.filter((p) => p.user_id !== adminId).map((p) => {
        const userAppts = (appointments || []).filter((a) => a.user_id === p.user_id && ["confirmed", "completed"].includes(a.status));
        return { user_id: p.user_id, display_name: p.display_name, avatar_url: p.avatar_url, visits: userAppts.length, lastVisit: userAppts.length > 0 ? userAppts[0].date : null };
      });
      clientList.sort((a, b) => b.visits - a.visits);
      setClients(clientList);
      setLoading(false);
    };
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => c.display_name.toLowerCase().includes(search.toLowerCase()));
  const loyalCount = clients.filter((c) => c.visits > 3).length;

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.searchClient")} className="w-full bg-card border border-border rounded-pill pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none" />
      </motion.div>
      <motion.div variants={itemVariants} className="flex gap-2">
        <div className="card-soft p-3 flex-1 text-center">
          <p className="text-xl font-extrabold font-heading text-foreground">{clients.length}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">{t("admin.total")}</p>
        </div>
        <div className="card-soft p-3 flex-1 text-center">
          <p className="text-xl font-extrabold font-heading text-primary">{loyalCount}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">{t("admin.regulars")}</p>
        </div>
      </motion.div>
      <div className="space-y-2">
        {filtered.map((client) => (
          <motion.div key={client.user_id} variants={itemVariants} className="card-soft p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-heading text-foreground">{client.display_name}</h3>
                {client.visits > 3 && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary px-2 py-0.5 rounded-pill bg-primary/10"><Star className="w-3 h-3 fill-primary" /> {t("admin.regulars").replace("⭐ ", "")}</span>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-heading text-foreground">{client.visits}</p>
                <p className="text-[10px] text-muted-foreground">{t("admin.visits")}</p>
              </div>
            </div>
            {client.lastVisit && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
                <Calendar className="w-3 h-3" /> {t("admin.lastVisitLabel")}: {client.lastVisit}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="hero" size="sm" className="text-[11px] h-7" onClick={() => setDiscountClient(client)}>
                <Gift className="w-3 h-3 mr-1" /> {t("admin.sendDiscount")}
              </Button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">{t("admin.noClients")}</p>}
      </div>
      <SendDiscountDialog open={!!discountClient} onOpenChange={(open) => !open && setDiscountClient(null)} client={discountClient} />
    </motion.div>
  );
};

export default AdminClients;
