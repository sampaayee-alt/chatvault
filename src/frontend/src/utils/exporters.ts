import type { ParsedChat } from "./chatParser";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateSelfContainedHtml(chat: ParsedChat): string {
  const platformNames: Record<string, string> = {
    chatgpt: "ChatGPT",
    grok: "Grok",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
    unknown: "AI Chat",
  };
  const platformName = platformNames[chat.platform] || "AI Chat";
  const title = chat.title || `${platformName} Conversation`;

  const messagesHtml = chat.messages
    .map((msg) => {
      const isUser = msg.role === "user";
      const avatarLetter = isUser ? "U" : "AI";
      const senderName = isUser ? "You" : platformName;
      const bgColor = isUser ? "#1a2035" : "#0f1623";
      const borderColor = isUser ? "#2EC5FF" : "#7A3CFF";
      const avatarGradient = isUser
        ? "linear-gradient(135deg, #2EC5FF, #1a8fd1)"
        : "linear-gradient(135deg, #7A3CFF, #4a1fa8)";

      const parts: string[] = [];
      const segments = msg.content.split(/(```[\s\S]*?```)/g);
      for (const seg of segments) {
        if (seg.startsWith("```") && seg.endsWith("```")) {
          const code = seg
            .slice(3, -3)
            .replace(/^[a-z]+\n/, "")
            .trim();
          parts.push(
            `<pre style="background:#0a0c10;border:1px solid #2A2F38;border-radius:8px;padding:16px;overflow-x:auto;font-family:'Courier New',monospace;font-size:13px;line-height:1.6;color:#e2e8f0;margin:12px 0;"><code>${escapeHtml(code)}</code></pre>`,
          );
        } else if (seg.trim()) {
          let html = escapeHtml(seg);
          html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
          html = html.replace(
            /`([^`]+)`/g,
            "<code style=\"background:#1a1f2e;padding:2px 6px;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;\">$1</code>",
          );
          html = html.replace(/\n/g, "<br>");
          parts.push(`<div style="line-height:1.7;">${html}</div>`);
        }
      }

      return `
      <div style="display:flex;gap:14px;padding:20px;background:${bgColor};border:1px solid ${borderColor}22;border-radius:12px;margin-bottom:12px;">
        <div style="flex-shrink:0;width:38px;height:38px;border-radius:50%;background:${avatarGradient};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:white;font-family:sans-serif;">${avatarLetter}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:14px;color:#F2F4F7;margin-bottom:8px;font-family:sans-serif;">${senderName}${msg.timestamp ? `<span style="color:#A7AFBA;font-weight:400;margin-left:8px;font-size:12px;">${msg.timestamp}</span>` : ""}</div>
          <div style="color:#D1D5DB;font-size:14px;">${parts.join("")}</div>
        </div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} \u2014 ChatVault Export</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0B0D10;
      color: #F2F4F7;
      min-height: 100vh;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #0f1623, #1a1f2e);
      border-bottom: 1px solid #2A2F38;
      padding: 20px 32px;
      display: flex;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #2EC5FF, #7A3CFF);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      color: white;
    }
    .header-title { font-size: 18px; font-weight: 700; color: #F2F4F7; }
    .header-subtitle { font-size: 13px; color: #A7AFBA; margin-left: auto; }
    .container { max-width: 860px; margin: 0 auto; padding: 32px 24px; }
    .chat-title { font-size: 22px; font-weight: 700; color: #F2F4F7; margin-bottom: 8px; }
    .chat-meta { font-size: 13px; color: #A7AFBA; margin-bottom: 28px; display: flex; gap: 16px; flex-wrap: wrap; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge-platform { background: #1a1f2e; color: #2EC5FF; border: 1px solid #2EC5FF44; }
    .badge-count { background: #1a1f2e; color: #A7AFBA; border: 1px solid #2A2F38; }
    .footer { text-align: center; padding: 32px; color: #A7AFBA; font-size: 12px; border-top: 1px solid #2A2F38; margin-top: 40px; }
    .footer a { color: #2EC5FF; text-decoration: none; }
    @media (max-width: 600px) {
      .container { padding: 20px 16px; }
      .header { padding: 16px 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">CV</div>
    <span class="header-title">ChatVault</span>
    <span class="header-subtitle">Exported ${new Date().toLocaleDateString()}</span>
  </div>
  <div class="container">
    <h1 class="chat-title">${escapeHtml(title)}</h1>
    <div class="chat-meta">
      <span class="badge badge-platform">${platformName}</span>
      <span class="badge badge-count">${chat.messages.length} messages</span>
      ${chat.url ? `<span style="color:#A7AFBA;font-size:12px;">Source: <a href="${escapeHtml(chat.url)}" target="_blank" style="color:#2EC5FF;">${escapeHtml(chat.url.slice(0, 60))}${chat.url.length > 60 ? "..." : ""}</a></span>` : ""}
    </div>
    <div class="messages">
      ${messagesHtml}
    </div>
    <div class="footer">
      Exported with <a href="https://chatvault.app" target="_blank">ChatVault</a> &bull;
      Built with <a href="https://caffeine.ai" target="_blank">caffeine.ai</a>
    </div>
  </div>
</body>
</html>`;
}

export function downloadHtml(chat: ParsedChat): void {
  const html = generateSelfContainedHtml(chat);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chat-export-${Date.now()}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadPdf(chat: ParsedChat): void {
  const html = generateSelfContainedHtml(chat);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to use PDF export.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

export function downloadWord(chat: ParsedChat): void {
  const platformNames: Record<string, string> = {
    chatgpt: "ChatGPT",
    grok: "Grok",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
    unknown: "AI Chat",
  };
  const platformName = platformNames[chat.platform] || "AI Chat";
  const title = chat.title || `${platformName} Conversation`;

  const messagesWordHtml = chat.messages
    .map((msg) => {
      const isUser = msg.role === "user";
      const senderName = isUser ? "You" : platformName;
      const color = isUser ? "#1565C0" : "#6A1B9A";

      const parts: string[] = [];
      const segments = msg.content.split(/(```[\s\S]*?```)/g);
      for (const seg of segments) {
        if (seg.startsWith("```") && seg.endsWith("```")) {
          const code = seg
            .slice(3, -3)
            .replace(/^[a-z]+\n/, "")
            .trim();
          parts.push(
            `<pre style="font-family:'Courier New',monospace;font-size:11pt;background:#f5f5f5;padding:10px;border-left:3px solid #999;margin:8px 0;">${escapeHtml(code)}</pre>`,
          );
        } else if (seg.trim()) {
          let text = escapeHtml(seg);
          text = text.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
          text = text.replace(
            /`([^`]+)`/g,
            "<code style='font-family:Courier New;font-size:10pt;background:#f0f0f0;'>$1</code>",
          );
          text = text.replace(/\n/g, "<br>");
          parts.push(
            `<p style="margin:4px 0;font-size:12pt;line-height:1.6;">${text}</p>`,
          );
        }
      }

      return `
      <div style="margin-bottom:16px;padding:12px;border-left:3px solid ${color};">
        <p style="font-weight:bold;color:${color};font-size:12pt;margin-bottom:8px;">${senderName}${msg.timestamp ? ` &nbsp;<span style="color:#666;font-weight:normal;font-size:10pt;">${msg.timestamp}</span>` : ""}</p>
        ${parts.join("")}
      </div>`;
    })
    .join("\n");

  const wordHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, sans-serif; font-size: 12pt; color: #222; margin: 2cm; }
    h1 { font-size: 20pt; color: #1a1a2e; border-bottom: 2px solid #1565C0; padding-bottom: 8pt; }
    .meta { color: #666; font-size: 10pt; margin-bottom: 20pt; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">
    Platform: ${platformName} &bull;
    Messages: ${chat.messages.length} &bull;
    Exported: ${new Date().toLocaleDateString()}
    ${chat.url ? `&bull; Source: ${escapeHtml(chat.url)}` : ""}
  </p>
  ${messagesWordHtml}
  <p style="color:#999;font-size:9pt;margin-top:30pt;border-top:1px solid #ddd;padding-top:8pt;">
    Exported with ChatVault &bull; https://caffeine.ai
  </p>
</body>
</html>`;

  const blob = new Blob([wordHtml], {
    type: "application/msword;charset=utf-8",
  });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `chat-export-${Date.now()}.doc`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
