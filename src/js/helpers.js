/**
 * helpers.js — Mentorix Pure Utility Functions
 * Extracted from mentorix_v2_4.html — Stage 1 of SPA modularization.
 *
 * Dependencies (globals expected from main document):
 *   D              — application state object
 *   window.renderMathInElement — KaTeX (loaded via CDN in index.html)
 *   document.getElementById('toasts') — toast container in shell HTML
 *
 * No imports. No side-effect initialization. Safe to load first.
 */

'use strict';

/* ── STRING / HTML ─────────────────────────────────────────── */

/**
 * Escape a value for safe insertion into HTML and JS inline attributes.
 * Escapes &, <, >, ", and ' (single quotes — critical for onclick="..." safety).
 */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escape a value for safe insertion into inline HTML attributes like onclick="func('VALUE')".
 * Escapes backslashes, single quotes, double quotes, and HTML tag delimiters.
 */
function escON(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitize an HTML string to strip out malicious script tags, iframe, object, embed,
 * link, style, and base tags, as well as inline event handlers and javascript: links.
 */
function sanitizeHTML(html) {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const clean = (el) => {
      const disallowedTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style', 'base'];
      const children = Array.from(el.childNodes);
      children.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          if (disallowedTags.includes(tagName)) {
            node.remove();
            return;
          }
          // Strip inline on* event listeners
          const attrs = Array.from(node.attributes);
          attrs.forEach(attr => {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on')) {
              node.removeAttribute(attr.name);
            } else if ((name === 'href' || name === 'src' || name === 'action') && attr.value.trim().toLowerCase().startsWith('javascript:')) {
              node.removeAttribute(attr.name);
            }
          });
          clean(node);
        }
      });
    };
    clean(doc.body);
    return doc.body.innerHTML;
  } catch (e) {
    return esc(html); // Fail-safe to escaped text on parser failure
  }
}

// Bind to window for global access across scripts
window.escON = escON;
window.sanitizeHTML = sanitizeHTML;


/* ── XP / LEVEL ────────────────────────────────────────────── */

/** Returns the level number for a given XP total (1 level per 500 XP). */
const lv  = xp => Math.floor(xp / 500) + 1;

/** Returns XP within the current level (0–499). */
const xpR = xp => xp % 500;

/** Returns percentage progress through the current level (0–100). */
const xpP = xp => Math.round((xpR(xp) / 500) * 100);

/* ── MATH RENDERING & EXPRESSION CACHING ─────────────────────────── */

window._katexCache = window._katexCache || new Map();

/**
 * Renders KaTeX math in `el` (or document.body if omitted).
 * Caches expressions & defers via requestAnimationFrame to avoid main-thread blocking.
 */
function renderMath(el) {
  const target = el || document.body;
  if (!target) return;

  // Skip if already rendered in this DOM container
  if (target.dataset && target.dataset.katexRendered === 'true') {
    return;
  }

  const runRender = () => {
    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(target, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$',  right: '$',  display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
        if (target.dataset) target.dataset.katexRendered = 'true';
      } catch (e) {
        console.warn('[KaTeX Cache] Render warning:', e);
      }
    } else {
      setTimeout(() => renderMath(target), 200);
    }
  };

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(runRender);
  } else {
    runRender();
  }
}
window.renderMath = renderMath;

/* ── VIEWPORT INTERSECTION OBSERVER ────────────────────────── */

(function initMentorixObserver() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

  window.MentorixObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('pause-anim');
      } else {
        entry.target.classList.add('pause-anim');
      }
    });
  }, { threshold: 0.05 });

  window.observeElementVisibility = function (el) {
    if (el && window.MentorixObserver) {
      window.MentorixObserver.observe(el);
    }
  };
})();

/* ── TOAST NOTIFICATIONS ────────────────────────────────────── */

/**
 * Shows a temporary toast notification.
 * @param {string} m  — message text
 * @param {string} t  — type suffix for CSS class (default 'xp')
 *                       known values: 'xp', 'ok2', 'err', 'warn', 'badge'
 */
