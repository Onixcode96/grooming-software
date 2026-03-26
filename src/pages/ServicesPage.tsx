import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { Clock, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const ServicesPage = () => {
  const { t } = useTranslation();
  const { formatPrice } = useLocale();
  const navigate = useNavigate();
  const { data: services, isLoading } = useServices();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold font-heading text-foreground">{t("services.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("services.subtitle")}</p>
      </motion.div>

      <div className="space-y-2">
        {services?.map((s) => (
          <motion.div
            key={s.id}
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
            className="card-soft p-4 w-full text-left transition-all cursor-pointer hover:shadow-hover"
            onClick={() => navigate(`/booking?service=${s.id}`)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{s.icon}</span>
              <div className="flex-1">
                <h4 className="font-bold font-heading text-foreground">{s.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {s.duration_minutes} {t("common.min")}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-primary">
                      <DollarSign className="w-3 h-3" /> {formatPrice(s.price)}
                    </span>
                  </div>
                  <Button variant="soft" size="sm" className="text-xs">{t("services.bookService")}</Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ServicesPage;
