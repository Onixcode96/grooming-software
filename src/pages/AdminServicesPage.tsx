import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useServicesRaw, useCreateService, useUpdateService, useDeleteService, Service } from "@/hooks/useServices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServiceForm {
  icon: string;
  name_it: string;
  name_en: string;
  description_it: string;
  description_en: string;
  price: number;
  duration_minutes: number;
  sort_order: number;
}

const emptyForm: ServiceForm = { icon: "✂️", name_it: "", name_en: "", description_it: "", description_en: "", price: 0, duration_minutes: 30, sort_order: 0 };

const AdminServicesPage = () => {
  const { t } = useTranslation();
  const { formatPrice, isIt } = useLocale();
  const { data: services, isLoading } = useServicesRaw();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formLang, setFormLang] = useState<"it" | "en">(isIt ? "it" : "en");

  const startNew = () => {
    setForm({ ...emptyForm, sort_order: (services?.length ?? 0) + 1 });
    setEditing("new");
    setFormLang(isIt ? "it" : "en");
  };

  const startEdit = (s: Service) => {
    setForm({
      icon: s.icon,
      name_it: s.name_it || s.name,
      name_en: s.name_en || "",
      description_it: s.description_it || s.description,
      description_en: s.description_en || "",
      price: s.price,
      duration_minutes: s.duration_minutes,
      sort_order: s.sort_order,
    });
    setEditing(s.id);
    setFormLang(isIt ? "it" : "en");
  };

  const handleSave = async () => {
    const activeName = formLang === "it" ? form.name_it : form.name_en;
    if (!activeName.trim()) return;

    const payload = {
      icon: form.icon,
      name: form.name_it || form.name_en, // fallback main name
      name_it: form.name_it,
      name_en: form.name_en,
      description: form.description_it || form.description_en,
      description_it: form.description_it,
      description_en: form.description_en,
      price: form.price,
      duration_minutes: form.duration_minutes,
      sort_order: form.sort_order,
    };

    if (editing === "new") await createService.mutateAsync(payload);
    else if (editing) await updateService.mutateAsync({ id: editing, ...payload });
    setEditing(null);
  };

  const handleDelete = async () => {
    if (deleteId) { await deleteService.mutateAsync(deleteId); setDeleteId(null); }
  };

  const isSaving = createService.isPending || updateService.isPending;

  const displayName = (s: Service) => (isIt ? s.name_it : s.name_en) || s.name;
  const displayDesc = (s: Service) => (isIt ? s.description_it : s.description_en) || s.description;

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground">{t("admin.manageServices")}</h2>
          <p className="text-sm text-muted-foreground">{t("admin.manageServicesDesc")}</p>
        </div>
        <Button variant="hero" size="sm" onClick={startNew} disabled={editing !== null}>
          <Plus className="w-4 h-4 mr-1" /> {t("admin.newService")}
        </Button>
      </div>

      {editing === "new" && (
        <ServiceFormCard
          form={form} setForm={setForm} onSave={handleSave} onCancel={() => setEditing(null)}
          saving={isSaving} t={t} formLang={formLang} setFormLang={setFormLang}
        />
      )}

      <div className="space-y-2">
        {services?.map((s) =>
          editing === s.id ? (
            <ServiceFormCard
              key={s.id} form={form} setForm={setForm} onSave={handleSave} onCancel={() => setEditing(null)}
              saving={isSaving} t={t} formLang={formLang} setFormLang={setFormLang}
            />
          ) : (
            <motion.div key={s.id} layout className="card-soft p-4 flex items-start gap-3">
              <span className="text-2xl mt-0.5">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold font-heading text-foreground">{displayName(s)}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{displayDesc(s)}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>⏱ {s.duration_minutes} {t("common.min")}</span>
                  <span className="font-bold text-primary text-sm">{formatPrice(s.price)}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(s)} disabled={editing !== null}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(s.id)} disabled={editing !== null}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </motion.div>
          )
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.deleteService")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.deleteServiceDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ServiceFormCard = ({
  form, setForm, onSave, onCancel, saving, t, formLang, setFormLang,
}: {
  form: ServiceForm;
  setForm: React.Dispatch<React.SetStateAction<ServiceForm>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  t: any;
  formLang: "it" | "en";
  setFormLang: (l: "it" | "en") => void;
}) => {
  const nameField = formLang === "it" ? "name_it" : "name_en";
  const descField = formLang === "it" ? "description_it" : "description_en";

  return (
    <div className="card-soft p-4 space-y-3 ring-2 ring-primary/30">
      {/* Language tabs */}
      <Tabs value={formLang} onValueChange={(v) => setFormLang(v as "it" | "en")}>
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="it" className="text-xs">🇮🇹 Italiano</TabsTrigger>
          <TabsTrigger value="en" className="text-xs">🇬🇧 English</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <Input placeholder={t("admin.iconEmoji")} value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="w-16 text-center text-xl" />
        <Input
          placeholder={formLang === "it" ? "Nome servizio (IT)" : "Service name (EN)"}
          value={form[nameField]}
          onChange={(e) => setForm((f) => ({ ...f, [nameField]: e.target.value }))}
          className="flex-1"
        />
      </div>
      <Textarea
        placeholder={formLang === "it" ? "Descrizione servizio (IT)" : "Service description (EN)"}
        value={form[descField]}
        onChange={(e) => setForm((f) => ({ ...f, [descField]: e.target.value }))}
        rows={2}
      />
      <div className="grid grid-cols-3 gap-2">
        <div><label className="text-xs font-semibold text-muted-foreground">{t("admin.priceLabel")}</label><Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} /></div>
        <div><label className="text-xs font-semibold text-muted-foreground">{t("admin.durationLabel")}</label><Input type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} /></div>
        <div><label className="text-xs font-semibold text-muted-foreground">{t("admin.orderLabel")}</label><Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}><X className="w-4 h-4 mr-1" /> {t("common.cancel")}</Button>
        <Button variant="hero" size="sm" onClick={onSave} disabled={saving || !(form.name_it.trim() || form.name_en.trim())}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} {t("common.save")}
        </Button>
      </div>
    </div>
  );
};

export default AdminServicesPage;
