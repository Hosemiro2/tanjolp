import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";

// ─── Phone formatter ─────────────────────────────────────────────────────────
function formatPhone(value: string): string {
  const raw = value.replace(/[^\d]/g, "").slice(0, 11);
  if (raw.length <= 2) return raw;
  if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
  if (raw.length <= 11) return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  return value;
}

// ─── Input Component ──────────────────────────────────────────────────────────
function TanjoInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white/50 max-md:text-white/80 text-xs tracking-widest uppercase font-light">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          bg-tanjo-bg-elevated border text-tanjo-text-primary placeholder-white/20 max-md:placeholder-white/45 text-sm font-light
          px-4 py-3.5 outline-none transition-all duration-300 tracking-wide
          focus:border-tanjo-accent focus:bg-tanjo-bg-overlay
          ${error ? "border-red-500/50" : "border-white/10 max-md:border-white/25 hover:border-white/20"}
        `}
      />
      {error && <span className="text-red-400 text-xs font-light">{error}</span>}
      {hint && !error && <span className="text-white/20 max-md:text-white/60 text-xs font-light">{hint}</span>}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function LeadForm() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", empresa: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const registerMutation = trpc.leads.register.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      sessionStorage.setItem("tanjo_session", data.sessionToken);
      sessionStorage.setItem("tanjo_lead_name", form.nome);
      setTimeout(() => navigate("/studio"), 1500);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao cadastrar. Tente novamente.");
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim() || form.nome.trim().length < 3)
      errs.nome = "Nome deve ter ao menos 3 caracteres.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "E-mail inválido.";
    if (!form.whatsapp.trim() || form.whatsapp.replace(/\D/g, "").length < 10)
      errs.whatsapp = "WhatsApp inválido.";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    registerMutation.mutate({
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      whatsapp: form.whatsapp.replace(/\D/g, ""),
      empresa: form.empresa.trim() || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="tanjo-border-glow bg-tanjo-bg-elevated p-12 text-center">
        <CheckCircle className="w-12 h-12 text-tanjo-accent mx-auto mb-6" />
        <h3 className="text-tanjo-text-primary text-xl font-extralight tracking-widest mb-3">Acesso Liberado</h3>
        <p className="text-white/40 text-sm font-light">Abrindo o Estúdio Danya AI...</p>
      </div>
    );
  }

  return (
    <div className="tanjo-border-glow bg-tanjo-bg-elevated p-6 sm:p-8 md:p-12">
      <div className="text-center mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 text-tanjo-accent text-xs tracking-[0.4em] uppercase font-light mb-4">
          <div
            className="w-1.5 h-1.5 rounded-full bg-tanjo-accent"
            style={{ animation: "tk-pulse 1.4s ease-in-out infinite" }}
          />
          Acesso ao Estúdio Virtual
        </div>
        <h3 className="text-tanjo-text-primary text-xl md:text-2xl font-extralight tracking-wide">
          Crie sua conta B2B
        </h3>
        <p className="text-white/30 max-md:text-white/70 text-sm font-light mt-2">
          Preencha os dados abaixo para acessar a Danya AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TanjoInput
          label="Nome Completo"
          value={form.nome}
          onChange={(v) => setForm((f) => ({ ...f, nome: v }))}
          placeholder="Seu nome"
          error={errors.nome}
        />
        <TanjoInput
          label="E-mail Corporativo"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          placeholder="email@suamarca.com.br"
          type="email"
          error={errors.email}
        />
        <TanjoInput
          label="WhatsApp"
          value={form.whatsapp}
          onChange={(v) => setForm((f) => ({ ...f, whatsapp: formatPhone(v) }))}
          placeholder="(11) 99999-9999"
          error={errors.whatsapp}
        />
        <TanjoInput
          label="Nome da Empresa (opcional)"
          value={form.empresa}
          onChange={(v) => setForm((f) => ({ ...f, empresa: v }))}
          placeholder="Sua marca ou loja"
        />

        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full group bg-tanjo-accent hover:bg-tanjo-accent-deep disabled:opacity-50 disabled:cursor-not-allowed text-tanjo-text-primary py-4 text-sm tracking-widest font-light uppercase transition-all duration-300 flex items-center justify-center gap-3"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Iniciar Criação com IA
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* LGPD — aviso discreto (sem checkbox bloqueante) */}
        <div className="md:col-span-2">
          <p className="text-white/25 max-md:text-white/65 text-[11px] font-light leading-relaxed text-center">
            Ao continuar, você concorda com nossa{" "}
            <a
              href="/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-tanjo-accent/80 max-md:text-tanjo-accent hover:text-tanjo-accent-bright underline underline-offset-2 decoration-tanjo-accent/30 max-md:decoration-tanjo-accent/60 hover:decoration-tanjo-accent-bright transition-colors"
            >
              Política de Privacidade
            </a>
            .
          </p>
        </div>
      </form>
    </div>
  );
}
