import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import type { ParsedChat } from "../utils/chatParser";
import { MessageBubble } from "./MessageBubble";

interface ChatPreviewProps {
  chat: ParsedChat;
}

const platformLabels: Record<string, string> = {
  chatgpt: "ChatGPT",
  grok: "Grok",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  unknown: "AI Chat",
};

const platformBadgeStyle: Record<string, string> = {
  chatgpt: "bg-green-500/10 text-green-400 border-green-500/20",
  grok: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  claude: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  gemini: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  perplexity: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  unknown: "bg-secondary text-muted-foreground border-border",
};

export function ChatPreview({ chat }: ChatPreviewProps) {
  const platformName = platformLabels[chat.platform] || "AI Chat";
  const badgeStyle =
    platformBadgeStyle[chat.platform] || platformBadgeStyle.unknown;

  return (
    <div
      data-ocid="chat.panel"
      className="card-glass rounded-xl flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-vault-cyan" />
          <h3 className="text-sm font-semibold text-foreground">
            {chat.title || "Conversation Preview"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeStyle}`}
          >
            {platformName}
          </span>
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground"
          >
            {chat.messages.length} messages
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 max-h-[520px]">
        <div className="px-5 py-4 space-y-5 scrollbar-thin">
          {chat.messages.map((msg, i) => (
            <MessageBubble
              key={msg.id || i}
              message={msg}
              platformName={platformName}
              index={i + 1}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
