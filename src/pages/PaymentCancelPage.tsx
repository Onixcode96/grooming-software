import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const PaymentCancelPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
        <XCircle className="w-16 h-16 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-extrabold font-heading text-foreground">{t("paymentCancel.title")}</h2>
        <p className="text-muted-foreground">{t("paymentCancel.desc")}</p>
        <p className="text-xs text-muted-foreground">{t("paymentCancel.hint")}</p>
        <div className="flex gap-3 justify-center mt-4">
          <Button variant="outline" size="lg" onClick={() => navigate("/booking")}>{t("paymentCancel.newBooking")}</Button>
          <Button variant="hero" size="lg" onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCancelPage;
