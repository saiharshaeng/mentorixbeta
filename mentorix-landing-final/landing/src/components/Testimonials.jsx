import Reveal from "./Reveal";
import { motion } from "framer-motion";

const quotes = [
  {
    text: "I'd been getting the same Coulomb's Law question wrong for two months. One session on Mentorix and I finally understood why — I was treating it as a scalar. The mistake diary made me see the pattern I kept missing.",
    name: "Arjun S., Class 12",
    subject: "JEE Physics",
    tag: "Breakthrough",
    color: "#a78bfa",
  },
  {
    text: "The chapter practice actually knows what chapter I chose. Every other app just gives me random questions and calls it practice. This gives me 10 Kinematics questions if I say Kinematics.",
    name: "Priya M., Class 11",
    subject: "JEE Mathematics",
    tag: "Practice",
    color: "#38bdf8",
  },
  {
    text: "I asked Tio to explain why Entropy increases in spontaneous reactions at 11pm. It explained it three different ways until one clicked. My teacher does this too but I can't call her at 11pm.",
    name: "Rohan K., Class 12",
    subject: "JEE Chemistry",
    tag: "Understanding",
    color: "#34d399",
  },
  {
    text: "I used to study whatever felt comfortable. Now I can see exactly which topics I've actually got and which ones I'm fooling myself about. That alone changed how I plan my week.",
    name: "Sneha P., Class 11",
    subject: "NEET Biology",
    tag: "Planning",
    color: "#f59e0b",
  },
  {
    text: "Free isn't supposed to mean good. Mentorix broke that rule. I've used paid apps that felt cheap compared to this.",
    name: "Vikram L., Class 12",
    subject: "JEE Maths",
    tag: "Value",
    color: "#ec4899",
  },
  {
    text: "The offline mode is the reason I can use this on my way to school. No WiFi needed. That one thing makes it actually usable for me.",
    name: "Ananya R., Class 11",
    subject: "Science",
    tag: "Accessibility",
    color: "#818cf8",
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
              What students say.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.3vw,14px)", color: "#5a6478", marginTop: 12, lineHeight: 1.7 }}>
              Real feedback from students using Mentorix to prepare for JEE, NEET, and board exams.
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
