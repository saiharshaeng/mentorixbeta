import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import FlowField from "./FlowField";

const APP_URL = "https://mentorix-beta.netlify.app"; // TODO: move to app.mentorix.in before launch

// Scripted Tio demo — cycles through real learning moments
const DEMO_SCRIPT = [
  {
    user: "I've watched three explanations of Newton's second law and still don't get it.",
    tio: "Then let's not watch a fourth. Tell me — when you read F = ma, which part feels wrong?",
    tag: "understanding",
  },
  {
    user: "I studied this chapter last month. Now I can't remember any of it.",
    tio: "That's not a memory problem. That's a revision problem. Let's bring it back properly — five minutes, the right way.",
    tag: "revision",
  },
  {
    user: "I know what answer I got wrong. I just don't know why I keep getting it wrong.",
    tio: "That's actually the most useful thing you can know. Let's find the exact point where your understanding breaks.",
    tag: "weak spots",
  },
  {
    user: "I have six chapters left and three days. Where do I even start?",
    tio: "Not at chapter one. Let's look at what you already know, what the exam actually tests, and build from there.",
    tag: "planning",
  },
];

function TioDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("user"); // "user" | "tio" | "pause"
  const [displayedUser, setDisplayedUser] = useState("");
  const [displayedTio, setDisplayedTio] = useState("");
  const script = DEMO_SCRIPT[idx];

  useEffect(() => {
    setPhase("user");
    setDisplayedUser("");
    setDisplayedTio("");
  }, [idx]);

  useEffect(() => {
    if (phase === "user") {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setDisplayedUser(script.user.slice(0, i));
        if (i >= script.user.length) { clearInterval(iv); setTimeout(() => setPhase("tio"), 700); }
      }, 28);
      return () => clearInterval(iv);
    }
    if (phase === "tio") {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setDisplayedTio(script.tio.slice(0, i));
        if (i >= script.tio.length) {
          clearInterval(iv);
          setTimeout(() => {
            setIdx(p => (p + 1) % DEMO_SCRIPT.length);
          }, 2800);
        }
      }, 22);
      return () => clearInterval(iv);
    }
  }, [phase, script]);

  return (
    <motion.div
      style={{
        borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(124,58,237,0.2)",
        background: "rgba(8,8,20,0.94)",
        backdropFilter: "blur(20px)",
        maxWidth: 480, width: "100%",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Chrome bar */}
      <div style={{
        padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(124,58,237,0.06)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ef4444","#f59e0b","#10b981"].map(c => (
            <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.45 }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} className="anim-breathe" />
          <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, color: "#3d4560", letterSpacing: "0.06em" }}>
            Tio · {script.tag}
          </span>
        </div>
        <div style={{
          marginLeft: "auto", padding: "2px 10px", borderRadius: 100,
          background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)",
          fontFamily: "Satoshi, sans-serif", fontSize: 9, fontWeight: 700,
          letterSpacing: "0.1em", color: "#a78bfa", textTransform: "uppercase",
        }}>
          Live demo
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: "20px 20px 8px", minHeight: 180, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* User bubble */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{
            maxWidth: "82%", padding: "11px 15px", borderRadius: "16px 16px 4px 16px",
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)",
            fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#c4b5fd", lineHeight: 1.55,
          }}>
            {displayedUser}
            {phase === "user" && displayedUser.length < script.user.length && (
              <span className="anim-cursor" style={{ opacity: 1, marginLeft: 1 }}>|</span>
            )}
          </div>
        </div>

        {/* Tio bubble */}
        <AnimatePresence>
          {phase === "tio" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {/* Tio avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, boxShadow: "0 0 12px rgba(124,58,237,0.4)",
              }}>🤖</div>
              <div style={{
                maxWidth: "82%", padding: "11px 15px", borderRadius: "16px 16px 16px 4px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#8892a4", lineHeight: 1.6,
              }}>
                {displayedTio}
                {displayedTio.length < script.tio.length && (
                  <span className="anim-cursor" style={{ marginLeft: 1 }}>|</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dots while thinking */}
        <AnimatePresence>
          {phase === "tio" && displayedTio.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {[0,1,2].map(i => (
                  <motion.span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#3d4560", display: "block" }}
                    animate={{ opacity: [0.3,1,0.3], y: [0,-3,0] }}
                    transition={{ duration: 0.9, delay: i*0.18, repeat: Infinity }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div style={{ padding: "12px 20px 16px", display: "flex", justifyContent: "center", gap: 6 }}>
        {DEMO_SCRIPT.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Demo ${i+1}`}
            style={{
              width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
              background: i === idx ? "#a78bfa" : "rgba(255,255,255,0.1)",
              border: "none", transition: "all 0.3s", cursor: "pointer", padding: 0,
            }} />
        ))}
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y  = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const op = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} style={{ position: "relative", minHeight: "100vh" }}>
      <FlowField>
        <motion.div style={{ y, opacity: op }}>
          <div className="wrap" style={{
            minHeight: "100vh", paddingTop: 110, paddingBottom: 80,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center",
          }}>

            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6, ease: [0.16,1,0.3,1] }}
              style={{ marginBottom: 32 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "5px 14px 5px 10px", borderRadius: 100,
                background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.22)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} className="anim-breathe" />
                <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", color: "#a78bfa" }}>
                  Free · Works offline · No signup required
                </span>
              </div>
            </motion.div>

            {/* Logo */}
            <motion.img src="/logo.png" alt="Mentorix"
              className="anim-logo"
              style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 32 }}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.14, duration: 0.8, ease: [0.16,1,0.3,1] }}
            />

            {/* Headline */}
            <motion.h1 className="h-display"
              style={{ fontSize: "clamp(42px,7.5vw,88px)", marginBottom: 0 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16,1,0.3,1] }}>
              Meet the way
            </motion.h1>
            <motion.h1 className="h-display grad-main"
              style={{ fontSize: "clamp(42px,7.5vw,88px)", marginBottom: 28 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.8, ease: [0.16,1,0.3,1] }}>
              you learn.
            </motion.h1>

            {/* Subheadline — clear value prop */}
            <motion.p
              style={{
                fontFamily: "Satoshi, sans-serif",
                fontSize: "clamp(15px,1.8vw,19px)", fontWeight: 400,
                color: "#5a6478", maxWidth: 560, lineHeight: 1.75, marginBottom: 48,
              }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.7, ease: [0.16,1,0.3,1] }}>
              Your personal AI tutor for JEE, NEET, and school exams.{" "}
              <span style={{ color: "#8892a4", fontWeight: 600 }}>20,000+ real PYQs</span>,{" "}
              <span style={{ color: "#8892a4", fontWeight: 600 }}>adaptive lessons</span>,{" "}
              <span style={{ color: "#8892a4", fontWeight: 600 }}>weak spot tracking</span> — all{" "}
              <span style={{ color: "#8892a4", fontWeight: 600 }}>free, forever</span>.
            </motion.p>

            {/* CTAs */}
            <motion.div
              style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "center", marginBottom: 64 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.6 }}>

              <motion.a href={APP_URL}
                className="anim-pulse"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "15px 36px", borderRadius: 14,
                  background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                  border: "1px solid rgba(139,92,246,0.3)", color: "white",
                  fontSize: "clamp(14px,1.6vw,17px)", fontWeight: 700,
                  textDecoration: "none", letterSpacing: "0.02em",
                  boxShadow: "0 0 0 1px rgba(124,58,237,0.2), 0 8px 36px rgba(109,40,217,0.55)",
                  whiteSpace: "nowrap",
                }}
                whileHover={{ scale: 1.04, y: -2, boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 12px 50px rgba(109,40,217,0.7)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 22 }}>
                Start learning →
              </motion.a>

              <motion.a href="/101"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "15px 28px", borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#5a6478", fontSize: "clamp(13px,1.4vw,15px)",
                  fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap",
                }}
                whileHover={{ borderColor: "rgba(167,139,250,0.3)", color: "#c4b5fd", y: -1 }}>
                See how it works ↓
              </motion.a>
            </motion.div>

            {/* Tio demo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", color: "#5a6478", textTransform: "uppercase" }}>
                Say something to Tio ↓
              </motion.p>
              <TioDemo />
            </div>

            {/* Stats */}
            <motion.div
              style={{
                display: "flex", alignItems: "stretch", marginTop: 52,
                borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.015)", backdropFilter: "blur(12px)",
                overflowX: "auto", WebkitOverflowScrolling: "touch",
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
              {[
                { n: "2,200+", l: "Learners",   c: "#a78bfa" },
                { n: "100%",   l: "Free",        c: "#34d399" },
                { n: "20K+",   l: "Questions",   c: "#38bdf8" },
                { n: "24 / 7", l: "Always on",   c: "#f59e0b" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "16px 28px", textAlign: "center", flexShrink: 0,
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <div className="f-clash" style={{ fontSize: "clamp(18px,2.5vw,26px)", fontWeight: 700, color: s.c, lineHeight: 1, marginBottom: 5 }}>{s.n}</div>
                  <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "#2d3a50", textTransform: "uppercase" }}>{s.l}</div>
                </div>
              ))}
            </motion.div>

          </div>
        </motion.div>
      </FlowField>
    </section>
  );
}
