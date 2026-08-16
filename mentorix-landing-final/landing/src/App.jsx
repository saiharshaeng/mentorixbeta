import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import Nav           from "./components/Nav";
import Footer        from "./components/Footer";
import IntroAnimation from "./components/IntroAnimation";

import Home         from "./pages/Home";
import About        from "./pages/About";
import Vision       from "./pages/Vision";
import Mentorix101  from "./pages/Mentorix101";
import { Donate, Feedback, Privacy, Terms, Credits, Admin } from "./pages/subpages";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageWrap({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );
}

function Layout({ introPlayed }) {
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";

  if (!introPlayed) return null;

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Nav />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"         element={<PageWrap><Home /></PageWrap>} />
          <Route path="/about"    element={<PageWrap><About /></PageWrap>} />
          <Route path="/vision"   element={<PageWrap><Vision /></PageWrap>} />
          <Route path="/101"      element={<PageWrap><Mentorix101 /></PageWrap>} />
          <Route path="/donate"   element={<PageWrap><Donate /></PageWrap>} />
          <Route path="/feedback" element={<PageWrap><Feedback /></PageWrap>} />
          <Route path="/privacy"  element={<PageWrap><Privacy /></PageWrap>} />
          <Route path="/terms"    element={<PageWrap><Terms /></PageWrap>} />
          <Route path="/credits"  element={<PageWrap><Credits /></PageWrap>} />
          <Route path="/admin"    element={<Admin />} />
          <Route path="*" element={
            <PageWrap>
              <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--black)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div>
                  <div className="f-mono" style={{ fontSize: 11, color: "#3d4560", marginBottom: 16, letterSpacing: "0.2em" }}>404</div>
                  <h1 className="h-display" style={{ fontSize: "clamp(28px,5vw,56px)", marginBottom: 20 }}>Page not found.</h1>
                  <a href="/" style={{ fontFamily: "Satoshi, sans-serif", fontSize: 15, color: "#a78bfa", textDecoration: "none" }}>← Go home</a>
                </div>
              </main>
            </PageWrap>
          } />
        </Routes>
      </AnimatePresence>
      {!isAdmin && <Footer />}
    </>
  );
}

export default function App() {
  // Only show intro once per session
  const [introPlayed, setIntroPlayed] = useState(() => {
    return sessionStorage.getItem("mentorix_intro") === "1";
  });

  const handleIntroDone = () => {
    sessionStorage.setItem("mentorix_intro", "1");
    setIntroPlayed(true);
  };

  return (
    <BrowserRouter>
      <AnimatePresence>
        {!introPlayed && (
          <IntroAnimation key="intro" onDone={handleIntroDone} />
        )}
      </AnimatePresence>
      <Layout introPlayed={introPlayed} />
    </BrowserRouter>
  );
}
