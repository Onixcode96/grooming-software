import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { THEME_PRESETS, type ThemeColorKey } from "@/hooks/useThemeColor";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const colorSwatches: Record<ThemeColorKey, string> = {
  rose: "bg-[hsl(333,82%,75%)]",
  sky: "bg-[hsl(199,89%,68%)]",
  teal: "bg-[hsl(168,60%,58%)]",
  lilac: "bg-[hsl(270,60%,72%)]",
  sand: "bg-[hsl(30,55%,65%)]",
  peach: "bg-[hsl(15,80%,72%)]",
};

const ThemeColorPicker = () => {
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const [selected, setSelected] = useState<ThemeColorKey>("rose");

  useEffect(() => {
    if (settings) {
      setSelected(((settings as any).theme_color || "rose") as ThemeColorKey);
    }
  }, [settings]);

  const handleSelect = (key: ThemeColorKey) => {
    setSelected(key);
    update.mutate({ theme_color: key } as any);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {(Object.keys(THEME_PRESETS) as ThemeColorKey[]).map((key) => {
        const preset = THEME_PRESETS[key];
        const isActive = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => handleSelect(key)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              isActive
                ? "border-primary bg-secondary shadow-soft scale-[1.02]"
                : "border-border hover:border-primary/40 hover:bg-secondary/50"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform",
              colorSwatches[key],
              isActive && "ring-2 ring-offset-2 ring-primary"
            )}>
              {isActive ? <Check className="w-5 h-5" /> : <span className="text-lg">{preset.emoji}</span>}
            </div>
            <span className="text-xs font-semibold text-foreground">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeColorPicker;
