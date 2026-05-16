import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");

  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: () => {
      toast.success("Bem-vindo.");
      navigate("/admin");
    },
    onError: (err) => {
      toast.error(err.message || "Senha inválida.");
      setPassword("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    loginMutation.mutate({ password });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#B5522A]/30 mb-6">
            <Lock className="w-5 h-5 text-[#B5522A]" />
          </div>
          <h1 className="text-white text-2xl font-extralight tracking-[0.3em] uppercase">
            Painel · Leads
          </h1>
          <p className="text-white/30 text-xs font-light tracking-widest uppercase mt-3">
            TANJŌ Studio
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#0f0f0f] border border-[#B5522A]/20 p-8 space-y-6"
        >
          <div className="flex flex-col gap-2">
            <label className="text-white/50 text-xs tracking-widest uppercase font-light">
              Senha de acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="bg-[#111] border border-white/10 focus:border-[#B5522A] text-white text-sm font-light px-4 py-3.5 outline-none transition-all tracking-wide"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending || !password.trim()}
            className="w-full bg-[#B5522A] hover:bg-[#9a4523] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 text-xs tracking-widest font-light uppercase transition-colors flex items-center justify-center gap-2"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="text-white/15 text-[10px] tracking-[0.3em] uppercase font-light text-center mt-8">
          Área restrita
        </p>
      </div>
    </div>
  );
}
