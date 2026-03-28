export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  id?: string;
}

export interface ParsedChat {
  messages: ChatMessage[];
  platform: "chatgpt" | "grok" | "claude" | "gemini" | "perplexity" | "unknown";
  title?: string;
  url?: string;
}

function detectPlatform(url: string): ParsedChat["platform"] {
  if (url.includes("chatgpt.com") || url.includes("chat.openai.com"))
    return "chatgpt";
  if (url.includes("grok.x.ai") || url.includes("x.com/i/grok")) return "grok";
  if (url.includes("claude.ai")) return "claude";
  if (url.includes("gemini.google.com") || url.includes("bard.google.com"))
    return "gemini";
  if (url.includes("perplexity.ai")) return "perplexity";
  return "unknown";
}

function parseChatGPTNextData(html: string): ChatMessage[] | null {
  try {
    const match = html.match(
      /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s,
    );
    if (!match) return null;

    const json = JSON.parse(match[1]);
    const pageProps = json?.props?.pageProps;

    const mapping =
      pageProps?.serverResponse?.data?.mapping ||
      pageProps?.serverResponse?.data?.linear_conversation_mapping ||
      pageProps?.sharedConversation?.linear_conversation;

    if (mapping && typeof mapping === "object" && !Array.isArray(mapping)) {
      const messages: ChatMessage[] = [];
      const nodes = Object.values(mapping) as any[];

      const nodeMap: Record<string, any> = {};
      for (const n of nodes) {
        if (n?.id) nodeMap[n.id] = n;
      }

      const visited = new Set<string>();
      const ordered: any[] = [];

      function traverse(id: string) {
        if (visited.has(id) || !nodeMap[id]) return;
        visited.add(id);
        ordered.push(nodeMap[id]);
        const children = nodeMap[id]?.children || [];
        for (const childId of children) traverse(childId);
      }

      const roots = nodes.filter((n: any) => !n?.parent || !nodeMap[n?.parent]);
      for (const r of roots) {
        if (r?.id) traverse(r.id);
      }

      for (const node of ordered) {
        const msg = node?.message;
        if (!msg || !msg?.content) continue;
        const role = msg.author?.role;
        if (role !== "user" && role !== "assistant") continue;
        const parts = msg.content?.parts || [];
        const text = parts
          .filter((p: any) => typeof p === "string")
          .join("\n")
          .trim();
        if (!text) continue;
        const ts = msg.create_time
          ? new Date(msg.create_time * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined;
        messages.push({ role, content: text, timestamp: ts, id: msg.id });
      }

      if (messages.length > 0) return messages;
    }

    if (Array.isArray(mapping)) {
      return mapping
        .filter(
          (item: any) =>
            item?.message?.author?.role && item?.message?.content?.parts,
        )
        .map((item: any) => ({
          role: (item.message.author.role === "user" ? "user" : "assistant") as
            | "user"
            | "assistant",
          content: (item.message.content.parts || [])
            .filter((p: any) => typeof p === "string")
            .join("\n")
            .trim(),
          id: item.message.id,
        }))
        .filter((m) => m.content.length > 0);
    }

    return null;
  } catch {
    return null;
  }
}

function parseGrokHTML(html: string): ChatMessage[] | null {
  try {
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
    if (jsonMatch) {
      const state = JSON.parse(jsonMatch[1]);
      const messages: ChatMessage[] = [];
      const convo = state?.grokConversation?.conversation?.messages || [];
      for (const msg of convo) {
        const role =
          msg?.sender === "HUMAN" || msg?.role === "user"
            ? "user"
            : "assistant";
        const text = msg?.message || msg?.content || msg?.text || "";
        if (text) messages.push({ role, content: text });
      }
      if (messages.length > 0) return messages;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const messages: ChatMessage[] = [];

    const userTurns = Array.from(
      doc.querySelectorAll(
        '[data-testid="human-turn"], .human-turn, [class*="humanTurn"]',
      ),
    );
    const aiTurns = Array.from(
      doc.querySelectorAll(
        '[data-testid="grok-turn"], .grok-turn, [class*="grokTurn"]',
      ),
    );

    if (userTurns.length > 0 || aiTurns.length > 0) {
      const allTurns: Array<{ role: "user" | "assistant"; el: Element }> = [];
      for (const el of userTurns) allTurns.push({ role: "user", el });
      for (const el of aiTurns) allTurns.push({ role: "assistant", el });

      allTurns.sort((a, b) => {
        const pos = a.el.compareDocumentPosition(b.el);
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

      for (const { role, el } of allTurns) {
        const text = el.textContent?.trim() || "";
        if (text) messages.push({ role, content: text });
      }
    }

    return messages.length > 0 ? messages : null;
  } catch {
    return null;
  }
}

function parseGenericHTML(html: string): ChatMessage[] | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const messages: ChatMessage[] = [];

    const selectors = [
      { selector: '[data-message-author-role="user"]', role: "user" as const },
      {
        selector: '[data-message-author-role="assistant"]',
        role: "assistant" as const,
      },
      { selector: ".user-message, .human-message", role: "user" as const },
      {
        selector: ".assistant-message, .ai-message, .bot-message",
        role: "assistant" as const,
      },
    ];

    const found: Array<{ role: "user" | "assistant"; el: Element }> = [];
    for (const { selector, role } of selectors) {
      for (const el of Array.from(doc.querySelectorAll(selector))) {
        found.push({ role, el });
      }
    }

    if (found.length > 0) {
      found.sort((a, b) => {
        const pos = a.el.compareDocumentPosition(b.el);
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
      for (const { role, el } of found) {
        const text = el.textContent?.trim() || "";
        if (text) messages.push({ role, content: text });
      }
      return messages;
    }

    return null;
  } catch {
    return null;
  }
}

export function parseManualText(text: string): ChatMessage[] {
  const lines = text.split("\n");
  const messages: ChatMessage[] = [];
  let currentRole: "user" | "assistant" | null = null;
  let currentContent: string[] = [];

  const userPrefixes = /^(you|user|human|me):\s*/i;
  const asPrefixes =
    /^(chatgpt|gpt|grok|claude|gemini|assistant|ai|bot|perplexity):\s*/i;

  function flush() {
    if (currentRole && currentContent.length > 0) {
      const content = currentContent.join("\n").trim();
      if (content) messages.push({ role: currentRole, content });
    }
    currentContent = [];
  }

  for (const line of lines) {
    if (userPrefixes.test(line)) {
      flush();
      currentRole = "user";
      currentContent.push(line.replace(userPrefixes, ""));
    } else if (asPrefixes.test(line)) {
      flush();
      currentRole = "assistant";
      currentContent.push(line.replace(asPrefixes, ""));
    } else {
      currentContent.push(line);
    }
  }
  flush();

  if (messages.length === 0 && text.trim()) {
    const blocks = text.split(/\n\n+/).filter((b) => b.trim());
    blocks.forEach((block, i) => {
      messages.push({
        role: i % 2 === 0 ? "user" : "assistant",
        content: block.trim(),
      });
    });
  }

  return messages;
}

export function parseHtmlToChat(html: string, url: string): ParsedChat {
  const platform = detectPlatform(url);
  let messages: ChatMessage[] | null = null;
  let title: string | undefined;

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch)
    title = titleMatch[1]
      .replace(/ ?[|-] ?(ChatGPT|Grok|Claude).*$/i, "")
      .trim();

  if (platform === "chatgpt") {
    messages = parseChatGPTNextData(html);
  } else if (platform === "grok") {
    messages = parseGrokHTML(html);
  }

  if (!messages) {
    messages = parseGenericHTML(html);
  }

  if (!messages || messages.length === 0) {
    return { messages: [], platform, title, url };
  }

  return { messages, platform, title, url };
}