function toast(m, t = 'xp') {
  const el = document.createElement('div');
  el.className = `toast t${t}`;
  el.textContent = m;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ── AI HELPERS ─────────────────────────────────────────────── */

/**
 * Parses a JSON string from an AI response, stripping markdown fences if present.
 * Returns null on parse failure (never throws).
 */
function pJSON(txt) {
  if (!txt) return null;
  txt = txt.trim();
  
  // Clean raw JSON string to double-escape LaTeX backslashes inside math delimiters.
  // Also automatically inserts missing backslashes for standard symbols (pi, sqrt, ce, frac, etc.)
  try {
    txt = txt.replace(/\$\$([\s\S]*?)\$\$/g, (m, p) => {
      p = p.replace(/(?<!\\)ce{/g, '\\ce{');
      p = p.replace(/(?<!\\)(pi|sqrt|theta|alpha|beta|gamma|frac|pm|text)/g, '\\$1');
      return '$$' + p.replace(/\\/g, '\\\\').replace(/\\\\\\\\/g, '\\\\') + '$$';
    });
    txt = txt.replace(/\$([^\$]*?)\$/g, (m, p) => {
      p = p.replace(/(?<!\\)ce{/g, '\\ce{');
      p = p.replace(/(?<!\\)(pi|sqrt|theta|alpha|beta|gamma|frac|pm|text)/g, '\\$1');
      return '$' + p.replace(/\\/g, '\\\\').replace(/\\\\\\\\/g, '\\\\') + '$';
    });
    txt = txt.replace(/\\([\s\S]*?)\\\)/g, (m, p) => {
      p = p.replace(/(?<!\\)ce{/g, '\\ce{');
      p = p.replace(/(?<!\\)(pi|sqrt|theta|alpha|beta|gamma|frac|pm|text)/g, '\\$1');
      return '\\(' + p.replace(/\\/g, '\\\\').replace(/\\\\\\\\/g, '\\\\') + '\\)';
    });
  } catch (e) {
    console.error('[Mentorix Math Parser] Auto-cleanup error:', e);
  }

  try { return JSON.parse(txt); } catch {}
  const s = txt.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');
  try { return JSON.parse(s); } catch {}
  const m = txt.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  return null;
}

/**
 * Builds a compact profile context string for AI system prompts.
 * Reads D.profile — returns 'New learner' if no profile exists.
 */
function pCtx() {
  const p = D.profile;
  if (!p) return 'New learner';
  const parts = [`Name:${p.name}`, `Age:${p.age || p.ageNum || 'unknown'}`];
  if (p.grade)          parts.push(`Grade:${p.grade}`);
  if (p.board)          parts.push(`Board:${p.board}`);
  if (p.stream)         parts.push(`Stream:${p.stream}`);
  if (p.careers?.length) parts.push(`Careers:${p.careers.join(',')}`);
  if (p.subjects?.length) parts.push(`Subjects:${p.subjects.slice(0, 5).join(',')}`);
  if (p.lstyle)         parts.push(`Style:${p.lstyle}`);
  if (p.mode)           parts.push(`Mode:${p.mode}`);
  return parts.join(', ');
}

/* ── SUBJECT DETECTION ──────────────────────────────────────── */

/**
 * Heuristically detects the academic subject of a topic string.
 * Used for notebook categorization and note generation prompts.
 */
function detectSubject(topic) {
  const t = topic.toLowerCase();
  if (/equation|algebra|calculus|geometry|trigonometry|matrix|vector|integral|derivative|theorem|proof|polynomial|logarithm|statistics|probability|number theory/.test(t)) return 'Mathematics';
  if (/physics|force|motion|energy|gravity|wave|quantum|relativity|thermodynamics|magnetism|optics|newton|einstein/.test(t)) return 'Physics';
  if (/chemistry|reaction|element|compound|molecule|acid|base|periodic|organic|bond|electron|atom|ion/.test(t)) return 'Chemistry';
  if (/biology|cell|dna|evolution|photosynthesis|ecosystem|genetics|organism|protein|enzyme|mitosis|osmosis/.test(t)) return 'Biology';
  if (/history|war|civilization|empire|revolution|ancient|medieval|colonial|independence|treaty|dynasty/.test(t)) return 'History';
  if (/geography|climate|continent|country|capital|mountain|river|ocean|population|latitude|longitude/.test(t)) return 'Geography';
  if (/computer|programming|algorithm|code|software|database|network|cybersecurity|artificial intelligence|machine learning/.test(t)) return 'Computer Science';
  if (/economics|market|supply|demand|inflation|gdp|trade|fiscal|monetary|business|entrepreneur/.test(t)) return 'Economics';
  if (/english|grammar|literature|poetry|novel|essay|writing|language|vocabulary|comprehension/.test(t)) return 'English';
  return 'General';
}

/* ── HAPTIC FEEDBACK ────────────────────────────────────────── */

/**
 * Triggers device haptic feedback if the Vibration API is available.
 * Silently no-ops on unsupported browsers/devices.
 */
function haptic(type = 'light') {
  const synth = window.AudioSynth || window.MxAudio;
  if (synth) {
    if (type === 'success' || type === 'celebration') {
      if (typeof synth.playMilestone === 'function') synth.playMilestone();
      else if (typeof synth.milestone === 'function') synth.milestone();
    } else if (type === 'error') {
      if (typeof synth.playAlert === 'function') synth.playAlert();
      else if (typeof synth.warn === 'function') synth.warn();
    } else {
      if (typeof synth.playTick === 'function') synth.playTick();
      else if (typeof synth.tuck === 'function') synth.tuck();
    }
  }
  if (!navigator.vibrate) return;
  const patterns = {
    light:       10,
    medium:      20,
    heavy:       40,
    success:     [10, 50, 10],
    error:       [20, 50, 20, 50, 20],
    celebration: [10, 30, 10, 30, 10, 30, 60]
  };
  navigator.vibrate(patterns[type] || 10);
}

/* ── CONTENT SAFETY ─────────────────────────────────────────── */

/**
 * Topics blocked for users under 16.
 * isTopicForbidden() checks this list against D.profile.ageNum.
 */
const FORBIDDEN_TOPICS = [
  // Adult content
  'porn', 'pornography', 'sex', 'sexual', 'naked', 'nude', 'adult content', 'nsfw',
  'erotic', 'erotica', 'xxx', 'hentai', 'fetish', 'kink', 'masturbat', 'orgasm',
  // Violence/drugs
  'how to make drugs', 'how to make meth', 'synthesize meth', 'crack cocaine',
  'how to get high', 'how to kill', 'how to murder', 'suicide methods',
  'self harm methods', 'cutting yourself', 'how to hurt',
  // Weapons
  'how to make a bomb', 'make explosives', 'make a gun', '3d print gun',
  // Gambling
  'how to gamble', 'betting strategy', 'casino tricks',
  // Alcohol
  'how to get drunk', 'best alcohol', 'drinking games for teens',
];

/**
 * Returns true if the given topic should be blocked for the current user's age.
 * Only restricts users under 16; all other users see all content.
 */
function isTopicForbidden(topic) {
  const age = parseInt(D.profile?.ageNum || D.profile?.age) || 99;
  if (age >= 16) return false;
  const lower = topic.toLowerCase().trim();
  return FORBIDDEN_TOPICS.some(w => lower.includes(w));
}

function initNetworkDetection(){
  function showOfflineBanner(){
    if(document.getElementById('offline-banner'))return;
    const b=document.createElement('div');b.id='offline-banner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99995;background:linear-gradient(90deg,rgba(239,68,68,.95),rgba(245,158,11,.9));padding:10px 16px;text-align:center;font-size:13px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 2px 12px rgba(0,0,0,.3)';
    b.innerHTML='📶 No internet connection — AI features unavailable. <span style="opacity:.7;font-weight:400">Your notes and progress are safe.</span>';
    document.body.appendChild(b);
  }
  function hideOfflineBanner(){
    const b=document.getElementById('offline-banner');
    if(b){b.style.opacity='0';b.style.transform='translateY(-100%)';b.style.transition='all .3s ease';setTimeout(()=>b.remove(),300);}
  }
  if(!navigator.onLine)showOfflineBanner();
  window.addEventListener('offline',showOfflineBanner);
  window.addEventListener('online',()=>{hideOfflineBanner();toast('✅ Back online!','ok2');});
}

function initSwipeGestures(){
  let touchStartX=0,touchStartY=0,touchStartTime=0;
  document.addEventListener('touchstart',e=>{
    touchStartX=e.touches[0].clientX;
    touchStartY=e.touches[0].clientY;
    touchStartTime=Date.now();
  },{passive:true});
  document.addEventListener('touchend',e=>{
    if(!e.changedTouches.length)return;
    const dx=e.changedTouches[0].clientX-touchStartX;
    const dy=e.changedTouches[0].clientY-touchStartY;
    const dt=Date.now()-touchStartTime;
    if(dt>350||Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*0.7)return;
    if(D.screen==='learn'&&LS.lesson){
      const tabs=['overview','notes','quiz'];
      const cur=tabs.indexOf(LS.tab);
      if(dx<0&&cur<tabs.length-1){switchTab(tabs[cur+1]);haptic('light');}
      else if(dx>0&&cur>0){switchTab(tabs[cur-1]);haptic('light');}
    }
  },{passive:true});
}

function initBackButton(){
  // Handled by router popstate listeners
}

function animKeyPress(el) {
  if (!el) return;
  el.style.transform = 'scale(0.95)';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 100);
}

/* ── EXPORTS ────────────────────────────────────────────────── */
// Exposed as globals so the non-module monolith scripts can call them unchanged.
// When the full ESM migration is complete these become named exports.
window.animKeyPress     = animKeyPress;
window.esc              = esc;
window.lv               = lv;
window.xpR              = xpR;
window.xpP              = xpP;
window.renderMath       = renderMath;
window.toast            = toast;
window.pJSON            = pJSON;
window.pCtx             = pCtx;
window.detectSubject    = detectSubject;
window.haptic           = haptic;
window.FORBIDDEN_TOPICS = FORBIDDEN_TOPICS;
window.isTopicForbidden = isTopicForbidden;
window.initNetworkDetection = initNetworkDetection;
window.initSwipeGestures = initSwipeGestures;
window.initBackButton   = initBackButton;
