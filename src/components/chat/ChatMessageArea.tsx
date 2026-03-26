import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Message } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, CheckCircle } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useLocale } from "@/hooks/useLocale";
import { useTranslation } from "react-i18next";

interface ChatMessageAreaProps {
  messages: Message[];
  currentUserId: string | null;
  onSendMessage: (content: string) => void;
  onQuickReply?: () => void;
  contactName?: string;
  showEmptyState?: boolean;
  isClientView?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const formatDateLabel = (dateStr: string, dateFnsLocale: any, t: any) => {
  const date = new Date(dateStr);
  if (isToday(date)) return t("chat.today") || "Today";
  if (isYesterday(date)) return t("chat.yesterday") || "Yesterday";
  return format(date, "d MMMM yyyy", { locale: dateFnsLocale });
};

const resolveContent = (content: string, t: any) => {
  if (content.startsWith("@@i18n:")) {
    const key = content.slice(7);
    return t(key, { defaultValue: content });
  }
  return content;
};

const ChatMessageArea = ({
  messages,
  currentUserId,
  onSendMessage,
  onQuickReply,
  contactName,
  showEmptyState = false,
  isClientView = false,
}: ChatMessageAreaProps) => {
  const { t } = useTranslation();
  const { dateFnsLocale } = useLocale();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [quickReplySent, setQuickReplySent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const text = newMessage;
    setNewMessage("");
    setSending(true);
    setQuickReplySent(true); // any manual message hides quick reply
    try {
      await onSendMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleQuickReplyClick = () => {
    setQuickReplySent(true);
    onQuickReply?.();
  };

  // Show quick reply if: client view, last message is from admin (not from client), and client hasn't dismissed it this session
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const showQuickReply = isClientView && !quickReplySent && lastMsg !== null && lastMsg.sender_id !== currentUserId;

  if (showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <MessageSquare className="w-12 h-12 opacity-30" />
        <p className="text-sm font-heading">{t("chat.selectConversation")}</p>
      </div>
    );
  }

  // Group messages by date for separators
  const getDateKey = (dateStr: string) => new Date(dateStr).toDateString();

  return (
    <div className="flex flex-col h-full">
      {contactName && (
        <div className="px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
          <p className="font-bold font-heading text-foreground">{contactName}</p>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <p className="text-sm">{t("chat.noMessagesYet")}</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {messages.map((msg, idx) => {
              const isMine = msg.sender_id === currentUserId;
              const isOptimistic = msg.id.startsWith("temp-");
              const showDateSeparator =
                idx === 0 ||
                getDateKey(msg.created_at) !== getDateKey(messages[idx - 1].created_at);
              const displayContent = resolveContent(msg.content, t);

              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                        {formatDateLabel(msg.created_at, dateFnsLocale, t)}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <motion.div
                    variants={itemVariants}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-[18px] transition-opacity ${
                        isOptimistic ? "opacity-60" : "opacity-100"
                      } ${
                        isMine
                          ? "gradient-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{displayContent}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMine
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {showQuickReply && (
        <div className="mx-4 mb-2 p-3 rounded-[16px] bg-secondary/80 border border-border">
          <p className="text-xs text-muted-foreground mb-2 text-center">
            {t("chat.quickReplyHint")}
          </p>
          <Button
            variant="hero"
            className="w-full"
            onClick={handleQuickReplyClick}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {t("chat.quickReplyOk")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 border-t border-border bg-card">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t("chat.writeMessage")}
          className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
        />
        <Button
          variant="hero"
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatMessageArea;
