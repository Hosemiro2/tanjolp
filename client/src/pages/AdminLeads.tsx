import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, LogOut, ChevronLeft, ChevronRight, MessageSquare, Image as ImageIcon } from "lucide-react";
import { PerfilBadge } from "@/lib/perfil";

export default function AdminLeads() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Gate — checa se ainda é admin
  const meQuery = trpc.admin.me.useQuery();
  useEffect(() => {
    if (meQuery.data && !meQuery.data.isAdmin) {
      navigate("/admin/login");
    }
  }, [meQuery.data, navigate]);

  const leadsQuery = trpc.admin.listLeads.useQuery(
    { page, pageSize },
    { enabled: !!meQuery.data?.isAdmin }
  );

  const utils = trpc.useUtils();
  const logoutMutation = trpc.admin.logout.useMutation({
    onSuccess: () => {
      utils.admin.me.invalidate();
      navigate("/admin/login");
    },
  });

  if (meQuery.isLoading || !meQuery.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#B5522A] animate-spin" />
      </div>
    );
  }

  const total = leadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rows = leadsQuery.data?.rows ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 md:px-12 py-5 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[#B5522A]/60 text-[10px] tracking-[0.4em] uppercase font-light">
              TANJŌ Studio · Admin
            </span>
            <h1 className="text-white text-lg md:text-xl font-extralight tracking-wide mt-1">
              Leads B2B
            </h1>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-white/40 hover:text-white text-[11px] tracking-[0.22em] uppercase font-light flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 mb-10">
          <Stat label="Total de leads" value={String(total)} />
          <Stat label="Página atual" value={`${page} / ${totalPages}`} />
          <Stat label="Exibindo" value={`${rows.length}`} />
          <Stat label="Por página" value={`${pageSize}`} />
        </div>

        {/* Table */}
        {leadsQuery.isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-6 h-6 text-[#B5522A] animate-spin mx-auto" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-white/40 font-light">
            Nenhum lead cadastrado ainda.
          </div>
        ) : (
          <div className="border border-white/5 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f0f0f] border-b border-white/5">
                <tr className="text-left text-[10px] tracking-[0.22em] uppercase text-white/40 font-light">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3 text-center">Renders</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-[#0e0e0e] transition-colors">
                    <td className="px-4 py-4 text-white/50 text-xs font-light whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-white font-light text-sm">{lead.nome}</td>
                    <td className="px-4 py-4 text-white/60 font-light text-sm">
                      <a href={`mailto:${lead.email}`} className="hover:text-[#B5522A]">
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-white/60 font-light text-sm">
                      <a
                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#B5522A]"
                      >
                        {formatPhone(lead.whatsapp)}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-white/50 font-light text-sm">
                      {lead.empresa || <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <PerfilBadge classificacao={lead.classificacao} score={lead.score} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[#B5522A]/80 text-xs font-light">
                        <ImageIcon className="w-3 h-3" />
                        {lead.imagesGenerated}/4
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/lead/${lead.id}`}
                        className="inline-flex items-center gap-1.5 text-[#B5522A] hover:text-[#B5522A]/80 text-[11px] tracking-widest uppercase font-light"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Ver chat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white/50 text-xs font-light tracking-wider px-4">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0a0a0a] p-4 md:p-6">
      <div className="text-white/30 text-[10px] tracking-[0.3em] uppercase font-light">{label}</div>
      <div className="text-[#B5522A] text-2xl font-extralight font-serif mt-2">{value}</div>
    </div>
  );
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}
