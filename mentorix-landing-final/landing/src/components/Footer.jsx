import { Link } from "react-router-dom";

const APP_URL = "https://mentorix-beta.netlify.app";

export default function Footer() {
  return (
    <footer style={{ background: "var(--deep)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="wrap" style={{ paddingTop: 64, paddingBottom: 40 }}>

        <div className="footer-grid" style={{ marginBottom: 56 }}>

          {/* Brand */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src="/logo.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(124,58,237,0.45))" }} />
              <span className="f-clash" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.16em", color: "white", textTransform: "uppercase" }}>Mentorix</span>
            </div>
            <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 13, color: "#3d4560", lineHeight: 1.75, maxWidth: 220, marginBottom: 16 }}>
              Your personal learning companion. Free for every learner, forever.
            </p>
            <a
              href="mailto:mentorixbeta@gmail.com"
              style={{ fontFamily: "Satoshi, sans-serif", fontSize: 11, color: "#3d4560", letterSpacing: "0.06em", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
              onMouseLeave={e => e.currentTarget.style.color = "#3d4560"}
            >
              mentorixbeta@gmail.com
            </a>
          </div>

          {/* Learn */}
          <FooterCol label="Learn" links={[
            { label: "About Mentorix",  to: "/about"   },
            { label: "How it works",    to: "/101"     },
            { label: "Our vision",      to: "/vision"  },
            { label: "Donate",          to: "/donate"  },
          ]} />

          {/* App */}
          <FooterCol label="App" links={[
            { label: "Start learning",  href: APP_URL       },
            { label: "Send feedback",   to: "/feedback"     },
          ]} />

          {/* Legal */}
          <FooterCol label="Legal" links={[
            { label: "Privacy policy",   to: "/privacy"  },
            { label: "Terms of service", to: "/terms"    },
            { label: "Credits",          to: "/credits"  },
          ]} />
        </div>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}>
          <span className="f-mono" style={{ fontSize: 11, color: "#3d4560" }}>
            © 2026 Mentorix · Built by Harsha, Hyderabad
          </span>
          <span className="f-mono" style={{ fontSize: 11, color: "#3d4560" }}>
            mentorix-beta.netlify.app
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ label, links }) {
  const linkStyle = {
    fontFamily: "Satoshi, sans-serif", fontSize: 13,
    color: "#3d4560", textDecoration: "none", transition: "color 0.2s",
  };
  const hover = e => { e.currentTarget.style.color = "#a78bfa"; };
  const blur  = e => { e.currentTarget.style.color = "#3d4560"; };

  return (
    <div className="footer-col">
      <div style={{ fontFamily: "Satoshi, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a6478", marginBottom: 18 }}>
        {label}
      </div>
      <ul role="list" style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
        {links.map((l, i) => (
          <li key={i}>
            {l.href
              ? <a href={l.href} style={linkStyle} onMouseEnter={hover} onMouseLeave={blur}>{l.label}</a>
              : <Link to={l.to} style={linkStyle} onMouseEnter={hover} onMouseLeave={blur}>{l.label}</Link>
            }
          </li>
        ))}
      </ul>
    </div>
  );
}
