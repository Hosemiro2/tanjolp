import { useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Diamond, Mail, Phone, Building2, Calendar } from "lucide-react";

export default function AdminLeadDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/lead/:id");
  const leadId = params?.id ? parseInt(params.id, 10) : NaN;

  const meQuery = trpc.admin.me.useQuery();
  useEffect(() => {
    if (meQuery.data && !meQuery.data.isAdmin) {
      navigate("/admin/login");
    }
  }, [meQuery.data, navigate]);

  const detailQuery = trpc.admin.getLead.useQuery(
    { id: leadId },
    { enabled: !!meQuery.data?.isAdmin && Number.isFinite(leadId) }
  );

  if (meQuery.isLoading || !meQuery.data?.isAdmin || detailQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#B5522A] animate-spin" />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/50">
        <div className="text-center">
          <p className="mb-4">Lead não encontrado.</p>
          <Link
            href="/admin"
            className="text-[#B5522A] hover:underline text-sm tracking-wider uppercase font-light"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const { lead, history } = detailQuery.data;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/5 px-6 md:px-12 py-5 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-white/40 hover:text-white text-[11px] tracking-[0.22em] uppercase font-light transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </Link>
          <span className="text-[#B5522A]/60 text-[10px] tracking-[0.4em] uppercase font-light">
            Lead #{lead.id}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-12 py-10">
        {/* Lead info */}
        <section className="bg-[#0f0f0f] border border-white/5 p-6 md:p-8 mb-10">
          <h1 className="text-white text-2xl md:text-3xl font-extralight mb-1">{lead.nome}</h1>
          {lead.empresa && (
            <p className="text-white/40 text-sm font-light tracking-wide mb-6">{lead.empresa}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
            <InfoRow
              icon={<Mail className="w-3.5 h-3.5" />}
              label="E-mail"
              value={
                <a href={`mailto:${lead.email}`} className="text-white/80 hover:text-[#B5522A]">
                  {lead.email}
                </a>
              }
            />
            <InfoRow
              icon={<Phone className="w-3.5 h-3.5" />}
              label="WhatsApp"
              value={
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-[#B5522A]"
                >
                  {lead.whatsapp}
                </a>
              }
            />
            <InfoRow
              icon={<Building2 className="w-3.5 h-3.5" />}
              label="Empresa"
              value={lead.empresa || <span className="text-white/30">—</span>}
            />
            <InfoRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Cadastro"
              value={formatDate(lead.createdAt)}
            />
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-2 text-[#B5522A]/80 text-sm font-light">
            <Diamond className="w-3.5 h-3.5" />
            {lead.imagesGenerated} de 3 conceitos gerados
          </div>
        </section>

        {/* Chat history */}
        <section>
          <h2 className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-light mb-6">
            Conversa com a Danya AI
          </h2>
          {history.length === 0 ? (
            <p className="text-white/30 font-light text-sm py-8 text-center">
              Sem mensagens nesta sessão.
            </p>
          ) : (
            <div className="space-y-6">
              {history.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#B5522A]/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <Diamond className="w-3.5 h-3.5 text-[#B5522A]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] flex flex-col gap-2 ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <span className="text-[#B5522A] text-[10px] tracking-widest uppercase font-light px-1">
                        Danya AI
                      </span>
                    )}
                    <div
                      className={`px-5 py-4 text-sm font-light leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#B5522A]/20 border border-[#B5522A]/30 text-white/90"
                          : "bg-[#141414] border border-white/5 text-white/80"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.imageUrls && msg.imageUrls.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                        {msg.imageUrls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-[#B5522A]/20 hover:border-[#B5522A] transition-colors block"
                          >
                            <img
                              src={url}
                              alt={`Conceito ${i + 1}`}
                              className="w-full"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    <span className="text-white/20 text-[10px] font-light px-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#B5522A]/60 mt-0.5">{icon}</div>
      <div>
        <div className="text-white/40 text-[10px] tracking-widest uppercase font-light">{label}</div>
        <div className="text-white/80 font-light mt-1">{value}</div>
      </div>
    </div>
  );
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
