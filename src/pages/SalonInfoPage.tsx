import { useSettings } from "@/hooks/useSettings";
import { useBusinessHours, getDayName } from "@/hooks/useBusinessHours";
import { MapPin, Phone, Mail, ShieldAlert, Store, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";

const SalonInfoPage = () => {
  const { t } = useTranslation();
  const { formatTime } = useLocale();
  const { data: settings, isLoading } = useSettings();
  const { data: hours, isLoading: hoursLoading } = useBusinessHours();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const name = settings?.business_name || "Pet Grooming";
  const address = settings?.address;
  const phone = settings?.phone;
  const email = settings?.email;
  const policy = settings?.cancellation_policy;
  const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-soft gradient-primary flex items-center justify-center">
          <Store className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold font-heading text-foreground">{name}</h2>
          {settings?.tagline && <p className="text-sm text-muted-foreground italic">{settings.tagline}</p>}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {address && (
            <a href={mapsUrl!} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">{address}</span>
            </a>
          )}
          {address && (phone || email) && <Separator />}
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-3 group">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">{phone}</span>
            </a>
          )}
          {phone && email && <Separator />}
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-3 group">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">{email}</span>
            </a>
          )}
        </CardContent>
      </Card>

      {!hoursLoading && hours && hours.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-bold font-heading text-foreground text-sm">{t("salonInfo.openingHours")}</h3>
            </div>
            <div className="space-y-1.5">
              {hours.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{getDayName(h.day_of_week)}</span>
                  {h.is_open ? (
                    <span className="text-muted-foreground">
                      {formatTime(h.open_time?.slice(0, 5))} – {formatTime(h.close_time?.slice(0, 5))}
                    </span>
                  ) : (
                    <span className="text-destructive/70 text-xs italic">{t("salonInfo.closed")}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {policy && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <h3 className="font-bold font-heading text-foreground text-sm">{t("salonInfo.cancellationPolicy")}</h3>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{policy}</p>
          </CardContent>
        </Card>
      )}

      <button
        onClick={() => navigate("/privacy")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto pt-2"
      >
        <Shield className="w-4 h-4" />
        <span>Privacy & Legal</span>
      </button>
    </div>
  );
};

export default SalonInfoPage;
