import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const PaymentSuccessPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "paid" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const sessionId = searchParams.get("session_id");
  const appointmentId = searchParams.get("appointment_id");
  const isMock = searchParams.get("mock") === "true";

  useEffect(() => {
    if (!sessionId || !appointmentId) {
      setStatus("error");
      setErrorMsg(t("paymentSuccess.missingParams"));
      return;
    }
    const verify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setStatus("error"); setErrorMsg(t("paymentSuccess.sessionExpired")); return; }
        const res = await supabase.functions.invoke("verify-checkout", {
          body: { session_id: sessionId, appointment_id: appointmentId, mock: isMock },
        });
        if (res.error) { setStatus("error"); setErrorMsg(res.error.message || t("paymentSuccess.failed")); return; }
        if (res.data?.paid) setStatus("paid");
        else { setStatus("error"); setErrorMsg(res.data?.error || t("paymentSuccess.failed")); }
      } catch { setStatus("error"); setErrorMsg(t("paymentSuccess.failed")); }
    };
    verify();
  }, [sessionId, appointmentId, isMock, t]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {status === "verifying" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-bold font-heading text-foreground">{t("paymentSuccess.verifying")}</h2>
          <p className="text-sm text-muted-foreground">{t("paymentSuccess.verifyingDesc", { testMode: isMock ? t("paymentSuccess.testMode") : "" })}</p>
        </motion.div>
      )}
      {status === "paid" && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-extrabold font-heading text-foreground">{t("paymentSuccess.confirmed")}</h2>
          <p className="text-muted-foreground">{t("paymentSuccess.confirmedDesc")}</p>
          {isMock && <p className="text-xs text-muted-foreground bg-secondary rounded-soft px-3 py-1 inline-block">{t("paymentSuccess.testBadge")}</p>}
          <Button variant="hero" size="lg" onClick={() => navigate("/dashboard")} className="mt-4">{t("paymentSuccess.backToHome")}</Button>
        </motion.div>
      )}
      {status === "error" && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-extrabold font-heading text-foreground">{t("paymentSuccess.failed")}</h2>
          <p className="text-muted-foreground">{errorMsg}</p>
          <div className="flex gap-3 justify-center mt-4">
            <Button variant="outline" size="lg" onClick={() => navigate("/booking")}>{t("paymentSuccess.retry")}</Button>
            <Button variant="hero" size="lg" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PaymentSuccessPage;
