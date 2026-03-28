import type { ChatMessage } from "../utils/chatParser";
import { MarkdownContent } from "../utils/markdownRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
  platformName: string;
  index: number;
}

const platformColors: Record<string, string> = {
  chatgpt: "from-green-500 to-emerald-600",
  grok: "from-blue-500 to-indigo-600",
  claude: "from-orange-500 to-amber-600",
  gemini: "from-blue-400 to-purple-600",
  perplexity: "from-teal-500 to-cyan-600",
  unknown: "from-purple-500 to-violet-600",
};

export function MessageBubble({
  message,
  platformName,
  index,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const platformKey = platformName.toLowerCase();
  const aiGradient = platformColors[platformKey] || platformColors.unknown;

  return (
    <div data-ocid={`chat.item.${index}`} className="flex gap-3 group">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vault-cyan to-blue-400 flex items-center justify-center text-xs font-bold text-white">
            U
          </div>
        ) : (
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${aiGradient} flex items-center justify-center text-xs font-bold text-white`}
          >
            AI
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-foreground">
            {isUser ? "You" : platformName}
          </span>
          {message.timestamp && (
            <span className="text-xs text-muted-foreground">
              {message.timestamp}
            </span>
          )}
        </div>
        <div
          className={`text-sm text-muted-foreground ${
            isUser ? "bg-secondary/50 rounded-lg rounded-tl-none px-3 py-2" : ""
          }`}
        >
          <MarkdownContent content={message.content} />
        </div>
      </div>
    </div>
  );
}
