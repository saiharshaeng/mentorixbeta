import Reveal from "../components/Reveal";
import FinalCTA from "../components/FinalCTA";
import { motion } from "framer-motion";

const values = [
  { icon: "🆓", color: "#34d399", title: "Free. Always.", body: "Not a trial. Not a freemium tier. Mentorix is free for every learner, regardless of circumstance. That's not a feature — it's the point." },
  { icon: "🧠", color: "#a78bfa", title: "Understanding over answers.", body: "Mentorix isn't here to give you the answer quickly. It's here to help you understand why — because that's the only kind of learning that lasts." },
  { icon: "🤝", color: "#38bdf8", title: "Learning is personal.", body: "Different learners need different paths to the same understanding. Mentorix is built around that — not a one-size system that forces everyone to adapt." },
  { icon: "🌱", color: "#f59e0b", title: "Amplify, not replace.", body: "Teachers, parents, mentors — they still matter enormously. Mentorix is built to amplify learning, not to pretend human guidance doesn't exist." },
];

export default function About() {
  return (
    <>
      <main style={{ paddingTop: 100, background: "var(--black)" }}>
        <div className="wrap section">

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <Reveal>
              <div className="badge" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", marginBottom: 20 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
                About Mentorix
              </div>
            </Reveal>
            <Reveal delay={0.07}>
              <h1 className="h-display" style={{ fontSize: "clamp(32px,5.5vw,68px)", marginBottom: 20 }}>
                A learner shouldn't have to<br />
                <span className="grad-main">figure out how to learn alone.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.13}>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(15px,1.7vw,18px)", color: "#5a6478", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>
                Mentorix sits at the intersection of education, mentorship, and personalization — built to connect the pieces that most learning systems leave disconnected.
              </p>
            </Reveal>
          </div>

          {/* What Mentorix is */}
          <Reveal>
            <div style={{
              padding: "48px 56px", borderRadius: 24,
              background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)",
              marginBottom: 64, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#7c3aed,#06b6d4,transparent)" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="split-grid">
                <div>
                  <h2 className="h-display" style={{ fontSize: "clamp(20px,2.5vw,30px)", marginBottom: 18 }}>What Mentorix is</h2>
                  <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.4vw,15px)", color: "#5a6478", lineHeight: 1.8 }}>
                    Mentorix is a connected learning ecosystem — not just a chatbot. Tio is the companion that makes it feel human. But Mentorix is the system underneath: courses, practice, tests, revision, weak-spot tracking, progress, career exploration, and a notebook that holds your learning together.
                  </p>
                </div>
                <div>
                  <h2 className="h-display" style={{ fontSize: "clamp(20px,2.5vw,30px)", marginBottom: 18 }}>What Mentorix is not</h2>
                  <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.4vw,15px)", color: "#5a6478", lineHeight: 1.8 }}>
                    Not a replacement for teachers. Not a tool to get answers faster. Not an exam-only app. Not designed to create dependency. Mentorix is designed around one idea: the learner should leave better at learning — not just better at using Mentorix.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Values */}
          <div style={{ marginBottom: 80 }}>
            <Reveal>
              <h2 className="h-display" style={{ fontSize: "clamp(22px,3vw,36px)", textAlign: "center", marginBottom: 40 }}>
                What Mentorix believes
              </h2>
            </Reveal>
            <div className="grid-2" style={{ gap: 14 }}>
              {values.map((v, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <motion.div className="card-glow" style={{ padding: "28px 26px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${v.color},transparent)` }} />
                    <span style={{ fontSize: 26, display: "block", marginBottom: 14 }}>{v.icon}</span>
                    <h3 style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(15px,1.6vw,18px)", fontWeight: 700, color: "white", marginBottom: 10 }}>{v.title}</h3>
                    <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.3vw,14px)", color: "#5a6478", lineHeight: 1.75 }}>{v.body}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Founder */}
          <Reveal>
            <div style={{ padding: "48px 56px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)", background: "var(--card)", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(124,58,237,0.06), transparent)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 52, lineHeight: 0.7, color: "rgba(124,58,237,0.2)", fontWeight: 800, marginBottom: 24 }}>"</div>
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(15px,2vw,22px)", fontWeight: 500, color: "white", lineHeight: 1.65, maxWidth: 580, margin: "0 auto 36px", fontStyle: "italic" }}>
                  I built Mentorix because I experienced what it feels like to learn without enough guidance, structure, or resources. I wanted to build the kind of system I wished existed when I needed it.
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Satoshi, sans-serif", fontSize: 20, fontWeight: 800, color: "white", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>H</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 15, fontWeight: 700, color: "white" }}>Harsha</div>
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
