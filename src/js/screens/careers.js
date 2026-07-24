/**
 * screens/careers.js — Mentorix Personalized Career Exploration Screen
 * Phase 2.1 Complete Redesign
 */

'use strict';

let CS = {
  step: 'discovery-prompt', // 'discovery-prompt' | 'discovery-flow' | 'list' | 'detail' | 'roadmap'
  discoveryStep: 1,
  intake: {
    favSubjects: [],
    dislikedSubjects: [],
    interests: '',
    workStyle: 'Hybrid / Team & Independent',
    goalPriority: 'high-paying'
  },
  selectedCareerId: null
};

function rCareers() {
  const main = document.getElementById('main');
  if (!main) return;

  main.innerHTML = `
    <div class="sw scr page-enter">
      <div class="between mb16">
        <div>
          <div class="h1">🚀 Career Discovery & Path Finder</div>
          <p class="sub">Personalized guidance based on your academic strengths, passions, and life goals.</p>
        </div>
        ${window.CareerEngine && window.CareerEngine.hasCompletedDiscovery() ? `
          <button class="btn bsec bsm" onclick="startNewDiscovery()">🔄 Re-take Discovery</button>
        ` : ''}
      </div>
      <div id="career-content"></div>
    </div>
  `;

  if (window.CareerEngine && window.CareerEngine.hasCompletedDiscovery()) {
    CS.step = 'list';
  } else {
    CS.step = 'discovery-prompt';
  }

  renderCareerContent();
}

function renderCareerContent() {
  const container = document.getElementById('career-content');
  if (!container) return;

  switch (CS.step) {
    case 'discovery-prompt':
      renderDiscoveryPrompt(container);
      break;
    case 'discovery-flow':
      renderDiscoveryFlow(container);
      break;
    case 'list':
      renderCareerList(container);
      break;
    case 'detail':
      renderCareerDetail(container);
      break;
    case 'roadmap':
      renderCareerRoadmap(container);
      break;
    default:
      renderDiscoveryPrompt(container);
  }
}

function renderDiscoveryPrompt(container) {
  container.innerHTML = `
    <div class="card scr" style="max-width:640px;margin:30px auto;text-align:center;padding:44px 32px;background:rgba(13,11,31,0.85);border:1px solid rgba(139,92,246,0.3)">
      <div style="font-size:56px;margin-bottom:16px">🎯</div>
      <h2 class="h2" style="color:#fff;margin-bottom:12px;font-size:24px">Mentorix Never Guesses — We Understand First</h2>
      <p class="sub" style="font-size:14px;line-height:1.65;margin-bottom:28px;max-width:500px;margin-left:auto;margin-right:auto">
        We'd like to understand your interests, academic strengths, and long-term lifestyle goals before recommending careers. Complete your 2-minute Career Discovery session with Tio.
      </p>
      <button class="btn bpri blg" onclick="startNewDiscovery()" style="padding:15px 32px;font-size:16px;border-radius:14px;box-shadow:0 8px 24px rgba(139,92,246,0.4)">
        🚀 Start 2-Min Career Discovery →
      </button>
    </div>
  `;
}

function startNewDiscovery() {
  CS.step = 'discovery-flow';
  CS.discoveryStep = 1;
  renderCareerContent();
}

