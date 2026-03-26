import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSettings, useUpdateSettings, type Settings } from "@/hooks/useSettings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store, Phone, Globe, FileText, Loader2, Save, Shield, Clock, Palette, CreditCard } from "lucide-react";
import BusinessHoursEditor from "@/components/admin/BusinessHoursEditor";
import ThemeColorPicker from "@/components/admin/ThemeColorPicker";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

type FormValues = Omit<Settings, "id" | "updated_at">;

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-secondary/30">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-bold font-heading text-foreground">{title}</h2>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{label}</Label>
    {children}
  </div>
);

const AdminSettingsPage = () => {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const [allowCash, setAllowCash] = useState(true);
  const [allowOnline, setAllowOnline] = useState(false);

  useEffect(() => {
    if (settings) {
      reset({
        business_name: settings.business_name, tagline: settings.tagline, address: settings.address,
        phone: settings.phone, email: settings.email, instagram_url: settings.instagram_url,
        facebook_url: settings.facebook_url, cancellation_policy: settings.cancellation_policy, privacy_policy: settings.privacy_policy,
      });
      setAllowCash(settings.allow_cash ?? true);
      setAllowOnline(settings.allow_online ?? false);
    }
  }, [settings, reset]);

  const onSubmit = (values: FormValues) => updateSettings.mutate({ ...values, allow_cash: allowCash, allow_online: allowOnline });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-4">
      <Section icon={Store} title={t("admin.business")}>
        <Field label={t("admin.businessName")}><Input {...register("business_name")} /></Field>
        <Field label={t("admin.taglineWelcome")}><Input {...register("tagline")} /></Field>
      </Section>
      <Section icon={Phone} title={t("admin.contacts")}>
        <Field label={t("admin.address")}><Input {...register("address")} /></Field>
        <Field label={t("admin.phone")}><Input {...register("phone")} type="tel" /></Field>
        <Field label={t("auth.email")}><Input {...register("email")} type="email" /></Field>
      </Section>
      <Section icon={Globe} title={t("admin.social")}>
        <Field label="Instagram URL"><Input {...register("instagram_url")} /></Field>
        <Field label="Facebook URL"><Input {...register("facebook_url")} /></Field>
      </Section>
      <Section icon={Clock} title={t("admin.openingHours")}><BusinessHoursEditor /></Section>
      <Section icon={Palette} title={t("admin.appThemeColor")}><ThemeColorPicker /></Section>
      <Section icon={CreditCard} title={t("admin.paymentMethods")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-foreground">{t("admin.allowCash")}</p>
            <p className="text-xs text-muted-foreground">{t("admin.allowCashDesc")}</p>
          </div>
          <Switch checked={allowCash} onCheckedChange={setAllowCash} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-foreground">{t("admin.allowOnline")}</p>
            <p className="text-xs text-muted-foreground">{t("admin.allowOnlineDesc")}</p>
          </div>
          <Switch checked={allowOnline} onCheckedChange={setAllowOnline} />
        </div>
      </Section>
      <Section icon={FileText} title={t("admin.policies")}>
        <Field label={t("admin.cancellationPolicyLabel")}><Textarea {...register("cancellation_policy")} rows={4} /></Field>
      </Section>
      <Section icon={Shield} title={t("common.privacyPolicy")}>
        <Field label={t("admin.privacyPolicyCustom")}><Textarea {...register("privacy_policy")} rows={6} /></Field>
        <p className="text-xs text-muted-foreground">{t("admin.privacyPolicyHint")}</p>
      </Section>
      <Button type="submit" className="w-full gap-2" disabled={updateSettings.isPending} size="lg">
        {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t("admin.saveSettings")}
      </Button>
    </form>
  );
};

export default AdminSettingsPage;
