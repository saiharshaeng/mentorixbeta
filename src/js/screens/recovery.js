/**
 * screens/recovery.js — Mentorix Mistake Diary & Skill Recovery Center
 * Phase 1.7 Core UI Integration with MasteryEngine
 */
'use strict';

function rRecovery(){
  const weakSpots = D.memory?.weakSpots || [];
  const activeWeakSpots = weakSpots.filter(w => !w.solved);
  const diary = (window.MasteryEngine && typeof window.MasteryEngine.getMistakeDiary === 'function')
    ? window.MasteryEngine.getMistakeDiary()
    : (D.memory?.mistakeDiary || []);
  
  const grouped = {};
  activeWeakSpots.forEach(w => {
    if (!grouped[w.topic]) grouped[w.topic] = [];
    if (!grouped[w.topic].includes(w.concept)) grouped[w.topic].push(w.concept);
  });

  const entries = Object.entries(grouped);
  let recoverySessionsHTML = '';
  
  if (entries.length > 0) {
    recoverySessionsHTML = entries.map(([topic, list]) => {
      const masteryState = (window.MasteryEngine && typeof window.MasteryEngine.initTopicMastery === 'function') 
        ? window.MasteryEngine.initTopicMastery(topic) 
        : null;
      const dims = masteryState?.dimensions || { conceptUnderstanding: 3, problemSolving: 2, speed: 2, confidence: 3, retention: 2, examReadiness: 2 };
      const levelLabel = masteryState?.level || 'Improving';

      return `
        <div class="card mb16 scr mx-glass-card" style="border-left:4px solid var(--p);background:rgba(13,11,31,0.85)">
          <div class="between mb10">
            <div>
              <div class="h3 font-serif" style="color:#fff;margin-bottom:2px">${esc(topic)}</div>
              <div class="font-poiret" style="font-size:11px;color:var(--pl);font-weight:700">Mastery Stage: ${esc(levelLabel)}</div>
            </div>
            <span class="tag tp font-poiret" style="font-size:11px;padding:3px 10px">Needs Practice</span>
          </div>

          <!-- 6-Dimensional Mastery Meter Grid -->
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:10px;margin-bottom:14px">
            <div style="font-size:11px;color:var(--sub)">
              <span>Concept Clarity: </span><strong style="color:var(--goldl)">${'★'.repeat(dims.conceptUnderstanding)}${'☆'.repeat(5-dims.conceptUnderstanding)}</strong>
            </div>
            <div style="font-size:11px;color:var(--sub)">
              <span>Problem Solving: </span><strong style="color:var(--goldl)">${'★'.repeat(dims.problemSolving)}${'☆'.repeat(5-dims.problemSolving)}</strong>
            </div>
            <div style="font-size:11px;color:var(--sub)">
              <span>Speed: </span><strong style="color:var(--goldl)">${'★'.repeat(dims.speed)}${'☆'.repeat(5-dims.speed)}</strong>
            </div>
            <div style="font-size:11px;color:var(--sub)">
              <span>Confidence: </span><strong style="color:var(--goldl)">${'★'.repeat(dims.confidence)}${'☆'.repeat(5-dims.confidence)}</strong>
            </div>
            <div style="font-size:11px;color:var(--sub)">
              <span>Retention: </span><strong style="color:var(--goldl)">${'★'.repeat(dims.retention)}${'☆'.repeat(5-dims.retention)}</strong>
            </div>
            <div style="font-size:11px;color:var(--sub)">
              <span>Exam Readiness: </span><strong style="color:var(--goldl)">${'★'.repeat(dims.examReadiness)}${'☆'.repeat(5-dims.examReadiness)}</strong>
            </div>
          </div>
          
          <div style="margin-bottom:14px">
            <p style="color:var(--sub);font-size:11px;margin-bottom:6px;font-weight:700;text-transform:uppercase">FOCUS CONCEPTS:</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${list.map(c => `
                <span class="chip font-poiret" style="border-color:rgba(139,92,246,0.3);background:rgba(139,92,246,0.08);color:var(--pl);font-size:11px;padding:3px 9px">
                  💡 ${esc(c)}
                </span>
              `).join('')}
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            <button class="btn bpri bsm font-poiret" onclick="startRecoverySession('${escON(topic)}', 'recap')">📖 Concept Recap</button>
            <button class="btn bok bsm font-poiret" onclick="startRecoverySession('${escON(topic)}', 'recovery')">🎯 Micro Quiz</button>
            <button class="btn bgh bsm font-poiret" onclick="startRecoverySession('${escON(topic)}', 'flashcards')">🃏 Flashcards</button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    recoverySessionsHTML = `
      <div class="card cok mx-glass-card" style="text-align:center;padding:36px">
        <div style="font-size:48px;margin-bottom:12px">🛡️</div>
        <div class="h2 font-serif" style="color:var(--okl);margin-bottom:8px">Improvement Journal Clear!</div>
        <p class="sub" style="max-width:400px;margin:0 auto">You have no active weak concepts. Mentorix will automatically add concepts here if you encounter any friction during quizzes.</p>
      </div>
    `;
  }

  const completedCount = D.topics.length;
  const totalWeak = activeWeakSpots.length;
  const improvementRate = (completedCount + totalWeak) > 0 ? Math.round((completedCount / (completedCount + totalWeak)) * 100) : 100;
  const topError = (window.MasteryEngine && typeof window.MasteryEngine.getMostCommonErrorType === 'function') ? window.MasteryEngine.getMostCommonErrorType() : { type: 'None', pct: 0 };

  document.getElementById('main').innerHTML = `
    <div class="sw scr page-enter">
      <div class="h1 font-serif">📖 Mistake Diary & Skill Recovery</div>
      <p class="sub">Your personalized improvement journal. Every mistake teaches Mentorix how to help you grow.</p>
      
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
        <button class="btn bpri" style="padding:14px;font-size:12px;font-weight:700" onclick="practiceWeakAreas()">⚡ Reinforce Current Focus Areas</button>
        <button class="btn bsec" style="padding:14px;font-size:12px;font-weight:700" onclick="startTargetedRecovery()">🛡️ Targeted Concept Practice</button>
        <button class="btn bok" style="padding:14px;font-size:12px;font-weight:700" onclick="startQuickRecovery()">⏱️ 5-Min Recovery Session</button>
      </div>

      <div class="grid-3 mb20">
        <div class="sc cglow" style="border-color:rgba(139,92,246,0.3)">
          <span class="sc-icon">💡</span>
          <div class="sn" style="color:var(--pl)">${totalWeak}</div>
          <div class="sl">Focus Concepts</div>
        </div>
        <div class="sc cglow">
          <span class="sc-icon">📈</span>
          <div class="sn" style="color:var(--pl)">${improvementRate}%</div>
          <div class="sl">Growth & Mastery Rate</div>
        </div>
        <div class="sc cgold">
          <span class="sc-icon">🎯</span>
          <div class="sn" style="color:var(--goldl);font-size:16px">${esc(topError.type)}</div>
          <div class="sl">Primary Error Pattern</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.8fr 1.2fr;gap:16px;margin-bottom:20px">
        <div>
          <div class="sec-divider">
            <div class="sec-divider-lbl">Active Concept Improvement Sessions</div>
            <div class="sec-divider-line"></div>
          </div>
          <div class="recovery-list" style="margin-top:12px">
            ${recoverySessionsHTML}
          </div>
        </div>
        <div>
          <div class="sec-divider">
            <div class="sec-divider-lbl">Mistake Journal Log</div>
            <div class="sec-divider-line"></div>
          </div>
          <div class="card mt12" style="max-height:420px;overflow-y:auto">
            <h3 class="h3 mb10" style="color:var(--pl)">Recent Journal Entries</h3>
            ${diary.length === 0 ? `
              <p class="sub" style="font-size:12px;text-align:center;padding:20px">No logged mistakes yet. Keep learning!</p>
            ` : diary.slice(-10).reverse().map(m => `
              <div style="border-bottom:1px solid rgba(255,255,255,0.06);padding:10px 0">
                <div class="between">
                  <span style="font-size:12px;font-weight:700;color:#fff">${esc(m.topicTitle || 'General')}</span>
                  <span class="tag tp" style="font-size:9px">${esc(m.errorType || 'Conceptual Error')}</span>
                </div>
                <div style="font-size:11px;color:var(--sub);margin-top:4px">${esc(m.concept || m.question || 'Concept review')}</div>
                <div style="font-size:9px;color:var(--mut);margin-top:4px">Logged: ${new Date(m.date).toLocaleDateString()}</div>
              </div>
            `).join('')}
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
  // Always push to D.memory.weakSpots (local store — works offline)
  if (window.D) {
    if (!D.memory) D.memory = { weakSpots: [], history: [], scores: {}, mistakeDiary: [], reflections: {} };
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
  if (window.MasteryEngine && typeof window.MasteryEngine.logAttempt === 'function') {
    window.MasteryEngine.logAttempt({
      topic: topic,
      questionText: question,
      isCorrect: false,
      difficulty: level === 5 ? 'hard' : level === 1 ? 'easy' : 'medium',
      errorType: classification || 'Conceptual Error'
    });
  }

  // Fix 12: If MasteryEngine later marks topic mastery >= 80, it will resolve weakSpots
  // via the resolveWeakSpots() call added to MasteryEngine.logAttempt (see masteryEngine.js)
}

function logQuizMistake(topic, concept, question, level, classification) {
  logMistake(topic, concept, question, level, classification, `Self-reflected as ${classification} during quiz assessment.`);
  toast(`Logged in Mistake Diary under ${classification}!`);
  if (typeof renderScr === 'function') renderScr();
}

function practiceWeakAreas() {
  const weakSpots = D.memory?.weakSpots || [];
  const active = weakSpots.filter(w => !w.solved);
  if (active.length === 0) {
    toast("No active focus concepts to practice right now!");
    return;
  }
  // Group by topic to find topic with most weak spots (most urgent)
  const topicCounts = {};
  active.forEach(w => { topicCounts[w.topic] = (topicCounts[w.topic] || 0) + 1; });
  const sortedTopics = Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a]);
  const targetTopic = sortedTopics[0] || active[0].topic;

  go('revision');
  setTimeout(() => {
    if (typeof RV !== 'undefined') RV._quickMode = false;
    startRevision(targetTopic, 'recovery');
  }, 100);
}

function startTargetedRecovery() {
  const weakSpots = D.memory?.weakSpots || [];
  const active = weakSpots.filter(w => !w.solved);
  if (active.length === 0) {
    toast("No active focus concepts to practice right now!");
    return;
  }
  const topics = [...new Set(active.map(w => w.topic))];
  if (topics.length === 1) {
    go('revision');
    setTimeout(() => {
      if (typeof RV !== 'undefined') RV._quickMode = false;
      startRevision(topics[0], 'recovery');
    }, 100);
    return;
  }

  // Show targeted topic selection modal
  const modalHTML = `
    <div class="modal-overlay" id="targeted-recovery-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box mx-glass-card" style="max-width:440px;padding:24px">
        <div class="between mb14">
          <div class="h3 font-serif" style="color:#fff">🎯 Targeted Concept Practice</div>
          <button class="btn bgh bsm" onclick="document.getElementById('targeted-recovery-modal')?.remove()">✖</button>
        </div>
        <p class="sub" style="font-size:13px;margin-bottom:14px">Select a focus topic to practice:</p>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto">
          ${topics.map(t => {
            const count = active.filter(w => w.topic === t).length;
            return `<button class="btn bgh" style="text-align:left;justify-content:space-between;padding:12px 14px;border:1px solid rgba(139,92,246,0.25)" onclick="document.getElementById('targeted-recovery-modal')?.remove();go('revision');setTimeout(()=>{ if(typeof RV!=='undefined')RV._quickMode=false; startRevision('${escON(t)}','recovery'); },100)">
              <span style="font-weight:600;color:#fff">${esc(t)}</span>
              <span class="tag tp" style="font-size:10px">${count} spot${count>1?'s':''}</span>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  const prevModal = document.getElementById('targeted-recovery-modal');
  if (prevModal) prevModal.remove();
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function startQuickRecovery() {
  const weakSpots = D.memory?.weakSpots || [];
  const active = weakSpots.filter(w => !w.solved);
  if (active.length === 0) {
    toast("No active focus concepts!");
    return;
  }
  // Most urgent (most recently logged spot)
  const urgent = active[active.length - 1];
  go('revision');
  setTimeout(() => {
    if (typeof RV !== 'undefined') RV._quickMode = true;
    startRevision(urgent.topic, 'recovery');
    if (typeof toast === 'function') toast('⏱️ 5-Minute Quick Recovery Session started!', 'badge');
  }, 100);
}

window.rRecovery = rRecovery;
window.logMistake = logMistake;
window.logQuizMistake = logQuizMistake;
window.practiceWeakAreas = practiceWeakAreas;
window.startTargetedRecovery = startTargetedRecovery;
window.startQuickRecovery = startQuickRecovery;
window.startRecoverySession = startRecoverySession;

