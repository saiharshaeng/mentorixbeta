import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playIntro } from "../audio/intro";

// Deep bass + particle burst intro — plays once per session
export default function IntroAnimation({ onDone }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("burst"); // burst → logo → done
  const [soundUnlocked, setSoundUnlocked] = useState(false);

  // Play sound on first interaction or auto-attempt
  useEffect(() => {
    const attempt = () => {
      try { playIntro(); setSoundUnlocked(true); } catch {}
    };
    // Try immediately (works on desktop, often blocked on mobile)
    attempt();
    // Also on first touch/click
    const unlock = () => { attempt(); document.removeEventListener("click", unlock); document.removeEventListener("touchstart", unlock); };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
  }, []);

  // Particle burst canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let raf;

    // Create particles exploding from center
    const CX = W / 2, CY = H / 2;
    const COUNT = window.innerWidth < 768 ? 120 : 280;

    const particles = Array.from({ length: COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 8 + 3;
      const isMain = Math.random() > 0.6;
      return {
        x: CX, y: CY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isMain ? 3.5 : 1.8) + 0.5,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        hue: Math.random() > 0.5 ? 268 : 195, // purple or cyan
        trail: [],
      };
    });

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.fillStyle = "rgba(4,4,10,0.22)";
      ctx.fillRect(0, 0, W, H);

      // Central glow pulse
      if (frame < 30) {
        const r = (30 - frame) * 12;
        const grd = ctx.createRadialGradient(CX, CY, 0, CX, CY, r);
        grd.addColorStop(0, `rgba(124,58,237,${0.5 * (1 - frame/30)})`);
        grd.addColorStop(0.5, `rgba(6,182,212,${0.2 * (1 - frame/30)})`);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }

      let alive = 0;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive++;

        // Trail
        p.trail.push({ x: p.x, y: p.y, a: p.alpha });
        if (p.trail.length > 8) p.trail.shift();

        for (let t = 0; t < p.trail.length; t++) {
          const tp = p.trail[t];
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, p.size * 0.5 * (t / p.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},80%,70%,${tp.a * 0.25 * (t / p.trail.length)})`;
          ctx.fill();
        }

        // Main particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},85%,72%,${p.alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.alpha * 0.12})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha -= p.decay;
      }

      if (alive > 0) {
        raf = requestAnimationFrame(draw);
      } else {
        // All particles dead — fade to logo phase
        setPhase("logo");
        setTimeout(() => { setPhase("done"); onDone(); }, 1200);
      }
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "#04040a",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Particle canvas */}
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

          {/* Logo reveal */}
          <AnimatePresence>
            {(phase === "burst" || phase === "logo") && (
              <motion.div
                style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Logo with rings */}
                <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* Outer ring */}
                  <motion.div style={{
                    position: "absolute", width: 120, height: 120, borderRadius: "50%",
                    border: "1px solid rgba(124,58,237,0.3)",
                  }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                  {/* Mid ring */}
                  <motion.div style={{
                    position: "absolute", width: 90, height: 90, borderRadius: "50%",
                    border: "1px solid rgba(6,182,212,0.4)",
                  }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, delay: 0.3, repeat: Infinity, ease: "easeInOut" }} />

                  <img src="/logo.png" alt="Mentorix"
                    style={{ width: 72, height: 72, objectFit: "contain", filter: "drop-shadow(0 0 32px rgba(124,58,237,0.9)) drop-shadow(0 0 64px rgba(6,182,212,0.4))", position: "relative", zIndex: 1 }} />
                </div>

                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  style={{ textAlign: "center" }}
                >
                  <div className="f-clash" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.22em", color: "white", textTransform: "uppercase" }}>
                    Mentorix
                  </div>
                  <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, color: "#3d4560", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>
                    Every mind learns differently.
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button */}
          <motion.button
            onClick={() => { setPhase("done"); onDone(); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              position: "absolute", bottom: 32, right: 32,
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              color: "#3d4560", fontFamily: "Satoshi, sans-serif",
              fontSize: 12, padding: "8px 16px", borderRadius: 8,
              cursor: "pointer", letterSpacing: "0.06em",
              transition: "all 0.2s",
            }}
            whileHover={{ borderColor: "rgba(167,139,250,0.3)", color: "#a78bfa" }}
          >
            Skip →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
