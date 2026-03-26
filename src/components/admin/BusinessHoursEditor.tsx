import { useBusinessHours, useUpdateBusinessHour, getDayName } from "@/hooks/useBusinessHours";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const BusinessHoursEditor = () => {
  const { data: hours, isLoading } = useBusinessHours();
  const updateHour = useUpdateBusinessHour();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold font-heading text-foreground mb-3">Opening Hours</h3>
      {hours?.map((h) => (
        <div
          key={h.id}
          className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all ${
            h.is_open ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
          }`}
        >
          {/* Day toggle row */}
          <div className="flex items-center gap-3 min-w-0">
            <Switch
              checked={h.is_open}
              onCheckedChange={(checked) =>
                updateHour.mutate({ id: h.id, is_open: checked })
              }
            />
            <span className="text-sm font-bold font-heading text-foreground w-24 truncate">
              {getDayName(h.day_of_week)}
            </span>
          </div>

          {/* Time inputs */}
          {h.is_open ? (
            <div className="flex items-center gap-2 pl-12 sm:pl-0">
              <Input
                type="time"
                value={h.open_time?.slice(0, 5)}
                onChange={(e) =>
                  updateHour.mutate({ id: h.id, open_time: e.target.value })
                }
                className="w-28 h-9 text-sm rounded-lg"
              />
              <span className="text-muted-foreground text-sm font-medium">–</span>
              <Input
                type="time"
                value={h.close_time?.slice(0, 5)}
                onChange={(e) =>
                  updateHour.mutate({ id: h.id, close_time: e.target.value })
                }
                className="w-28 h-9 text-sm rounded-lg"
              />
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic pl-12 sm:pl-0">Closed</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default BusinessHoursEditor;
