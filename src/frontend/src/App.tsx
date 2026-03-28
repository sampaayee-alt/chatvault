import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Database,
  Download,
  FileCheck,
  FileText,
  Github,
  Globe,
  Loader2,
  MessageSquare,
  Shield,
  Star,
  Twitter,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatPreview } from "./components/ChatPreview";
import { ExportPanel } from "./components/ExportPanel";
import {
  useFetchUrlContent,
  useGetTotalExports,
  useListChatSessions,
} from "./hooks/useQueries";
import {
  type ParsedChat,
  parseHtmlToChat,
  parseManualText,
} from "./utils/chatParser";

// SEO setup
function useSEO() {
  useEffect(() => {
    document.title = "ChatVault — Export Your AI Chats as HTML, PDF, Word";
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(
        `meta[${attr}="${name}"]`,
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta(
      "description",
      "Export ChatGPT, Grok, Claude, Gemini conversations as beautiful HTML, PDF, or Word files. Preserve full styling, code blocks, and formatting.",
    );
    setMeta(
      "keywords",
      "export chatgpt, export grok, chat export, AI chat download, ChatGPT to PDF, ChatGPT to Word, save AI conversation",
    );
    setMeta("og:title", "ChatVault — Export Your AI Chats", true);
    setMeta(
      "og:description",
      "Paste any AI chat share link and download it as HTML, PDF, or Word. Works with ChatGPT, Grok, Claude, Gemini.",
      true,
    );
    setMeta("og:type", "website", true);
    setMeta("og:url", window.location.href, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "ChatVault — Export Your AI Chats");
    setMeta(
      "twitter:description",
      "Export any AI conversation as HTML, PDF, or Word. Full styling preserved.",
    );

    // JSON-LD
    let jsonLd = document.querySelector("script[type='application/ld+json']");
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "ChatVault",
      description:
        "Export AI chat conversations as HTML, PDF, or Word documents.",
      applicationCategory: "Productivity",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
  }, []);
}

const sampleChat: ParsedChat = {
  platform: "chatgpt",
  title: "Building a REST API in Python",
  url: "",
  messages: [
    {
      role: "user",
      content: "How do I build a REST API in Python using FastAPI?",
      timestamp: "10:23 AM",
    },
    {
      role: "assistant",
      content:
        'Great choice! FastAPI is one of the fastest frameworks for building APIs in Python. Here\'s a quick example:\n\n```python\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/items/{item_id}")\nasync def read_item(item_id: int, q: str | None = None):\n    return {"item_id": item_id, "q": q}\n```\n\n**Key features:**\n- Automatic API documentation at `/docs`\n- Type checking with Pydantic\n- Async support out of the box\n\nRun with: `uvicorn main:app --reload`',
      timestamp: "10:23 AM",
    },
    {
      role: "user",
      content: "How do I add authentication to this?",
      timestamp: "10:25 AM",
    },
    {
      role: "assistant",
      content:
        'For authentication, you can use **JWT tokens** with `python-jose`. Here\'s the pattern:\n\n```python\nfrom fastapi.security import OAuth2PasswordBearer\nfrom jose import JWTError, jwt\n\noauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")\n\nasync def get_current_user(token: str = Depends(oauth2_scheme)):\n    credentials_exception = HTTPException(status_code=401)\n    try:\n        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])\n        username = payload.get("sub")\n        if username is None:\n            raise credentials_exception\n    except JWTError:\n        raise credentials_exception\n```\n\nThis gives you secure, stateless authentication for all your endpoints.',
      timestamp: "10:26 AM",
    },
  ],
};

export default function App() {
  useSEO();

  const [url, setUrl] = useState("");
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualText, setManualText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchMutation = useFetchUrlContent();
  const { data: savedChats, isLoading: loadingVault } = useListChatSessions();
  const { data: totalExports } = useGetTotalExports();

  const handleFetch = async () => {
    if (!url.trim()) {
      toast.error("Please enter a share URL.");
      return;
    }
    setError(null);
    setShowDemo(false);
    try {
      const html = await fetchMutation.mutateAsync(url.trim());
      const parsed = parseHtmlToChat(html, url.trim());
      if (parsed.messages.length === 0) {
        setError(
          "Could not auto-parse this chat. Please use the manual paste option below.",
        );
        setShowManual(true);
        setChat(null);
      } else {
        setChat(parsed);
        toast.success(`Found ${parsed.messages.length} messages!`);
        setTimeout(
          () => previewRef.current?.scrollIntoView({ behavior: "smooth" }),
          200,
        );
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch. Try the manual paste option.");
      setShowManual(true);
    }
  };

  const handleManualImport = () => {
    if (!manualText.trim()) {
      toast.error("Please paste your chat text.");
      return;
    }
    const messages = parseManualText(manualText);
    if (messages.length === 0) {
      toast.error("Could not detect any messages.");
      return;
    }
    const platform =
      url.includes("chatgpt") || url.includes("openai")
        ? "chatgpt"
        : url.includes("grok")
          ? "grok"
          : url.includes("claude")
            ? "claude"
            : url.includes("gemini")
              ? "gemini"
              : "unknown";
    setChat({ messages, platform, url: url || undefined });
    setShowManual(false);
    setError(null);
    toast.success(`Imported ${messages.length} messages!`);
    setTimeout(
      () => previewRef.current?.scrollIntoView({ behavior: "smooth" }),
      200,
    );
  };

  const activeChat = chat || (showDemo ? sampleChat : null);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Toaster position="top-right" theme="dark" />

      {/* NAV */}
      <header className="no-print sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">
                ChatVault
              </span>
            </div>

            {/* Nav links */}
            <nav
              className="hidden md:flex items-center gap-6"
              aria-label="Main navigation"
            >
              {["Features", "Export", "How It Works", "Vault"].map((link) => (
                <a
                  key={link}
                  data-ocid={`nav.${link.toLowerCase().replace(/ /g, "-")}.link`}
                  href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link}
                </a>
              ))}
            </nav>

            {/* CTAs */}
            <div className="flex items-center gap-2">
              <Button
                data-ocid="nav.export.primary_button"
                size="sm"
                className="btn-gradient text-white font-semibold rounded-full border-0 text-xs px-4"
                onClick={() => document.getElementById("hero-input")?.focus()}
              >
                Export Chat
              </Button>
              <Button
                data-ocid="nav.vault.secondary_button"
                size="sm"
                variant="outline"
                className="rounded-full text-xs px-4 border-border"
                onClick={() =>
                  document
                    .getElementById("vault")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Save to Vault
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="no-print pt-24 pb-16 px-4 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.14 220), oklch(0.52 0.24 290), transparent 70%)",
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-xs text-muted-foreground mb-8">
              <Zap className="w-3 h-3 text-vault-cyan" />
              Works with ChatGPT · Grok · Claude · Gemini · Perplexity
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              <span className="text-foreground block">
                Export Your AI Chats.
              </span>
              <span className="gradient-text block">
                Keep Every Conversation.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Paste any share link from ChatGPT, Grok, or Claude. Get an instant
              live preview and download as a perfect HTML, PDF, or Word file —
              with all styling preserved.
            </p>

            {/* URL Input bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 p-1.5 rounded-full border border-border bg-secondary/80 backdrop-blur focus-within:border-vault-cyan/50 transition-colors">
                <input
                  id="hero-input"
                  data-ocid="hero.url.input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                  placeholder="Paste a ChatGPT, Grok, or Claude share link…"
                  className="flex-1 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
                />
                <Button
                  data-ocid="hero.fetch.primary_button"
                  onClick={handleFetch}
                  disabled={fetchMutation.isPending}
                  className="btn-gradient text-white font-semibold rounded-full border-0 px-5 text-sm flex-shrink-0"
                >
                  {fetchMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Fetching…
                    </>
                  ) : (
                    <>
                      Fetch &amp; Preview{" "}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-400" /> No account needed
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-400" /> 100% private
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-400" /> Free to use
                </span>
              </div>
            </div>

            {/* Manual toggle */}
            <div className="mt-6">
              <button
                type="button"
                data-ocid="hero.manual.toggle"
                onClick={() => setShowManual(!showManual)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showManual ? "rotate-180" : ""}`}
                />
                Or paste chat manually
              </button>
            </div>

            <AnimatePresence>
              {showManual && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 max-w-2xl mx-auto overflow-hidden"
                >
                  <div className="card-glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-3 text-left">
                      Paste your raw chat text below. Use prefixes like{" "}
                      <code className="text-vault-cyan">You:</code>,{" "}
                      <code className="text-vault-cyan">ChatGPT:</code>,{" "}
                      <code className="text-vault-cyan">Grok:</code>, etc. to
                      identify speakers.
                    </p>
                    <Textarea
                      data-ocid="hero.manual.textarea"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="You: How does quantum computing work?\n\nChatGPT: Quantum computing uses qubits instead of classical bits…"
                      className="bg-background border-border text-sm min-h-[140px] resize-none font-mono"
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        data-ocid="hero.manual.submit_button"
                        onClick={handleManualImport}
                        size="sm"
                        className="btn-gradient text-white rounded-lg border-0 font-semibold text-xs"
                      >
                        Import Chat
                      </Button>
                      <Button
                        data-ocid="hero.manual.cancel_button"
                        onClick={() => setShowManual(false)}
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                      >
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ERROR STATE */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto px-4 mb-6"
            >
              <div
                data-ocid="fetch.error_state"
                className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-0.5">Fetch failed</p>
                  <p className="text-destructive/80 text-xs">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOADING STATE */}
        {fetchMutation.isPending && (
          <div
            data-ocid="fetch.loading_state"
            className="max-w-6xl mx-auto px-4 mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
              <div className="card-glass rounded-xl p-5 space-y-4">
                {(["a", "b", "c", "d"] as const).map((k) => (
                  <div key={k} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24 bg-secondary" />
                      <Skeleton className="h-12 w-full bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-glass rounded-xl p-5 space-y-3">
                {(["a", "b", "c"] as const).map((k) => (
                  <Skeleton
                    key={k}
                    className="h-24 w-full bg-secondary rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAT PREVIEW + EXPORT */}
        <AnimatePresence>
          {activeChat && !fetchMutation.isPending && (
            <motion.section
              ref={previewRef}
              id="export"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto px-4 pb-8"
            >
              {showDemo && (
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Badge
                    variant="outline"
                    className="text-xs border-vault-cyan/30 text-vault-cyan"
                  >
                    <Star className="w-3 h-3 mr-1" /> Demo Preview
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Paste a real URL above to see your actual chat
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">
                <ChatPreview chat={activeChat} />
                <ExportPanel chat={activeChat} />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* FEATURES */}
        <section
          id="features"
          className="no-print max-w-6xl mx-auto px-4 py-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-center text-foreground mb-3">
              Why ChatVault?
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              The simplest way to preserve your most valuable AI conversations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: Zap,
                  title: "Instant Previews",
                  desc: "See your chat rendered beautifully in real-time before exporting. What you see is what you get.",
                  ocid: "features.instant.card",
                },
                {
                  icon: FileCheck,
                  title: "Full Fidelity",
                  desc: "Code blocks, markdown formatting, timestamps — everything preserved perfectly across all export formats.",
                  ocid: "features.fidelity.card",
                },
                {
                  icon: Globe,
                  title: "Format Choice",
                  desc: "Download as self-contained HTML, print-ready PDF, or editable Word doc — all with a single click.",
                  ocid: "features.formats.card",
                },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    data-ocid={f.ocid}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="card-glass rounded-xl p-6 hover:border-vault-cyan/30 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg btn-gradient flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="no-print max-w-5xl mx-auto px-4 py-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-center text-foreground mb-3">
              How It Works
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
              Three simple steps to preserve any AI conversation.
            </p>
            <div className="relative">
              {/* Connecting line */}
              <div
                className="absolute top-10 left-1/2 hidden md:block w-2/3 -translate-x-1/2 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, var(--vault-cyan), var(--vault-purple))",
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    icon: Copy,
                    title: "Copy Share Link",
                    desc: "Open your ChatGPT, Grok, or Claude conversation and copy the share link from the menu.",
                  },
                  {
                    step: "02",
                    icon: MessageSquare,
                    title: "Instant Preview",
                    desc: "Paste the link into ChatVault. We fetch and render your entire conversation instantly.",
                  },
                  {
                    step: "03",
                    icon: Download,
                    title: "Download & Share",
                    desc: "Choose HTML, PDF, or Word format. Your export preserves all code, formatting, and styling.",
                  },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.step}
                      data-ocid={`how-it-works.step.${i + 1}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.15 }}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="relative mb-5">
                        <div className="w-20 h-20 rounded-2xl card-glass flex items-center justify-center">
                          <Icon
                            className="w-8 h-8"
                            style={{ color: "var(--vault-cyan)" }}
                          />
                        </div>
                        <div
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-xs font-bold text-white flex items-center justify-center"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--vault-cyan), var(--vault-purple))",
                          }}
                        >
                          {s.step}
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {s.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {s.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </section>

        {/* VAULT SECTION */}
        <section id="vault" className="no-print max-w-6xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Your Vault
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Saved conversations ready to re-export anytime.
                </p>
              </div>
              {totalExports !== undefined && (
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground text-sm"
                >
                  <Database className="w-3 h-3 mr-1.5" />
                  {totalExports.toString()} total exports
                </Badge>
              )}
            </div>

            {loadingVault ? (
              <div
                data-ocid="vault.loading_state"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {(["a", "b", "c"] as const).map((k) => (
                  <Skeleton key={k} className="h-32 rounded-xl bg-secondary" />
                ))}
              </div>
            ) : !savedChats || savedChats.length === 0 ? (
              <div
                data-ocid="vault.empty_state"
                className="card-glass rounded-xl p-12 text-center"
              >
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Your vault is empty
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  After exporting a chat, click "Save to Vault" to keep it here
                  for future downloads.
                </p>
              </div>
            ) : (
              <div
                data-ocid="vault.list"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {savedChats.map((session, i) => (
                  <motion.div
                    key={session.id.toString()}
                    data-ocid={`vault.item.${i + 1}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-glass rounded-xl p-5 hover:border-vault-cyan/30 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      try {
                        const msgs = JSON.parse(session.parsedChatJson);
                        setChat({
                          messages: msgs,
                          platform: "unknown",
                          title: session.title,
                          url: session.sourceUrl,
                        });
                        setShowDemo(false);
                        setTimeout(
                          () =>
                            previewRef.current?.scrollIntoView({
                              behavior: "smooth",
                            }),
                          200,
                        );
                      } catch {
                        toast.error("Could not load saved chat");
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-2 flex-1">
                        {session.title}
                      </h4>
                      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>
                    {session.sourceUrl && (
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {session.sourceUrl}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        Number(session.timestamp) / 1_000_000,
                      ).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="no-print border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg btn-gradient flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-foreground">ChatVault</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export and preserve your AI conversations in any format,
                forever.
              </p>
              <div className="flex gap-3 mt-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: ["Features", "How It Works", "Export", "Vault"],
              },
              {
                title: "Formats",
                links: [
                  "HTML Export",
                  "PDF Export",
                  "Word Export",
                  "All Platforms",
                ],
              },
              {
                title: "Support",
                links: [
                  "Documentation",
                  "FAQ",
                  "Privacy Policy",
                  "Terms of Service",
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="/"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} ChatVault. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-vault-cyan hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
