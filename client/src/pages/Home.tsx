import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { Diamond, Sparkles, Shield, ChevronDown, ArrowRight, Star, Gem, Zap } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import Atmosphere from "@/components/Atmosphere";
import { IJewelViewer } from "@/components/IJewelViewer";

// ─── Scroll hook ──────────────────────────────────────────────────────────────
function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return scrollY;
}

// ─── Minimal Hero Background ──────────────────────────────────────────────────
// Clean, breathable: just a perspective grid + soft glow + a few particles
function HeroBackground({ scrollY }: { scrollY: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.8,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 6,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Perspective grid — subtle, receding */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(177,79,50,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(177,79,50,0.055) 1px, transparent 1px)
          `,
          backgroundSize: "70px 70px",
          backgroundPosition: `0 ${(scrollY * 0.25) % 70}px`,
          transform: "perspective(800px) rotateX(50deg) scaleX(1.6)",
          transformOrigin: "50% 100%",
          top: "35%",
          height: "120%",
        }}
      />

      {/* Single soft radial glow — center */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: "800px",
          height: "500px",
          background: "radial-gradient(ellipse at 50% 40%, rgba(177,79,50,0.09) 0%, transparent 65%)",
          transform: `translateY(${scrollY * 0.06}px)`,
        }}
      />

      {/* Horizon line */}
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          top: "54%",
          background: "linear-gradient(90deg, transparent 5%, rgba(177,79,50,0.35) 30%, rgba(177,79,50,0.6) 50%, rgba(177,79,50,0.35) 70%, transparent 95%)",
          boxShadow: "0 0 30px 6px rgba(177,79,50,0.12)",
        }}
      />

      {/* Sparse particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-tanjo-accent"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: 0.18,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Corner accents — minimal */}
      <div className="absolute top-0 left-0 w-12 h-12" style={{ borderTop: "1px solid rgba(177,79,50,0.2)", borderLeft: "1px solid rgba(177,79,50,0.2)" }} />
      <div className="absolute top-0 right-0 w-12 h-12" style={{ borderTop: "1px solid rgba(177,79,50,0.2)", borderRight: "1px solid rgba(177,79,50,0.2)" }} />
    </div>
  );
}

// ─── Section fade-in wrapper ──────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const leftLinks = [
    { label: "A Fábrica", id: "sobre" },
    { label: "Processo", id: "processo" },
  ];
  const rightLinks = [
    { label: "Qualidade", id: "pilares" },
    { label: "Contato", id: "contato" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled ? "bg-tanjo-bg-deep/95 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="relative h-16 md:h-20 flex items-center px-5 md:px-12">
        {/* Logo icon — left */}
        <div className="z-10 flex-shrink-0 flex items-center gap-3">
          <img
            src="/assets/LOGO01.png"
            alt="TANJŌ"
            className="h-9 md:h-11 w-auto object-contain"
          />
          {/* Wordmark — visible only on mobile (desktop has its own centered version) */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="md:hidden opacity-90 hover:opacity-100 transition-opacity"
            aria-label="Voltar ao topo"
          >
            <img
              src="/assets/MARCA01.png"
              alt="TANJŌ Jewelry"
              className="h-7 w-auto object-contain"
            />
          </button>
        </div>

        {/* Desktop nav — centered */}
        <div className="hidden md:flex absolute inset-0 items-center justify-center">
          <div className="flex items-center gap-10 mr-16">
            {leftLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-white/40 hover:text-white text-[11px] tracking-[0.22em] font-light transition-colors duration-300 uppercase"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Brand mark center — official image */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group opacity-90 hover:opacity-100 transition-opacity duration-300"
          >
            <img
              src="/assets/MARCA01.png"
              alt="TANJŌ Jewelry"
              style={{ height: 48, width: "auto", objectFit: "contain" }}
            />
          </button>

          <div className="flex items-center gap-10 ml-16">
            {rightLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-white/40 hover:text-white text-[11px] tracking-[0.22em] font-light transition-colors duration-300 uppercase"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="ml-auto z-10 flex items-center gap-3">
          <button
            onClick={() => scrollTo("studio")}
            className="hidden md:block border border-tanjo-accent/50 text-tanjo-accent hover:bg-tanjo-accent hover:text-white px-5 py-2 text-[10px] tracking-[0.22em] font-light transition-all duration-300 uppercase"
          >
            Estúdio IA
          </button>
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className={`block w-5 h-px bg-white/60 transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-px bg-white/60 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-px bg-white/60 transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-tanjo-bg-deep/98 backdrop-blur-xl border-t border-white/5 px-6 py-6 flex flex-col gap-5">
          {[...leftLinks, ...rightLinks].map((item) => (
            <button key={item.id} onClick={() => scrollTo(item.id)} className="text-white/50 hover:text-white text-sm tracking-widest font-light uppercase text-left transition-colors">
              {item.label}
            </button>
          ))}
          <button onClick={() => scrollTo("studio")} className="border border-tanjo-accent text-tanjo-accent px-5 py-3 text-xs tracking-widest font-light uppercase text-center mt-2">
            Estúdio IA
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ scrollY }: { scrollY: number }) {
  const contentY = scrollY * 0.2;
  const opacity = Math.max(0, 1 - scrollY / 650);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-tanjo-bg-deep">
      <HeroBackground scrollY={scrollY} />

      <div
        className="container relative z-10 text-center pt-20"
        style={{ transform: `translateY(${contentY}px)`, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-8"
        >
          <span className="text-tanjo-accent/70 max-md:text-tanjo-accent/95 text-[10px] tracking-[0.5em] font-light uppercase border border-tanjo-accent/20 max-md:border-tanjo-accent/45 px-5 py-2">
            Alta Joalheria B2B · São Paulo
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="text-5xl md:text-7xl lg:text-[88px] font-extralight text-white tracking-tight leading-[0.95] mb-8"
        >
          Fabricação de joias
          <br />
          <em className="not-italic text-tanjo-accent" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
            que elevam
          </em>
          <br />
          sua marca
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-white/35 max-md:text-white/65 text-lg font-light tracking-wide max-w-xl mx-auto mb-14"
        >
          Soluções completas em alta joalheria para marcas e designers que buscam
          qualidade, precisão e sofisticação B2B.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" })}
            className="group bg-tanjo-accent hover:bg-tanjo-accent-deep text-white px-12 py-4 text-[11px] tracking-[0.3em] font-light uppercase transition-all duration-300 flex items-center gap-3 justify-center"
          >
            Criar com IA
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" })}
            className="border border-white/12 max-md:border-white/25 hover:border-white/30 text-white/40 max-md:text-white/70 hover:text-white/80 px-12 py-4 text-[11px] tracking-[0.3em] font-light uppercase transition-all duration-300"
          >
            Conheça a Fábrica
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-20 md:mt-28 grid grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto px-2"
        >
          {[
            { value: "200+", label: "Clientes B2B" },
            { value: "18k", label: "Ouro Puro" },
            { value: "5 anos", label: "De Excelência" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-tanjo-accent text-base sm:text-xl font-light tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>{stat.value}</div>
              <div className="text-white/20 max-md:text-white/65 text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-1.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: opacity * 0.6 }}
      >
        <ChevronDown className="w-4 h-4 text-tanjo-accent/40 animate-bounce" />
      </motion.div>
    </section>
  );
}

// ─── Pilares Section ──────────────────────────────────────────────────────────
function PilaresSection() {
  const pilares = [
    { icon: <Star className="w-5 h-5" />, title: "Excelência", desc: "Padrões rigorosos de qualidade em todas as etapas do processo produtivo." },
    { icon: <Zap className="w-5 h-5" />, title: "Tecnologia", desc: "Equipamentos de última geração aliados à precisão artesanal da ourivesaria." },
    { icon: <Diamond className="w-5 h-5" />, title: "Parceria", desc: "Relacionamentos sólidos e atendimento consultivo para marcas de alto padrão." },
    { icon: <Shield className="w-5 h-5" />, title: "Confiança", desc: "Compromisso com prazos, segurança e transparência em cada entrega." },
  ];

  return (
    <section id="pilares" className="py-24 bg-tanjo-bg-deep border-t border-white/4">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/4">
          {pilares.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.1}>
              <div className="bg-tanjo-bg-deep p-10 text-center group hover:bg-tanjo-bg-elevated transition-colors duration-500">
                <div className="text-tanjo-accent/70 max-md:text-tanjo-accent/95 mb-6 flex justify-center group-hover:text-tanjo-accent-bright group-hover:scale-110 transition-all duration-300">
                  {p.icon}
                </div>
                <h3 className="text-white/60 max-md:text-white/85 text-[10px] tracking-[0.35em] uppercase font-light mb-4">{p.title}</h3>
                <p className="text-white/30 max-md:text-white/72 text-sm font-light leading-relaxed">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Sobre Section ────────────────────────────────────────────────────────────
function SobreSection() {
  return (
    <section id="sobre" className="py-32 bg-tanjo-bg-deep border-t border-white/4">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <FadeIn>
            <div>
              <span className="text-tanjo-accent/70 max-md:text-tanjo-accent/95 text-[10px] tracking-[0.4em] uppercase font-light">Sobre a TANJŌ</span>
              <h2 className="text-4xl md:text-5xl font-extralight text-white mt-4 mb-8 leading-tight">
                Tradição, tecnologia
                <br />
                <span className="font-serif italic text-white/50 max-md:text-white/75">e paixão por joias</span>
              </h2>
              <p className="text-white/40 max-md:text-white/72 font-light leading-relaxed mb-6 text-[15px]">
                A Tanjō Jewelry é uma fábrica especializada na produção de joias em ouro 18k, com foco em marcas que
                valorizam qualidade, design e confiança. Fundada em São Paulo, unimos o melhor da ourivesaria
                tradicional com tecnologia avançada para entregar peças que encantam e fortalecem marcas.
              </p>
              <p className="text-white/40 max-md:text-white/72 font-light leading-relaxed mb-10 text-[15px]">
                Com mais de 200 clientes B2B em todo o Brasil, somos parceiros estratégicos de lojas e designers que
                desejam lançar suas próprias coleções com o padrão de excelência de uma maison criativa.
              </p>
              <button
                onClick={() => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" })}
                className="group flex items-center gap-3 text-tanjo-accent text-[11px] tracking-[0.3em] uppercase font-light hover:gap-5 transition-all duration-300"
              >
                Criar sua coleção
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { src: "/assets/tanjo-ourivesaria-01.jpg", label: "Ourivesaria" },
                { src: "/assets/tanjo-cravacao-03.jpg", label: "Cravação" },
                { src: "/assets/tanjo-polimento-01.jpg", label: "Polimento" },
                { src: "/assets/tanjo-finalizado-02.jpg", label: "Peça Finalizada" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="relative aspect-square overflow-hidden group"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className="w-full h-full object-cover [@media(hover:hover)_and_(pointer:fine)]:grayscale [@media(hover:hover)_and_(pointer:fine)]:group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-white/40 max-md:text-white/80 text-[9px] tracking-[0.3em] uppercase font-light">{item.label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ─── Processo Section ─────────────────────────────────────────────────────────
function ProcessoSection() {
  const steps = [
    { num: "01", title: "Concepção & Design 3D", desc: "Do esboço à modelagem digital perfeita. Nossa equipe traduz sua ideia em um projeto 3D detalhado.", icon: <Sparkles className="w-5 h-5" />, img: null },
    { num: "02", title: "Fundição & Ourivesaria", desc: "A materialização em ouro 18k com precisão absoluta. Cada peça fundida com rigor técnico.", icon: <Zap className="w-5 h-5" />, img: "/assets/tanjo-ourivesaria-02.jpg" },
    { num: "03", title: "Cravação & Acabamento", desc: "O rigor técnico para um brilho impecável. Cravadores especializados com décadas de experiência.", icon: <Gem className="w-5 h-5" />, img: "/assets/tanjo-cravacao-01.jpg" },
    { num: "04", title: "Entrega da Coleção", desc: "Suas peças prontas para o mercado. Embalagem premium e controle de qualidade final.", icon: <Diamond className="w-5 h-5" />, img: "/assets/tanjo-finalizado-03.jpg" },
  ];

  return (
    <section id="processo" className="py-32 bg-tanjo-bg-deep border-t border-white/4">
      <div className="container">
        <FadeIn>
          <div className="text-center mb-20">
            <span className="text-tanjo-accent/60 max-md:text-tanjo-accent/95 text-[10px] tracking-[0.4em] uppercase font-light">O Processo</span>
            <h2 className="text-4xl md:text-5xl font-extralight text-white mt-4 leading-tight">
              Da ideia à
              <span className="font-serif italic text-tanjo-accent"> joia perfeita</span>
            </h2>
          </div>
        </FadeIn>

        <div className="relative">
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tanjo-accent/20 to-transparent" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.15}>
                <div className="relative group">
                  <div
                    className="w-full aspect-[4/3] mb-6 overflow-hidden relative"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {step.img ? (
                      <>
                        <img src={step.img} alt={step.title} className="w-full h-full object-cover [@media(hover:hover)_and_(pointer:fine)]:grayscale [@media(hover:hover)_and_(pointer:fine)]:group-hover:grayscale-0 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-tanjo-bg-deep flex flex-col items-center justify-center gap-3">
                        <div className="text-tanjo-accent/25">{step.icon}</div>
                        <span className="text-white/15 max-md:text-white/55 text-[9px] tracking-[0.4em] uppercase font-light">Em breve</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-full border border-tanjo-accent/30 max-md:border-tanjo-accent/55 flex items-center justify-center bg-black/60 max-md:bg-black/80">
                      <span className="text-tanjo-accent/80 max-md:text-tanjo-accent text-[11px] font-extralight" style={{ fontFamily: "'Cinzel', serif" }}>{step.num}</span>
                    </div>
                  </div>
                  <h3 className="text-white/60 max-md:text-white/85 text-[10px] tracking-[0.25em] uppercase font-light mb-3">{step.title}</h3>
                  <p className="text-white/30 max-md:text-white/72 text-sm font-light leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Studio Section ───────────────────────────────────────────────────────────
function StudioSection() {
  const projects = [
    {
      id: "marquise-01",
      tag: "Projeto Real · Design 3D Tanjō",
      name: "Anel Marquise Solitário",
      material: "Ouro 18k bicolor · diamante marquise central + pavé",
      images: {
        frontal: "/portfolio/marquise-01-frontal.jpg",
        perspective: "/portfolio/marquise-01-perspectiva.jpg",
      },
      viewer3d_glb: "https://bee.transfr.one/6a048316-17/model.glb",
      disclaimer: "Peça real · modelada pela equipe de design 3D TANJŌ · pronta para fundição em ouro 18k",
    },
  ];
  const project = projects[0];

  return (
    <section id="studio" className="pt-6 lg:pt-8 pb-12 lg:pb-16 bg-tanjo-bg-deep border-t border-white/4 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(177,79,50,0.05) 0%, transparent 60%)" }}
      />
      <div className="container relative z-10">
        {/* Header — compacto */}
        <FadeIn>
          <div className="text-center mb-8 lg:mb-10 max-w-2xl mx-auto">
            <span className="text-tanjo-accent/60 max-md:text-tanjo-accent/95 text-[10px] tracking-[0.3em] uppercase font-light">Estúdio Virtual</span>
            <h2 className="text-3xl lg:text-4xl font-extralight text-white mt-3 mb-4 leading-tight">
              Visualize o futuro{" "}
              <span className="font-serif italic text-tanjo-accent">da sua coleção</span>
            </h2>
            <p className="text-white/40 max-md:text-white/72 font-light text-sm lg:text-base leading-relaxed">
              Converse com a <strong className="text-tanjo-accent font-light">Danya</strong>, nossa Diretora Criativa de
              Inteligência Artificial. Ela vai entender a sua ideia e gerar conceitos fotorrealistas exclusivos da sua próxima joia em segundos.
            </p>
          </div>
        </FadeIn>

        {/* Grid: Projeto + Formulário */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto">
          {/* Coluna esquerda: projeto exclusivo */}
          <FadeIn delay={0.15} className="h-full">
            <div className="flex flex-col h-full">
              {/* 3D viewer único, proporção controlada */}
              <div
                className="aspect-square max-h-[420px] bg-black/30 max-md:bg-black/55 border border-tanjo-accent/20 max-md:border-tanjo-accent/45 rounded overflow-hidden relative"
                style={{ boxShadow: "inset 0 0 40px 10px rgba(0,0,0,0.3)" }}
              >
                <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-sm bg-black/70 border border-tanjo-accent/40 backdrop-blur-sm pointer-events-none">
                  <span className="text-[10px] tracking-[0.25em] uppercase font-light text-tanjo-accent/90">
                    ● Projeto Real · Design 3D Tanjō
                  </span>
                </div>
                <IJewelViewer
                  modelUrl={project.viewer3d_glb}
                  poster={project.images.frontal}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>

              {/* Caption compacto */}
              <div className="mt-4">
                <h3 className="text-white/90 text-base font-light">{project.name}</h3>
                <p className="text-white/60 max-md:text-white/80 text-xs tracking-wide mt-1">{project.material}</p>
                <p className="text-white/45 max-md:text-white/72 text-[11px] italic mt-2 leading-relaxed">{project.disclaimer}</p>
              </div>

              {/* Spacer flexível */}
              <div className="flex-grow min-h-[16px]" />

              {/* Tag rodapé alinhada com a direita */}
              <div className="text-center text-tanjo-accent/70 max-md:text-tanjo-accent/95 text-[10px] tracking-[0.3em] uppercase font-light pt-3">
                ● {project.tag}
              </div>
            </div>
          </FadeIn>

          {/* Coluna direita: formulário */}
          <FadeIn delay={0.25} className="h-full">
            <div className="flex flex-col h-full">
              <LeadForm />
              <p className="text-center text-white/15 max-md:text-white/60 text-[9px] tracking-[0.4em] uppercase mt-6 font-light">
                Acesso exclusivo para lojistas e marcas · B2B
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contato" className="bg-tanjo-bg-deep border-t border-white/4 py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <img
              src="/assets/Logo_vertical_laranja.png"
              alt="TANJŌ Jewelry"
              style={{ height: 88, width: "auto", objectFit: "contain" }}
            />
            <p className="text-white/25 max-md:text-white/70 text-sm font-light leading-relaxed mt-6 max-w-xs">
              Fabricação de joias em ouro 18k com excelência, precisão e compromisso com o sucesso da sua marca.
            </p>
          </div>
          <div>
            <h4 className="text-white/30 max-md:text-white/70 text-[9px] tracking-[0.4em] uppercase font-light mb-6">Navegação</h4>
            <div className="flex flex-col gap-3">
              {[
                { label: "A Fábrica", id: "sobre" },
                { label: "Processo", id: "processo" },
                { label: "Qualidade", id: "pilares" },
                { label: "Estúdio IA", id: "studio" },
              ].map((item) => (
                <button key={item.id} onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })} className="text-white/25 max-md:text-white/75 text-sm font-light hover:text-white/50 cursor-pointer transition-colors text-left">
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white/30 max-md:text-white/70 text-[9px] tracking-[0.4em] uppercase font-light mb-6">Contato</h4>
            <div className="flex flex-col gap-3 text-white/25 max-md:text-white/75 text-sm font-light">
              <span>comercial@tanjoo.com.br</span>
              <span>São Paulo — SP, Brasil</span>
              <div className="flex gap-4 mt-2">
                <a href="https://instagram.com/tanjojewel" target="_blank" rel="noopener noreferrer" className="text-tanjo-accent/70 max-md:text-tanjo-accent/95 hover:text-tanjo-accent-bright transition-colors text-[10px] tracking-widest uppercase">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/4 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-white/15 max-md:text-white/55 text-xs font-light tracking-wide">© 2026 Tanjō Jewelry. Todos os direitos reservados.</span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center">
            <a
              href="/politica-de-privacidade"
              className="text-white/25 max-md:text-white/70 hover:text-white/50 text-xs font-light tracking-wide transition-colors"
            >
              Política de Privacidade
            </a>
            <span className="text-white/8 max-md:text-white/45 text-xs font-light">Alta Joalheria B2B · São Paulo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const scrollY = useScrollY();
  return (
    <div className="min-h-screen bg-tanjo-bg-deep">
      <Atmosphere />
      <Navbar />
      <HeroSection scrollY={scrollY} />
      <PilaresSection />
      <SobreSection />
      <ProcessoSection />
      <StudioSection />
      <Footer />
    </div>
  );
}
