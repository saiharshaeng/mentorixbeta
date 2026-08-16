import { useState } from "react";
import { motion } from "framer-motion";
import Reveal from "./Reveal";

const UPI_ID = "8688402869@fam";
// QR code is the uploaded image — user supplies the actual file
// For now we use a styled UPI card + the QR they gave us

export default function DonateSection() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <section className="section" style={{ background: "var(--black)", position: "relative", overflow: "hidden" }}>
      {/* Warm ambient glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 500, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.05),transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

      <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Reveal>
            <div className="badge" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b" }} />
              Support Mentorix
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 18 }}>
              Free for learners.<br />
              <span className="grad-warm">Powered by supporters.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,16px)", color: "#5a6478", maxWidth: 460, margin: "0 auto", lineHeight: 1.75 }}>
              Mentorix will always be free. If it helped you learn something, consider keeping it alive for the next student.
            </p>
          </Reveal>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, maxWidth: 900, margin: "0 auto" }} className="donate-grid-3">

          {/* QR Code */}
          <Reveal>
            <div className="card-glow" style={{ padding: "28px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#f59e0b,#ec4899)" }} />
              <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 16 }}>Scan to Pay</div>
              {/* QR code — user's actual orange QR */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <div style={{
                  width: 140, height: 140, borderRadius: 14,
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  <img src="/qr-donate.png" alt="UPI QR Code"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => {
                      // fallback if QR image not present yet
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div style={{ display: "none", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 32 }}>📱</span>
                    <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, color: "#3d4560" }}>QR coming</span>
                  </div>
                </div>
              </div>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, color: "#3d4560", lineHeight: 1.6 }}>
                Open any UPI app and scan
              </p>
            </div>
          </Reveal>

          {/* UPI ID */}
          <Reveal delay={0.07}>
            <div className="card-glow" style={{ padding: "28px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }} />
              <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a78bfa", marginBottom: 16 }}>Or Enter UPI ID</div>
              <div style={{ fontSize: 28, marginBottom: 16 }}>💸</div>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#5a6478", lineHeight: 1.7, marginBottom: 20 }}>
                Copy the UPI ID and pay via PhonePe, GPay, Paytm, or your bank.
              </p>
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="f-mono" style={{ fontSize: 12, color: "#a78bfa", wordBreak: "break-all", flex: 1 }}>{UPI_ID}</span>
                <motion.button onClick={copy} whileTap={{ scale: 0.94 }}
                  style={{ padding: "6px 14px", borderRadius: 7, background: copied ? "rgba(16,185,129,0.12)" : "rgba(124,58,237,0.12)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(124,58,237,0.25)"}`, color: copied ? "#34d399" : "#a78bfa", fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  {copied ? "✓" : "Copy"}
                </motion.button>
              </div>
            </div>
          </Reveal>

          {/* Why it matters */}
          <Reveal delay={0.13}>
            <div className="card-glow" style={{ padding: "28px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#34d399,#06b6d4)" }} />
              <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#34d399", marginBottom: 16 }}>What it funds</div>
              {[
                { icon: "⚡", text: "AI that powers every explanation" },
                { icon: "🖥️", text: "Servers for 2,200+ learners" },
                { icon: "🔨", text: "New features being built" },
                { icon: "🆓", text: "Free access for everyone else" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none", fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#5a6478" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3d4560", marginTop: 14, textAlign: "center" }}>
                100% optional · Always free
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
