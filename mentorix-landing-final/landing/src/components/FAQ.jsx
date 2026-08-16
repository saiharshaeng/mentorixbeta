import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "What is Mentorix?",
    a: "Mentorix is a personal learning and mentorship ecosystem. It combines structured courses, practice questions, assessments, smart revision, weak-spot analysis, and career exploration — all connected through Tio, your personal learning companion. It's built to help you understand more deeply, not just finish more quickly.",
  },
  {
    q: "Who is Mentorix for?",
    a: "Any student who wants more from their learning than just finishing a syllabus. Whether you're struggling with a concept, preparing for an exam, revising before a test, or trying to figure out what to study next — Mentorix is built for that moment. You don't need to be preparing for a specific exam to benefit.",
  },
  {
    q: "Is Mentorix free?",
    a: "Yes. Completely free. No subscription, no paywall, no trial period. Mentorix will always be free for every student. If you find it helpful and want to support it, there's a donate page — but it's entirely optional and never required.",
  },
  {
    q: "What can Tio help with?",
    a: "Tio can explain concepts, answer questions, walk through examples, clarify derivations, help you figure out what to study next, and guide you through your weak spots. What Tio won't do is just give you an answer without helping you understand it — the goal is always understanding, not dependency.",
  },
  {
    q: "Does Mentorix replace teachers?",
    a: "No. And it's not trying to. Human teachers, parents, mentors, and institutions still matter enormously. Mentorix is designed to amplify learning — to give every student access to the kind of guidance that was previously only available to some. It works alongside teachers, not instead of them.",
  },
  {
    q: "What subjects and exams does Mentorix cover?",
    a: "Mentorix supports general learning across subjects including Science, Mathematics, and more. It also has specific support for competitive exam preparation. Coverage is expanding — if your subject or exam isn't there yet, it's being built.",
  },
  {
    q: "Can I use Mentorix on my phone?",
    a: "Yes. Mentorix is a Progressive Web App — it works in your browser on any device and can be added to your home screen like an app. No download required from any app store.",
  },
  {
    q: "How does Mentorix know what I need to study next?",
    a: "Mentorix tracks your performance across practice, tests, and sessions. It identifies which concepts you're consistently getting wrong, which ones are fading from memory, and what's most urgent given your goals. It doesn't just give you a random list — it builds recommendations from your actual learning history.",
  },
  {
    q: "How do I get started?",
    a: "Just open the app. Tell Tio what you're studying or what you're stuck on. There's no perfect starting point — Mentorix will figure out where you are and help you move forward from there.",
  },
];

function FAQItem({ q, a, i }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.04, duration: 0.5 }}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, padding: "20px 0",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,16px)", fontWeight: 600, color: open ? "white" : "#8892a4", lineHeight: 1.4, transition: "color 0.2s" }}>
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ color: open ? "#a78bfa" : "#3d4560", fontSize: 20, flexShrink: 0, lineHeight: 1 }}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.3vw,14px)", color: "#5a6478", lineHeight: 1.8, paddingBottom: 20 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <section className="section" style={{ background: "var(--deep)" }}>
      <div className="wrap">

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}
          className="split-grid faq-split">

          {/* Left — header */}
          <div>
            <Reveal>
              <div className="badge" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.18)", color: "#38bdf8", marginBottom: 20 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#38bdf8" }} />
                Questions
              </div>
            </Reveal>
            <Reveal delay={0.07}>
              <h2 className="h-display" style={{ fontSize: "clamp(26px,3.5vw,44px)", marginBottom: 20 }}>
                Answers to the things you're probably wondering.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.4vw,15px)", color: "#5a6478", lineHeight: 1.75, marginBottom: 28 }}>
                If something's not here, you can always ask Tio — or send Harsha a message directly.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <a href="/feedback" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 20px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#5a6478", fontFamily: "Satoshi, sans-serif",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)"; e.currentTarget.style.color = "#a78bfa"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#5a6478"; }}>
                Ask a question →
              </a>
            </Reveal>
          </div>

          {/* Right — accordion */}
          <div>
            {FAQS.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} i={i} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
