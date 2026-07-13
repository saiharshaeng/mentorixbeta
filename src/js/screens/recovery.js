/**
 * screens/recovery.js — Mentorix Recovery Screen
 * // Deps: D, ai, pJSON, pCtx, toast, esc, saveAll, go, addXP
 */
'use strict';

function rRecovery(){
  const weakSpots = D.memory?.weakSpots || [];
  const activeWeakSpots = weakSpots.filter(w => !w.solved);
  
  const grouped = {};
  activeWeakSpots.forEach(w => {
    if (!grouped[w.topic]) grouped[w.topic] = [];
    if (!grouped[w.topic].includes(w.concept)) grouped[w.topic].push(w.concept);
  });

  const entries = Object.entries(grouped);
  let recoverySessionsHTML = '';
  
  if (entries.length > 0) {
    recoverySessionsHTML = entries.map(([topic, list]) => {
      const wMetadata = activeWeakSpots.find(w => w.topic === topic) || {};
      const difficulty = wMetadata.difficulty || 3;
      const diffTag = difficulty >= 5 ? '<span class="tag tred">Hard Mode</span>' : difficulty >= 3 ? '<span class="tag tp">Standard</span>' : '<span class="tag tok">Basics</span>';

      return `
        <div class="card mb16 scr" style="border-left:4px solid var(--red)">
          <div class="between mb10">
            <div>
              <div class="h3" style="color:#fff;margin-bottom:2px">${esc(topic)}</div>
              <div style="font-size:11px;color:var(--mut)">Needs targeted exercises & recovery</div>
            </div>
            ${diffTag}
          </div>
          
          <div style="margin-bottom:14px">
            <p style="color:var(--sub);font-size:12px;margin-bottom:6px;font-weight:600">WEAK CONCEPTS:</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${list.map(c => `
                <span class="chip" style="border-color:rgba(239,68,68,.25);background:rgba(239,68,68,.05);color:var(--redl);font-size:11px;padding:3px 9px">
                  ⚠️ ${esc(c)}
                </span>
              `).join('')}
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            <button class="btn bpri bsm" onclick="startRecoverySession('${escON(topic)}', 'recap')">📖 Concept Recap</button>
            <button class="btn bok bsm" onclick="startRecoverySession('${escON(topic)}', 'recovery')">🎯 Micro Quiz</button>
            <button class="btn bgh bsm" onclick="startRecoverySession('${escON(topic)}', 'flashcards')">🃏 Flashcards</button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    recoverySessionsHTML = `
      <div class="card cok" style="text-align:center;padding:36px">
        <div style="font-size:48px;margin-bottom:12px">🛡️</div>
        <div class="h2" style="color:var(--okl);margin-bottom:8px">Shield Fully Charged!</div>
        <p class="sub" style="max-width:400px;margin:0 auto">You have no active weak concepts.</p>
      </div>
    `;
  }

  const completedCount = D.topics.length;
  const totalWeak = activeWeakSpots.length;
  const improvementRate = (completedCount + totalWeak) > 0 ? Math.round((completedCount / (completedCount + totalWeak)) * 100) : 100;

  const classifications = {
    'Knowledge Gap': 0,
    'Careless Error': 0,
    'Application Error': 0,
    'Reasoning Error': 0,
    'Memory Error': 0
  };
  weakSpots.forEach(w => {
    if (classifications[w.classification] !== undefined) {
      classifications[w.classification]++;
    }
  });

  const statsHTML = Object.entries(classifications).map(([type, count]) => {
    const totalAll = weakSpots.length || 1;
    const pct = Math.round((count / totalAll) * 100);
    return `
      <div style="margin-bottom:8px">
        <div class="between mb3" style="font-size:12px;color:var(--sub)">
          <span>${type}</span>
          <span>${count} (${pct}%)</span>
        </div>
        <div class="pw" style="height:4px;background:rgba(255,255,255,0.04)">
          <div class="pf" style="width:${pct}%;background:var(--p)"></div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('main').innerHTML = `
    <div class="sw scr">
      <div class="h1">🛡️ Skill Recovery Center</div>
      <p class="sub">Reinforce weak concepts to secure your learning and clear mistakes</p>
      
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
        <button class="btn bpri" style="padding:14px;font-size:12px;font-weight:700" onclick="practiceWeakAreas()">⚡ Practice Weak Areas</button>
        <button class="btn bsec" style="padding:14px;font-size:12px;font-weight:700" onclick="startTargetedRecovery()">🛡️ Targeted Recovery</button>
        <button class="btn bok" style="padding:14px;font-size:12px;font-weight:700" onclick="startQuickRecovery()">⏱️ Quick Recovery Session</button>
      </div>

      <div class="grid-3 mb20">
        <div class="sc cred" style="border-color:rgba(239,68,68,0.25)">
          <span class="sc-icon">⚠️</span>
          <div class="sn" style="color:var(--redl)">${totalWeak}</div>
          <div class="sl">Weak Concepts</div>
        </div>
        <div class="sc cglow">
          <span class="sc-icon">📈</span>
          <div class="sn" style="color:var(--pl)">${improvementRate}%</div>
          <div class="sl">Improvement Rate</div>
        </div>
        <div class="sc cgold">
          <span class="sc-icon">🛡️</span>
          <div class="sn" style="color:var(--goldl)">${weakSpots.filter(w=>w.solved).length}</div>
          <div class="sl">Recovered spots</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.8fr 1.2fr;gap:16px;margin-bottom:20px">
        <div>
          <div class="sec-divider">
            <div class="sec-divider-lbl">Active Recovery Sessions</div>
            <div class="sec-divider-line"></div>
          </div>
          <div class="recovery-list" style="margin-top:12px">
            ${recoverySessionsHTML}
          </div>
        </div>
        <div>
          <div class="sec-divider">
            <div class="sec-divider-lbl">Mistake Analytics</div>
            <div class="sec-divider-line"></div>
          </div>
          <div class="card mt12">
            <h3 class="h3 mb10" style="color:var(--pl)">Failure Modes Analysis</h3>
            <p class="sub" style="font-size:11px;margin-bottom:12px">Reflective categorization of your past errors:</p>
            ${statsHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}

function startRecoverySession(topic, mode) {
  go('revision');
  setTimeout(() => {
    startRevision(topic, mode);
  }, 100);
}

function logMistake(topic, concept, question, level, classification, reason) {
  if (!D.memory.weakSpots) D.memory.weakSpots = [];
  const exists = D.memory.weakSpots.some(w => w.topic === topic && w.concept === concept && !w.solved);
  if (!exists) {
    D.memory.weakSpots.push({
      id: Date.now() + Math.random().toString(36).substring(2, 5),
      topic: topic,
      concept: concept || 'General Theory',
      question: question || 'Concept understanding',
      difficulty: level || 3,
      classification: classification || 'Knowledge Gap',
      reason: reason || 'Concept misunderstanding',
      date: new Date().toISOString(),
      solved: false
    });
    saveAll();
  }
}

function logQuizMistake(topic, concept, question, level, classification) {
  logMistake(topic, concept, question, level, classification, `Self-reflected as ${classification} during quiz assessment.`);
  toast(`Logged as ${classification} in Recovery!`);
  // FIX: renderTab() doesn't exist — this is called from the learn screen's quiz tab.
  // Use the router's screen dispatcher to correctly re-render whatever screen is active.
  if (typeof renderScr === 'function') renderScr();
}

function practiceWeakAreas() {
  const weakSpots = D.memory?.weakSpots || [];
  const active = weakSpots.filter(w => !w.solved);
  if (active.length === 0) {
    toast("No active weak spots to practice!");
    return;
  }
  go('revision');
  setTimeout(() => {
    startRevision(active[0].topic, 'recovery');
  }, 100);
}

function startTargetedRecovery() {
  practiceWeakAreas();
}

function startQuickRecovery() {
  practiceWeakAreas();
}


window.rRecovery = rRecovery;
window.logMistake = logMistake;
window.practiceWeakAreas = practiceWeakAreas;
window.startTargetedRecovery = startTargetedRecovery;
window.startQuickRecovery = startQuickRecovery;
