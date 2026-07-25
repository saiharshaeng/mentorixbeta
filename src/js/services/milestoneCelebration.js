/**
 * milestoneCelebration.js — Mentorix Milestone Celebration Module
 *
 * Single source of truth for launch milestone counter & celebration animation.
 * Plays before the existing splash sequence begins.
 */

'use strict';

(function(exports) {

  // Single Configuration Source
  const COMMUNITY_STATS = Object.freeze({
    enabled: true,
    learners: 2150,
    suffix: '+',
    label: 'LEARNERS REACHED',
    subtitle: 'Still counting...',
    thankYou: 'Thank you for believing in Mentorix. 💜',
    durationMs: 900,           // 0.9 seconds for counter animation
    celebrationDurationMs: 900 // 0.9 seconds for particle fade
  });

  function formatNumber(num) {
    if (typeof num !== 'number') return '0' + COMMUNITY_STATS.suffix;
    return num.toLocaleString('en-US') + COMMUNITY_STATS.suffix;
  }

  class MilestoneCelebration {
    constructor() {
      this.config = COMMUNITY_STATS;
    }

    /**
     * Plays the milestone celebration sequence then triggers onComplete
     */
    play(onComplete) {
      const done = typeof onComplete === 'function' ? onComplete : () => {};

      if (!this.config.enabled) {
        done();
        return;
      }

      const splashContainer = document.getElementById('mx-splash');
      if (!splashContainer) {
        done();
        return;
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Build Milestone Celebration DOM
      const overlay = document.createElement('div');
      overlay.id = 'mx-milestone-overlay';
      overlay.style.cssText = `
        position: absolute;
        inset: 0;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #070913;
        color: #ffffff;
        text-align: center;
        opacity: 1;
        transition: opacity 0.5s ease-out;
        font-family: Inter, system-ui, -apple-system, sans-serif;
      `;

      const canvas = document.createElement('canvas');
      canvas.id = 'mx-milestone-canvas';
      canvas.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      `;

      const contentBox = document.createElement('div');
      contentBox.style.cssText = `
        position: relative;
        z-index: 2;
        padding: 24px;
        max-width: 480px;
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

      contentBox.innerHTML = `
        <div id="mx-milestone-num" style="font-size: 56px; font-weight: 900; letter-spacing: -1.5px; color: #ffffff; background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; line-height: 1.1;">
          ${prefersReducedMotion ? formatNumber(this.config.learners) : '0' + this.config.suffix}
        </div>
        <div style="font-size: 13px; font-weight: 800; letter-spacing: 2.5px; color: #a7f3d0; text-transform: uppercase; margin-bottom: 6px;">
          ${this.config.label}
        </div>
        <div style="font-size: 14px; font-weight: 500; color: #94a3b8; margin-bottom: 16px;">
          ${this.config.subtitle}
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #c4b5fd;">
          ${this.config.thankYou}
        </div>
      `;

      overlay.appendChild(canvas);
      overlay.appendChild(contentBox);
      splashContainer.appendChild(overlay);

      // Handle Reduced Motion
      if (prefersReducedMotion) {
        setTimeout(() => {
          this.fadeOut(overlay, done);
        }, 700);
        return;
      }

      // Animate Counter & Particles
      this.animateCounter(document.getElementById('mx-milestone-num'), () => {
        this.triggerParticleCelebration(canvas, () => {
          this.fadeOut(overlay, done);
        });
      });
    }

    animateCounter(targetEl, callback) {
      if (!targetEl) { callback(); return; }

      const start = 0;
      const end = this.config.learners;
      const duration = this.config.durationMs;
      const startTime = performance.now();

      // Smooth easeOutCubic curve (no bouncing, no slot-machine)
      const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const currentVal = Math.round(start + (end - start) * easeOutCubic(progress));

        targetEl.textContent = formatNumber(currentVal);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          targetEl.textContent = formatNumber(end);
          if (typeof callback === 'function') callback();
        }
      };

      requestAnimationFrame(step);
    }

    triggerParticleCelebration(canvas, callback) {
      if (!canvas) { callback(); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { callback(); return; }

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const particleCount = 32; // 20-40 lightweight particles
      const colors = ['#8b5cf6', '#c4b5fd', '#06b6d4', '#ffffff', '#a7f3d0'];

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 - 20;

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.5 + Math.random() * 2.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.015 + Math.random() * 0.02
        });
      }

      const startTime = performance.now();
      const duration = this.config.celebrationDurationMs;

      const draw = (currentTime) => {
        const elapsed = currentTime - startTime;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let activeCount = 0;
        particles.forEach(p => {
          if (p.alpha > 0) {
            activeCount++;
            p.x += p.vx;
            p.y += p.vy;
            p.alpha = Math.max(0, p.alpha - p.decay);

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        if (elapsed < duration && activeCount > 0) {
          requestAnimationFrame(draw);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (typeof callback === 'function') callback();
        }
      };

      requestAnimationFrame(draw);
    }

    fadeOut(overlay, callback) {
      if (!overlay) { callback(); return; }
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (typeof callback === 'function') callback();
      }, 500);
    }
  }

  const instance = new MilestoneCelebration();
  if (typeof window !== 'undefined') {
    window.COMMUNITY_STATS = COMMUNITY_STATS;
    window.MilestoneCelebration = instance;
  }
  exports.COMMUNITY_STATS = COMMUNITY_STATS;
  exports.MilestoneCelebration = instance;

})(typeof exports !== 'undefined' ? exports : window);
