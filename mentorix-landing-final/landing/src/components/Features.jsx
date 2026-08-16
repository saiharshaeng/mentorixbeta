import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";

const TABS = [
  {
    id: "understand",
    label: "When you want to understand",
    color: "#a78bfa",
    icon: "🧠",
    features: [
      {
        icon: "🤖",
        name: "Tio — your learning companion",
        before: "\"I don't get it and I don't know who to ask.\"",
        after: "Tio explains it again, differently, until it clicks. At 2am if needed.",
      },
      {
        icon: "📚",
        name: "Structured courses",
        before: "\"I have no idea what to study next.\"",
        after: "Every subject mapped into a clear path — chapter by chapter, topic by topic.",
      },
      {
        icon: "🔍",
        name: "Explore & search",
        before: "\"I opened five tabs and none of them connected.\"",
        after: "Question → explanation → example → application. One place.",
      },
    ],
  },
  {
    id: "improve",
    label: "When you want to improve",
    color: "#34d399",
    icon: "📈",
    features: [
      {
        icon: "✏️",
        name: "Practice questions",
        before: "\"I watched the lesson. Now I can't do the question.\"",
        after: "20,000+ questions that build skill, not just test knowledge.",
      },
      {
        icon: "🎯",
        name: "Assessments & mock tests",
        before: "\"I don't know if I'm actually prepared.\"",
        after: "Full-length tests with instant explanations. You'll know exactly where you stand.",
      },
      {
        icon: "🛡️",
        name: "Skill recovery",
        before: "\"I keep making the same mistake and I don't know why.\"",
        after: "Mentorix finds the exact concept gap behind the error — not just the wrong answer.",
      },
      {
        icon: "🔄",
        name: "Smart revision",
        before: "\"I have no time to revise everything.\"",
        after: "Mentorix brings back what you're forgetting, when you need it. Not on a fixed schedule.",
      },
    ],
  },
  {
    id: "explore",
    label: "When you want to explore",
    color: "#38bdf8",
    icon: "🧭",
    features: [
      {
        icon: "🚀",
        name: "Career explorer",
        before: "\"I'm good at maths. What does that actually mean for my future?\"",
        after: "Connect interests → subjects → skills → careers → next steps. A path, not a list.",
      },
      {
        icon: "📊",
        name: "Progress & mastery",
        before: "\"I studied a lot but I don't feel like I'm improving.\"",
        after: "Visible progress. Not streaks. Real mastery — concept by concept.",
      },
    ],
  },
  {
    id: "keep",
    label: "When you want to keep everything",
    color: "#f59e0b",
    icon: "📝",
    features: [
      {
        icon: "📓",
        name: "AI Notebook",
        before: "\"The explanation was perfect. Now I can't find it.\"",
        after: "Every concept Tio explains can become a note. Organised, searchable, always there.",
      },
      {
        icon: "📖",
        name: "Mistake diary",
        before: "\"I got it wrong again but I thought I fixed this.\"",
        after: "Every mistake is recorded with its root cause. Tio remembers so you don't have to.",
      },
    ],
  },
];

function FeatureCard({ feature, color }) {
  return (
    <motion.div
      className="card-glow"
      style={{ padding: "24px 22px" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>{feature.icon}</span>
        <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 14, fontWeight: 700, color: "white" }}>
          {feature.name}
        </span>
      </div>

      {/* Before */}
      <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", marginBottom: 8 }}>
        <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 12, color: "rgba(248,113,113,0.85)", lineHeight: 1.55 }}>
          Before: {feature.before}
        </span>
      </div>

      {/* After */}
      <div style={{ padding: "10px 14px", borderRadius: 10, background: `${color}08`, border: `1px solid ${color}20` }}>
        <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 12, color: "#5a6478", lineHeight: 1.6 }}>
          <span style={{ color, fontWeight: 600 }}>After: </span>{feature.after}
        </span>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section className="section" style={{ background: "var(--black)" }}>
      <div className="wrap">

        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Reveal>
            <div className="badge" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#a78bfa", marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
              Everything Mentorix can do
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 18 }}>
              Not a feature list.<br />
              <span className="grad-warm">Outcomes for learners.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,16px)", color: "#5a6478", maxWidth: 460, margin: "0 auto", lineHeight: 1.75 }}>
              Select what you're trying to do. See how Mentorix helps you get there.
            </p>
          </Reveal>
        </div>

        {/* Tab selector */}
        <Reveal>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 40 }}>
            {TABS.map((t, i) => (
              <motion.button key={t.id} onClick={() => setActive(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 18px", borderRadius: 100,
                  background: active === i ? `${t.color}12` : "transparent",
                  border: `1px solid ${active === i ? t.color + "35" : "rgba(255,255,255,0.06)"}`,
                  color: active === i ? t.color : "#3d4560",
                  fontFamily: "Satoshi, sans-serif", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.22s",
                }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </motion.button>
            ))}
          </div>
        </Reveal>

        {/* Feature cards */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            className="grid-3"
            style={{ gap: 14 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}>
            {tab.features.map((f, i) => (
              <FeatureCard key={i} feature={f} color={tab.color} />
            ))}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
