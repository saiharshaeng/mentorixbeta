import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";

const APP_URL = "https://mentorix-beta.netlify.app";

const screens = [
  {
    img: "/screen-dashboard.png",
    label: "Dashboard",
    color: "#a78bfa",
    title: "Your command centre",
    desc: "Every morning, Tio gives you a briefing — what to focus on, what you're forgetting, what's urgent. Not a generic to-do list. A plan built from your actual learning history.",
  },
  {
    img: "/screen-courses.png",
    label: "Courses",
    color: "#38bdf8",
    title: "A path, not a pile of content",
    desc: "Every subject mapped chapter by chapter, topic by topic. Visual progress so you always know exactly where you are and what comes next — without having to figure it out yourself.",
  },
  {
    img: "/screen-competitive.png",
    label: "Practice",
    color: "#f59e0b",
    title: "Practise with purpose",
    desc: "Custom practice rooms, full assessments, and a 3-pass strategy guide built in. Questions that build ability, not just test memory.",
  },
  {
    img: "/screen-notebook.png",
    label: "AI Notebook",
    color: "#34d399",
    title: "Notes that write themselves",
    desc: "Every concept Tio explains can become a structured, searchable note instantly. Your personal knowledge base grows as you learn — organised, always there.",
  },
  {
    img: "/screen-recovery.png",
    label: "Skill Recovery",
    color: "#ec4899",
    title: "Know exactly what's holding you back",
    desc: "Mistake Diary tracks every weak concept, your mastery stage, and root cause. Not just 'you got it wrong' — but why, and what to do about it.",
  },
];

export default function AppScreenshots() {
  const [active, setActive] = useState(0);
  const screen = screens[active];

  return (
    <section className="section" style={{ background: "var(--deep)", overflow: "hidden" }}>
      <div className="wrap">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Reveal>
            <div className="badge" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
              See it for yourself
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 18 }}>
              This actually exists.<br />
              <span className="grad-cool">Here's what it looks like.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,16px)", color: "#5a6478", maxWidth: 440, margin: "0 auto", lineHeight: 1.75 }}>
              Real screenshots from the live app. Select a section to explore.
            </p>
          </Reveal>
        </div>

        {/* Tab pills */}
        <Reveal>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 40 }}>
            {screens.map((s, i) => (
              <motion.button key={i} onClick={() => setActive(i)}
                style={{
                  padding: "9px 18px", borderRadius: 100, flexShrink: 0,
                  border: `1px solid ${active === i ? s.color + "50" : "rgba(255,255,255,0.07)"}`,
                  background: active === i ? `${s.color}12` : "transparent",
                  color: active === i ? s.color : "#3d4560",
                  fontFamily: "Satoshi, sans-serif", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.22s",
                }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                {s.label}
              </motion.button>
            ))}
          </div>
        </Reveal>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 48, alignItems: "center" }}
            className="screenshot-grid">

            {/* Left — text */}
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "3px 12px", borderRadius: 8, marginBottom: 18,
                background: `${screen.color}15`, border: `1px solid ${screen.color}28`,
              }}>
                <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: screen.color }}>
                  {screen.label}
                </span>
              </div>
              <h3 className="h-display" style={{ fontSize: "clamp(20px,2.6vw,34px)", marginBottom: 16, lineHeight: 1.2 }}>
                {screen.title}
              </h3>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.4vw,15px)", color: "#5a6478", lineHeight: 1.8, marginBottom: 28 }}>
                {screen.desc}
              </p>
              <motion.a href={APP_URL}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 22px", borderRadius: 12,
                  background: `${screen.color}14`, border: `1px solid ${screen.color}28`,
                  color: screen.color, fontFamily: "Satoshi, sans-serif",
                  fontSize: 13, fontWeight: 700, textDecoration: "none",
                }}
                whileHover={{ background: `${screen.color}24` }}>
                Try it free →
              </motion.a>
            </div>

            {/* Right — real screenshot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderRadius: 16, overflow: "hidden",
                boxShadow: `0 0 80px ${screen.color}18, 0 24px 60px rgba(0,0,0,0.6)`,
                border: `1px solid ${screen.color}18`,
                position: "relative",
              }}>
              {/* Fake browser chrome */}
              <div style={{
                padding: "8px 14px", background: "rgba(8,8,20,0.98)",
                borderBottom: `1px solid ${screen.color}15`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#ef4444","#f59e0b","#10b981"].map(c => (
                    <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.5 }} />
                  ))}
                </div>
                <div style={{
                  flex: 1, height: 20, borderRadius: 4,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, color: "#3d4560" }}>
                    mentorix-beta.netlify.app
                  </span>
                </div>
              </div>
              <img
                src={screen.img}
                alt={`Mentorix ${screen.label}`}
                style={{ width: "100%", display: "block", objectFit: "cover" }}
                loading="lazy"
              />
              {/* Subtle overlay gradient at bottom */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
                background: `linear-gradient(to top, rgba(8,8,20,0.5), transparent)`,
                pointerEvents: "none",
              }} />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          {screens.map((s, i) => (
            <button key={i} onClick={() => setActive(i)} aria-label={s.label}
              style={{
                width: active === i ? 24 : 7, height: 7, borderRadius: 4,
                background: active === i ? s.color : "rgba(255,255,255,0.1)",
                border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0,
              }} />
          ))}
        </div>

      </div>
    </section>
  );
}
