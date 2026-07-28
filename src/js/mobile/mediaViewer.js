/**
 * mediaViewer.js — Mobile Media Viewer & KaTeX Pre-rendering Manager
 * Mobile Phase L1 (Lesson Reader & Study Session Experience)
 *
 * Handles progressive image/diagram loading, tap-to-expand fullscreen media viewer,
 * and ensures mathematical expressions render completely before becoming visible.
 */

'use strict';

(function(exports) {

  class MediaViewer {
    constructor() {
      this.initialized = false;
      this.activeModal = null;
    }

    init() {
      if (this.initialized) return;
      this.attachGlobalListeners();
      this.initialized = true;
    }

    attachGlobalListeners() {
      if (typeof document === 'undefined') return;

      // Escape key to close modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeModal) {
          this.closeFullscreenViewer();
        }
      });
    }

    /**
     * Pre-renders KaTeX expressions inside an element offscreen before displaying
     */
    preRenderKaTeX(element) {
      if (!element) return Promise.resolve();

      return new Promise((resolve) => {
        if (window.renderMathInElement || (window.katex && typeof katex.render === 'function')) {
          try {
            if (typeof renderMathInElement === 'function') {
              renderMathInElement(element, {
                delimiters: [
                  { left: '$$', right: '$$', display: true },
                  { left: '$', right: '$', display: false },
                  { left: '\\(', right: '\\)', display: false },
                  { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
              });
            }
          } catch (e) {
            console.warn('[MediaViewer] KaTeX pre-render notice:', e);
          }
        }
        // Ensure raw LaTeX text is not exposed by adding katex-rendered class
        element.classList.add('katex-rendered');
        resolve();
      });
    }

    /**
     * Wraps image/diagram in progressive lazy-loading container with tap-to-expand
     */
    createDiagramContainer(src, alt = 'Study Diagram', caption = '') {
      const containerId = 'diag-' + Math.random().toString(36).substr(2, 9);
      const html = `
        <div id="${containerId}" class="m-diagram-card mb16" style="background: rgba(18, 18, 26, 0.7); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 14px; padding: 12px; overflow: hidden;">
          <div class="m-diagram-wrapper" style="position: relative; width: 100%; min-height: 180px; display: flex; align-items: center; justify-content: center; background: #070913; border-radius: 10px; overflow: hidden; cursor: zoom-in;" onclick="window.MediaViewer && window.MediaViewer.openFullscreenViewer('${src}', '${alt}')">
            <img src="${src}" alt="${alt}" loading="lazy" style="max-width: 100%; max-height: 320px; object-fit: contain; border-radius: 8px; transition: transform 0.25s ease;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div style="display: none; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; color: var(--mut); font-size: 13px;">
              <span>📐</span>
              <span>Visual Diagram: ${alt}</span>
            </div>
            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(7, 9, 19, 0.8); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 4px 8px; font-size: 11px; color: #c4b5fd; display: flex; align-items: center; gap: 4px;">
              <span>🔍</span> Tap to Expand
            </div>
          </div>
          ${caption ? `<div style="font-size: 12px; color: var(--sub); text-align: center; margin-top: 8px; font-style: italic;">${caption}</div>` : ''}
        </div>
      `;
      return html;
    }

    /**
     * Opens fullscreen image/diagram modal with pinch-zoom support
     */
    openFullscreenViewer(src, alt = 'Diagram') {
      if (typeof document === 'undefined') return;

      this.closeFullscreenViewer(); // Close any existing

      const modal = document.createElement('div');
      modal.className = 'm-media-viewer-modal';
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(7, 9, 19, 0.95);
        backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.25s ease;
      `;

      modal.innerHTML = `
        <div style="position: absolute; top: 16px; right: 16px; z-index: 2;">
          <button onclick="window.MediaViewer && window.MediaViewer.closeFullscreenViewer()" style="background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 50%; width: 40px; height: 40px; font-size: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ✕
          </button>
        </div>
        <div style="max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <img src="${src}" alt="${alt}" style="max-width: 100%; max-height: 75vh; object-fit: contain; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);" onerror="this.onerror=null; this.src=''; this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div style="display: none; color: #fff; font-size: 14px; margin-top: 12px; text-align: center;">${alt}</div>
          <div style="color: var(--sub); font-size: 12px; margin-top: 12px;">Pinch to zoom • Tap anywhere outside to close</div>
        </div>
      `;

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeFullscreenViewer();
      });

      document.body.appendChild(modal);
      this.activeModal = modal;

      requestAnimationFrame(() => {
        modal.style.opacity = '1';
      });
    }

    closeFullscreenViewer() {
      if (this.activeModal) {
        this.activeModal.style.opacity = '0';
        setTimeout(() => {
          if (this.activeModal && this.activeModal.parentNode) {
            this.activeModal.parentNode.removeChild(this.activeModal);
          }
          this.activeModal = null;
        }, 250);
      }
    }
  }

  const instance = new MediaViewer();
  if (typeof window !== 'undefined') window.MediaViewer = instance;
  exports.MediaViewer = instance;

})(typeof exports !== 'undefined' ? exports : window);
