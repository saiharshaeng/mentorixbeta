import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";

const STEPS = [
  {
    id: "ask",
    label: "Ask",
    icon: "💬",
    color: "#a78bfa",
    title: "Start anywhere",
    detail: "You don't need to know where to begin. Tell Tio what you're trying to understand, what exam you're preparing for, or just what's confusing you right now.",
  },
  {
    id: "understand",
    label: "Understand",
    icon: "🧠",
    color: "#38bdf8",
    title: "Actually understand it",
    detail: "Not summaries. Not flashcard definitions. Tio explains the concept the way it needs to be explained for you — with examples, derivations, and the reason behind the formula.",
  },
  {
    id: "practice",
    label: "Practice",
    icon: "✏️",
    color: "#34d399",
    title: "Turn knowledge into ability",
    detail: "Understanding something once doesn't mean you can use it. Practice turns passive reading into active skill. Questions that build, not just test.",
  },
  {
    id: "discover",
    label: "Discover",
    icon: "🔍",
    color: "#f59e0b",
    title: "Find what's actually holding you back",
    detail: "Mentorix doesn't just tell you your score. It tells you which specific concept failed, how often, and what to do about it. That's a different kind of feedback.",
  },
  {
    id: "revise",
    label: "Revise",
    icon: "🔄",
    color: "#ec4899",
    title: "Revise what deserves it",
    detail: "Not everything needs the same revision time. Mentorix brings back concepts when you're about to forget them — not on a fixed schedule, but based on how you're actually doing.",
  },
  {
    id: "improve",
    label: "Improve",
    icon: "📈",
    color: "#10b981",
    title: "Watch it compound",
    detail: "Every session adds to your learning history. Every mistake becomes a data point. Every revision makes the next one faster. Progress becomes visible.",
  },
  {
    id: "explore",
    label: "Explore",
    icon: "🧭",
    color: "#818cf8",
    title: "See where it can take you",
    detail: "Learning isn't the destination. Mentorix connects what you're learning to what you could become — subjects, skills, careers, paths you might not have considered.",
  },
];

export default function LearningLoop() {
  const [active, setActive] = useState(null);
  const hovered = active !== null ? STEPS[active] : null;

  return (
    <section className="section" style={{ background: "var(--black)" }}>
      <div className="wrap">

        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <Reveal>
            <div className="badge" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
              The Mentorix loop
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 18 }}>
              Learning isn't linear.<br />
              <span className="grad-cool">But it has a shape.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,17px)", color: "#5a6478", maxWidth: 480, margin: "0 auto", lineHeight: 1.75 }}>
              Hover each step to see what Mentorix actually does there.
            </p>
          </Reveal>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48 }}>

          {/* Loop steps */}
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            gap: 10, maxWidth: 700,
          }}>
            {STEPS.map((s, i) => (
              <motion.button
                key={s.id}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(active === i ? null : i)}
                aria-label={s.label}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 20px", borderRadius: 100,
                  background: active === i ? `${s.color}15` : "rgba(255,255,255,0.025)",
                  border: `1px solid ${active === i ? s.color + "40" : "rgba(255,255,255,0.06)"}`,
                  color: active === i ? s.color : "#3d4560",
                  fontFamily: "Satoshi, sans-serif", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.22s",
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                {s.label}
                {i < STEPS.length - 1 && (
                  <span style={{ marginLeft: 4, color: "rgba(255,255,255,0.1)", fontSize: 12 }}>→</span>
                )}
              </motion.button>
            ))}

            {/* Loop back arrow */}
            <div style={{
              width: "100%", textAlign: "center",
              fontFamily: "Satoshi, sans-serif", fontSize: 12, color: "#3d4560",
              letterSpacing: "0.1em", marginTop: 4,
            }}>
              ↩ and repeat — every time deeper
            </div>
          </div>

          {/* Detail card */}
          <div style={{ width: "100%", maxWidth: 560, minHeight: 120 }}>
            <AnimatePresence mode="wait">
              {hovered ? (
                <motion.div
                  key={hovered.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    padding: "28px 32px", borderRadius: 20,
                    background: `${hovered.color}08`,
                    border: `1px solid ${hovered.color}25`,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{hovered.icon}</div>
                  <h3 style={{
                    fontFamily: "Satoshi, sans-serif", fontSize: 18, fontWeight: 700,
                    color: hovered.color, marginBottom: 10,
                  }}>{hovered.title}</h3>
                  <p style={{
                    fontFamily: "Satoshi, sans-serif", fontSize: 14,
                    color: "#5a6478", lineHeight: 1.7,
                  }}>{hovered.detail}</p>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: "28px 32px", borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.04)",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#5a6478" }}>
                    Hover any step to see what happens there
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
