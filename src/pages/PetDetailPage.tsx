import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, AlertTriangle, Calendar, Clock, RefreshCw, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears } from "date-fns";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";

interface PetData {
  id: string; name: string; type: string; breed: string;
  weight: number; date_of_birth: string | null; photo: string;
  allergies: string[] | null; notes: string | null;
}

interface PastAppointment {
  id: string; service_id: string; service_name: string;
  date: string; time: string; duration_minutes: number; price: number; status: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const PetDetailPage = () => {
  const { t } = useTranslation();
  const { dateFnsLocale, formatWeight, formatPrice } = useLocale();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<PetData | null>(null);
  const [history, setHistory] = useState<PastAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) { setNotFound(true); setLoading(false); return; }
      const { data: petData, error } = await supabase
        .from("pets")
        .select("id, name, type, breed, weight, date_of_birth, photo, allergies, notes")
        .eq("id", id).eq("user_id", user.id).single();
      if (error || !petData) { setNotFound(true); setLoading(false); return; }
      setPet(petData);
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, service_id, service_name, date, time, duration_minutes, price, status")
        .eq("user_id", user.id).order("date", { ascending: false });
      setHistory(appts || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (notFound || !pet) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("pets.petNotFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/my-pets")}>{t("pets.backToMyPets")}</Button>
      </div>
    );
  }

  const age = pet.date_of_birth ? differenceInYears(new Date(), new Date(pet.date_of_birth)) : null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={itemVariants} className="card-soft p-5 flex items-center gap-4">
        <div className="w-20 h-20 rounded-soft gradient-primary flex items-center justify-center text-5xl shrink-0">{pet.photo}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-extrabold font-heading text-foreground">{pet.name}</h2>
            <Heart className="w-5 h-5 text-primary fill-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{pet.breed || t("pets.noBreed")}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-secondary text-[11px] font-semibold text-secondary-foreground">
              {pet.type === "dog" ? `🐕 ${t("common.dog")}` : `🐱 ${t("common.cat")}`}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-secondary text-[11px] font-semibold text-secondary-foreground">
              ⚖️ {formatWeight(pet.weight)}
            </span>
            {age !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-secondary text-[11px] font-semibold text-secondary-foreground">
                🎂 {age} {t("common.yrs")}
              </span>
            )}
          </div>
          {pet.allergies && pet.allergies.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
              <AlertTriangle className="w-3 h-3" /> {t("pets.allergies")}: {pet.allergies.join(", ")}
            </div>
          )}
          {pet.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{pet.notes}"</p>}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-bold font-heading text-foreground mb-3">{t("petDetail.bookingHistory")}</h3>
        {history.length === 0 ? (
          <div className="card-soft p-6 text-center">
            <p className="text-muted-foreground font-semibold">{t("petDetail.noBookings")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("petDetail.noBookingsDesc", { name: pet.name })}</p>
            <Link to="/booking"><Button variant="hero" size="sm" className="mt-3">{t("common.bookNow")}</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((appt) => (
              <motion.div key={appt.id} variants={itemVariants} className="card-soft p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold font-heading text-foreground">{appt.service_name}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-semibold ${
                        appt.status === "completed" ? "bg-green-100 text-green-700" :
                        appt.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                        appt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-secondary text-secondary-foreground"
                      }`}>{appt.status}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(appt.date), "d MMMM yyyy", { locale: dateFnsLocale })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {appt.duration_minutes} {t("common.min")}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">{formatPrice(appt.price)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => navigate(`/booking?service=${appt.service_id}`)}>
                    <RefreshCw className="w-3.5 h-3.5" /> {t("petDetail.bookAgain")}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PetDetailPage;
