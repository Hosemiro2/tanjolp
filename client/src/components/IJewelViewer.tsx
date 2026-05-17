import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

interface IJewelViewerProps {
  modelUrl: string;
  poster?: string;
  className?: string;
  style?: CSSProperties;
}

declare global {
  interface Window {
    ijewelViewer?: any;
  }
}

export function IJewelViewer({ modelUrl, poster, className, style }: IJewelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!window.ijewelViewer) {
      console.error("[IJewelViewer] SDK não carregou. Verifique o <script> no index.html");
      return;
    }

    const project = { modelUrl };

    // Opções pra esconder TODO o chrome do iJewel
    const viewerOptions = {
      showLogo: false,
      showCard: false,
      useIjewelLogo: false,
      hideQuality: true,
      hideFullScreen: true,
      hideResetView: true,
      hideFitScene: true,
      hideRotateCamera: true,
      hideCameraViews: true,
      transparentBg: true,
      brandingSettings: {
        enable: false,
        showLoadingScreenLogo: false,
      },
    };

    try {
      viewerInstanceRef.current = new window.ijewelViewer.Viewer(
        containerRef.current,
        project,
        viewerOptions
      );
    } catch (e) {
      console.error("[IJewelViewer] Falha ao inicializar:", e);
    }

    const onReady = (ev: any) => {
      // Fade out poster
      if (posterRef.current) {
        posterRef.current.style.opacity = "0";
        setTimeout(() => {
          if (posterRef.current) posterRef.current.style.display = "none";
        }, 700);
      }

      const viewer = ev.detail?.viewer;
      if (!viewer) {
        console.warn("[IJewelViewer] viewer instance not found");
        return;
      }

      // === 1. Remover background da scene (mantém environment como lighting source) ===
      try {
        if (viewer.scene) {
          if ("background" in viewer.scene) {
            viewer.scene.background = null;
          }
          if ("backgroundColor" in viewer.scene && viewer.scene.backgroundColor) {
            if (typeof viewer.scene.backgroundColor.set === "function") {
              viewer.scene.backgroundColor.set("#0F0F11");
            } else if (typeof viewer.scene.backgroundColor.setHex === "function") {
              viewer.scene.backgroundColor.setHex(0x0f0f11);
            }
          }
          if ("backgroundIntensity" in viewer.scene) {
            viewer.scene.backgroundIntensity = 0;
          }
          if ("useEnvironmentAsBackground" in viewer.scene) {
            viewer.scene.useEnvironmentAsBackground = false;
          }
        }
      } catch (err) {
        console.warn("[IJewelViewer] background null failed:", err);
      }

      // === 2. Remover Reflector "Ground Plane" (que ignora visible=false) ===
      try {
        const findReflectors = (obj: any, results: any[] = []): any[] => {
          if (!obj) return results;

          const isReflector =
            obj.type === "Reflector" ||
            obj.constructor?.name === "Reflector" ||
            obj.isReflector === true ||
            (obj.name && obj.name.toLowerCase().includes("ground"));

          if (isReflector) results.push(obj);

          if (Array.isArray(obj.children)) {
            for (const child of obj.children) {
              findReflectors(child, results);
            }
          }
          return results;
        };

        const reflectors = findReflectors(viewer.scene);
        console.log("[IJewelViewer] Reflectors found:", reflectors.length);

        for (const r of reflectors) {
          // Estratégia 1: remover da parent (mais limpo)
          if (r.parent && typeof r.parent.remove === "function") {
            r.parent.remove(r);
            console.log("[IJewelViewer] Reflector REMOVED from parent:", r.name);
          }

          // Estratégia 2: garantir invisibilidade total
          r.visible = false;
          if ("enabled" in r) r.enabled = false;

          // Estratégia 3: matar o material
          if (r.material) {
            r.material.visible = false;
            r.material.opacity = 0;
            r.material.transparent = true;
          }

          // Estratégia 4: escala zero
          if (r.scale && typeof r.scale.set === "function") {
            r.scale.set(0, 0, 0);
          }

          // Estratégia 5: mover pra fora da view
          if (r.position && typeof r.position.set === "function") {
            r.position.set(0, -10000, 0);
          }
        }

        const pluginNames = [
          "GroundPlugin",
          "ShadowGroundPlugin",
          "ContactShadowGroundPlugin",
          "ContactShadowPlugin",
          "StageObjectPlugin",
          "GroundPlanePlugin",
          "PerformanceFloorPlugin",
          "SimpleStagePlugin",
          "ReflectionPlugin",
        ];
        for (const pname of pluginNames) {
          const plugin =
            viewer.getPluginByType?.(pname) ||
            viewer.plugins?.[pname];
          if (plugin) {
            if ("enabled" in plugin) plugin.enabled = false;
            if ("visible" in plugin) plugin.visible = false;
            console.log("[IJewelViewer] PLUGIN DISABLED:", pname);
          }
        }
      } catch (err) {
        console.warn("[IJewelViewer] reflector removal failed:", err);
      }

      // === 3. Environment intensity (API NOVA: environmentIntensity) ===
      try {
        if (viewer.scene) {
          if ("environmentIntensity" in viewer.scene) {
            viewer.scene.environmentIntensity = 0.45;
          }
          if ("envMapIntensity" in viewer.scene) {
            viewer.scene.envMapIntensity = 0.45;
          }
        }

        const envPlugin =
          viewer.getPluginByType?.("SimpleBackgroundEnvUiPlugin2") ||
          viewer.plugins?.SimpleBackgroundEnvUiPlugin2;
        if (envPlugin) {
          if ("sceneEnvironmentIntensity" in envPlugin) {
            envPlugin.sceneEnvironmentIntensity = 0.45;
          }
          if ("sceneEnvironmentFixedDirection" in envPlugin) {
            envPlugin.sceneEnvironmentFixedDirection = true;
          }
          if ("tonemapBackground" in envPlugin) {
            envPlugin.tonemapBackground = false;
          }
        }
      } catch (err) {
        console.warn("[IJewelViewer] env intensity failed:", err);
      }

      // === 4. Tone mapping exposure ===
      try {
        if (viewer.renderer && "toneMappingExposure" in viewer.renderer) {
          viewer.renderer.toneMappingExposure = 0.85;
        }
      } catch {
        // ignore
      }

      // === 5. Auto-rotate ===
      try {
        if (viewer.scene?.activeCamera?.controls) {
          const controls = viewer.scene.activeCamera.controls;
          if ("autoRotate" in controls) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.8;
          }
        }
      } catch {
        // ignore
      }

      // === 6. Forçar re-render com delay (após mudanças propagarem) ===
      try {
        setTimeout(() => {
          viewer.setDirty?.();
          viewer.render?.();
        }, 50);
        setTimeout(() => {
          viewer.setDirty?.();
          viewer.render?.();
        }, 500);
      } catch {
        // ignore
      }
    };

    window.addEventListener("ijewel-viewer-ready", onReady);

    return () => {
      window.removeEventListener("ijewel-viewer-ready", onReady);
      try {
        viewerInstanceRef.current?.dispose?.();
      } catch {}
    };
  }, [modelUrl]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      {poster && (
        <div
          ref={posterRef}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${poster})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transition: "opacity 0.7s ease-out",
            opacity: 1,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
}
