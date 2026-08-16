import Reveal from "./Reveal";
import { motion } from "framer-motion";

// Beta tester feedback — anonymous attributions only
const quotes = [
  {
    text: "I kept getting rotational mechanics questions wrong without understanding why. After working through the CBL breakdowns, I finally saw the exact mistake I was making.",
    name: "Grade 12 · JEE Aspirant",
    tag: "Physics",
    color: "#a78bfa",
  },
  {
    text: "I used to waste 30 minutes just deciding what to study first. Mentorix tells me what's urgent and decaying so I just sit down and solve.",
    name: "Grade 11 · Beta Tester",
    tag: "Daily Focus",
    color: "#38bdf8",
  },
  {
    text: "The mistake diary is what makes this different. I stopped repeating the same algebraic sign slips once I could see the pattern.",
    name: "Class 10 · Beta Tester",
    tag: "Mistake Diary",
    color: "#34d399",
  },
  {
    text: "Tio doesn't just give answers — it asks why I picked option C and helps me find the logical gap on my own. That sticks better.",
    name: "Grade 12 · JEE Prep",
    tag: "AI Dialogue",
    color: "#f59e0b",
  },
];

export default function Testimonials() {
  return (
    <section className="section" style={{ background: "var(--deep)", overflow: "hidden" }}>
      <div className="wrap">

        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Reveal>
            <div className="badge" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)", color: "#34d399", marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />
              From learners
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 18 }}>
              What students actually say.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.4vw,15px)", color: "#5a6478", maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
              Real quotes from Mentorix users. No stars. No "amazing platform!!!"
            </p>
          </Reveal>
        </div>

        <div className="grid-3" style={{ gap: 14 }}>
          {quotes.map((q, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <motion.div
                className="card-glow"
                style={{ padding: "26px 24px", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Tag */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "3px 10px", borderRadius: 100,
                  background: `${q.color}12`, border: `1px solid ${q.color}25`,
                  alignSelf: "flex-start",
                }}>
                  <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: q.color, textTransform: "uppercase" }}>
                    {q.tag}
                  </span>
                </div>

                {/* Quote */}
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.3vw,14px)", color: "#5a6478", lineHeight: 1.75, flexGrow: 1 }}>
                  "{q.text}"
                </p>

                {/* Attribution */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: `${q.color}20`, border: `1px solid ${q.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, flexShrink: 0,
                  }}>👤</div>
                  <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 12, color: "#5a6478" }}>
                    — {q.name}
                  </span>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