function renderDiscoveryFlow(container) {
  const step = CS.discoveryStep;

  if (step === 1) {
    container.innerHTML = `
      <div class="card scr" style="max-width:600px;margin:20px auto;padding:32px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <div style="font-size:36px">🤖</div>
          <div>
            <div style="color:var(--pl);font-weight:700;font-size:14px">Tio — Career Discovery</div>
            <div style="color:var(--sub);font-size:12px">Step 1 of 3: Academic Preferences</div>
          </div>
        </div>

        <p style="color:#fff;font-size:15px;line-height:1.5;margin-bottom:20px">
          "Which subjects do you enjoy most in school right now?"
        </p>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:24px">
          ${['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'English', 'Social Studies'].map(s => {
            const isSel = CS.intake.favSubjects.includes(s);
            return `
              <button class="obtn${isSel ? ' on' : ''}" onclick="toggleFavSubject('${s}', this)">
                ${isSel ? '✅ ' : '+ '}${s}
              </button>
            `;
          }).join('')}
        </div>

        <div style="display:flex;justify-content:flex-end">
          <button class="btn bpri" ${CS.intake.favSubjects.length === 0 ? 'disabled' : ''} onclick="CS.discoveryStep=2;renderCareerContent()">
            Next Step →
          </button>
        </div>
      </div>
    `;
  } else if (step === 2) {
    container.innerHTML = `
      <div class="card scr" style="max-width:600px;margin:20px auto;padding:32px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <div style="font-size:36px">💡</div>
          <div>
            <div style="color:var(--pl);font-weight:700;font-size:14px">Tio — Career Discovery</div>
            <div style="color:var(--sub);font-size:12px">Step 2 of 3: Passions & Skills</div>
          </div>
        </div>

        <div class="inp-wrap" style="margin-bottom:20px">
          <label class="inp-label">WHAT ACTIVITIES OR HOBBIES EXCITE YOU MOST? *</label>
          <textarea class="inp" id="cd-interests" rows="3" placeholder="e.g., Coding apps, solving puzzles, digital design, helping friends with science..."
            oninput="CS.intake.interests=this.value;document.getElementById('cd-step2-btn').disabled=!this.value.trim()">${esc(CS.intake.interests)}</textarea>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button class="btn bgh" onclick="CS.discoveryStep=1;renderCareerContent()">← Back</button>
          <button class="btn bpri" id="cd-step2-btn" ${!CS.intake.interests.trim() ? 'disabled' : ''} onclick="CS.discoveryStep=3;renderCareerContent()">
            Next Step →
          </button>
        </div>
      </div>
    `;
  } else if (step === 3) {
    const goals = [
      { id: 'high-paying', label: '💰 High Earning Potential', desc: 'Maximize income and financial growth' },
      { id: 'impact', label: '🌍 Societal Impact', desc: 'Solve real-world problems and help people' },
      { id: 'creative', label: '🎨 Creative Expression', desc: 'Innovate, design, and express ideas' },
      { id: 'stability', label: '🛡️ Job Security & Balance', desc: 'Stable environment with work-life balance' }
    ];

    container.innerHTML = `
      <div class="card scr" style="max-width:600px;margin:20px auto;padding:32px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <div style="font-size:36px">🌟</div>
          <div>
            <div style="color:var(--pl);font-weight:700;font-size:14px">Tio — Career Discovery</div>
            <div style="color:var(--sub);font-size:12px">Step 3 of 3: Life Goals & Priorities</div>
          </div>
        </div>

        <p style="color:#fff;font-size:14px;margin-bottom:14px;font-weight:600">WHAT MATTERS MOST TO YOU IN A CAREER?</p>
        <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:24px">
          ${goals.map(g => `
            <button class="obtn${CS.intake.goalPriority === g.id ? ' on' : ''}" onclick="CS.intake.goalPriority='${g.id}';renderCareerContent()" style="text-align:left;padding:12px 16px">
              <div style="font-weight:700;font-size:14px">${g.label}</div>
              <div style="font-size:11px;color:var(--sub);margin-top:2px">${g.desc}</div>
            </button>
          `).join('')}
        </div>

        <div style="display:flex;justify-content:space-between">
          <button class="btn bgh" onclick="CS.discoveryStep=2;renderCareerContent()">← Back</button>
          <button class="btn bpri blg" onclick="finishDiscovery()" style="padding:12px 24px">
            ✨ Generate My Personalized Careers →
          </button>
        </div>
      </div>
    `;
  }
}

