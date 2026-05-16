import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Atmosphere — efeito visual "futurista" exclusivo do desktop.
 *
 * Composto por dois elementos:
 *
 *  1. WireframeGem — um octaedro 3D em SVG, com vértices projetados a cada frame.
 *     Roda continuamente (drift) + responde ao scroll. As arestas mais ao fundo
 *     ficam mais finas e claras; as da frente ficam mais grossas e luminosas.
 *
 *  2. DataRails — duas "réguas" laterais com medidas industriais (Au %, mm, ct,
 *     graus, kt) caindo do topo da tela, como num scanner de coordenadas.
 *
 * Tudo é position: fixed e pointer-events: none — não interfere com a UI.
 * Só renderiza em desktop (largura >= 1024 px). Em mobile, retorna null.
 */

// ─── Hook de viewport simples (substitui useTanjoViewport do bundle) ─────────
function useViewport() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    width: w,
    isMobile: w < 640,
    isTablet: w >= 640 && w < 1024,
    isDesktop: w >= 1024,
  };
}

// ─── WireframeGem — octaedro 3D em SVG ───────────────────────────────────────
const VERTS: Array<[number, number, number]> = [
  [0, 1, 0],   // 0 top
  [0, -1, 0],  // 1 bottom
  [1, 0, 0],   // 2 right
  [-1, 0, 0],  // 3 left
  [0, 0, 1],   // 4 front
  [0, 0, -1],  // 5 back
];

const EDGES: Array<[number, number]> = [
  [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 2], [1, 3], [1, 4], [1, 5],
  [2, 4], [4, 3], [3, 5], [5, 2],
];

function project(vert: [number, number, number], rotY: number, rotX: number, scale: number) {
  const [x, y, z] = vert;
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const y1 = y * cx - z1 * sx;
  const z2 = y * sx + z1 * cx;
  const persp = 1 / (1.6 + z2 * 0.25);
  return { x: x1 * scale * persp, y: y1 * scale * persp, z: z2, persp };
}

function WireframeGem({ size = 200, rotY = 0, rotX = 0 }: { size?: number; rotY: number; rotX: number }) {
  const vp = size / 2;
  const projected = VERTS.map((v) => project(v, rotY, rotX, vp));

  // Arestas ordenadas de trás pra frente (z médio).
  const edgeData = EDGES
    .map(([a, b], i) => ({ a, b, key: i, zmid: (projected[a].z + projected[b].z) / 2 }))
    .sort((p, q) => p.zmid - q.zmid);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-vp} ${-vp} ${size} ${size}`}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <radialGradient id="tk-gem-vert" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B5522A" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#B5522A" stopOpacity={0} />
        </radialGradient>
      </defs>

      {edgeData.map((e) => {
        const a = projected[e.a];
        const b = projected[e.b];
        const t = (e.zmid + 1) / 2;
        const opacity = 0.18 + t * 0.55;
        const strokeWidth = 0.4 + t * 0.8;
        return (
          <line
            key={e.key}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="#B5522A"
            strokeOpacity={opacity}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}

      {projected.map((p, i) =>
        p.z > -0.2 ? (
          <circle
            key={`v${i}`}
            cx={p.x} cy={p.y}
            r={2.5 + p.persp * 1.5}
            fill="url(#tk-gem-vert)"
          />
        ) : null
      )}

      <circle
        cx={0} cy={0} r={3}
        fill="#B5522A"
        style={{ animation: "tk-corepulse 2.4s ease-in-out infinite" }}
      />
    </svg>
  );
}

// ─── DataRails — ticks de medida caindo verticalmente nas laterais ───────────
function DataRail({ side, visible }: { side: "left" | "right"; visible: boolean }) {
  const ticks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        delay: -i * 1.2 - Math.random() * 1.5,
        label: [
          `${(Math.random() * 9 + 1).toFixed(2)}mm`,
          `18k · ${(Math.random() * 0.5 + 1.4).toFixed(2)}g`,
          `Au ${(Math.random() * 30 + 70).toFixed(1)}%`,
          `${Math.floor(Math.random() * 360)}°`,
          `${(Math.random() * 2 + 1).toFixed(2)}ct`,
          `R.${Math.floor(Math.random() * 90 + 10)}`,
        ][i % 6],
      })),
    []
  );

  const sideKey: "left" | "right" = side;
  const innerSide = side === "left" ? "right" : "left";

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        [sideKey]: 12,
        width: 80,
        height: "100vh",
        pointerEvents: "none",
        zIndex: 5,
        opacity: visible ? 1 : 0,
        transition: "opacity 800ms cubic-bezier(0.23,1,0.32,1)",
        overflow: "hidden",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [innerSide]: 18,
          width: 1,
          background:
            "linear-gradient(to bottom, transparent, rgba(181,82,42,0.18) 30%, rgba(181,82,42,0.18) 70%, transparent)",
        }}
      />
      {ticks.map((t) => (
        <div
          key={t.id}
          style={{
            position: "absolute",
            top: 0,
            [innerSide]: 24,
            fontSize: 9,
            color: "rgba(181,82,42,0.45)",
            fontFamily: "'Cinzel', serif",
            fontWeight: 300,
            letterSpacing: "0.15em",
            whiteSpace: "nowrap",
            animation: `tk-tick-fall 14s linear ${t.delay}s infinite`,
          }}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Atmosphere() {
  const [scrollY, setScrollY] = useState(0);
  const [hover, setHover] = useState(0);
  const vp = useViewport();
  const rafRef = useRef(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Drift contínuo (RAF) — anima mesmo sem scroll.
  useEffect(() => {
    const loop = () => {
      setHover((h) => h + 0.004);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Não renderiza em mobile/tablet — efeito é exclusivo de desktop.
  if (vp.isMobile || vp.isTablet) return null;

  // Fade-in após o usuário passar do hero (≈ 40% da viewport).
  const heroExit = Math.min(1, Math.max(0, (scrollY - window.innerHeight * 0.4) / 200));

  const rotY = hover * 0.6 + scrollY * 0.004;
  const rotX = Math.sin(hover * 0.4) * 0.35 + scrollY * 0.0015;

  const gemSize = 200;
  const rightOffset = 56;
  const floatY = Math.sin(hover * 0.7) * 12;

  return (
    <>
      {/* Gem 3D — fixo no centro-direita */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "50%",
          right: rightOffset,
          transform: `translateY(calc(-50% + ${floatY}px))`,
          width: gemSize,
          height: gemSize,
          pointerEvents: "none",
          zIndex: 5,
          opacity: heroExit * 0.85,
          transition: "opacity 600ms cubic-bezier(0.23,1,0.32,1)",
          filter: "drop-shadow(0 0 24px rgba(181,82,42,0.22))",
        }}
      >
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <WireframeGem size={gemSize} rotY={rotY} rotX={rotX} />
        </div>
      </div>

      {/* Data rails — laterais */}
      <DataRail side="left"  visible={heroExit > 0.5} />
      <DataRail side="right" visible={heroExit > 0.5} />

      {/* Halo radial — escurece bordas da página quando o Atmosphere está visível */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 4,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
          opacity: heroExit * 0.4,
        }}
      />
    </>
  );
}
