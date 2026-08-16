import Reveal from "./Reveal";
import { motion } from "framer-motion";

const beliefs = [
  {
    icon: "🧠",
    headline: "Understand, don't memorise blindly.",
    body: "There's no point knowing a formula you can't use. Mentorix is built around understanding the reason — not just the result.",
    color: "#a78bfa",
  },
  {
    icon: "✏️",
    headline: "Practise, don't just consume.",
    body: "Reading a concept and solving a question are very different skills. One builds familiarity. The other builds ability.",
    color: "#38bdf8",
  },
  {
    icon: "🔍",
    headline: "Find weaknesses. Don't hide from them.",
    body: "A score tells you what happened. A weak-spot tells you why. Mentorix is more interested in the why.",
    color: "#34d399",
  },
  {
    icon: "🧭",
    headline: "Build your path. Don't wait for one.",
    body: "Learning is not the destination. It's the beginning of what you can become. Mentorix helps you see further.",
    color: "#f59e0b",
  },
];

export default function Philosophy() {
  return (
    <section className="section" style={{ background: "var(--black)" }}>
      <div className="wrap">

        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <Reveal>
            <div className="badge" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#a78bfa", marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
              Why Mentorix
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 18 }}>
              Because learning is bigger<br />
              <span className="grad-main">than answers.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,17px)", color: "#5a6478", maxWidth: 480, margin: "0 auto", lineHeight: 1.75 }}>
              Mentorix isn't here to give you more things to study. It's here to help you understand where you are, figure out what you need, and keep moving forward.
            </p>
          </Reveal>
        </div>

        {/* Belief cards */}
        <div className="grid-2" style={{ gap: 14, marginBottom: 72 }}>
          {beliefs.map((b, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <motion.div
                className="card-glow"
                style={{ padding: "32px 28px", position: "relative", overflow: "hidden" }}
              >
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${b.color}, transparent)`,
                }} />
                <span style={{ fontSize: 28, display: "block", marginBottom: 16 }}>{b.icon}</span>
                <h3 style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(15px,1.6vw,18px)", fontWeight: 700, color: "white", marginBottom: 12, lineHeight: 1.35 }}>
                  {b.headline}
                </h3>
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.3vw,14px)", color: "#5a6478", lineHeight: 1.75 }}>
                  {b.body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>

        {/* Tio distinction callout */}
        <Reveal>
          <div style={{
            padding: "40px 48px", borderRadius: 24,
            background: "rgba(124,58,237,0.04)",
            border: "1px solid rgba(124,58,237,0.12)",
            position: "relative", overflow: "hidden",
            textAlign: "center",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,58,237,0.07), transparent)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
              <h3 className="h-display" style={{ fontSize: "clamp(18px,2.5vw,28px)", marginBottom: 16 }}>
                Mentorix is not Tio.
              </h3>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,16px)", color: "#5a6478", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>
                Tio is the learning companion — warm, patient, always available. Mentorix is the ecosystem around it: courses, practice, tests, revision, weak-spot tracking, career exploration.{" "}
                <span style={{ color: "#8892a4", fontWeight: 600 }}>The difference matters</span>{" "}
                — because Mentorix isn't another chatbot. It's a connected learning system with a companion built into it.
              </p>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
