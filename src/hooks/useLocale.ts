import { useTranslation } from "react-i18next";
import { it, enUS } from "date-fns/locale";

export const useLocale = () => {
  const { i18n, t } = useTranslation();
  const isIt = i18n.language?.startsWith("it");

  const dateFnsLocale = isIt ? it : enUS;
  const currencySymbol = isIt ? "€" : "$";
  const currencyPrefix = !isIt; // EN: $60, IT: 60€

  const formatPrice = (amount: number) => {
    if (isIt) return `€${amount}`;
    return `$${amount}`;
  };

  const formatWeight = (kg: number) => {
    if (isIt) return `${kg} kg`;
    const lbs = Math.round(kg * 2.205);
    return `${lbs} lbs`;
  };

  const formatTime = (time24: string) => {
    if (isIt) return time24;
    const [h, m] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
  };

  const weightUnit = isIt ? "kg" : "lbs";

  return {
    dateFnsLocale,
    currencySymbol,
    currencyPrefix,
    formatPrice,
    formatWeight,
    formatTime,
    weightUnit,
    isIt,
  };
};