function toggleFavSubject(subj) {
  if (CS.intake.favSubjects.includes(subj)) {
    CS.intake.favSubjects = CS.intake.favSubjects.filter(x => x !== subj);
  } else {
    CS.intake.favSubjects.push(subj);
  }
  renderCareerContent();
}

function finishDiscovery() {
  if (window.CareerEngine) {
    window.CareerEngine.saveDiscoveryProfile(CS.intake);
  }
  CS.step = 'list';
  if (window.toast) window.toast('🎉 Career Discovery Complete! Generating personalized recommendations...', 'ok2');
  renderCareerContent();
}

function renderCareerList(container) {
  const recommendations = window.CareerEngine ? window.CareerEngine.getRecommendations() : [];

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:10px">
      ${recommendations.map(c => `
        <div class="card scr hover-glow" onclick="viewCareerDetail('${c.id}')" style="cursor:pointer;background:rgba(13,11,31,0.85);border:1px solid rgba(255,255,255,0.08);padding:20px;transition:transform 0.2s">
          <div class="between mb10">
            <span style="font-size:36px">${c.emoji}</span>
            <span class="tag tgold" style="font-weight:700;font-size:12px;padding:4px 10px">${c.matchPct}% Compatibility</span>
          </div>
          <div class="h3" style="color:#fff;margin-bottom:4px">${esc(c.title)}</div>
          <div style="font-size:12px;color:var(--pl);font-weight:600;margin-bottom:8px">${esc(c.category)}</div>
          <p style="color:var(--sub);font-size:12px;line-height:1.5;margin-bottom:12px">${esc(c.tagline)}</p>

          <!-- Transparent Recommendation Reason -->
          <div style="background:rgba(139,92,246,0.1);border-left:3px solid var(--p);border-radius:0 8px 8px 0;padding:8px 12px;margin-bottom:14px">
            <p style="color:var(--pl);font-size:11px;margin:0;font-style:italic">
              💡 ${esc(c.transparentWhy)}
            </p>
          </div>

          <div class="between" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;font-size:11px">
            <span style="color:var(--okl)">💰 ${esc(c.salary)}</span>
            <span style="color:var(--cl)">📈 ${esc(c.growth)} Growth</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function viewCareerDetail(id) {
  CS.selectedCareerId = id;
  CS.step = 'detail';
  renderCareerContent();
}

function renderCareerDetail(container) {
  const c = window.CareerEngine ? window.CareerEngine.CAREER_DATABASE.find(x => x.id === CS.selectedCareerId) : null;
  if (!c) {
    CS.step = 'list';
    renderCareerContent();
    return;
  }

  container.innerHTML = `
    <button class="btn bgh bsm mb16" onclick="CS.step='list';renderCareerContent()">← Back to Recommended Careers</button>
    <div class="card scr" style="padding:28px;background:rgba(13,11,31,0.9);border:1px solid rgba(139,92,246,0.3)">
      <div class="between mb16">
        <div style="display:flex;align-items:center;gap:14px">
          <span style="font-size:48px">${c.emoji}</span>
          <div>
            <div class="h2" style="color:#fff;margin-bottom:2px">${esc(c.title)}</div>
            <div style="font-size:13px;color:var(--pl);font-weight:700">${esc(c.category)}</div>
          </div>
        </div>
        <button class="btn bpri" onclick="CS.step='roadmap';renderCareerContent()">🗺️ View My Personalized Roadmap →</button>
      </div>

      <p style="color:var(--sub);font-size:14px;line-height:1.6;margin-bottom:20px">${esc(c.desc)}</p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
        <div class="sc cglow">
          <div class="sl">Salary Range</div>
          <div class="sn" style="font-size:16px;color:var(--okl);margin-top:4px">${esc(c.salary)}</div>
        </div>
        <div class="sc cglow">
          <div class="sl">Future Demand</div>
          <div class="sn" style="font-size:16px;color:var(--cl);margin-top:4px">${esc(c.growth)}</div>
        </div>
        <div class="sc cgold">
          <div class="sl">Entry Difficulty</div>
          <div class="sn" style="font-size:16px;color:var(--goldl);margin-top:4px">${esc(c.difficulty)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <div>
          <h3 class="h3 mb10" style="color:var(--pl)">🎓 Required Degrees & Programs</h3>
          <ul style="color:var(--sub);font-size:13px;padding-left:18px;line-height:1.7">
            ${c.requiredDegrees.map(d => `<li>${esc(d)}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h3 class="h3 mb10" style="color:var(--pl)">📝 Key Entrance Exams</h3>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${c.requiredExams.map(e => `<span class="tag tp" style="font-size:12px;padding:4px 10px">${esc(e)}</span>`).join('')}
          </div>
        </div>
      </div>

      <h3 class="h3 mb10" style="color:var(--pl)">⚡ Core Responsibilities</h3>
      <ul style="color:var(--sub);font-size:13px;padding-left:18px;line-height:1.7;margin-bottom:20px">
        ${c.duties.map(d => `<li>${esc(d)}</li>`).join('')}
      </ul>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:16px">
          <h4 class="h3 mb8" style="color:var(--okl);font-size:14px">✅ Advantages & Pros</h4>
          <ul style="color:var(--sub);font-size:12px;padding-left:16px;line-height:1.6">
            ${c.pros.map(p => `<li>${esc(p)}</li>`).join('')}
          </ul>
        </div>
        <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px">
          <h4 class="h3 mb8" style="color:var(--redl);font-size:14px">⚠️ Challenges & Realities</h4>
          <ul style="color:var(--sub);font-size:12px;padding-left:16px;line-height:1.6">
            ${c.challenges.map(ch => `<li>${esc(ch)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderCareerRoadmap(container) {
  const rm = window.CareerEngine ? window.CareerEngine.generateRoadmap(CS.selectedCareerId) : null;
  if (!rm) {
    CS.step = 'list';
    renderCareerContent();
    return;
  }

  container.innerHTML = `
    <button class="btn bgh bsm mb16" onclick="CS.step='detail';renderCareerContent()">← Back to Career Overview</button>
    <div class="card scr" style="padding:28px;background:rgba(13,11,31,0.9);border:1px solid rgba(139,92,246,0.3)">
      <div class="between mb16">
        <div>
          <div class="h2" style="color:#fff;margin-bottom:2px">${esc(rm.title)}</div>
          <div style="color:var(--sub);font-size:13px">Personalized roadmap based on your current grade & goals.</div>
        </div>
        <span class="tag tc" style="font-size:13px;padding:6px 12px">Estimated: ${esc(rm.totalDuration)}</span>
      </div>

      <!-- Do This First Alert -->
      <div style="background:rgba(217,119,6,0.12);border:1px solid rgba(217,119,6,0.3);border-radius:12px;padding:14px 18px;margin-bottom:24px">
        <div style="color:var(--goldl);font-weight:700;font-size:13px;margin-bottom:4px">⚡ Action for This Week</div>
        <div style="color:#FDE68A;font-size:13px;line-height:1.5">${esc(rm.firstAction)}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:24px">
        ${rm.steps.map((s, i) => `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px">
            <div class="between mb8">
              <div class="h3" style="color:var(--pl);font-size:15px">${i+1}. ${esc(s.phase)}</div>
              <span class="tag tp" style="font-size:11px">${esc(s.dur)}</span>
            </div>
            <p style="color:var(--sub);font-size:13px;line-height:1.5;margin-bottom:10px">${esc(s.desc)}</p>
            <div style="background:rgba(16,185,129,0.08);border-radius:8px;padding:8px 12px;font-size:12px;color:#86EFAC">
              🎯 <strong>Milestone:</strong> ${esc(s.milestone)}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.rCareers = rCareers;
window.startNewDiscovery = startNewDiscovery;
window.toggleFavSubject = toggleFavSubject;
window.finishDiscovery = finishDiscovery;
window.viewCareerDetail = viewCareerDetail;
