import { motion } from "framer-motion";
import { ChatContact } from "@/hooks/useChat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";

interface ChatContactListProps {
  contacts: ChatContact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
}

const ChatContactList = ({
  contacts,
  activeContactId,
  onSelectContact,
}: ChatContactListProps) => {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 px-4">
        <MessageSquare className="w-10 h-10 opacity-40" />
        <p className="text-sm text-center">Nessuna conversazione ancora.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {contacts.map((contact) => {
          const isActive = activeContactId === contact.user_id;
          const initials = contact.display_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <motion.button
              key={contact.user_id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectContact(contact.user_id)}
              className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-secondary border-l-4 border-primary"
                  : "hover:bg-secondary/50 border-l-4 border-transparent"
              }`}
            >
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold font-heading text-sm text-foreground truncate">
                    {contact.display_name}
                  </p>
                  {contact.last_message_at && (
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {new Date(contact.last_message_at).toLocaleTimeString(
                        "it-IT",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted-foreground truncate pr-2">
                    {contact.last_message || "Nessun messaggio"}
                  </p>
                  {contact.unread_count > 0 && (
                    <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold">
                      {contact.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ChatContactList;
