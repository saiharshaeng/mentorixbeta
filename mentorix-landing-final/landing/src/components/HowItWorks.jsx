import { motion } from "framer-motion";
import Reveal from "./Reveal";

const STEPS = [
  {
    num: "01",
    color: "#a78bfa",
    title: "Tell Mentorix where you are",
    desc: "Your subject, level, goal, or exam. Or just tell Tio what you're stuck on right now. There's no perfect starting point required.",
    icon: "💬",
  },
  {
    num: "02",
    color: "#38bdf8",
    title: "Learn with real understanding",
    desc: "Get explanations that go deep enough to actually help. Courses, examples, derivations, the reason behind the formula — not just the formula.",
    icon: "🧠",
  },
  {
    num: "03",
    color: "#34d399",
    title: "Practise and test yourself",
    desc: "Solve questions that build your ability. Take assessments that show you where you actually stand — not where you think you do.",
    icon: "✏️",
  },
  {
    num: "04",
    color: "#f59e0b",
    title: "Mentorix tells you what comes next",
    desc: "After every session, Mentorix identifies weak spots, resurfaces what you're forgetting, and helps you decide what to focus on next.",
    icon: "🎯",
  },
];

export default function HowItWorks() {
  return (
    <section className="section" style={{ background: "var(--deep)" }}>
      <div className="wrap">

        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <Reveal>
            <div className="badge" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />
              How Mentorix works
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 18 }}>
              Simple to start.<br />
              <span className="grad-main">Gets smarter as you go.</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid-2" style={{ gap: 16 }}>
          {STEPS.map((s, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <motion.div
                className="card-glow"
                style={{ padding: "32px 28px", height: "100%" }}
              >
                {/* Number + icon */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <span className="f-mono" style={{ fontSize: 11, color: s.color, letterSpacing: "0.18em", fontWeight: 500 }}>
                    STEP {s.num}
                  </span>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                </div>

                {/* Accent line */}
                <div style={{ width: 32, height: 2, background: s.color, borderRadius: 2, marginBottom: 18, opacity: 0.7 }} />

                <h3 style={{
                  fontFamily: "Satoshi, sans-serif", fontSize: "clamp(16px,1.8vw,20px)",
                  fontWeight: 700, color: "white", marginBottom: 12, lineHeight: 1.3,
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.3vw,14px)",
                  color: "#5a6478", lineHeight: 1.75,
                }}>
                  {s.desc}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
