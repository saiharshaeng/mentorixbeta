/**
 * screens/recovery.js — Mentorix Mistake Diary & Skill Recovery Center
 * Phase 1.7 Core UI Integration with MasteryEngine
 */
'use strict';

function rRecovery(){
  const weakSpots = D.memory?.weakSpots || [];
  const activeWeakSpots = weakSpots.filter(w => !w.solved);
  const diary = D.memory?.mistakeDiary || [];
  
  const grouped = {};
  activeWeakSpots.forEach(w => {
    if (!grouped[w.topic]) grouped[w.topic] = [];
    if (!grouped[w.topic].includes(w.concept)) grouped[w.topic].push(w.concept);
  });

  const entries = Object.entries(grouped);
  let recoverySessionsHTML = '';
  
  if (entries.length > 0) {
    recoverySessionsHTML = entries.map(([topic, list]) => {
      const masteryState = window.MasteryEngine ? window.MasteryEngine.initTopicMastery(topic) : null;
      const dims = masteryState?.dimensions || { conceptUnderstanding: 3, problemSolving: 2, speed: 2, confidence: 3, retention: 2, examReadiness: 2 };
      const levelLabel = masteryState?.level || 'Improving';

      return `
        <div class="card mb16 scr" style="border-left:4px solid var(--p);background:rgba(13,11,31,0.85)">
          <div class="between mb10">
            <div>
              <div class="h3" style="color:#fff;margin-bottom:2px">${esc(topic)}</div>
              <div style="font-size:11px;color:var(--pl);font-weight:700">Mastery Stage: ${esc(levelLabel)}</div>
            </div>
            <span class="tag tp" style="font-size:11px;padding:3px 10px">Needs Practice</span>
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
                <span class="chip" style="border-color:rgba(139,92,246,0.3);background:rgba(139,92,246,0.08);color:var(--pl);font-size:11px;padding:3px 9px">
                  💡 ${esc(c)}
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
        <div class="h2" style="color:var(--okl);margin-bottom:8px">Improvement Journal Clear!</div>
        <p class="sub" style="max-width:400px;margin:0 auto">You have no active weak concepts. Mentorix will automatically add concepts here if you encounter any friction during quizzes.</p>
      </div>
    `;
  }

  const completedCount = D.topics.length;
  const totalWeak = activeWeakSpots.length;
  const improvementRate = (completedCount + totalWeak) > 0 ? Math.round((completedCount / (completedCount + totalWeak)) * 100) : 100;
  const topError = window.MasteryEngine ? window.MasteryEngine.getMostCommonErrorType() : { type: 'None', pct: 0 };

  document.getElementById('main').innerHTML = `
    <div class="sw scr page-enter">
      <div class="h1">📖 Mistake Diary & Skill Recovery</div>
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
  if (window.MasteryEngine) {
    window.MasteryEngine.logMistake({
      topicTitle: topic,
      concept: concept,
      question: question,
      errorType: classification || 'Conceptual Error'
    });
  } else {
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
window.logQuizMistake = logQuizMistake;
window.practiceWeakAreas = practiceWeakAreas;
window.startTargetedRecovery = startTargetedRecovery;
window.startQuickRecovery = startQuickRecovery;
