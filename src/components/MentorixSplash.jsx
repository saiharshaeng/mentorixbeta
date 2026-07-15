import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import anime from 'animejs';

// DESIGN TOKENS — NEVER HARDCODE
const COLORS = {
  bg:      '#0a0a0f',
  surface: '#12121a',
  p:       '#8b5cf6',
  pl:      '#a78bfa',
  c:       '#06b6d4',
  text:    '#ffffff',
  sub:     '#94a3b8',
  brd:     'rgba(255,255,255,0.08)',
  glowP:   'rgba(139,92,246,0.3)',
  glowC:   'rgba(6,182,212,0.3)',
};

const EASE = {
  out:    'cubic-bezier(0, 0, 0.2, 1)',
  inOut:  'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  exit:   'cubic-bezier(0.4, 0, 1, 1)',
};

export default function MentorixSplash({ onComplete }) {
  const [fontsReady, setFontsReady] = useState(false);

  const splashRef = useRef(null);
  const starsRef = useRef(null);
  const nebulaRef = useRef(null);
  const cyanNebulaRef = useRef(null);
  const contentRef = useRef(null);
  const iconRef = useRef(null);
  const wordmarkRef = useRef(null);
  const lineRef = useRef(null);
  const subtitleRef = useRef(null);
  const messageRef = useRef(null);
  const bylineRef = useRef(null);
  const launchRef = useRef(null);
  const progressRef = useRef(null);

  // 1. Reduced Motion Check
  const prefersReducedMotion = 
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Load and verify Google Fonts before animation starts
  useEffect(() => {
    // Inject Google Fonts link dynamically
    const linkId = 'mx-fonts-link';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Julius+Sans+One&family=Playfair+Display:ital@0;1&display=swap';
      document.head.appendChild(link);
    }

    let active = true;
    const timeout = setTimeout(() => {
      if (active) setFontsReady(true);
    }, 2000); // 2s timeout fallback

    Promise.all([
      document.fonts.load('12px "Julius Sans One"'),
      document.fonts.load('12px "Playfair Display"'),
      document.fonts.load('12px "DM Serif Display"')
    ]).then(() => {
      if (active) {
        clearTimeout(timeout);
        setFontsReady(true);
      }
    }).catch(() => {
      if (active) {
        clearTimeout(timeout);
        setFontsReady(true);
      }
    });

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  // 3. Star Field Generation & Twinkle Animations (Anime.js)
  useEffect(() => {
    if (!fontsReady || prefersReducedMotion) return;

    const starsContainer = starsRef.current;
    if (!starsContainer) return;

    // Clear previous stars if any
    starsContainer.innerHTML = '';

    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 45 : 80;
    const starElements = [];

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'will-change-anim';
      star.style.position = 'absolute';
      star.style.borderRadius = '50%';
      star.style.backgroundColor = 'white';
      
      const size = Math.random() * (2.0 - 0.6) + 0.6;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      
      const opacity = Math.random() * (0.55 - 0.15) + 0.15;
      star.style.opacity = opacity.toString();
      star.style.pointerEvents = 'none';

      starsContainer.appendChild(star);
      starElements.push(star);
    }

    // Twinkle animation
    const twinkle = anime({
      targets: starElements,
      opacity: [
        {
          value: (el) => parseFloat(el.style.opacity) * 0.25,
          duration: () => anime.random(1500, 3000),
          easing: 'easeInOutSine'
        },
        {
          value: (el) => parseFloat(el.style.opacity),
          duration: () => anime.random(1500, 3000),
          easing: 'easeInOutSine'
        }
      ],
      delay: () => anime.random(0, 4000),
      loop: true,
      direction: 'alternate'
    });

    // Slow drifting animation for 6 stars
    const driftCount = Math.min(6, starElements.length);
    const driftStars = [];
    const chosenIndices = new Set();
    while (chosenIndices.size < driftCount) {
      chosenIndices.add(Math.floor(Math.random() * starElements.length));
    }
    chosenIndices.forEach(idx => driftStars.push(starElements[idx]));

    const drift = anime({
      targets: driftStars,
      translateX: () => anime.random(-8, 8),
      translateY: () => anime.random(-6, 6),
      duration: () => anime.random(8000, 12000),
      easing: 'easeInOutSine',
      loop: true,
      direction: 'alternate'
    });

    return () => {
      twinkle.pause();
      drift.pause();
      anime.remove(starElements);
      anime.remove(driftStars);
    };
  }, [fontsReady, prefersReducedMotion]);

  // 4. Progress particle burst generator
  const triggerParticleBurst = () => {
    const container = progressRef.current;
    if (!container) return;

    const colors = ['#8b5cf6', '#06b6d4', '#8b5cf6', '#06b6d4'];
    const burstParticles = [];

    for (let i = 0; i < 4; i++) {
      const p = document.createElement('div');
      p.className = 'will-change-anim';
      p.style.position = 'absolute';
      p.style.width = '3px';
      p.style.height = '3px';
      p.style.borderRadius = '50%';
      p.style.backgroundColor = colors[i];
      p.style.top = '-1px';
      p.style.left = `${(i + 1) * 20}%`;
      p.style.pointerEvents = 'none';

      container.appendChild(p);
      burstParticles.push(p);

      gsap.to(p, {
        y: -gsap.utils.random(20, 40),
        x: gsap.utils.random(-15, 15),
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => p.remove()
      });
    }
  };

  // 5. Reduced Motion Flow
  useEffect(() => {
    if (prefersReducedMotion && fontsReady) {
      gsap.set([
        splashRef.current,
        starsRef.current,
        nebulaRef.current,
        cyanNebulaRef.current,
        contentRef.current,
        iconRef.current,
        '.mx-letter',
        lineRef.current,
        subtitleRef.current,
        '.line1',
        '.line2',
        bylineRef.current,
        launchRef.current,
        progressRef.current,
        '.mx-progress-fill'
      ], {
        opacity: 1,
        scale: 1,
        y: 0,
        x: 0,
        scaleX: 1,
        boxShadow: '0 0 40px rgba(139,92,246,0.3), 0 24px 64px rgba(0,0,0,0.8)'
      });

      const timer = setTimeout(() => {
        onComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [prefersReducedMotion, fontsReady, onComplete]);

  // 6. Master GSAP Timeline Animation
  useGSAP(() => {
    if (!fontsReady || prefersReducedMotion) return;

    // Set GPU Layer acceleration
    gsap.set(contentRef.current, { force3D: true });

    const tl = gsap.timeline({
      defaults: {
        ease: 'power3.out'
      }
    });

    // PHASE 1: VOID (0s → 0.4s)
    tl.to({}, { duration: 0.4 });

    // PHASE 2: NEBULA AWAKENS (0.4s → 1.0s)
    tl.to(nebulaRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: () => {
        anime({
          targets: nebulaRef.current,
          scale: [1, 1.18, 1],
          opacity: [0.9, 1, 0.9],
          duration: 4200,
          easing: 'easeInOutSine',
          loop: true
        });
      }
    }, '<');

    // PHASE 3: ICON DESCENDS (1.0s → 2.1s)
    tl.to(iconRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.85,
      ease: 'power3.out'
    });

    // Fade in cyan nebula for depth (Phase 3)
    tl.to(cyanNebulaRef.current, {
      opacity: 0.4,
      duration: 0.85,
      ease: 'power3.out'
    }, '<');

    // Spring settle
    tl.to(iconRef.current, {
      scale: 1.05,
      duration: 0.18,
      ease: 'power1.in'
    });
    tl.to(iconRef.current, {
      scale: 1.0,
      duration: 0.22,
      ease: 'elastic.out(1.2, 0.5)'
    });

    // Glow pulse on icon
    tl.to(iconRef.current, {
      boxShadow: '0 0 60px rgba(139,92,246,0.55), 0 24px 64px rgba(0,0,0,0.8)',
      duration: 0.4,
      ease: 'power2.out'
    });
    tl.to(iconRef.current, {
      boxShadow: '0 0 40px rgba(139,92,246,0.3), 0 24px 64px rgba(0,0,0,0.8)',
      duration: 0.5,
      ease: 'power2.inOut'
    });

    // PHASE 4: MENTORIX LETTERS (2.1s → 3.3s)
    tl.to('.mx-letter', {
      opacity: 1,
      y: 0,
      duration: 0.45,
      stagger: 0.065,
      ease: 'power3.out'
    });

    // Decorative line draws itself
    tl.fromTo(lineRef.current,
      { scaleX: 0, transformOrigin: 'left center', opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.55, ease: 'power2.inOut' },
      '-=0.1'
    );

    // PHASE 5: SUBTITLE (3.3s → 3.85s)
    tl.to(subtitleRef.current, {
      opacity: 1,
      duration: 0.45,
      ease: 'power2.out'
    });

    // PHASE 6: MESSAGE — LINE 1 (3.85s → 4.5s)
    tl.to('.line1', {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: 'power3.out'
    });

    // PHASE 7: MESSAGE — LINE 2 (4.5s → 5.1s)
    tl.to('.line2', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out'
    });

    // Pulse cyan glow on line2
    tl.to('.line2', {
      textShadow: '0 0 20px rgba(6,182,212,0.6)',
      duration: 0.3,
      ease: 'power2.out'
    });
    tl.to('.line2', {
      textShadow: '0 0 0px rgba(6,182,212,0)',
      duration: 0.5,
      ease: 'power2.inOut'
    });

    // PHASE 8: BY HARSHA (5.1s → 5.7s)
    tl.to(bylineRef.current, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    });

    // PHASE 9: LAUNCH DATE + PROGRESS (5.7s → 7.2s)
    tl.to(launchRef.current, {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out'
    });

    tl.to(progressRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    }, '-=0.1');

    tl.fromTo('.mx-progress-fill',
      { scaleX: 0, transformOrigin: 'left center' },
      { 
        scaleX: 1, 
        duration: 0.9,
        ease: 'power2.inOut',
        onComplete: triggerParticleBurst
      }
    );

    // Glow at progress bar completion
    tl.to('.mx-progress-fill', {
      boxShadow: '0 0 12px rgba(139,92,246,0.9)',
      duration: 0.2,
      ease: 'power2.out'
    });
    tl.to('.mx-progress-fill', {
      boxShadow: '0 0 4px rgba(139,92,246,0.3)',
      duration: 0.4,
      ease: 'power2.inOut'
    });

    // PHASE 10: HOLD (7.2s → 8.0s)
    tl.to({}, { duration: 0.8 });

    // PHASE 11: GRACEFUL EXIT (8.0s → 9.2s)
    tl.to(contentRef.current, {
      opacity: 0,
      y: -8,
      duration: 0.6,
      ease: 'power2.in'
    });

    tl.to(nebulaRef.current, {
      opacity: 0,
      scale: 0.85,
      duration: 0.6,
      ease: 'power2.in'
    }, '<');

    tl.to(cyanNebulaRef.current, {
      opacity: 0,
      scale: 0.85,
      duration: 0.6,
      ease: 'power2.in'
    }, '<');

    tl.to(starsRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in'
    }, '-=0.3');

    tl.to(splashRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        // Kill all active Anime.js instances
        anime.remove('#mx-stars div');
        anime.remove('#mx-nebula');
        
        // Clean up will-change properties to preserve performance
        const allAnimated = [
          splashRef.current,
          starsRef.current,
          nebulaRef.current,
          cyanNebulaRef.current,
          contentRef.current,
          iconRef.current,
          lineRef.current,
          subtitleRef.current,
          bylineRef.current,
          launchRef.current,
          progressRef.current,
          '.mx-letter',
          '.line1',
          '.line2',
          '.mx-progress-fill'
        ];
        gsap.set(allAnimated, { clearProps: 'will-change' });

        // Trigger parent callback
        onComplete();
      }
    }, '-=0.2');

  }, { dependencies: [fontsReady, prefersReducedMotion] });

  // Render void screen if fonts not yet preloaded/ready
  if (!fontsReady) {
    return (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: COLORS.bg
        }}
      />
    );
  }

  const wordmarkLetters = 'MENTORIX';

  return (
    <div ref={splashRef} id="mx-splash" className="will-change-anim">
      {/* Styles Injection */}
      <style>{`
        #mx-splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: ${COLORS.bg};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: sans-serif;
          user-select: none;
        }

        #mx-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        #mx-nebula {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(139,92,246,0.09) 0%,
            rgba(139,92,246,0.04) 40%,
            transparent 70%
          );
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0;
          pointer-events: none;
          filter: blur(8px);
          z-index: 2;
        }

        #mx-nebula-cyan {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(6,182,212,0.05) 0%,
            transparent 65%
          );
          top: 50%;
          left: 50%;
          transform: translate(calc(-50% + 80px), calc(-50% - 60px)) scale(1);
          opacity: 0;
          pointer-events: none;
          filter: blur(6px);
          z-index: 2;
        }

        #mx-content {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        #mx-icon {
          width: 96px;
          height: 96px;
          border-radius: 22px;
          background: ${COLORS.surface} url('logo.png') center/cover no-repeat;
          border: 1px solid rgba(139,92,246,0.35);
          box-shadow: 
            0 0 0 1px rgba(139,92,246,0.1),
            0 0 40px ${COLORS.glowP},
            0 24px 64px rgba(0,0,0,0.8);
          opacity: 0;
          transform: translateY(-24px) scale(0.82);
          margin-bottom: 24px;
        }

        #mx-wordmark {
          font-family: 'Julius Sans One', sans-serif;
          font-size: clamp(32px, 5.5vw, 64px);
          color: #ffffff;
          letter-spacing: 0.28em;
          text-shadow: 0 0 40px rgba(139,92,246,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 0.28em;
        }

        .mx-letter {
          display: inline-block;
          opacity: 0;
          transform: translateY(10px);
        }

        #mx-line {
          width: 80px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, #8b5cf6, transparent);
          margin-top: 14px;
          opacity: 0;
        }

        #mx-subtitle {
          font-family: 'Julius Sans One', sans-serif;
          font-size: clamp(7px, 1vw, 11px);
          color: ${COLORS.sub};
          letter-spacing: 0.35em;
          text-transform: uppercase;
          margin-top: 8px;
          opacity: 0;
          padding-left: 0.35em;
        }

        #mx-message {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(18px, 2.8vw, 32px);
          color: rgba(255,255,255,0.9);
          line-height: 1.4;
          text-align: center;
          margin-top: 28px;
          max-width: 90vw;
        }

        #mx-message .line1 {
          display: block;
          opacity: 0;
          transform: translateY(8px);
        }

        #mx-message .line2 {
          display: block;
          font-size: 85%;
          color: #06b6d4;
          letter-spacing: 0.08em;
          opacity: 0;
          transform: translateY(8px);
          margin-top: 4px;
        }

        #mx-byline {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(13px, 1.6vw, 18px);
          color: ${COLORS.sub};
          margin-top: 20px;
          opacity: 0;
        }

        #mx-launch {
          font-family: 'Julius Sans One', sans-serif;
          font-size: clamp(9px, 1.1vw, 13px);
          color: #8b5cf6;
          letter-spacing: 0.45em;
          margin-top: 28px;
          opacity: 0;
          padding-left: 0.45em;
        }

        #mx-progress {
          width: 140px;
          height: 2px;
          background: rgba(139,92,246,0.12);
          border-radius: 999px;
          margin-top: 12px;
          opacity: 0;
          overflow: visible;
          position: relative;
        }

        .mx-progress-fill {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg, 
            #8b5cf6, 
            #a78bfa
          );
          border-radius: 999px;
          transform-origin: left center;
          transform: scaleX(0);
        }

        .will-change-anim {
          will-change: transform, opacity;
        }

        @media (max-width: 767px) {
          #mx-icon {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            margin-bottom: 18px;
          }
          #mx-nebula {
            width: 280px;
            height: 280px;
          }
          #mx-nebula-cyan {
            width: 150px;
            height: 150px;
            transform: translate(calc(-50% + 50px), calc(-50% - 40px));
          }
          #mx-progress {
            width: 100px;
          }
          #mx-message {
            max-width: 90vw;
          }
        }
      `}</style>

      {/* Twinkling Star Layer */}
      <div ref={starsRef} id="mx-stars" />

      {/* Glow Nebula Elements */}
      <div ref={nebulaRef} id="mx-nebula" className="will-change-anim" />
      <div ref={cyanNebulaRef} id="mx-nebula-cyan" className="will-change-anim" />

      {/* Main Content Area */}
      <div ref={contentRef} id="mx-content" className="will-change-anim">
        {/* App Icon Container */}
        <div ref={iconRef} id="mx-icon" className="will-change-anim">
        </div>

        {/* Brand Wordmark */}
        <div ref={wordmarkRef} id="mx-wordmark">
          {wordmarkLetters.split('').map((char, index) => (
            <span key={index} className="mx-letter will-change-anim">{char}</span>
          ))}
        </div>

        {/* Decorative Separator Line */}
        <div ref={lineRef} id="mx-line" className="will-change-anim" />

        {/* Brand Subtitle */}
        <div ref={subtitleRef} id="mx-subtitle" className="will-change-anim">
          KNOWLEDGE IS INFINITE. EXPLORE IT.
        </div>

        {/* Mission Statement */}
        <div ref={messageRef} id="mx-message">
          <span className="line1 will-change-anim">The mentor you never had.</span>
          <span className="line2 will-change-anim">Free. Forever.</span>
        </div>

        {/* Founder Byline */}
        <div ref={bylineRef} id="mx-byline" className="will-change-anim">
          by Harsha
        </div>

        {/* Target Launch Info */}
        <div ref={launchRef} id="mx-launch" className="will-change-anim">
          LAUNCHING JULY 30
        </div>

        {/* Simulated Load Progress Indicator */}
        <div ref={progressRef} id="mx-progress" className="will-change-anim">
          <div className="mx-progress-fill will-change-anim" />
        </div>
      </div>
    </div>
  );
}
