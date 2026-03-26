import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("it") ? "it" : "en";

  const switchTo = (lang: "it" | "en") => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center bg-secondary rounded-pill p-0.5 gap-0.5">
      {(["it", "en"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          className="relative px-2.5 py-1 rounded-pill text-[11px] font-bold font-heading uppercase transition-colors"
        >
          {currentLang === lang && (
            <motion.div
              layoutId="langIndicator"
              className="absolute inset-0 bg-primary/15 rounded-pill"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${currentLang === lang ? "text-primary" : "text-muted-foreground"}`}>
            {lang.toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
