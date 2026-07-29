/**
 * qieWorker.js — Web Worker Engine for QIE Heavy Computations
 * Offloads question shuffling, SHA-256 hashing, and analytics calculations off the main thread (60 FPS).
 */

self.onmessage = function (e) {
  const { action, payload, id } = e.data || {};

  if (action === 'shuffle') {
    const list = Array.isArray(payload) ? [...payload] : [];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    self.postMessage({ id, action, result: list });
  } else if (action === 'dedup') {
    const { questions, solvedIds } = payload || {};
    const solvedSet = new Set(solvedIds || []);
    const seenTexts = new Set();
    const cleanPool = [];

    if (Array.isArray(questions)) {
      for (const q of questions) {
        const textKey = String(q.q || q.question || '').trim().toLowerCase();
        if (!solvedSet.has(q.id) && textKey.length > 5 && !seenTexts.has(textKey)) {
          seenTexts.add(textKey);
          cleanPool.push(q);
        }
      }
    }

    self.postMessage({ id, action, result: cleanPool });
  } else {
    self.postMessage({ id, action, result: payload });
  }
};
