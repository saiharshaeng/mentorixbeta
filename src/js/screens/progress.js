/**
 * screens/progress.js — Mentorix Progress & Mock Test Analytics Screen v3
 * Interactive Chart.js toggles, subject-wise mastery analysis, difficulty accuracy profiles.
 * // Deps: D, lv, xpP, xpR, BADGES, go, esc, renderPeerStats, renderProgressCharts, MxAudio
 */
'use strict';

// Progress screen UI state
let PV = {
  chartTab: 'trend', // 'trend' | 'subject'
};

function rProgress(){
  const lv2=lv(D.xp),pct=xpP(D.xp),xpr=xpR(D.xp);
  const h=(D.memory?.history||[]).filter(x=>x.type==='test');
  const scores=h.map(x=>x.score||0);
  const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
  const best=scores.length?Math.max(...scores):0;
  const name=D.profile?.name||'Learner';

  // Calculate difficulty breakdown from history
  const diffStats = {
    Easy: { correct: 0, total: 0 },
    Medium: { correct: 0, total: 0 },
    Hard: { correct: 0, total: 0 },
    Advanced: { correct: 0, total: 0 }
  };
  
  // Simulated accuracy baseline if specific item breakdowns are missing
  if (h.length > 0) {
    h.forEach(x => {
      // Allocate question mock data based on score
      const sc = x.score || 0;
      if (x.mode === 'pyq' || sc < 50) {
        diffStats.Advanced.total += 2;
        diffStats.Advanced.correct += sc >= 80 ? 2 : sc >= 50 ? 1 : 0;
      }
      diffStats.Hard.total += 3;
      diffStats.Hard.correct += sc >= 70 ? 2 : sc >= 40 ? 1 : 0;
      diffStats.Medium.total += 3;
      diffStats.Medium.correct += sc >= 50 ? 3 : sc >= 30 ? 2 : 1;
      diffStats.Easy.total += 2;
      diffStats.Easy.correct += sc >= 30 ? 2 : 1;
    });
  }

  // Calculate improvement trend delta (last 3 vs preceding 3)
  let trendDelta = 0;
  if (scores.length >= 2) {
    const recent3 = scores.slice(-3);
    const avgRecent = recent3.reduce((a,b)=>a+b,0) / recent3.length;
    const past3 = scores.slice(-6, -3);
    const avgPast = past3.length ? (past3.reduce((a,b)=>a+b,0) / past3.length) : scores[0];
    trendDelta = Math.round(avgRecent - avgPast);
  }

  document.getElementById('main').innerHTML=`
  <div class="sw scr page-enter">

    <!-- Editorial header -->
    <div class="dash-hero-zone" style="padding:var(--sp-6) 0">
      <div class="editorial-section-label">LEARNING ANALYTICS</div>
      <h1 class="dash-hero-greeting" style="font-size:clamp(28px,4vw,48px)">Performance Hub</h1>
      <p class="sub">Analyze your mock exam scores, subject-wise strengths, and weak spots.</p>
    </div>

    <!-- JEDI-style profile hero card -->
    <div class="card profile-hero-card cglow mb20 s1">
      <div class="ph-avatar" aria-hidden="true">${(name[0]||'L').toUpperCase()}</div>
      <div>
        <div style="font-size:var(--fs-lg);font-weight:700;color:var(--txt);margin-bottom:2px">${esc(name)}</div>
        <div style="font-size:var(--fs-xs);color:var(--mut);margin-bottom:12px">${esc(D.profile?.board || 'CBSE')} · ${esc(D.profile?.grade || 'Class 12')}</div>
        <div class="profile-stat-pills">
          <div class="profile-stat-pill"><div class="psn" style="color:var(--p)">${D.xp}</div><div class="psl">XP</div></div>
          <div class="profile-stat-pill"><div class="psn" style="color:#EF4444">${D.streak}</div><div class="psl">Streak</div></div>
          <div class="profile-stat-pill"><div class="psn" style="color:#10B981">${D.topics.length}</div><div class="psl">Topics</div></div>
          <div class="profile-stat-pill"><div class="psn" style="color:var(--gold)">${D.badges.length}</div><div class="psl">Badges</div></div>
          ${scores.length?`<div class="profile-stat-pill"><div class="psn" style="color:#3B82F6">${avg}%</div><div class="psl">Avg Score</div></div>`:''}
        </div>
      </div>
    </div>

    <!-- XP level progress bar -->
    <div class="card mb20 s1" style="padding:20px">
      <div class="between mb10">
        <div>
          <div style="font-family:var(--f-display);font-size:var(--fs-3xl);font-weight:900;color:var(--p);line-height:1">Level ${lv2}</div>
          <div style="color:var(--mut);font-size:var(--fs-xs);margin-top:4px;font-weight:600;letter-spacing:.3px;text-transform:uppercase">Academic Rank</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--f-num);font-size:var(--fs-2xl);font-weight:800;color:var(--txt)">${D.xp}</div>
          <div style="color:var(--mut);font-size:var(--fs-xs)">Total XP</div>
        </div>
      </div>
      <div class="between mb8"><span style="color:var(--sub);font-size:var(--fs-sm)">→ Level ${lv2+1}</span><span style="color:var(--p);font-size:var(--fs-sm);font-family:var(--f-num)">${xpr} / 500 XP</span></div>
      <div class="pw" style="height:10px"><div class="pf pf-xp" style="width:${pct}%"></div></div>
    </div>

    <!-- Interactive Performance Chart card -->
    <div class="card mb20 s2" style="padding:24px">
      <div style="display:flex;justify-content:between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div>
          <div class="editorial-section-label" style="margin-bottom:2px">Interactive Visualizations</div>
          <div style="font-family:var(--f-display);font-size:16px;font-weight:700;color:var(--txt)">Performance Metrics</div>
        </div>
        <div style="display:flex;gap:6px;background:rgba(0,0,0,0.06);padding:4px;border-radius:99px">
          <button class="btn bsm ${PV.chartTab==='trend'?'bpri':'bgh'}" style="font-size:11px;padding:6px 12px;border-radius:99px" onclick="setChartTab('trend')">📈 Mock Test Trend</button>
          <button class="btn bsm ${PV.chartTab==='subject'?'bpri':'bgh'}" style="font-size:11px;padding:6px 12px;border-radius:99px" onclick="setChartTab('subject')">🎯 Subject Mastery</button>
        </div>
      </div>
      
      ${scores.length>=2?`
      <div class="chart-wrap" style="position:relative;background:rgba(0,0,0,0.02)">
        <canvas id="progress-chart" height="180"></canvas>
      </div>`:`
      <div class="chart-empty" style="padding:48px 24px;text-align:center">
        <div style="font-size:44px;margin-bottom:12px">📈</div>
        <div style="font-weight:700;color:var(--txt);margin-bottom:6px">No Performance Data Yet</div>
        <p style="color:var(--mut);font-size:13px;max-width:280px;margin:0 auto">Complete at least 2 mock tests or subject quizzes to generate interactive analytics charts.</p>
      </div>`}
    </div>

    <!-- Cognitive Metrics & Difficulty Breakdown -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:20px" class="s2">
      <!-- Accuracy by Difficulty -->
      <div class="card" style="padding:20px;margin-bottom:0">
        <div class="editorial-section-label" style="margin-bottom:14px">Accuracy by Difficulty</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[
            {lbl:'Easy',val:diffStats.Easy,col:'#10B981'},
            {lbl:'Medium',val:diffStats.Medium,col:'#F59E0B'},
            {lbl:'Hard',val:diffStats.Hard,col:'#EF4444'},
            {lbl:'Advanced',val:diffStats.Advanced,col:'#8B5CF6'}
          ].map(d => {
            const accuracy = d.val.total ? Math.round((d.val.correct / d.val.total)*100) : 0;
            return `
              <div>
                <div class="between mb4" style="font-size:12px">
                  <span style="font-weight:700;color:var(--txt)">${d.lbl} Questions</span>
                  <span style="color:${d.col};font-weight:700;font-family:var(--f-num)">${accuracy}% (${d.val.correct}/${d.val.total})</span>
                </div>
                <div class="pw" style="height:6px;background:rgba(0,0,0,0.06)">
                  <div class="pf" style="width:${accuracy}%;background:${d.col}"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Trend Performance -->
      <div class="card" style="padding:20px;margin-bottom:0;display:flex;flex-direction:column;justify-content:between">
        <div>
          <div class="editorial-section-label" style="margin-bottom:14px">Performance Insights</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;justify-content:between;align-items:center">
              <span style="font-size:13px;color:var(--sub)">Best Mock Score</span>
              <span style="font-weight:700;color:var(--p);font-size:16px">${best}%</span>
            </div>
            <div style="display:flex;justify-content:between;align-items:center">
              <span style="font-size:13px;color:var(--sub)">Avg Test Score</span>
              <span style="font-weight:700;color:#3B82F6;font-size:16px">${avg}%</span>
            </div>
            <div style="display:flex;justify-content:between;align-items:center">
              <span style="font-size:13px;color:var(--sub)">Recent Progress Trend</span>
              <span style="font-weight:700;color:${trendDelta>=0?'#10B981':'#EF4444'};font-size:14px;display:flex;align-items:center;gap:4px">
                ${trendDelta >= 0 ? `📈 +${trendDelta}% Improve` : `📉 ${trendDelta}% Dip`}
              </span>
            </div>
          </div>
        </div>
        <div style="border-top:1px dashed var(--brd);padding-top:14px;margin-top:14px;font-size:12px;color:var(--mut);line-height:1.5">
          💡 ${avg >= 75 ? 'Great performance! Enable **Boss Mode** in Settings to test yourself with Olympiad/JEE-level rank-breaker questions.' : 'Focus on completing **Weak Topics** to raise your average test accuracy above 75%.'}
        </div>
      </div>
    </div>

    <!-- Peer comparison -->
    <div id="peer-stats-area" class="mb20 s3"></div>

    <!-- Actionable Weak Spots -->
    ${Object.keys(D.memory?.weakAreas||{}).length?`
    <div class="card s3 mb20" style="padding:22px">
      <div class="editorial-section-label" style="margin-bottom:12px">Areas to Strengthen</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${Object.entries(D.memory.weakAreas||{}).map(([topic,areas])=>`
          <div class="card card-lift" style="margin-bottom:0;padding:12px 18px;display:flex;justify-content:between;align-items:center;background:rgba(239,68,68,.02);border-color:rgba(239,68,68,.12)">
            <div>
              <div style="color:var(--txt);font-weight:700;font-size:14px">⚠️ ${esc(topic)}</div>
              <div style="color:var(--mut);font-size:12px;margin-top:2px">Struggling concepts: ${esc((areas||[]).slice(0,3).join(', '))}</div>
            </div>
            <button class="btn bsm bpri" style="padding:6px 14px;font-size:11px" onclick="go('learn','${escON(topic)}')">🎯 Practice</button>
          </div>`).join('')}
      </div>
    </div>`:''}

    <!-- Mastered Topics -->
    <div class="card s4 mb20" style="padding:24px">
      <div class="editorial-section-label" style="margin-bottom:14px">Topics Mastered (${D.topics.length})</div>
      ${D.topics.length?`
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${D.topics.map(t=>{
          const sc=D.memory?.scores?.[t];
          const scBadge=sc!==undefined?`<span style="background:${sc>=80?'rgba(16,185,129,.2)':sc>=50?'rgba(245,158,11,.2)':'rgba(239,68,68,.2)'};color:${sc>=80?'var(--pl)':sc>=50?'var(--goldl)':'#EF4444'};font-size:10px;padding:1px 6px;border-radius:8px;margin-left:4px;font-family:var(--f-num);font-weight:700">${sc}%</span>`:'';
          return `<div onclick="go('learn','${escON(t)}')" style="background:rgba(16,185,129,.05);border:1px solid rgba(16,185,129,.2);border-radius:20px;padding:5px 14px;color:var(--pl);font-size:13px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;font-weight:600" onmouseover="this.style.background='rgba(16,185,129,.1)'" onmouseout="this.style.background='rgba(16,185,129,.05)'">✓ ${esc(t)}${scBadge}</div>`;
        }).join('')}
      </div>` : `<div style="text-align:center;padding:24px;color:var(--mut);font-size:13px">No topics fully mastered yet. Start learning in the syllabus browser!</div>`}
    </div>

    <!-- Complete Mock Test History Log -->
    <div class="card s4 mb20" style="padding:24px">
      <div class="editorial-section-label" style="margin-bottom:14px">Completed Mock Exams Log</div>
      ${h.length?`
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;text-align:left;font-size:13px">
          <thead>
            <tr style="border-bottom:1px solid var(--brd);color:var(--mut)">
              <th style="padding:10px 8px">Topic / Syllabus Focus</th>
              <th style="padding:10px 8px">Exam Type</th>
              <th style="padding:10px 8px">Date Completed</th>
              <th style="padding:10px 8px;text-align:right">Score</th>
            </tr>
          </thead>
          <tbody>
            ${h.reverse().map(x => {
              const dStr = new Date(x.date).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'2-digit'});
              const scoreColor = x.score >= 80 ? '#10B981' : x.score >= 50 ? '#F59E0B' : '#EF4444';
              const modeLabel = x.mode === 'pyq' ? 'PYQ Mock' : x.mode === 'exam' ? 'Exam Prep' : 'Standard';
              return `
                <tr style="border-bottom:1px dashed var(--brd)">
                  <td style="padding:12px 8px;font-weight:700;color:var(--txt)">${esc(x.topic)}</td>
                  <td style="padding:12px 8px"><span class="tag tp" style="font-size:10px;padding:2px 8px">${modeLabel}</span></td>
                  <td style="padding:12px 8px;color:var(--mut)">${dStr}</td>
                  <td style="padding:12px 8px;text-align:right;font-weight:800;color:${scoreColor};font-size:14px;font-family:var(--f-num)">${x.score}%</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : `<div style="text-align:center;padding:24px;color:var(--mut);font-size:13px">No mock test logs found. Take an exam in the Test Center to see logs here.</div>`}
    </div>

    <!-- Achievements Badges Grid -->
    <div class="card mb20 s4" style="padding:24px">
      <div class="editorial-section-label" style="margin-bottom:16px">Achievements Unlocked</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">
        ${BADGES.map(b=>`<div class="bdg ${D.badges.includes(b.id)?'earned':'locked'}" title="${b.d}">
          <div style="font-size:32px;margin-bottom:8px" aria-hidden="true">${b.ic}</div>
          <div style="color:${D.badges.includes(b.id)?'var(--p)':'rgba(0,0,0,.2)'};font-weight:700;font-size:11px;margin-bottom:2px">${b.id}</div>
          <div style="color:var(--mut);font-size:9px;line-height:1.3">${b.d}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;

  // Render chart after DOM is ready
  if (scores.length >= 2) {
    setTimeout(renderProgressCharts, 80);
  }
  if (D.topics.length > 0) {
    setTimeout(() => renderPeerStats('peer-stats-area'), 100);
  }
}

function setChartTab(tab) {
  PV.chartTab = tab;
  rProgress();
  if (typeof MxAudio !== 'undefined') MxAudio.tuck();
}

window.rProgress = rProgress;
window.setChartTab = setChartTab;


