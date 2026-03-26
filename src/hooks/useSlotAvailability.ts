import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ExistingAppt {
  time: string;
  duration_minutes: number;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

function generateSlots(openTime: string, closeTime: string, interval = 30): string[] {
  const start = timeToMinutes(openTime);
  const end = timeToMinutes(closeTime);
  const slots: string[] = [];
  for (let m = start; m < end; m += interval) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

export function useSlotAvailability(date: string, durationMinutes: number) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [conflictSlots, setConflictSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [allSlots, setAllSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!date) {
      setAvailableSlots([]);
      setAllSlots([]);
      return;
    }

    let cancelled = false;

    async function fetchSlots() {
      setLoading(true);

      // Get the day of week for the selected date (0=Mon, 6=Sun in our table)
      const dateObj = new Date(date + "T00:00:00");
      // JS: 0=Sun,1=Mon..6=Sat -> convert to 0=Mon..6=Sun
      const jsDay = dateObj.getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

      // Fetch business hours for this day
      const { data: hoursData } = await supabase
        .from("business_hours")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();

      if (cancelled) return;

      // If closed or no data, no slots
      if (!hoursData || !(hoursData as any).is_open) {
        setAvailableSlots([]);
        setAllSlots([]);
        setConflictSlots(new Set());
        setLoading(false);
        return;
      }

      const openTime = ((hoursData as any).open_time as string).slice(0, 5);
      const closeTime = ((hoursData as any).close_time as string).slice(0, 5);
      const daySlots = generateSlots(openTime, closeTime);
      setAllSlots(daySlots);

      // Fetch existing appointments
      const { data, error } = await supabase
        .from("appointments")
        .select("time, duration_minutes")
        .eq("date", date)
        .in("status", ["confirmed", "pending"]);

      if (cancelled) return;

      if (error) {
        console.error("Error fetching appointments:", error);
        setAvailableSlots(daySlots);
        setConflictSlots(new Set());
        setLoading(false);
        return;
      }

      const existing: ExistingAppt[] = (data || []).map((d) => ({
        time: d.time,
        duration_minutes: d.duration_minutes,
      }));

      const closeMinutes = timeToMinutes(closeTime);
      const conflicts = new Set<string>();

      // All slots are available (overbooking allowed), but mark conflicts
      const validSlots = daySlots.filter((slot) => {
        const slotStart = timeToMinutes(slot);
        const slotEnd = slotStart + durationMinutes;
        // Don't go past closing time
        if (slotEnd > closeMinutes) return false;

        // Check for overlap with existing appointments
        for (const appt of existing) {
          const apptStart = timeToMinutes(appt.time);
          const apptEnd = apptStart + appt.duration_minutes;
          if (slotStart < apptEnd && slotEnd > apptStart) {
            conflicts.add(slot);
          }
        }
        return true;
      });

      setAvailableSlots(validSlots);
      setConflictSlots(conflicts);
      setLoading(false);
    }

    fetchSlots();
    return () => { cancelled = true; };
  }, [date, durationMinutes]);

  return { availableSlots, conflictSlots, loading, allSlots };
}
