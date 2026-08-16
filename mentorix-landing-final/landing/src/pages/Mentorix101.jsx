import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "../components/Reveal";
import FinalCTA from "../components/FinalCTA";

const STEPS = [
  {
    num: "01", label: "Understand", color: "#a78bfa", icon: "🧠",
    title: "Explanations deep enough to actually help",
    desc: "Most study resources give you definitions. Mentorix gives you the reason behind the concept, a worked example, the pattern the assessment tests, and a way to remember it. Not a summary. The actual understanding.",
    points: [
      "Tio explains concepts the way you need them explained",
      "Derivations and worked examples — not just formulas",
      "The 'why' behind the answer, not just the answer",
      "Adaptable explanations — if one doesn't click, try again differently",
      "Notes auto-generated so understanding doesn't disappear",
    ],
  },
  {
    num: "02", label: "Practise", color: "#34d399", icon: "✏️",
    title: "Practise deliberately — not just repeatedly",
    desc: "Reading a concept and solving a question are very different skills. Mentorix gives you questions that build ability progressively — starting where you are, pushing you where you need to go.",
    points: [
      "20,000+ questions across subjects and difficulty levels",
      "Progressive difficulty — builds from where you actually are",
      "Full assessments that mirror real exam conditions",
      "Instant explanations for every question — not just the answer",
      "Bookmark hard questions to revisit before your exam",
    ],
  },
  {
    num: "03", label: "Discover", color: "#f59e0b", icon: "🔍",
    title: "Find what's actually holding you back",
    desc: "A score tells you what happened. A weak-spot tells you why. Mentorix identifies the specific concept gap behind the error — not just the topic, but the exact point where your understanding breaks.",
    points: [
      "Concept-level weak-spot detection — not just topic-level",
      "Mistake diary with root cause analysis",
      "Pattern recognition — careless mistakes vs concept gaps",
      "Tio's personalised next-step recommendations",
      "Score trends that show real improvement over time",
    ],
  },
  {
    num: "04", label: "Revise", color: "#38bdf8", icon: "🔄",
    title: "Revise what deserves it, when it needs it",
    desc: "Not everything needs the same revision time. Mentorix resurfaces concepts when you're about to forget them — calibrated to your actual performance and your goals, not a fixed schedule.",
    points: [
      "Spaced repetition built around your memory, not a timer",
      "Urgency ranking — most forgotten concepts come first",
      "5-minute recovery sessions for quick reinforcement",
      "Flashcard review for concepts that need drilling",
      "Revision that gets smarter as you use it",
    ],
  },
  {
    num: "05", label: "Explore", color: "#ec4899", icon: "🧭",
    title: "See where your learning can take you",
    desc: "Learning isn't the destination. Mentorix connects what you're studying to what you could become — subjects, skills, career paths, and possibilities you might not have considered yet.",
    points: [
      "Career exploration connected to your subjects",
      "Interest → subject → skill → career pathways",
      "Progress tracking that shows real mastery growth",
      "Study plan suggestions based on where you want to go",
      "The learning loop continues — always something next",
    ],
  },
];

export default function Mentorix101() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <>
      <main style={{ paddingTop: 100, background: "var(--black)" }}>
        <div className="wrap section">

          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <Reveal>
              <div className="badge" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", marginBottom: 20 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
                How Mentorix works
              </div>
            </Reveal>
            <Reveal delay={0.07}>
              <h1 className="h-display" style={{ fontSize: "clamp(30px,5.5vw,64px)", marginBottom: 20 }}>
                Five stages.<br />
                <span className="grad-cool">One connected loop.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.13}>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.7vw,18px)", color: "#5a6478", lineHeight: 1.75, maxWidth: 500, margin: "0 auto" }}>
                This isn't a feature tour. This is how you go from struggling with something to actually knowing it.
              </p>
            </Reveal>
          </div>

          {/* Step tabs */}
          <Reveal>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 48 }}>
              {STEPS.map((s, i) => (
                <motion.button key={i} onClick={() => setActive(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "10px 20px", borderRadius: 100,
                    background: active === i ? `${s.color}12` : "transparent",
                    border: `1px solid ${active === i ? s.color + "40" : "rgba(255,255,255,0.06)"}`,
                    color: active === i ? s.color : "#3d4560",
                    fontFamily: "Satoshi, sans-serif", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.22s",
                  }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <span className="f-mono" style={{ fontSize: 10, letterSpacing: "0.1em" }}>{s.num}</span>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </motion.button>
              ))}
            </div>
          </Reveal>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div key={active}
              className="split-grid"
              style={{ gap: 64, alignItems: "start" }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}>

              {/* Text */}
              <div>
                <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: step.color, marginBottom: 16 }}>
                  Stage {step.num}
                </div>
                <h2 className="h-display" style={{ fontSize: "clamp(20px,2.8vw,34px)", marginBottom: 18, lineHeight: 1.2 }}>
                  {step.title}
                </h2>
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.4vw,15px)", color: "#5a6478", lineHeight: 1.8, marginBottom: 32 }}>
                  {step.desc}
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
                  {step.points.map((p, i) => (
                    <motion.li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontFamily: "Satoshi, sans-serif", fontSize: "clamp(12px,1.3vw,14px)", color: "#5a6478", lineHeight: 1.6 }}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: step.color, flexShrink: 0, marginTop: 7 }} />
                      {p}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Visual card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: "36px 32px", borderRadius: 20,
                  background: `${step.color}08`,
                  border: `1px solid ${step.color}20`,
                  position: "relative", overflow: "hidden",
                }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${step.color},transparent)` }} />
                <div style={{ fontSize: 48, marginBottom: 20 }}>{step.icon}</div>
                <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: step.color, marginBottom: 14 }}>
                  {step.label}
                </div>
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(15px,1.8vw,20px)", fontWeight: 600, color: "white", lineHeight: 1.5, marginBottom: 24 }}>
                  {step.title}
                </p>
                {/* Mini loop indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {STEPS.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: active === i ? 20 : 6, height: 6, borderRadius: 3, background: active === i ? s.color : "rgba(255,255,255,0.08)", transition: "all 0.3s" }} />
                      {i < STEPS.length - 1 && <span style={{ fontSize: 8, color: "#3d4560" }}>→</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

        </div>
      </main>
      <FinalCTA />
    </>
  );
}
