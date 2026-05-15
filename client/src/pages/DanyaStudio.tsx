import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Loader2, ArrowLeft, Sparkles, Diamond } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrls?: string[];
  isLoading?: boolean;
};

// ─── TANJŌ Logo ───────────────────────────────────────────────────────────────
function TanjoLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/assets/LOGO01.png"
        alt="TANJŌ"
        width={size}
        height={size}
        style={{ objectFit: "contain" }}
      />
      <div className="flex flex-col leading-none">
        <span
          className="text-white font-light tracking-[0.3em] text-base"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          TANJŌ
        </span>
        <span
          className="text-[#B5522A] text-[8px] tracking-[0.4em] font-light mt-0.5"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          JEWELRY
        </span>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#B5522A]"
          style={{ animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#B5522A]/30 flex items-center justify-center flex-shrink-0 mt-1">
          <Diamond className="w-3.5 h-3.5 text-[#B5522A]" />
        </div>
      )}

      <div className={`max-w-[75%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {/* Sender label */}
        {!isUser && (
          <span className="text-[#B5522A] text-[10px] tracking-widest uppercase font-light px-1">
            Danya AI · Diretora Criativa
          </span>
        )}

        {/* Text bubble */}
        {msg.isLoading ? (
          <div className="bg-[#141414] border border-[#B5522A]/10 rounded-sm">
            <TypingDots />
          </div>
        ) : msg.content ? (
          <div
            className={`px-5 py-4 text-sm font-light leading-relaxed tracking-wide ${
              isUser
                ? "bg-[#B5522A]/20 border border-[#B5522A]/30 text-white/90 rounded-sm"
                : "bg-[#141414] border border-white/5 text-white/80 rounded-sm"
            }`}
          >
            {msg.content}
          </div>
        ) : null}

        {/* Images (no download) */}
        {msg.imageUrls && msg.imageUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
            {msg.imageUrls.map((url, i) => (
              <div
                key={i}
                className="relative overflow-hidden border border-[#B5522A]/20 rounded-sm group"
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src={url}
                  alt={`Conceito de joia ${i + 1}`}
                  className="w-full object-cover no-download select-none"
                  draggable={false}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white/60 text-xs tracking-widest uppercase font-light">
                    Conceito TANJŌ · {i + 1}/3
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Image Counter ────────────────────────────────────────────────────────────
function ImageCounter({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/30 text-xs tracking-widest uppercase font-light">Renders</span>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < count ? "bg-[#B5522A]" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <span className="text-white/20 text-xs font-light">{count}/3</span>
    </div>
  );
}

// ─── Main Studio Page ─────────────────────────────────────────────────────────
export default function DanyaStudio() {
  const [, navigate] = useLocation();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [leadName, setLeadName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imagesGenerated, setImagesGenerated] = useState(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [pendingImagePrompt, setPendingImagePrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Validate session on mount
  useEffect(() => {
    const token = sessionStorage.getItem("tanjo_session");
    const name = sessionStorage.getItem("tanjo_lead_name") || "Parceiro";
    if (!token) {
      navigate("/");
      return;
    }
    setSessionToken(token);
    setLeadName(name);
  }, [navigate]);

  // Load history
  const historyQuery = trpc.danya.getHistory.useQuery(
    { sessionToken: sessionToken! },
    { enabled: !!sessionToken }
  );

  // Session query
  const sessionQuery = trpc.leads.getSession.useQuery(
    { sessionToken: sessionToken! },
    { enabled: !!sessionToken }
  );

  useEffect(() => {
    if (sessionQuery.data) {
      setImagesGenerated(sessionQuery.data.imagesGenerated);
    }
  }, [sessionQuery.data]);

  // Load history into messages
  useEffect(() => {
    if (historyQuery.data && historyQuery.data.length > 0) {
      setMessages(
        historyQuery.data.map((m) => ({
          id: String(m.id),
          role: m.role,
          content: m.content,
          imageUrls: m.imageUrls || undefined,
        }))
      );
    } else if (historyQuery.data && historyQuery.data.length === 0 && sessionToken) {
      // First visit — trigger welcome message
      sendWelcome();
    }
  }, [historyQuery.data]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = trpc.danya.chat.useMutation({
    onSuccess: async (data) => {
      // Remove loading bubble
      setMessages((prev) => prev.filter((m) => !m.isLoading));

      // Add Danya's response
      const assistantMsg: Message = {
        id: nanoid(),
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // If image prompt detected, generate images
      if (data.imagePrompt && imagesGenerated < 3) {
        setPendingImagePrompt(data.imagePrompt);
        await generateImages(data.imagePrompt);
      }
    },
    onError: (err) => {
      setMessages((prev) => prev.filter((m) => !m.isLoading));
      toast.error(err.message || "Erro ao processar mensagem.");
    },
  });

  const generateImagesMutation = trpc.danya.generateImages.useMutation({
    onSuccess: (data) => {
      setImagesGenerated(data.imagesGenerated);
      setIsGeneratingImage(false);
      setPendingImagePrompt(null);

      // Add image message
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "img-loading"),
        {
          id: nanoid(),
          role: "assistant" as const,
          content: "Aqui está o conceito fotorrealista da sua joia, criado exclusivamente para a sua marca:",
          imageUrls: data.imageUrl ? [data.imageUrl] : [],
        },
      ]);

      // After images, trigger closing message if limit reached
      if (data.imagesGenerated >= 3) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nanoid(),
              role: "assistant",
              content:
                "Você utilizou os 3 conceitos disponíveis nesta sessão. Gostou do que viu? Posso encaminhar esses designs para a nossa equipe comercial formular um pré-orçamento de produção exclusivo para a sua marca. Deseja solicitar o orçamento oficial?",
            },
          ]);
        }, 1000);
      }
    },
    onError: (err) => {
      setIsGeneratingImage(false);
      setMessages((prev) => prev.filter((m) => m.id !== "img-loading"));
      toast.error(err.message || "Erro ao gerar imagem.");
    },
  });

  const generateImages = async (prompt: string) => {
    if (!sessionToken) return;
    setIsGeneratingImage(true);
    setMessages((prev) => [
      ...prev,
      {
        id: "img-loading",
        role: "assistant",
        content: "",
        isLoading: true,
      },
    ]);
    generateImagesMutation.mutate({ sessionToken, prompt });
  };

  const sendWelcome = () => {
    if (!sessionToken) return;
    const loadingId = nanoid();
    setMessages([{ id: loadingId, role: "assistant", content: "", isLoading: true }]);
    chatMutation.mutate({
      sessionToken,
      message: `[SISTEMA: O cliente ${leadName} acabou de acessar o estúdio. Faça a saudação inicial de boas-vindas.]`,
    });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !sessionToken || chatMutation.isPending) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: nanoid(), role: "user", content: text },
      { id: nanoid() + "-loading", role: "assistant", content: "", isLoading: true },
    ]);

    chatMutation.mutate({ sessionToken, message: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBusy = chatMutation.isPending || isGeneratingImage;

  if (!sessionToken) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#B5522A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#B5522A]/10 bg-[#0a0a0a]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <TanjoLogo size={28} />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#B5522A] animate-pulse" />
              <span className="text-white/40 text-xs tracking-widest uppercase font-light">Danya AI · Online</span>
            </div>
            <ImageCounter count={imagesGenerated} />
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-8">
        {/* Danya intro card */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#B5522A]/30 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Diamond className="w-7 h-7 text-[#B5522A]" />
            </div>
            <h2 className="text-white text-2xl font-extralight tracking-widest mb-3">Estúdio Danya AI</h2>
            <p className="text-white/30 text-sm font-light tracking-wide">Iniciando sessão criativa...</p>
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex flex-col gap-6 flex-1">
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="mt-8 sticky bottom-0 pb-4">
          {imagesGenerated >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 border border-[#B5522A]/20 bg-[#0f0f0f] text-center"
            >
              <p className="text-white/50 text-sm font-light">
                Limite de renders atingido.{" "}
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B5522A] hover:underline"
                >
                  Solicitar orçamento oficial →
                </a>
              </p>
            </motion.div>
          )}

          <div className="flex gap-3 items-end bg-[#111] border border-white/10 focus-within:border-[#B5522A]/40 transition-colors duration-300 p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva a joia que você imagina para a sua coleção..."
              rows={1}
              disabled={isBusy}
              className="flex-1 bg-transparent text-white placeholder-white/20 text-sm font-light resize-none outline-none leading-relaxed tracking-wide disabled:opacity-50"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isBusy}
              className="w-10 h-10 bg-[#B5522A] hover:bg-[#9a4523] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-95"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-white/15 text-xs text-center mt-3 font-light tracking-wide">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}

// nanoid helper (inline)
function nanoid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
