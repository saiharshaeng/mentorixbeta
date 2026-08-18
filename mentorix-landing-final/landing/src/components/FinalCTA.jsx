import { motion } from "framer-motion";
import Reveal from "./Reveal";

const APP_URL = "https://mentorix-beta.netlify.app"; // TODO: move to app.mentorix.in before launch

export default function FinalCTA() {
  return (
    <section className="section" style={{ background: "var(--black)", position: "relative", overflow: "hidden" }}>
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "50%", left: "35%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.07),transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: "65%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.05),transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

      {/* Grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.02) 1px,transparent 1px)", backgroundSize: "80px 80px", maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%,black,transparent)", pointerEvents: "none" }} />

      <div className="wrap" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>

        <Reveal>
          <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#5a6478", marginBottom: 28 }}>
            Your next question is waiting
          </div>
        </Reveal>

        <Reveal delay={0.07}>
          <h2 className="h-display" style={{ fontSize: "clamp(40px,7.5vw,92px)", marginBottom: 20 }}>
            Start learning<br />
            <span className="grad-main">differently.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.13}>
          <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.6vw,18px)", color: "#3d4560", lineHeight: 1.7, marginBottom: 52 }}>
            No perfect starting point required.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <motion.a
              href={APP_URL}
              className="anim-pulse"
              style={{
                display: "inline-flex", alignItems: "center", gap: 12,
                padding: "18px 48px", borderRadius: 18,
                background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "white", fontSize: "clamp(15px,1.8vw,19px)", fontWeight: 800,
                textDecoration: "none", letterSpacing: "0.02em", whiteSpace: "nowrap",
                boxShadow: "0 0 0 1px rgba(124,58,237,0.2),0 8px 48px rgba(109,40,217,0.55)",
              }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <span>Meet Tio →</span>
            </motion.a>

            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a6478" }}>
              Free · No account required to explore
            </p>
          </div>
        </Reveal>

        {/* Big quote */}
        <Reveal delay={0.24}>
          <div style={{ marginTop: 80, maxWidth: 640, margin: "80px auto 0" }}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(15px,1.8vw,20px)", fontStyle: "italic", color: "#2d3a50", lineHeight: 1.75 }}>
              "Because sometimes what a learner needs isn't another answer. It's something that helps them find their way to it."
            </p>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
