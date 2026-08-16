import Reveal from "../components/Reveal";
import FinalCTA from "../components/FinalCTA";
import { motion } from "framer-motion";

const problems = [
  { icon: "😶", text: "One teacher. Sixty students. You're invisible." },
  { icon: "💸", text: "Quality guidance costs more than most families earn in a month." },
  { icon: "📖", text: "Exams test memory. Not whether you actually understood anything." },
  { icon: "🗺️", text: "Nobody tells you what to study next or why you keep getting it wrong." },
  { icon: "⏰", text: "Help is available during school hours. You study at midnight." },
  { icon: "🎲", text: "Your circumstances shouldn't decide how far your curiosity can take you." },
];

const changes = [
  { icon: "🤖", color: "#a78bfa", text: "A companion that knows your weak spots and helps fix them — before your next assessment does." },
  { icon: "♾️", color: "#22d3ee", text: "A mentor available at 2am, before a test, always — and always free." },
  { icon: "🧠", color: "#34d399", text: "Explanations built for understanding — not for finishing a syllabus quickly." },
  { icon: "🎯", color: "#f59e0b", text: "A revision plan that adapts to your goals and your actual performance." },
  { icon: "📊", color: "#f472b6", text: "Honest progress. Not a streak counter. Real mastery — concept by concept." },
  { icon: "🌍", color: "#60a5fa", text: "Free for every learner. Without exception. That's the entire model." },
];

export default function Vision() {
  return (
    <>
      <main style={{ paddingTop: 100, background: "var(--black)" }}>
        <div className="wrap section">

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <Reveal>
              <div className="badge" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", marginBottom: 20 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
                Our vision
              </div>
            </Reveal>
            <Reveal delay={0.07}>
              <h1 className="h-display" style={{ fontSize: "clamp(32px,5.5vw,68px)", marginBottom: 20 }}>
                Education should adapt<br />
                <span className="grad-warm">to the learner.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.13}>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(15px,1.7vw,18px)", color: "#5a6478", lineHeight: 1.75, maxWidth: 520, margin: "0 auto" }}>
                Not force every learner to adapt to the same system. That's a powerful sentence. And it's the reason Mentorix exists.
              </p>
            </Reveal>
          </div>

          {/* Problem / Change grid */}
          <div className="grid-2" style={{ gap: 16, marginBottom: 80 }}>

            <Reveal>
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(239,68,68,0.08)", height: "100%" }}>
                <div style={{ padding: "18px 26px", borderBottom: "1px solid rgba(239,68,68,0.07)", background: "rgba(239,68,68,0.03)", display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(239,68,68,0.6)" }} />
                  <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(248,113,113,0.7)", textTransform: "uppercase" }}>The reality for many learners</span>
                </div>
                <div style={{ background: "var(--card)" }}>
                  {problems.map((p, i) => (
                    <Reveal key={i} delay={i * 0.04}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "Satoshi, sans-serif", fontSize: "clamp(12px,1.3vw,14px)", color: "#5a6478", lineHeight: 1.65 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
                        {p.text}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(124,58,237,0.12)", height: "100%" }}>
                <div style={{ padding: "18px 26px", borderBottom: "1px solid rgba(124,58,237,0.08)", background: "rgba(124,58,237,0.04)", display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(124,58,237,0.8)" }} />
                  <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(167,139,250,0.85)", textTransform: "uppercase" }}>What Mentorix changes</span>
                </div>
                <div style={{ background: "var(--card)" }}>
                  {changes.map((c, i) => (
                    <Reveal key={i} delay={i * 0.04}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "Satoshi, sans-serif", fontSize: "clamp(12px,1.3vw,14px)", color: "#5a6478", lineHeight: 1.65 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{c.icon}</span>
                        {c.text}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Vision statement */}
          <Reveal>
            <div style={{ padding: "clamp(32px,5vw,56px) clamp(24px,5vw,64px)", borderRadius: 24, border: "1px solid rgba(124,58,237,0.12)", background: "rgba(124,58,237,0.04)", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.6),rgba(6,182,212,0.4),transparent)" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%,rgba(124,58,237,0.07),transparent)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 56, lineHeight: 0.7, color: "rgba(124,58,237,0.2)", fontWeight: 800, marginBottom: 24 }}>"</div>
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(16px,2.2vw,26px)", fontWeight: 500, color: "white", lineHeight: 1.65, maxWidth: 620, margin: "0 auto 40px", fontStyle: "italic" }}>
                  I want to be the companion someone never had. The one that sits with you, explains it again, never gets tired of your questions, and never makes you feel like you're asking too much.
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "white", boxShadow: "0 0 20px rgba(124,58,237,0.4)", fontFamily: "Satoshi, sans-serif" }}>H</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 14, fontWeight: 700, color: "white" }}>Harsha</div>
                    <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 12, color: "#3d4560", marginTop: 2 }}>Founder · 18 · Hyderabad, India</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </main>
      <FinalCTA />
    </>
  );
}
