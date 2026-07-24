/**
 * screens/progress.js — Mentorix Educational Diagnostics Panel
 * Redesigned from first principles: Analytics should feel like guidance, not report cards.
 * Powered by window.MasteryEngine and window.CurriculumEngine.
 */
'use strict';

let PV = {
  tab: 'diagnostics', // 'diagnostics' | 'diary' | 'achievements'
  chartTab: 'trend'
};

function rProgress() {
  const name = D.profile?.name || 'Learner';
  const board = D.profile?.board || 'CBSE';
  const grade = D.profile?.grade || 'Class 11';
  
  const mEngine = window.MasteryEngine;
  const profile = mEngine ? mEngine.getMasteryProfile() : {
    conceptMastery: {}, accuracy: 70, consistency: 50, confidence: 65, speed: 12,
    application: 60, reasoning: 60, growth: 10, momentum: 50, retention: 85
  };

  const dangerousMisconceptions = mEngine ? mEngine.getDangerousMisconceptions() : [];
  const mistakeDiary = mEngine ? mEngine.getMistakeDiary() : [];
  const mistakeBreakdown = mEngine ? mEngine.getMistakeBreakdown() : {};

  // Setup HTML base structure
  let headerHTML = `
    <div class="dash-hero-zone" style="padding:var(--sp-6) 0">
      <div class="editorial-section-label">EDUCATIONAL METRICS</div>
      <h1 class="dash-hero-greeting" style="font-size:clamp(28px,4vw,48px)">Diagnostics Hub</h1>
      <p class="sub">Pedagogical insights, mistake analysis, and conceptual mastery tracking.</p>
    </div>

    <!-- Identity & Level Card -->
    <div class="card profile-hero-card cglow mb20 s1">
      <div class="ph-avatar" aria-hidden="true">${(name[0]||'L').toUpperCase()}</div>
      <div>
        <div style="font-size:var(--fs-lg);font-weight:700;color:var(--txt);margin-bottom:2px">${esc(name)}</div>
        <div style="font-size:var(--fs-xs);color:var(--mut);margin-bottom:12px">${esc(board)} · ${esc(grade)}</div>
        <div class="profile-stat-pills">
          <div class="profile-stat-pill"><div class="psn" style="color:var(--p)">${D.xp}</div><div class="psl">XP</div></div>
          <div class="profile-stat-pill"><div class="psn" style="color:#EF4444">${D.streak}</div><div class="psl">Streak</div></div>
          <div class="profile-stat-pill"><div class="psn" style="color:#10B981">${D.topics.length}</div><div class="psl">Mastered</div></div>
          <div class="profile-stat-pill"><div class="psn" style="color:var(--gold)">${profile.accuracy}%</div><div class="psl">Accuracy</div></div>
          <div class="profile-stat-pill"><div class="psn" style="color:#3B82F6">${profile.speed}s</div><div class="psl">Avg Speed</div></div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div style="display:flex;gap:12px;margin-bottom:24px;border-bottom:1px solid var(--brd);padding-bottom:10px">
      <span class="tab-item ${PV.tab === 'diagnostics' ? 'active' : ''}" onclick="setProgressTab('diagnostics')" style="cursor:pointer;font-weight:700;font-size:14px;color:${PV.tab === 'diagnostics' ? 'var(--p)' : 'var(--mut)'};padding-bottom:8px">🕵️ Personal Diagnostics</span>
      <span class="tab-item ${PV.tab === 'diary' ? 'active' : ''}" onclick="setProgressTab('diary')" style="cursor:pointer;font-weight:700;font-size:14px;color:${PV.tab === 'diary' ? 'var(--p)' : 'var(--mut)'};padding-bottom:8px">📖 Mistake Diary (${mistakeDiary.length})</span>
      <span class="tab-item ${PV.tab === 'achievements' ? 'active' : ''}" onclick="setProgressTab('achievements')" style="cursor:pointer;font-weight:700;font-size:14px;color:${PV.tab === 'achievements' ? 'var(--p)' : 'var(--mut)'};padding-bottom:8px">🏆 Badges & Awards</span>
    </div>
  `;

  let mainContentHTML = '';

  if (PV.tab === 'diagnostics') {
    // ── 1. DIAGNOSTICS SUB-PANEL ──
    
    // Calculate dangerous misconceptions warning banner
    let misconceptionsBanner = '';
    if (dangerousMisconceptions.length > 0) {
      misconceptionsBanner = `
        <div class="card s2" style="border-left:4px solid var(--red);border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.03);padding:16px 20px;margin-bottom:20px">
          <div style="color:var(--redl);font-weight:700;font-size:14px;margin-bottom:6px">⚠️ Urgent Review: Dangerous Misconceptions Detected (${dangerousMisconceptions.length})</div>
          <p style="font-size:12.5px;color:var(--sub);line-height:1.5;margin-bottom:12px">
            You solved these questions incorrectly but marked your confidence as <strong>Confident</strong> or <strong>Very Confident</strong>. This indicates conceptual slips or false patterns that require review.
          </p>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${dangerousMisconceptions.slice(0, 3).map(m => `
              <div style="background:rgba(0,0,0,0.15);padding:10px 14px;border-radius:8px;font-size:12.5px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
                <span style="color:#fff;font-weight:600">"${esc(m.question)}" in <em>${esc(m.concept)}</em></span>
                <button class="btn bsm" style="background:rgba(139,92,246,0.15);color:var(--pl);border:1px solid rgba(139,92,246,0.3)" onclick="go('learn', '${escON(m.concept)}')">Review Concept</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Solve timings analysis
    const tooSlowTopic = mistakeDiary.sort((a,b) => b.timeTaken - a.timeTaken)[0];
    const repeatStruggle = mistakeDiary.sort((a,b) => b.frequency - a.frequency)[0];

    mainContentHTML = `
      ${misconceptionsBanner}

      <!-- Mastery Profile Matrix -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px">
        <div class="card s2" style="padding:16px;text-align:center">
          <div style="font-size:24px;margin-bottom:6px">🎯</div>
          <div style="font-size:18px;font-weight:800;color:var(--txt);font-family:var(--f-num)">${profile.accuracy}%</div>
          <div style="color:var(--mut);font-size:11px;font-weight:700;text-transform:uppercase;margin-top:2px">Accuracy Rating</div>
        </div>
        <div class="card s2" style="padding:16px;text-align:center">
          <div style="font-size:24px;margin-bottom:6px">⚡</div>
          <div style="font-size:18px;font-weight:800;color:var(--txt);font-family:var(--f-num)">${profile.speed} seconds</div>
          <div style="color:var(--mut);font-size:11px;font-weight:700;text-transform:uppercase;margin-top:2px">Solve Speed</div>
        </div>
        <div class="card s2" style="padding:16px;text-align:center">
          <div style="font-size:24px;margin-bottom:6px">🤝</div>
          <div style="font-size:18px;font-weight:800;color:var(--txt);font-family:var(--f-num)">${profile.confidence}%</div>
          <div style="color:var(--mut);font-size:11px;font-weight:700;text-transform:uppercase;margin-top:2px">Confidence Index</div>
        </div>
        <div class="card s2" style="padding:16px;text-align:center">
          <div style="font-size:24px;margin-bottom:6px">📊</div>
          <div style="font-size:18px;font-weight:800;color:var(--txt);font-family:var(--f-num)">${profile.consistency}/100</div>
          <div style="color:var(--mut);font-size:11px;font-weight:700;text-transform:uppercase;margin-top:2px">Consistency Factor</div>
        </div>
      </div>

      <!-- Main Q&A Diagnostics Panel -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;margin-bottom:24px">
        
        <!-- Pedagogical Q&A -->
        <div class="card s2" style="padding:22px">
          <div class="editorial-section-label" style="margin-bottom:14px">Pedagogical Q&A</div>
          
          <div style="display:flex;flex-direction:column;gap:16px">
            <div>
              <div style="font-size:13px;color:var(--sub);font-weight:700">❓ Which concepts have I mastered?</div>
              <div style="font-size:12.5px;color:var(--mut);margin-top:4px">
                ${D.topics.length > 0 
                  ? `You have successfully completed <strong>${D.topics.length} topics</strong> with verified understanding.` 
                  : 'Start studying in the syllabus path to record mastered concepts!'}
              </div>
            </div>

            <div>
              <div style="font-size:13px;color:var(--sub);font-weight:700">❓ Which concept is slowing me down?</div>
              <div style="font-size:12.5px;color:var(--mut);margin-top:4px">
                ${tooSlowTopic 
                  ? `<strong>${tooSlowTopic.concept}</strong> (averaging <strong>${tooSlowTopic.timeTaken}s</strong> solving speed). Review this topic to build speed.` 
                  : 'Insufficient timing data logged. Keep practicing checks!'}
              </div>
            </div>

            <div>
              <div style="font-size:13px;color:var(--sub);font-weight:700">❓ Which mistakes repeat most often?</div>
              <div style="font-size:12.5px;color:var(--mut);margin-top:4px">
                ${repeatStruggle 
                  ? `Conceptual struggles in <strong>${repeatStruggle.concept}</strong> (repeated <strong>${repeatStruggle.frequency} times</strong>).` 
                  : 'No recurring question slips logged. You are learning consistently!'}
              </div>
            </div>

            <div>
              <div style="font-size:13px;color:var(--sub);font-weight:700">❓ Am I ready for competitive exams?</div>
              <div style="font-size:12.5px;color:var(--mut);margin-top:4px">
                ${profile.accuracy >= 80 
                  ? '🔥 <strong>High Readiness</strong>. Your accuracy is above 80%, indicating deep analytical comprehension.' 
                  : '📈 <strong>Needs Practice</strong>. Focus on raising check accuracy above 80% to be ready for rank-breaker exams.'}
              </div>
            </div>
          </div>
        </div>

        <!-- Mistake Type Distribution Chart -->
        <div class="card s2" style="padding:22px">
          <div class="editorial-section-label" style="margin-bottom:14px">Mistake Classification</div>
          
          ${Object.keys(mistakeBreakdown).length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:12px">
              ${Object.entries(mistakeBreakdown).map(([type, pct]) => {
                let color = 'var(--p)';
                if (type === 'Careless mistake') color = '#EF4444';
                else if (type === 'Guessing') color = '#F59E0B';
                else if (type === 'Time pressure') color = '#3B82F6';

                return `
                  <div>
                    <div class="between mb4" style="font-size:12px">
                      <span style="font-weight:700;color:var(--txt)">${type}</span>
                      <span style="color:${color};font-weight:700;font-family:var(--f-num)">${pct}%</span>
                    </div>
                    <div class="pw" style="height:6px;background:rgba(0,0,0,0.06)">
                      <div class="pf" style="width:${pct}%;background:${color}"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div style="text-align:center;padding:32px 16px;color:var(--mut)">
              <div style="font-size:32px;margin-bottom:8px">📊</div>
              <div style="font-size:12.5px">No mistakes logged yet. Once you make mistakes in Checks, classifications will show up here.</div>
            </div>
          `}
          <div style="border-top:1px dashed var(--brd);padding-top:12px;margin-top:14px;font-size:11.5px;color:var(--mut);line-height:1.5">
            💡 <strong>Careless mistakes</strong> can be reduced by taking an extra 5 seconds to re-read. <strong>Conceptual gaps</strong> require reviewing prerequisite modules.
          </div>
        </div>
      </div>
    `;

  } else if (PV.tab === 'diary') {
    // ── 2. MISTAKE DIARY SUB-PANEL ──
    mainContentHTML = `
      <div class="card s2" style="padding:22px">
        <div class="between mb14">
          <div class="editorial-section-label">Mistake Diary (Error Intelligence)</div>
          <span style="font-size:12px;color:var(--mut)">Corrected topics are auto-archived.</span>
        </div>

        ${mistakeDiary.length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:14px">
            ${mistakeDiary.slice().reverse().map(m => `
              <div style="border:1px solid ${m.correctedLater ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};background:${m.correctedLater ? 'rgba(16,185,129,0.01)' : 'rgba(239,68,68,0.01)'};border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:14px">
                <div style="flex:1;min-width:260px">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                    <span class="tag ${m.correctedLater ? 'tp' : 'ts'}" style="font-size:9.5px;padding:2px 8px">${m.errorType}</span>
                    <span style="font-size:11px;color:var(--mut)">in ${esc(m.concept)} (Subchapter: ${esc(m.subtopic)})</span>
                  </div>
                  <div style="font-size:13.5px;color:#fff;font-weight:600;margin-bottom:8px" class="katex-render-target">"${esc(m.question)}"</div>
                  <div style="font-size:12px;color:var(--mut)">
                    Correct Answer: <strong style="color:var(--okl)">${esc(m.correctAnswer)}</strong> | Selected: <strong style="color:var(--redl)">${esc(m.studentAnswer)}</strong>
                  </div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:11px;color:var(--mut)">Struggled: ${m.frequency}x</div>
                  <div style="font-size:11px;color:var(--mut);margin-bottom:10px">Speed: ${m.timeTaken}s</div>
                  <button class="btn bsm" style="background:rgba(139,92,246,0.15);color:var(--pl);border:1px solid rgba(139,92,246,0.3)" onclick="go('learn', '${escON(m.concept)}')">
                    ${m.correctedLater ? 'Practice Again' : 'Practice & Resolve'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align:center;padding:48px 24px;color:var(--mut)">
            <div style="font-size:44px;margin-bottom:12px">📖</div>
            <div style="font-weight:700;color:var(--txt);margin-bottom:6px">Your Diary is Clean!</div>
            <p style="font-size:13px;max-width:280px;margin:0 auto">All concepts have been completed with verified understanding. Good job!</p>
          </div>
        `}
      </div>
    `;

  } else if (PV.tab === 'achievements') {
    // ── 3. ACHIEVEMENTS SUB-PANEL ──
    mainContentHTML = `
      <div class="card s2" style="padding:22px">
        <div class="editorial-section-label" style="margin-bottom:16px">Achievements Unlocked</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">
          ${BADGES.map(b => `
            <div class="bdg ${D.badges.includes(b.id) ? 'earned' : 'locked'}" title="${b.d}">
              <div style="font-size:32px;margin-bottom:8px" aria-hidden="true">${b.ic}</div>
              <div style="color:${D.badges.includes(b.id) ? 'var(--p)' : 'rgba(0,0,0,.2)'};font-weight:700;font-size:11px;margin-bottom:2px">${b.id}</div>
              <div style="color:var(--mut);font-size:9px;line-height:1.3">${b.d}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  document.getElementById('main').innerHTML = `
    <div class="sw scr page-enter">
      ${headerHTML}
      ${mainContentHTML}
    </div>
  `;

  // KaTeX rendering fallback
  setTimeout(() => {
    const el = document.getElementById('main');
    if (el && window.renderMath) {
      window.renderMath(el);
    }
  }, 50);
}

function setProgressTab(tab) {
  PV.tab = tab;
  rProgress();
  if (typeof MxAudio !== 'undefined') MxAudio.tuck();
}

window.rProgress = rProgress;
window.setProgressTab = setProgressTab;
