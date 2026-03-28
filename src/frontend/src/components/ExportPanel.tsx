import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  FileDown,
  FileText,
  Globe,
  Loader2,
  Save,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveChatSession } from "../hooks/useQueries";
import type { ParsedChat } from "../utils/chatParser";
import { downloadHtml, downloadPdf, downloadWord } from "../utils/exporters";

interface ExportPanelProps {
  chat: ParsedChat;
}

const exportOptions = [
  {
    id: "html",
    icon: Globe,
    title: "HTML File",
    ext: ".html",
    description:
      "Self-contained file with full styling. Opens on any device, works offline.",
    color: "text-vault-cyan",
    borderGlow:
      "hover:border-vault-cyan/50 hover:shadow-[0_0_20px_oklch(0.78_0.14_220_/_0.15)]",
  },
  {
    id: "pdf",
    icon: FileDown,
    title: "PDF Document",
    ext: ".pdf",
    description:
      "Perfect for sharing, printing, or archiving. Print-ready layout.",
    color: "text-red-400",
    borderGlow:
      "hover:border-red-400/50 hover:shadow-[0_0_20px_rgba(248,113,113,0.15)]",
  },
  {
    id: "word",
    icon: FileText,
    title: "Word Document",
    ext: ".doc",
    description:
      "Editable document compatible with Microsoft Word and Google Docs.",
    color: "text-blue-400",
    borderGlow:
      "hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]",
  },
];

export function ExportPanel({ chat }: ExportPanelProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const saveMutation = useSaveChatSession();

  const handleDownload = async (format: string) => {
    setDownloading(format);
    try {
      if (format === "html") downloadHtml(chat);
      else if (format === "pdf") downloadPdf(chat);
      else if (format === "word") downloadWord(chat);
      toast.success(`${format.toUpperCase()} downloaded successfully!`);
    } catch {
      toast.error(`Failed to export as ${format}`);
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  };

  const handleSaveToVault = async () => {
    const platformNames: Record<string, string> = {
      chatgpt: "ChatGPT",
      grok: "Grok",
      claude: "Claude",
      gemini: "Gemini",
      perplexity: "Perplexity",
      unknown: "AI Chat",
    };
    try {
      await saveMutation.mutateAsync({
        title:
          chat.title || `${platformNames[chat.platform] || "AI"} Conversation`,
        sourceUrl: chat.url || "",
        parsedChatJson: JSON.stringify(chat.messages),
      });
      toast.success("Chat saved to your Vault!");
    } catch {
      toast.error("Failed to save to Vault");
    }
  };

  return (
    <div
      data-ocid="export.panel"
      className="card-glass rounded-xl flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Export Options
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose your preferred format
        </p>
      </div>

      {/* Options */}
      <div className="px-5 py-4 space-y-3 flex-1">
        {exportOptions.map((opt) => {
          const Icon = opt.icon;
          const isDownloading = downloading === opt.id;
          return (
            <div
              key={opt.id}
              data-ocid={`export.${opt.id}.card`}
              className={`border border-border rounded-lg p-4 transition-all duration-200 ${opt.borderGlow} cursor-default`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 ${opt.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {opt.title}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {opt.ext}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
              <Button
                data-ocid={`export.${opt.id}.button`}
                size="sm"
                onClick={() => handleDownload(opt.id)}
                disabled={isDownloading}
                className="w-full mt-3 btn-gradient text-white text-xs font-semibold rounded-lg border-0"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />{" "}
                    Preparing...
                  </>
                ) : (
                  <>
                    <FileDown className="w-3 h-3 mr-1.5" /> Download {opt.ext}
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Save to Vault */}
      <div className="px-5 pb-5">
        <Button
          data-ocid="export.save_button"
          onClick={handleSaveToVault}
          disabled={saveMutation.isPending}
          variant="outline"
          className="w-full border-border hover:border-vault-purple/50 text-sm font-semibold"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : saveMutation.isSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" /> Saved to
              Vault!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save to Vault
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
