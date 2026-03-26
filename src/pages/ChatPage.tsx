import { useState, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import ChatMessageArea from "@/components/chat/ChatMessageArea";
import { Loader2, ArrowLeft, Scissors } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const ChatPage = () => {
  const { t } = useTranslation();
  const {
    currentUserId, isAdmin, loading, messages, contacts,
    activeContactId, setActiveContactId, sendMessage, adminUserId,
  } = useChat();
  const { markAllRead } = useUnreadMessages();
  const [openConversation, setOpenConversation] = useState(false);

  const handleClientSend = async (content: string) => {
    await sendMessage(content);
    if (!isAdmin) markAllRead();
  };

  const handleQuickReply = () => handleClientSend("OK");

  if (loading) {
    return (
      <div className="fixed inset-0 top-14 bottom-16 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="fixed inset-0 top-14 bottom-16 flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm font-heading">{t("auth.loginToChat")}</p>
      </div>
    );
  }

  const activeContact = contacts.find((c) => c.user_id === activeContactId);

  const handleSelectContact = (userId: string) => {
    setActiveContactId(userId);
    setOpenConversation(true);
  };

  if (isAdmin) {
    return (
      <div className="fixed inset-0 top-14 bottom-16 flex flex-col bg-background z-10">
        <AnimatePresence mode="wait">
          {!openConversation ? (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex flex-col h-full">
              <div className="px-5 py-4 border-b border-border bg-card">
                <h2 className="font-bold font-heading text-lg text-foreground">{t("chat.conversations")}</h2>
              </div>
              <div className="flex-1 overflow-y-auto bg-background">
                {contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 px-4">
                    <p className="text-sm text-center">{t("chat.noConversations")}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {contacts.map((contact) => (
                      <li key={contact.user_id}>
                        <button onClick={() => handleSelectContact(contact.user_id)} className="w-full text-left px-5 py-4 hover:bg-secondary/60 active:bg-secondary transition-colors flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold font-heading text-foreground text-sm truncate">{contact.display_name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.last_message || t("chat.noMessages")}</p>
                          </div>
                          {contact.unread_count > 0 && (
                            <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary-foreground">{contact.unread_count}</span>
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="conversation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-card">
                <Button variant="ghost" size="icon" onClick={() => setOpenConversation(false)} className="shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <p className="font-bold font-heading text-foreground truncate">{activeContact?.display_name ?? t("chat.conversation")}</p>
              </div>
              <div className="flex-1 min-h-0">
                <ChatMessageArea messages={messages} currentUserId={currentUserId} onSendMessage={sendMessage} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-14 bottom-16 flex flex-col bg-background z-10">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
          <Scissors className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold font-heading text-foreground text-sm">{t("chat.groomer")}</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ChatMessageArea messages={messages} currentUserId={currentUserId} onSendMessage={handleClientSend} onQuickReply={handleQuickReply} isClientView />
      </div>
    </div>
  );
};

export default ChatPage;
