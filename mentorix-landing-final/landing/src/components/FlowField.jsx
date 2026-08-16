import { useEffect, useRef } from "react";

export default function FlowField({ children }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Reduce particles on mobile for perf
    const isMobile = window.innerWidth < 768;
    const isLowEnd = navigator.hardwareConcurrency <= 4;
    const COUNT = isMobile || isLowEnd ? 180 : 520;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let frame = 0;
    let raf;

    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0, vy: 0,
      size: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.35 + 0.05,
      hue: Math.random() > 0.7 ? 195 : 268, // cyan or purple
    }));

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize, { passive: true });

    const draw = () => {
      ctx.fillStyle = "rgba(4,4,10,0.18)";
      ctx.fillRect(0, 0, W, H);
      frame++;

      for (const p of particles) {
        const nx = p.x / W, ny = p.y / H;
        const angle =
          Math.sin(nx * 3.5 + frame * 0.006) * Math.PI +
          Math.cos(ny * 2.8 + frame * 0.004) * Math.PI * 0.5;

        p.vx = p.vx * 0.92 + Math.cos(angle) * 0.28;
        p.vy = p.vy * 0.92 + Math.sin(angle) * 0.28;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none", zIndex: 0,
        }}
        aria-hidden="true"
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
