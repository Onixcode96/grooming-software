import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHAT_READ_RESET_EVENT = "chat:read-reset";

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("read", false);

    setUnreadCount(count || 0);
  }, []);

  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CHAT_READ_RESET_EVENT));
    }

    // Clear PWA app badge
    if ("clearAppBadge" in navigator) {
      (navigator as any).clearAppBadge?.().catch(() => {});
    }

    const { error } = await supabase.rpc("mark_my_messages_as_read");
    if (error) {
      await fetchUnread();
    }
  }, [fetchUnread]);

  useEffect(() => {
    fetchUnread();

    const handleReset = () => setUnreadCount(0);
    window.addEventListener(CHAT_READ_RESET_EVENT, handleReset);

    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchUnread();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener(CHAT_READ_RESET_EVENT, handleReset);
      supabase.removeChannel(channel);
    };
  }, [fetchUnread]);

  return { unreadCount, markAllRead };
};
