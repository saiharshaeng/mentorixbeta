import { motion } from "framer-motion";
import Reveal from "./Reveal";

const moments = [
  { text: "I watched three explanations of the same concept and still don't understand it.", icon: "😶" },
  { text: "I know I got the answer wrong. I just don't know why I keep getting it wrong.", icon: "🤔" },
  { text: "I studied this whole chapter last month. Why can't I remember any of it now?", icon: "😔" },
  { text: "I have five topics left and two days to go. I don't even know where to start.", icon: "😰" },
  { text: "I understand it when I read it. Then the question looks different and my mind goes blank.", icon: "😵" },
  { text: "No one's available to help me at 11pm when I'm actually studying.", icon: "🌙" },
];

export default function Recognition() {
  return (
    <section className="section" style={{ background: "var(--deep)", position: "relative", overflow: "hidden" }}>
      {/* Background texture — grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
        pointerEvents: "none",
      }} />
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.05),transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

      <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <Reveal>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 20 }}>
              Ever had this happen?
            </h2>
          </Reveal>
          <Reveal delay={0.07}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.6vw,17px)", color: "#5a6478", maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
              These aren't unusual. This is what learning alone actually feels like.
            </p>
          </Reveal>
        </div>

        <div className="grid-3" style={{ gap: 14, marginBottom: 56 }}>
          {moments.map((m, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <motion.div style={{
                padding: "24px 22px", borderRadius: 16,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "flex-start", gap: 14,
              }}
                whileHover={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.03)", y: -2 }}
                transition={{ duration: 0.2 }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{m.icon}</span>
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.3vw,14px)", color: "#5a6478", lineHeight: 1.7 }}>
                  {m.text}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div style={{ textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 14,
              padding: "18px 28px", borderRadius: 18,
              background: "rgba(124,58,237,0.07)",
              border: "1px solid rgba(124,58,237,0.16)",
              maxWidth: 620,
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>🤖</span>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,16px)", color: "#8892a4", lineHeight: 1.6, textAlign: "left" }}>
                Mentorix was built for exactly these moments.{" "}
                <span style={{ color: "#a78bfa", fontWeight: 600 }}>Not to give you more content. To help you figure out what's actually going on.</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
