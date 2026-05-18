import { useCallback, useEffect, useRef, useState } from "react";
import { IJewelViewer } from "@/components/IJewelViewer";
import type { ProjetoReal } from "@/data/projetosReais";

interface ProjetosReaisCarouselProps {
  projetos: ProjetoReal[];
}

export function ProjetosReaisCarousel({ projetos }: ProjetosReaisCarouselProps) {
  const total = projetos.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  // Lazy load: monta IJewelViewers só quando seção entra em viewport
  useEffect(() => {
    if (isVisible) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  // Keyboard nav quando container tem focus
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    },
    [next, prev]
  );

  // Swipe mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const minSwipe = 50;
    if (distance > minSwipe) next();
    else if (distance < -minSwipe) prev();
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Projetos reais TANJŌ"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative outline-none focus-visible:ring-1 focus-visible:ring-tanjo-accent/30 rounded"
    >
      {/* Pill fixo — fora do track, sobreposto ao top-left do viewer */}
      <div className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-sm bg-black/70 border border-tanjo-accent/40 backdrop-blur-sm pointer-events-none">
        <span className="text-[10px] tracking-[0.25em] uppercase font-light text-tanjo-accent/90">
          ● Projeto Real · Design 3D Tanjō
        </span>
      </div>

      {/* Track wrapper — overflow hidden */}
      <div
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {projetos.map((p, i) => (
            <div
              key={p.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${total}: ${p.nome}`}
              aria-hidden={i !== activeIndex}
              className="w-full flex-shrink-0"
            >
              {/* Viewer frame — mesma estética do card original */}
              <div
                className="aspect-square max-h-[420px] bg-black/30 max-md:bg-black/55 border border-tanjo-accent/20 max-md:border-tanjo-accent/45 rounded overflow-hidden relative"
                style={{ boxShadow: "inset 0 0 40px 10px rgba(0,0,0,0.3)" }}
              >
                {isVisible ? (
                  <IJewelViewer
                    modelUrl={p.modelUrl}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border border-tanjo-accent/30 rounded-full animate-pulse" />
                  </div>
                )}
              </div>

              {/* Caption — nome, composição, narrativa */}
              <div className="mt-4">
                <h3 className="text-xl font-light text-tanjo-text-primary tracking-wide">
                  {p.nome}
                </h3>
                <p className="text-sm text-tanjo-text-secondary font-light mt-1">
                  {p.composicao}
                </p>
                <p className="text-xs text-tanjo-text-muted italic font-light mt-2 leading-relaxed">
                  {p.narrativa}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setas — overlay com mesmas dimensões do viewer para centralizar verticalmente */}
      <div className="hidden sm:block absolute inset-x-0 top-0 aspect-square max-h-[420px] pointer-events-none z-20">
        <button
          type="button"
          onClick={prev}
          aria-label="Peça anterior"
          className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-tanjo-text-muted hover:text-tanjo-accent-bright transition-colors rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Próxima peça"
          className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-tanjo-text-muted hover:text-tanjo-accent-bright transition-colors rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {projetos.map((p, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Ir para peça ${i + 1}: ${p.nome}`}
              aria-current={active}
              className={
                "rounded-full transition-all duration-300 " +
                (active
                  ? "w-6 h-1.5 bg-tanjo-accent-bright"
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40")
              }
            />
          );
        })}
      </div>
    </div>
  );
}
