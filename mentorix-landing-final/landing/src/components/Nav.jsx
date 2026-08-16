import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const APP_URL = "https://mentorix-beta.netlify.app";

const links = [
  { label: "How it works", href: "/101"    },
  { label: "Vision",       href: "/vision" },
  { label: "About",        href: "/about"  },
  { label: "Donate",       href: "/donate" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [loc.pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isActive = (href) => loc.pathname === href;

  return (
    <>
      <motion.nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 60,
        background: scrolled || menuOpen ? "rgba(4,4,10,0.94)" : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(24px) saturate(180%)" : "none",
        borderBottom: scrolled || menuOpen ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition: "background 0.35s, backdrop-filter 0.35s, border-color 0.35s",
      }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}>

        {/* True 3-column grid: logo | links | cta */}
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 16,
        }}>
          {/* Col 1: Logo */}
          <Link to="/" aria-label="Mentorix home"
            style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", justifySelf: "start" }}>
            <img src="/logo.png" alt="" style={{ width: 26, height: 26, objectFit: "contain", filter: "drop-shadow(0 0 7px rgba(124,58,237,0.5))" }} />
            <span className="f-clash" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", color: "white", textTransform: "uppercase" }}>
              Mentorix
            </span>
          </Link>

          {/* Col 2: Center links — desktop only */}
          <ul className="nav-links-desktop" role="list"
            style={{ display: "flex", alignItems: "center", gap: 24, listStyle: "none", margin: 0 }}>
            {links.map(l => (
              <li key={l.href}>
                <Link to={l.href} style={{
                  fontFamily: "Satoshi, sans-serif", fontSize: 13, fontWeight: 500,
                  color: isActive(l.href) ? "white" : "#5a6478",
                  textDecoration: "none", transition: "color 0.2s", whiteSpace: "nowrap",
                  borderBottom: isActive(l.href) ? "1px solid rgba(167,139,250,0.45)" : "1px solid transparent",
                  paddingBottom: 2,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
                  onMouseLeave={e => e.currentTarget.style.color = isActive(l.href) ? "white" : "#5a6478"}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Col 3: Right side — CTA or hamburger */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
            <motion.a href={APP_URL} className="nav-cta-desktop"
              style={{
                alignItems: "center", gap: 6, padding: "8px 18px",
                borderRadius: 10, background: "linear-gradient(135deg,#6d28d9,#7c3aed)",
                border: "1px solid rgba(124,58,237,0.3)", color: "white",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                letterSpacing: "0.02em", boxShadow: "0 0 18px rgba(124,58,237,0.28)",
                whiteSpace: "nowrap",
              }}
              whileHover={{ boxShadow: "0 0 32px rgba(124,58,237,0.5)", y: -1 }}
              whileTap={{ scale: 0.97 }}>
              Start learning →
            </motion.a>

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="nav-hamburger"
              style={{
                background: "none", border: "none", padding: 6,
                display: "flex", flexDirection: "column", gap: 5,
                alignItems: "center", justifyContent: "center",
                width: 36, height: 36, cursor: "pointer",
              }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: "block", width: 20, height: 1.5,
                  background: menuOpen ? "#a78bfa" : "#5a6478",
                  borderRadius: 2, transition: "all 0.28s",
                  transform: menuOpen
                    ? i === 0 ? "rotate(45deg) translate(2px, 4.5px)"
                    : i === 2 ? "rotate(-45deg) translate(2px, -4.5px)" : "none"
                    : "none",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(4,4,10,0.97)", backdropFilter: "blur(24px)",
            paddingTop: 60, display: "flex", flexDirection: "column",
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}>
            <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 4 }}>
              {links.map((l, i) => (
                <motion.div key={l.href}
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}>
                  <Link to={l.href} style={{
                    display: "block", padding: "16px 0",
                    fontFamily: "Satoshi, sans-serif", fontSize: 22, fontWeight: 600,
                    color: isActive(l.href) ? "#a78bfa" : "#5a6478",
                    textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>{l.label}</Link>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                style={{ marginTop: 28 }}>
                <a href={APP_URL} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "17px 24px", borderRadius: 14,
                  background: "linear-gradient(135deg,#6d28d9,#7c3aed)",
                  color: "white", fontSize: 17, fontWeight: 700,
                  textDecoration: "none", boxShadow: "0 0 28px rgba(124,58,237,0.4)",
                }}>Start learning →</a>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34 }}
                style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, color: "#3d4560", textAlign: "center", marginTop: 16, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Free for every learner
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
