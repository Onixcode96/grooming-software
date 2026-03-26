import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Banknote, CheckCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

type Appointment = {
  id: string;
  service_name: string;
  date: string;
  price: number;
  payment_method: string;
  status: string;
  animal_type: string;
  breed: string;
  is_paid: boolean;
};

const PaymentsPage = () => {
  const { t } = useTranslation();
  const { formatPrice, dateFnsLocale } = useLocale();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, service_name, date, price, payment_method, status, animal_type, breed, is_paid")
        .order("date", { ascending: false });
      setAppointments(data || []);
      setLoading(false);
    };
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={itemVariants}>
        <h3 className="font-bold font-heading text-foreground mb-3">{t("payments.title")}</h3>
        {appointments.length === 0 ? (
          <div className="card-soft p-6 text-center">
            <p className="text-muted-foreground font-semibold">{t("payments.noPayments")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => {
              const isCash = appt.payment_method === "cash";
              const isPaid = appt.is_paid;
              return (
                <motion.div key={appt.id} variants={itemVariants} className="card-soft p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-soft bg-secondary flex items-center justify-center text-primary">
                    {isCash ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold font-heading text-sm text-foreground truncate">{appt.service_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {appt.breed} · {new Date(appt.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-foreground">{formatPrice(appt.price)}</span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-accent/20 text-accent-foreground">
                        <CheckCircle className="w-3 h-3" /> {t("payments.online")}
                      </span>
                    ) : isCash ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-secondary text-primary">
                        <Banknote className="w-3 h-3" /> {t("payments.cash")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-secondary text-muted-foreground">
                        <Clock className="w-3 h-3" /> {t("payments.pending")}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PaymentsPage;
