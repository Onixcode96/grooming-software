import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useServices } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Gift, Percent } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getTenantId } from "@/hooks/useTenant";

interface SendDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: { user_id: string; display_name: string } | null;
}

const PERCENTAGES = [5, 10, 15, 20, 25, 30];
const CUSTOM_PERCENTAGES = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];

const SendDiscountDialog = ({ open, onOpenChange, client }: SendDiscountDialogProps) => {
  const { t } = useTranslation();
  const { data: services = [] } = useServices();
  const [percentage, setPercentage] = useState("10");
  const [showCustom, setShowCustom] = useState(false);
  const [serviceId, setServiceId] = useState<string>("all");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!client) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const tenant_id = await getTenantId();
      const serviceName = serviceId === "all" ? t("admin.allServices") : services.find((s) => s.id === serviceId)?.name || "";
      const msg = t("admin.discountChatMsg", { percent: percentage, service: serviceName });
      const { error: msgError } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id: client.user_id, content: msg, tenant_id } as any);
      if (msgError) throw msgError;
      if (saveAsDefault) {
        const svcFilter = serviceId === "all" ? null : serviceId;
        if (svcFilter) await supabase.from("discount_settings" as any).delete().eq("service_id", svcFilter);
        else await supabase.from("discount_settings" as any).delete().is("service_id", null);
        await supabase.from("discount_settings" as any).insert({ percentage: parseInt(percentage), service_id: svcFilter, is_active: true, loyal_only: true, tenant_id });
      }
      toast.success(t("admin.discountSent", { percent: percentage, name: client.display_name }));
      onOpenChange(false);
    } catch { toast.error(t("admin.discountError")); } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> {t("admin.discountTitle", { name: client?.display_name })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="font-heading text-sm">{t("admin.discountPercentage")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {PERCENTAGES.map((p) => (
                <Button key={p} variant={percentage === String(p) && !showCustom ? "default" : "outline"} size="sm" onClick={() => { setPercentage(String(p)); setShowCustom(false); }} className="text-sm font-bold">{p}%</Button>
              ))}
              <Button variant={showCustom ? "default" : "outline"} size="sm" onClick={() => setShowCustom(!showCustom)} className="text-sm font-bold">{t("admin.customChoice")}</Button>
            </div>
            {showCustom && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-4 gap-1.5 pt-1">
                {CUSTOM_PERCENTAGES.map((p) => (
                  <Button key={p} variant={percentage === String(p) ? "default" : "outline"} size="sm" onClick={() => setPercentage(String(p))} className="text-xs font-bold h-8">{p}%</Button>
                ))}
              </motion.div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-heading text-sm">{t("admin.applyTo")}</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder={t("admin.selectService")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allServices")}</SelectItem>
                {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t("admin.saveAsDefault")}</Label>
            <Switch checked={saveAsDefault} onCheckedChange={setSaveAsDefault} />
          </div>
          <Button variant="hero" className="w-full" onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Percent className="w-4 h-4 mr-2" />}
            {t("admin.sendDiscountBtn", { percent: percentage })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendDiscountDialog;
