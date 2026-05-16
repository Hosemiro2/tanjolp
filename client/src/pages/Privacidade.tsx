import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

/**
 * Política de Privacidade — Template LGPD (Lei 13.709/2018) em versão mínima.
 *
 * Esta versão identifica o controlador apenas por nome empresarial + e-mail
 * de contato (sem CNPJ ou endereço fiscal). A decisão foi tomada cientes da
 * trade-off: reduz exposição operacional, mas reduz também a força jurídica.
 *
 * Antes de publicar, conferir/preencher:
 *   - Data da última atualização
 *   - Nome do encarregado (pode usar o próprio sócio/dono)
 */
export default function Privacidade() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Topo simples */}
      <header className="border-b border-white/5 px-6 md:px-12 py-6">
        <div className="container flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/40 hover:text-white text-[11px] tracking-[0.22em] uppercase font-light transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </Link>
          <span className="text-[#B5522A]/70 text-[10px] tracking-[0.4em] uppercase font-light">
            TANJŌ Jewelry
          </span>
        </div>
      </header>

      <main className="container py-20 max-w-3xl">
        <div className="mb-16">
          <span className="text-[#B5522A]/60 text-[10px] tracking-[0.4em] uppercase font-light">
            Documento Institucional
          </span>
          <h1 className="text-4xl md:text-5xl font-extralight mt-4 mb-6 leading-tight">
            Política de
            <span className="font-serif italic text-[#B5522A]"> Privacidade</span>
          </h1>
          <p className="text-white/40 font-light text-sm">
            Última atualização:{" "}
            <span className="text-white/60">[PREENCHER DATA, ex.: 15 de maio de 2026]</span>
          </p>
        </div>

        <div className="prose-style space-y-10 text-white/60 font-light leading-relaxed text-[15px]">
          {/* Introdução */}
          <section>
            <p>
              A TANJŌ JEWELRY ("TANJŌ", "nós") respeita a sua privacidade e está comprometida com a
              proteção dos dados pessoais tratados em nossos canais digitais. Esta Política descreve
              como coletamos, utilizamos, armazenamos e protegemos os dados dos visitantes e clientes
              B2B da nossa landing page e do nosso Estúdio Virtual Danya AI, em conformidade com a
              Lei nº 13.709/2018 — Lei Geral de Proteção de Dados (LGPD).
            </p>
          </section>

          {/* 1. Controlador */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              1. Controlador dos Dados
            </h2>
            <p>O controlador responsável pelo tratamento dos seus dados pessoais é:</p>
            <div className="mt-4 pl-4 border-l border-[#B5522A]/30 text-white/50 text-sm">
              <div>
                Nome empresarial: <span className="text-white/70">TANJŌ Jewelry</span>
              </div>
              <div>
                E-mail de contato:{" "}
                <a
                  href="mailto:comercial@tanjoo.com.br"
                  className="text-[#B5522A]/80 hover:text-[#B5522A] transition-colors"
                >
                  comercial@tanjoo.com.br
                </a>
              </div>
              <div className="mt-2 text-white/40 text-xs italic">
                Sediada em São Paulo — SP, Brasil.
              </div>
            </div>
          </section>

          {/* 2. Dados coletados */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              2. Quais Dados Coletamos
            </h2>
            <p className="mb-3">
              Coletamos apenas os dados necessários para o relacionamento comercial B2B:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/55">
              <li>Nome completo</li>
              <li>E-mail corporativo</li>
              <li>Número de WhatsApp</li>
              <li>Nome da empresa ou marca (opcional)</li>
              <li>
                Conteúdo das mensagens trocadas com nossa consultora virtual no Estúdio Danya AI
              </li>
              <li>Dados técnicos básicos de navegação (data, hora e estatísticas anônimas de uso)</li>
            </ul>
          </section>

          {/* 3. Finalidades */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              3. Para Que Usamos os Dados
            </h2>
            <p className="mb-3">Seus dados são tratados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/55">
              <li>Identificá-lo como contato qualificado B2B (lojista, marca ou designer)</li>
              <li>Permitir o acesso ao Estúdio Virtual Danya AI</li>
              <li>Gerar conceitos visuais personalizados de joias com base nas suas preferências</li>
              <li>Entrar em contato comercial para apresentar pré-orçamento de fábrica</li>
              <li>Cumprir obrigações legais, regulatórias e fiscais</li>
            </ul>
          </section>

          {/* 4. Base legal */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">4. Base Legal</h2>
            <p>
              O tratamento dos seus dados é fundamentado em duas bases legais previstas na LGPD: o
              seu{" "}
              <span className="text-white/80">consentimento</span> (Art. 7º, I), manifestado ao
              prosseguir com o cadastro após o aviso de privacidade exibido no formulário, e o nosso{" "}
              <span className="text-white/80">legítimo interesse</span> (Art. 7º, IX) em conduzir
              relacionamento comercial B2B. Você pode retirar o consentimento a qualquer momento.
            </p>
          </section>

          {/* 5. Compartilhamento */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              5. Compartilhamento com Terceiros
            </h2>
            <p className="mb-3">
              A TANJŌ não vende, aluga ou comercializa dados pessoais. Compartilhamos informações
              apenas com:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/55">
              <li>
                Provedores de infraestrutura tecnológica (servidores e armazenamento) sob contrato e
                acordo de confidencialidade
              </li>
              <li>
                Provedores de tecnologia de visualização para gerar os conceitos no Estúdio Danya AI,
                sempre de forma agregada e sem identificação direta
              </li>
              <li>Autoridades públicas, mediante ordem judicial ou exigência legal</li>
            </ul>
          </section>

          {/* 6. Retenção */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              6. Tempo de Armazenamento
            </h2>
            <p>
              Mantemos seus dados pelo tempo necessário ao cumprimento das finalidades acima,
              observando prazos legais aplicáveis. Como regra geral, dados de leads B2B são mantidos
              por até <span className="text-white/80">2 (dois) anos</span> a partir do último
              contato, podendo ser estendido para cumprimento de obrigações fiscais e regulatórias.
              Após esse período, os dados são anonimizados ou eliminados de forma segura.
            </p>
          </section>

          {/* 7. Direitos do titular */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              7. Seus Direitos
            </h2>
            <p className="mb-3">A LGPD garante a você, titular dos dados, os seguintes direitos:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/55">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar os dados que mantemos sobre você</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço</li>
              <li>
                Revogar o consentimento e solicitar a eliminação dos dados tratados com base nele
              </li>
              <li>Ser informado sobre com quem seus dados foram compartilhados</li>
            </ul>
            <p className="mt-4">
              Para exercer qualquer desses direitos, basta nos enviar um e-mail para o encarregado
              indicado na seção 9.
            </p>
          </section>

          {/* 8. Segurança */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              8. Segurança da Informação
            </h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra
              acesso não autorizado, perda, alteração ou divulgação indevida. Isso inclui
              criptografia em trânsito, controle de acesso por credenciais e armazenamento em
              provedores reconhecidos do mercado.
            </p>
          </section>

          {/* 9. Encarregado */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              9. Encarregado pelo Tratamento de Dados (DPO)
            </h2>
            <p>
              Para questões relacionadas à privacidade e proteção de dados, entre em contato com
              nosso encarregado:
            </p>
            <div className="mt-4 pl-4 border-l border-[#B5522A]/30 text-white/50 text-sm">
              <div>
                Nome: <span className="text-white/70">[PREENCHER NOME DO ENCARREGADO]</span>
              </div>
              <div>
                E-mail:{" "}
                <a
                  href="mailto:comercial@tanjoo.com.br"
                  className="text-[#B5522A]/80 hover:text-[#B5522A] transition-colors"
                >
                  comercial@tanjoo.com.br
                </a>
              </div>
            </div>
          </section>

          {/* 10. Cookies */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              10. Cookies e Armazenamento Local
            </h2>
            <p>
              Utilizamos armazenamento local do navegador (sessionStorage) para manter sua sessão
              ativa no Estúdio Danya AI durante a conversa. Esses dados não são compartilhados com
              terceiros e são automaticamente eliminados ao fechar o navegador.
            </p>
          </section>

          {/* 11. Alterações */}
          <section>
            <h2 className="text-white text-lg font-light tracking-wide mb-4 mt-12">
              11. Alterações Nesta Política
            </h2>
            <p>
              Esta Política pode ser atualizada periodicamente. A versão vigente sempre estará
              disponível nesta página, com a data da última atualização indicada no topo.
              Recomendamos consulta regular.
            </p>
          </section>

          {/* Encerramento */}
          <section className="pt-8 border-t border-white/5">
            <p className="text-white/40 text-sm">
              Em caso de dúvidas adicionais sobre esta Política ou sobre o tratamento dos seus
              dados, entre em contato pelo e-mail{" "}
              <a
                href="mailto:comercial@tanjoo.com.br"
                className="text-[#B5522A]/80 hover:text-[#B5522A] transition-colors"
              >
                comercial@tanjoo.com.br
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#B5522A] hover:gap-3 text-[11px] tracking-[0.3em] uppercase font-light transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à página inicial
          </Link>
        </div>
      </main>
    </div>
  );
}
