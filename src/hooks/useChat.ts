import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendPushNotification } from "@/hooks/usePushNotifications";
import { getTenantId } from "@/hooks/useTenant";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  created_at: string;
  read: boolean;
}

export interface ChatContact {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const useChat = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // 1. Get current user & check role
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);

      // Get admin user id for client view using security definer function
      if (!roleData) {
        const { data: adminId } = await supabase.rpc("get_admin_user_id");
        if (adminId) setAdminUserId(adminId);
      }

      setLoading(false);
    };

    init();
  }, []);

  // 2. Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;

    if (isAdmin) {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    } else {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    }
  }, [currentUserId, isAdmin]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 3. Build contacts list for admin
  useEffect(() => {
    if (!isAdmin || !currentUserId) return;

    const buildContacts = async () => {
      const clientIds = new Set<string>();
      messages.forEach((m) => {
        if (m.sender_id !== currentUserId) clientIds.add(m.sender_id);
        if (m.receiver_id && m.receiver_id !== currentUserId) clientIds.add(m.receiver_id);
      });

      if (clientIds.size === 0) {
        setContacts([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", Array.from(clientIds));

      if (!profiles) return;

      const contactList: ChatContact[] = profiles.map((p) => {
        const clientMessages = messages.filter(
          (m) => m.sender_id === p.user_id || m.receiver_id === p.user_id
        );
        const lastMsg = clientMessages[clientMessages.length - 1];
        const unread = clientMessages.filter(
          (m) => m.sender_id === p.user_id && !m.read
        ).length;

        return {
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          last_message: lastMsg?.content || "",
          last_message_at: lastMsg?.created_at || "",
          unread_count: unread,
        };
      });

      contactList.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime()
      );

      setContacts(contactList);

      if (!activeContactId && contactList.length > 0) {
        setActiveContactId(contactList[0].user_id);
      }
    };

    buildContacts();
  }, [isAdmin, currentUserId, messages, activeContactId]);

  // 4. Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  // 5. Send message with optimistic update
  const sendMessage = async (content: string) => {
    if (!currentUserId || !content.trim()) return;

    const targetReceiverId = isAdmin ? activeContactId : adminUserId;
    if (!targetReceiverId) return;

    const trimmed = content.trim();

    // Optimistic: add message locally immediately
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: targetReceiverId,
      content: trimmed,
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const tenant_id = await getTenantId();
    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: targetReceiverId,
      content: trimmed,
      tenant_id,
    } as any);

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } else {
      // Immediately fetch to reconcile optimistic → confirmed
      await fetchMessages();
      // Send push notification to recipient (fire-and-forget)
      sendPushNotification(
        targetReceiverId,
        isAdmin ? "New message from your groomer 💬" : "New message 💬",
        trimmed.substring(0, 100),
        "/chat"
      );
    }
  };

  // 6. Mark messages as read
  const markAsRead = async (contactId: string) => {
    if (!currentUserId) return;
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", contactId)
      .eq("receiver_id", currentUserId)
      .eq("read", false);
  };

  // Get messages for the active conversation
  const activeMessages = isAdmin
    ? messages.filter(
        (m) =>
          m.sender_id === activeContactId ||
          m.receiver_id === activeContactId
      )
    : messages;

  return {
    currentUserId,
    isAdmin,
    loading,
    messages: activeMessages,
    contacts,
    activeContactId,
    setActiveContactId: (id: string) => {
      setActiveContactId(id);
      markAsRead(id);
    },
    sendMessage,
    adminUserId,
  };
};
