import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";

// ─── CNPJ Validation ──────────────────────────────────────────────────────────
function validateCNPJ(cnpj: string): boolean {
  const raw = cnpj.replace(/[^\d]/g, "");
  if (raw.length !== 14) return false;
  if (/^(\d)\1+$/.test(raw)) return false;

  const calc = (digits: string, weights: number[]) => {
    const sum = digits.split("").reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(raw.slice(0, 12), w1);
  const d2 = calc(raw.slice(0, 13), w2);

  return parseInt(raw[12]) === d1 && parseInt(raw[13]) === d2;
}

function formatCNPJ(value: string): string {
  const raw = value.replace(/[^\d]/g, "").slice(0, 14);
  if (raw.length <= 2) return raw;
  if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
  if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
  if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
}

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
      <label className="text-white/50 text-xs tracking-widest uppercase font-light">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          bg-[#111] border text-white placeholder-white/20 text-sm font-light
          px-4 py-3.5 outline-none transition-all duration-300 tracking-wide
          focus:border-[#B5522A] focus:bg-[#131313]
          ${error ? "border-red-500/50" : "border-white/10 hover:border-white/20"}
        `}
      />
      {error && <span className="text-red-400 text-xs font-light">{error}</span>}
      {hint && !error && <span className="text-white/20 text-xs font-light">{hint}</span>}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function LeadForm() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", cnpj: "", empresa: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const registerMutation = trpc.leads.register.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      // Store session token for chat access
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
    if (!form.nome.trim() || form.nome.trim().length < 3) errs.nome = "Nome deve ter ao menos 3 caracteres.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "E-mail inválido.";
    if (!form.whatsapp.trim() || form.whatsapp.replace(/\D/g, "").length < 10) errs.whatsapp = "WhatsApp inválido.";
    const cnpjRaw = form.cnpj.replace(/[^\d]/g, "");
    if (cnpjRaw.length !== 14) errs.cnpj = "CNPJ deve ter 14 dígitos.";
    else if (!validateCNPJ(form.cnpj)) errs.cnpj = "CNPJ inválido. Verifique o número.";
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
      cnpj: form.cnpj.replace(/[^\d]/g, ""),
      empresa: form.empresa.trim() || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="tanjo-border-glow bg-[#0f0f0f] p-12 text-center">
        <CheckCircle className="w-12 h-12 text-[#B5522A] mx-auto mb-6" />
        <h3 className="text-white text-xl font-extralight tracking-widest mb-3">Acesso Liberado</h3>
        <p className="text-white/40 text-sm font-light">Abrindo o Estúdio Danya AI...</p>
      </div>
    );
  }

  return (
    <div className="tanjo-border-glow bg-[#0f0f0f] p-8 md:p-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-[#B5522A] text-xs tracking-[0.4em] uppercase font-light mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#B5522A] animate-pulse" />
          Acesso ao Estúdio Virtual
        </div>
        <h3 className="text-white text-2xl font-extralight tracking-wide">
          Crie sua conta B2B
        </h3>
        <p className="text-white/30 text-sm font-light mt-2">
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
          label="CNPJ"
          value={form.cnpj}
          onChange={(v) => setForm((f) => ({ ...f, cnpj: formatCNPJ(v) }))}
          placeholder="00.000.000/0001-00"
          error={errors.cnpj}
          hint="Obrigatório para acesso B2B"
        />
        <div className="md:col-span-2">
          <TanjoInput
            label="Nome da Empresa (opcional)"
            value={form.empresa}
            onChange={(v) => setForm((f) => ({ ...f, empresa: v }))}
            placeholder="Sua marca ou loja"
          />
        </div>

        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full group bg-[#B5522A] hover:bg-[#9a4523] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 text-sm tracking-widest font-light uppercase transition-all duration-300 flex items-center justify-center gap-3"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando CNPJ...
              </>
            ) : (
              <>
                Iniciar Criação com IA
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
