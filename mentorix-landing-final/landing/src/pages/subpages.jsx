import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "../components/Reveal";
import FinalCTA from "../components/FinalCTA";

// ─── DONATE PAGE ─────────────────────────────────────────────────────────────
const UPI_ID = "8688402869@fam";

export function Donate() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };
  return (
    <>
      <main style={{ paddingTop: 100, background: "var(--black)" }}>
        <div className="wrap section">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <Reveal>
              <div className="badge" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", marginBottom: 20 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b" }} />
                Support Mentorix
              </div>
            </Reveal>
            <Reveal delay={0.07}>
              <h1 className="h-display" style={{ fontSize: "clamp(30px,5vw,64px)", marginBottom: 20 }}>
                We keep it free.<br /><span className="grad-warm">Help us keep it running.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.7vw,18px)", color: "#5a6478", lineHeight: 1.75, maxWidth: 500, margin: "0 auto" }}>
                Mentorix is free and will always be free. AI, servers, and development cost real money. If it helped you, consider supporting it.
              </p>
            </Reveal>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, maxWidth: 900, margin: "0 auto" }} className="donate-grid-3">
            {/* QR */}
            <Reveal>
              <div className="card-glow" style={{ padding: "28px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#f59e0b,#ec4899)" }} />
                <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 16 }}>Scan to Pay</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <div style={{ width: 148, height: 148, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.05)" }}>
                    <img src="/qr-donate.png" alt="UPI QR Code" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, color: "#3d4560" }}>Open any UPI app and scan</p>
              </div>
            </Reveal>

            {/* UPI ID */}
            <Reveal delay={0.07}>
              <div className="card-glow" style={{ padding: "28px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }} />
                <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a78bfa", marginBottom: 16 }}>UPI ID</div>
                <div style={{ fontSize: 28, marginBottom: 14 }}>💸</div>
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#5a6478", lineHeight: 1.7, marginBottom: 18 }}>
                  PhonePe, GPay, Paytm, or your bank. Works instantly.
                </p>
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="f-mono" style={{ fontSize: 12, color: "#a78bfa", flex: 1, wordBreak: "break-all" }}>{UPI_ID}</span>
                  <motion.button onClick={copy} whileTap={{ scale: 0.94 }}
                    style={{ padding: "6px 12px", borderRadius: 7, background: copied ? "rgba(16,185,129,0.12)" : "rgba(124,58,237,0.12)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(124,58,237,0.25)"}`, color: copied ? "#34d399" : "#a78bfa", fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {copied ? "✓" : "Copy"}
                  </motion.button>
                </div>
              </div>
            </Reveal>

            {/* What it funds */}
            <Reveal delay={0.13}>
              <div className="card-glow" style={{ padding: "28px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#34d399,#06b6d4)" }} />
                <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#34d399", marginBottom: 16 }}>What it funds</div>
                {[
                  { icon: "⚡", text: "AI powering every explanation" },
                  { icon: "🖥️", text: "Servers for 2,200+ learners" },
                  { icon: "🔨", text: "New features in development" },
                  { icon: "🆓", text: "Free access for everyone else" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none", fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#5a6478" }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>{item.text}
                  </div>
                ))}
                <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3d4560", marginTop: 14, textAlign: "center" }}>
                  Completely optional
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </main>
      <FinalCTA />
    </>
  );
}

// ─── FEEDBACK ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://rpkhrwtowmvoccznqubo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwa2hyd3Rvd212b2Njem5xdWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODc1OTYsImV4cCI6MjEwMDc2MzU5Nn0.OQ1_03vM_Mf02utDmhmddW_7DFS5jPplvNAlgeemarc";

const fTypes = [
  { id: "experience", label: "My Experience", icon: "✨", color: "#10b981" },
  { id: "suggestion", label: "Suggestion",    icon: "💡", color: "#7c3aed" },
  { id: "bug",        label: "Bug Report",    icon: "🐛", color: "#ef4444" },
  { id: "question",   label: "Question",      icon: "❓", color: "#f59e0b" },
];

export function Feedback() {
  const [form,   setForm]   = useState({ name: "", email: "", message: "", type: "experience" });
  const [status, setStatus] = useState("idle");
  const active = fTypes.find(t => t.id === form.type);

  const submit = async (e) => {
    e.preventDefault();
    const msg = form.message.trim();
    if (!msg || msg.length > 2000) return;
    setStatus("sending");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/landing_feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ 
          name: (form.name.trim() || "Anonymous").slice(0, 100), 
          email: form.email.trim().slice(0, 200), 
          message: msg.slice(0, 2000), 
          type: form.type, 
          created_at: new Date().toISOString() 
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setForm({ name: "", email: "", message: "", type: "experience" });
    } catch { setStatus("error"); }
    setTimeout(() => setStatus("idle"), 6000);
  };

  const inp = { width: "100%", padding: "13px 16px", borderRadius: 12, background: "rgba(8,8,20,0.9)", border: "1px solid rgba(255,255,255,0.07)", color: "white", fontFamily: "Satoshi, sans-serif", fontSize: 14, outline: "none", transition: "border-color 0.2s" };
  const onfocus = e => { e.target.style.borderColor = "rgba(124,58,237,0.35)"; };
  const onblur  = e => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; };

  return (
    <main style={{ paddingTop: 100, background: "var(--black)", minHeight: "100vh" }}>
      <div className="wrap section">
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Reveal><div className="badge" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", marginBottom: 20 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />Feedback</div></Reveal>
          <Reveal delay={0.07}><h1 className="h-display" style={{ fontSize: "clamp(28px,4.5vw,56px)", marginBottom: 16 }}>Tell us what you think.</h1></Reveal>
          <Reveal delay={0.12}><p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,17px)", color: "#5a6478", lineHeight: 1.75, maxWidth: 420, margin: "0 auto" }}>Bugs, ideas, what helped, what didn't. Harsha reads every one and usually fixes bugs within 24 hours.</p></Reveal>
        </div>
        <Reveal>
          <form onSubmit={submit} style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {fTypes.map(t => (
                <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  style={{ padding: "10px 4px", borderRadius: 12, border: `1px solid ${form.type === t.id ? t.color + "40" : "rgba(255,255,255,0.06)"}`, background: form.type === t.id ? `${t.color}10` : "transparent", color: form.type === t.id ? t.color : "#3d4560", fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span style={{ letterSpacing: "0.03em", textAlign: "center", lineHeight: 1.3 }}>{t.label}</span>
                </button>
              ))}
            </div>
            <input type="text" maxLength={100} placeholder="Your name (optional)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} onFocus={onfocus} onBlur={onblur} />
            <input type="email" maxLength={200} placeholder="Your email — for replies (optional)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} onFocus={onfocus} onBlur={onblur} />
            <div style={{ position: "relative" }}>
              <textarea maxLength={2000} placeholder={`Your ${active?.label.toLowerCase() || "message"}...`} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={6} required style={{ ...inp, resize: "vertical" }} onFocus={onfocus} onBlur={onblur} />
              <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 11, color: form.message.length > 1800 ? "#f87171" : "#3d4560", pointerEvents: "none" }}>
                {form.message.length}/2000
              </div>
            </div>
            <motion.button type="submit" disabled={status === "sending" || !form.message.trim()}
              style={{ padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#6d28d9,#7c3aed)", border: "1px solid rgba(124,58,237,0.25)", color: "white", fontFamily: "Satoshi, sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: status === "sending" || !form.message.trim() ? 0.45 : 1 }}
              whileHover={{ boxShadow: "0 0 28px rgba(124,58,237,0.4)" }} whileTap={{ scale: 0.98 }}>
              {status === "sending" ? "Sending..." : "Send →"}
            </motion.button>
            <AnimatePresence>
              {status === "done" && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: "14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontFamily: "Satoshi, sans-serif", fontSize: 14, textAlign: "center" }}>✓ Received. Harsha will read this.</motion.div>}
              {status === "error" && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: "14px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontFamily: "Satoshi, sans-serif", fontSize: 14, textAlign: "center" }}>Something went wrong. Email mentorixbeta@gmail.com</motion.div>}
            </AnimatePresence>
            <p style={{ textAlign: "center", fontFamily: "Satoshi, sans-serif", fontSize: 11, color: "#3d4560", marginTop: 4 }}>Or email: mentorixbeta@gmail.com</p>
          </form>
        </Reveal>
      </div>
    </main>
  );
}

// ─── PRIVACY ─────────────────────────────────────────────────────────────────
export function Privacy() {
  return (
    <main style={{ paddingTop: 100, background: "var(--black)", minHeight: "100vh" }}>
      <div className="wrap section" style={{ maxWidth: 720 }}>
        <Reveal><h1 className="h-display" style={{ fontSize: "clamp(28px,4vw,48px)", marginBottom: 40 }}>Privacy Policy</h1></Reveal>
        {[
          { h: "What we collect", b: "Information you provide directly — your name and email if given, and learning activity within the app. We do not sell this data." },
          { h: "How we use it", b: "Only to improve your learning experience — tracking progress, identifying weak spots, personalising your study path. Nothing else." },
          { h: "AI conversations", b: "Conversations with Tio are sent to AI inference providers (currently Groq) to generate responses. Please review Groq's data practices at groq.com for their retention policies." },
          { h: "Data storage", b: "Learning data is stored via Supabase. Feedback submitted through the landing page is stored in a separate Supabase table. Both use industry-standard security." },
          { h: "Feedback data", b: "Feedback you submit is only accessible to Harsha (the founder). It is not shared, sold, or used for any purpose other than improving Mentorix." },
          { h: "Your rights", b: "You can request deletion of your data at any time by emailing mentorixbeta@gmail.com. We will respond within 48 hours." },
          { h: "Contact", b: "Questions? Email mentorixbeta@gmail.com." },
        ].map((s, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(16px,1.8vw,20px)", fontWeight: 700, color: "white", marginBottom: 10 }}>{s.h}</h2>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.4vw,15px)", color: "#5a6478", lineHeight: 1.8 }}>{s.b}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </main>
  );
}

// ─── TERMS ───────────────────────────────────────────────────────────────────
export function Terms() {
  return (
    <main style={{ paddingTop: 100, background: "var(--black)", minHeight: "100vh" }}>
      <div className="wrap section" style={{ maxWidth: 720 }}>
        <Reveal><h1 className="h-display" style={{ fontSize: "clamp(28px,4vw,48px)", marginBottom: 40 }}>Terms of Service</h1></Reveal>
        {[
          { h: "Use of Mentorix", b: "Mentorix is a free educational tool. You may use it for personal learning. You may not misuse it, attempt to reverse-engineer it, or use it in ways that harm other users." },
          { h: "AI responses", b: "Tio's responses are AI-generated and may occasionally be inaccurate. Mentorix is a learning aid — not a substitute for verified textbooks, qualified teachers, or professional advice." },
          { h: "Your content", b: "Notes and content you create within Mentorix remain yours. We do not claim ownership over user-generated content." },
          { h: "Availability", b: "Mentorix is provided as-is. We cannot guarantee 100% uptime or error-free AI responses, but we work hard to maintain both." },
          { h: "\"Free. Always.\"", b: "The core Mentorix learning platform is and will remain free. This is a genuine commitment, not a marketing claim." },
          { h: "Contact", b: "Questions? Email mentorixbeta@gmail.com." },
        ].map((s, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(16px,1.8vw,20px)", fontWeight: 700, color: "white", marginBottom: 10 }}>{s.h}</h2>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(13px,1.4vw,15px)", color: "#5a6478", lineHeight: 1.8 }}>{s.b}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </main>
  );
}

// ─── CREDITS ─────────────────────────────────────────────────────────────────
export function Credits() {
  const items = [
    { name: "React 19", desc: "UI framework", color: "#38bdf8" },
    { name: "Framer Motion", desc: "Animations", color: "#a78bfa" },
    { name: "Vite", desc: "Build tool", color: "#f59e0b" },
    { name: "Tailwind CSS", desc: "Utility styling", color: "#34d399" },
    { name: "Supabase", desc: "Database & storage", color: "#3ecf8e" },
    { name: "Groq", desc: "AI inference", color: "#f43f5e" },
    { name: "Fontshare", desc: "Clash Display & Satoshi", color: "#818cf8" },
    { name: "Netlify", desc: "Hosting & deployment", color: "#38bdf8" },
    { name: "Cloudflare Workers", desc: "API proxy", color: "#f59e0b" },
    { name: "Web Audio API", desc: "Intro sound", color: "#ec4899" },
  ];
  return (
    <main style={{ paddingTop: 100, background: "var(--black)", minHeight: "100vh" }}>
      <div className="wrap section">
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Reveal><h1 className="h-display" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 16 }}>Credits</h1></Reveal>
          <Reveal delay={0.07}><p style={{ fontFamily: "Satoshi, sans-serif", fontSize: "clamp(14px,1.5vw,16px)", color: "#5a6478", lineHeight: 1.75 }}>Mentorix is built on the shoulders of great open-source work.</p></Reveal>
        </div>
        <div className="grid-3" style={{ gap: 12 }}>
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className="card-glow" style={{ padding: "20px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, marginBottom: 10 }} />
                <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 12, color: "#3d4560" }}>{item.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 15, color: "#3d4560", lineHeight: 1.75 }}>
              Built by Harsha — solo, from Hyderabad, on a laptop that crashes too often.<br />
              <span style={{ color: "#3d4560" }}>Every line written hoping it helps someone learn better.</span>
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

// ─── ADMIN — Security note ────────────────────────────────────────────────────
// P0 FIX: Frontend password removed. Admin access now requires Supabase
// authenticated session. Set up Supabase Auth + RLS policy:
// - landing_feedback: anon can INSERT only (no SELECT, no UPDATE, no DELETE)
// - authenticated role (your account): full SELECT
// Then access feedback directly via Supabase dashboard or a server-side tool.

export function Admin() {
  const [data, setData]   = useState([]);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw]       = useState("");
  const [auth, setAuth]   = useState(false);
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      // Use Supabase Auth — real server-side authentication
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password: pw }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error_description || json.error);
      const accessToken = json.access_token;
      setToken(accessToken);

      // Fetch feedback with authenticated token
      const dataRes = await fetch(`${SUPABASE_URL}/rest/v1/landing_feedback?select=*&order=created_at.desc`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}` },
      });
      const rows = await dataRes.json();
      setData(Array.isArray(rows) ? rows : []);
      setAuth(true);
    } catch (e) {
      setErr(e.message || "Login failed.");
    }
    setLoading(false);
  };

  const tagColor = { experience: "#10b981", suggestion: "#7c3aed", bug: "#ef4444", question: "#f59e0b" };

  if (!auth) return (
    <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--black)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360, padding: "0 20px" }}>
        <h1 className="h-display" style={{ fontSize: 26, textAlign: "center", marginBottom: 4 }}>Admin</h1>
        <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 12, color: "#3d4560", textAlign: "center", marginBottom: 8 }}>Sign in with your Supabase account</p>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
          style={{ padding: "13px 16px", borderRadius: 12, background: "rgba(8,8,20,0.9)", border: "1px solid rgba(255,255,255,0.07)", color: "white", fontFamily: "Satoshi, sans-serif", fontSize: 14, outline: "none" }} />
        <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} required
          style={{ padding: "13px 16px", borderRadius: 12, background: "rgba(8,8,20,0.9)", border: "1px solid rgba(255,255,255,0.07)", color: "white", fontFamily: "Satoshi, sans-serif", fontSize: 14, outline: "none" }} />
        {err && <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#f87171", textAlign: "center" }}>{err}</p>}
        <button type="submit" disabled={loading}
          style={{ padding: "13px", borderRadius: 12, background: "linear-gradient(135deg,#6d28d9,#7c3aed)", color: "white", fontFamily: "Satoshi, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Signing in..." : "Sign in →"}
        </button>
      </form>
    </main>
  );

  return (
    <main style={{ paddingTop: 100, background: "var(--black)", minHeight: "100vh" }}>
      <div className="wrap section">
        <h1 className="h-display" style={{ fontSize: 30, marginBottom: 6 }}>Feedback</h1>
        <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#3d4560", marginBottom: 32 }}>{data.length} entries</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map((item, i) => (
            <div key={i} style={{ padding: "18px 20px", borderRadius: 14, background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 10px", borderRadius: 100, background: `${tagColor[item.type] || "#7c3aed"}15`, color: tagColor[item.type] || "#7c3aed", fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{item.type}</span>
                <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 13, fontWeight: 600, color: "white" }}>{item.name}</span>
                {item.email && <span style={{ fontFamily: "Satoshi, sans-serif", fontSize: 12, color: "#3d4560" }}>{item.email}</span>}
                <span style={{ marginLeft: "auto", fontFamily: "Satoshi, sans-serif", fontSize: 11, color: "#3d4560" }}>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#5a6478", lineHeight: 1.65 }}>{item.message}</p>
            </div>
          ))}
          {data.length === 0 && <p style={{ fontFamily: "Satoshi, sans-serif", color: "#3d4560" }}>No feedback yet.</p>}
        </div>
      </div>
    </main>
  );
}
