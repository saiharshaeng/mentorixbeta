/**
 * qiacp.js — Question Ingestion & Academic Classification Pipeline Workbench UI Screen
 * Authoritative UI workbench for loading, parsing, classifying, validating, and importing exam papers into QRIS.
 */

'use strict';

(function(exports) {

  let _qiacpState = {
    activeTab: 'input',
    paperText: '',
    examId: 'jee_main',
    examYear: 2025,
    isOfficialPYQ: true,
    filterStatus: 'ALL',
    isProcessing: false,
    currentStage: null,
    pipelineResult: null,
    reviewQueue: [],
    importedCount: 0
  };

  const SAMPLE_JEE_PAPER = `SECTION A - PHYSICS

Q.1 A projectile is launched with velocity v_0 at an angle theta to the horizontal. Find its maximum height H.
(A) $H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}$
(B) $H = \\frac{v_0^2 \\cos^2(\\theta)}{g}$
(C) $H = \\frac{v_0 \\sin(\\theta)}{g}$
(D) $H = \\frac{v_0^2}{2g}$
Answer: A
Solution: By equations of kinematics under gravity, vertical component of velocity is v_y = v_0 \\sin(\\theta). At max height v_y = 0. Therefore H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}.
Refer Figure 1a.

Q.2 Calculate the electric field at a distance r from a point charge q using Coulomb's Law.
(A) $E = \\frac{1}{4\\pi \\epsilon_0} \\frac{q}{r^2}$
(B) $E = \\frac{q}{r}$
(C) $E = \\frac{1}{4\\pi \\epsilon_0} q r$
(D) $E = 0$
Answer: 1
Solution: According to Electrostatics Coulomb's Law, field is inverse square proportional to distance.

SECTION B - CHEMISTRY

Q.3 Find IUPAC name of CH3-CH2-OH.
(A) Ethanol
(B) Methanol
(C) Propanol
(D) Ethanoic Acid
Answer: A
Solution: Organic Chemistry Basics IUPAC Nomenclature of primary alcohols.`;

  function renderQIACP() {
    const el = document.getElementById('qiacpApp') || document.getElementById('mainContent');
    if (!el) return;

    const res = _qiacpState.pipelineResult;
    const pkg = res ? res.packagePayload : null;

    el.innerHTML = `
      <div class="qiacp-container" style="padding: 24px; max-width: 1400px; margin: 0 auto; font-family: var(--font-main, system-ui, sans-serif);">
        
        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, #1e1e38 0%, #0f0f23 100%); padding: 28px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); padding: 4px 12px; border-radius: 20px; color: #818cf8; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;">
                ⚡ PHASE 10 — QIACP ENGINE WORKBENCH
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; tracking: -0.5px;">Question Ingestion & Academic Classification Pipeline</h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 14px;">Transform raw PDFs & PYQs into normalized, KaTeX-compiled, academically mapped packages for QRIS Repository.</p>
            </div>
            
            <div style="display: flex; gap: 12px;">
              <button onclick="window.QIACPUI.loadSamplePaper()" style="background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.2); padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s;">
                📄 Load Sample NTA Paper
              </button>
              <button onclick="window.QIACPUI.runIngestion()" ${!_qiacpState.paperText.trim() || _qiacpState.isProcessing ? 'disabled' : ''} style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 14px rgba(99,102,241,0.4); opacity: ${_qiacpState.isProcessing ? 0.6 : 1}">
                ${_qiacpState.isProcessing ? '🔄 Ingesting...' : '🚀 Execute 16-Stage Pipeline'}
              </button>
            </div>
          </div>

          <!-- PIPELINE STAGES TRACKER -->
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">16-Stage Sequential Pipeline Status</div>
            <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px;">
              ${[
                'PDF Ingest', 'OCR Check', 'Text Clean', 'Page Seg', 'Q Detect', 'Opt Detect', 
                'Ans Extract', 'Sol Extract', 'Img Extract', 'Eq Clean', 'KaTeX Norm', 
                'Academic Classify', 'Metadata Gen', 'Validation', 'Duplicate Check', 'JSON Package'
              ].map((stageName, idx) => {
                const isDone = res && res.stage === 'PACKAGE_GENERATED';
                return `
                  <div style="flex: 1; min-width: 78px; background: ${isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${isDone ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.08)'}; padding: 6px 8px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 10px; color: ${isDone ? '#34d399' : '#64748b'}; font-weight: 700;">ST-${idx+1}</div>
                    <div style="font-size: 11px; color: ${isDone ? '#e2e8f0' : '#94a3b8'}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${stageName}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- MAIN LAYOUT GRID -->
        <div style="display: grid; grid-template-columns: 380px 1fr; gap: 24px;">
          
          <!-- LEFT: INPUT & METADATA CONFIG PANEL -->
          <div style="background: #1e1e38; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px;">
            <h3 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 16px; font-weight: 700;">Paper Configuration</h3>
            
            <div style="margin-bottom: 14px;">
              <label style="display: block; color: #94a3b8; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Target Examination</label>
              <select onchange="window.QIACPUI.setExam(this.value)" style="width: 100%; background: #0f0f23; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; font-size: 13px;">
                <option value="jee_main" ${_qiacpState.examId === 'jee_main' ? 'selected' : ''}>JEE Main (NTA Official)</option>
                <option value="jee_adv" ${_qiacpState.examId === 'jee_adv' ? 'selected' : ''}>JEE Advanced (IIT)</option>
                <option value="neet" ${_qiacpState.examId === 'neet' ? 'selected' : ''}>NEET UG (NMC)</option>
              </select>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; color: #94a3b8; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Examination Year</label>
              <input type="number" value="${_qiacpState.examYear}" onchange="window.QIACPUI.setYear(this.value)" style="width: 100%; background: #0f0f23; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: flex; align-items: center; gap: 8px; color: #cbd5e1; font-size: 13px; cursor: pointer;">
                <input type="checkbox" ${_qiacpState.isOfficialPYQ ? 'checked' : ''} onchange="window.QIACPUI.setOfficial(this.checked)" style="accent-color: #6366f1;">
                Tag as Official PYQ Paper (Officially Verified)
              </label>
            </div>

            <h3 style="margin: 20px 0 12px 0; color: #f8fafc; font-size: 15px; font-weight: 700; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">Raw Exam Text</h3>
            <textarea id="qiacpInputText" oninput="window.QIACPUI.setText(this.value)" placeholder="Paste raw PDF text or paper contents here..." style="width: 100%; height: 260px; background: #0f0f23; color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; font-family: var(--font-mono, monospace); font-size: 12px; resize: vertical; box-sizing: border-box;">${_qiacpState.paperText}</textarea>
          </div>

          <!-- RIGHT: PARSED QUESTIONS & PACKAGE INSPECTOR -->
          <div>
            ${!pkg ? `
              <div style="background: #1e1e38; border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px; padding: 60px; text-align: center; color: #64748b;">
                <div style="font-size: 40px; margin-bottom: 12px;">📑</div>
                <h3 style="margin: 0; color: #cbd5e1; font-size: 18px; font-weight: 700;">No Paper Package Ingested Yet</h3>
                <p style="margin: 8px 0 20px 0; font-size: 14px;">Paste or load an official exam paper on the left, then click "Execute 16-Stage Pipeline".</p>
                <button onclick="window.QIACPUI.loadSamplePaper()" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer;">Load Sample Paper & Test</button>
              </div>
            ` : `
              <!-- STATS METRIC BAR -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;">
                <div style="background: #1e1e38; border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 12px;">
                  <div style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Total Questions</div>
                  <div style="color: #f8fafc; font-size: 24px; font-weight: 800; margin-top: 4px;">${pkg.questions.length}</div>
                </div>
                <div style="background: #1e1e38; border: 1px solid rgba(16, 185, 129, 0.3); padding: 16px; border-radius: 12px;">
                  <div style="color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase;">Verified Content</div>
                  <div style="color: #34d399; font-size: 24px; font-weight: 800; margin-top: 4px;">${pkg.questions.filter(q => q.isVerifiedForPractice).length}</div>
                </div>
                <div style="background: #1e1e38; border: 1px solid rgba(245, 158, 11, 0.3); padding: 16px; border-radius: 12px;">
                  <div style="color: #fbbf24; font-size: 11px; font-weight: 700; text-transform: uppercase;">Pending Review</div>
                  <div style="color: #fbbf24; font-size: 24px; font-weight: 800; margin-top: 4px;">${pkg.packageHeader.totalFlaggedForReview}</div>
                </div>
                <div style="background: #1e1e38; border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px; border-radius: 12px;">
                  <div style="color: #f87171; font-size: 11px; font-weight: 700; text-transform: uppercase;">Duplicates Excluded</div>
                  <div style="color: #f87171; font-size: 24px; font-weight: 800; margin-top: 4px;">${pkg.packageHeader.totalDuplicates}</div>
                </div>
              </div>

              <!-- ACTIONS & IMPORT BUTTON -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: #1e1e38; padding: 14px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px;">
                <div style="color: #e2e8f0; font-size: 13px; font-weight: 600;">
                  Schema: <span style="font-family: monospace; color: #818cf8;">${pkg.packageHeader.schemaVersion}</span>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button onclick="window.QIACPUI.downloadJSON()" style="background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">💾 Download JSON</button>
                  <button onclick="window.QIACPUI.importToRepository()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">📥 Import to Repository (QRIS)</button>
                </div>
              </div>

              <!-- QUESTION CARDS LIST -->
              <div style="display: flex; flex-direction: column; gap: 16px;">
                ${pkg.questions.map((q, qIdx) => `
                  <div style="background: #1e1e38; border: 1px solid ${q.verificationStatus === 'Officially Verified' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)'}; border-radius: 12px; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="background: #0f0f23; color: #818cf8; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(129,140,248,0.3);">Q.${qIdx + 1}</span>
                        <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; border: 1px solid rgba(16,185,129,0.3);">
                          🛡️ ${q.verificationStatus}
                        </span>
                      </div>

                      <div style="font-family: monospace; color: #64748b; font-size: 11px;">
                        ID: ${q.globalQuestionId}
                      </div>
                    </div>

                    <!-- ACADEMIC CLASSIFICATION HIERARCHY -->
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px;">
                      <span style="color: #94a3b8; font-size: 11px; font-weight: 600;">Hierarchy:</span>
                      <span style="color: #60a5fa; font-size: 11px; font-weight: 700;">${q.academicClassification.exam}</span>
                      <span style="color: #64748b; font-size: 11px;">→</span>
                      <span style="color: #f472b6; font-size: 11px; font-weight: 700;">${q.academicClassification.subject}</span>
                      <span style="color: #64748b; font-size: 11px;">→</span>
                      <span style="color: #fbbf24; font-size: 11px; font-weight: 700;">${q.academicClassification.chapter}</span>
                      <span style="color: #64748b; font-size: 11px;">→</span>
                      <span style="color: #a78bfa; font-size: 11px; font-weight: 700;">${q.academicClassification.topic}</span>
                    </div>

                    <!-- STEM -->
                    <div class="katex-render-block" style="color: #f1f5f9; font-size: 14px; line-height: 1.6; margin-bottom: 14px;">
                      ${q.stem}
                    </div>

                    <!-- OPTIONS -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                      ${(q.options || []).map((opt, oIdx) => `
                        <div style="background: ${oIdx === q.correctAnswer ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${oIdx === q.correctAnswer ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.08)'}; padding: 8px 12px; border-radius: 6px; color: ${oIdx === q.correctAnswer ? '#34d399' : '#cbd5e1'}; font-size: 12px; font-weight: 600;">
                          ${String.fromCharCode(65 + oIdx)}. ${opt} ${oIdx === q.correctAnswer ? '✓' : ''}
                        </div>
                      `).join('')}
                    </div>

                    <!-- SOLUTION -->
                    <div style="background: rgba(255,255,255,0.02); border-left: 3px solid #6366f1; padding: 10px 14px; border-radius: 0 6px 6px 0; color: #94a3b8; font-size: 12px;">
                      <strong style="color: #818cf8;">Solution:</strong> ${q.solution}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

        </div>
      </div>
    `;

    // Render KaTeX expressions inside question cards
    if (typeof window.initKaTeX === 'function') {
      window.initKaTeX();
    }
  }

  // PUBLIC CONTROLLER API
  const QIACPUI = {
    render: renderQIACP,
    loadSamplePaper() {
      _qiacpState.paperText = SAMPLE_JEE_PAPER;
      renderQIACP();
    },
    setText(text) {
      _qiacpState.paperText = text;
    },
    setExam(examId) {
      _qiacpState.examId = examId;
    },
    setYear(yr) {
      _qiacpState.examYear = parseInt(yr, 10) || 2025;
    },
    setOfficial(isOff) {
      _qiacpState.isOfficialPYQ = !!isOff;
    },
    async runIngestion() {
      if (!_qiacpState.paperText.trim()) return;
      _qiacpState.isProcessing = true;
      renderQIACP();

      try {
        const result = await window.QIACP.IngestPaperPackage(_qiacpState.paperText, {
          examId: _qiacpState.examId,
          examYear: _qiacpState.examYear,
          isOfficialPYQ: _qiacpState.isOfficialPYQ
        });
        _qiacpState.pipelineResult = result;
      } catch (err) {
        alert('QIACP Ingestion Failed: ' + err.message);
      } finally {
        _qiacpState.isProcessing = false;
        renderQIACP();
      }
    },
    downloadJSON() {
      if (!_qiacpState.pipelineResult) return;
      const jsonStr = _qiacpState.pipelineResult.jsonString;
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qiacp_package_${_qiacpState.examId}_${_qiacpState.examYear}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importToRepository() {
      if (!_qiacpState.pipelineResult || !window.pyqService) return;
      const pkg = _qiacpState.pipelineResult.packagePayload;
      const res = window.pyqService.importPackage(pkg);
      alert(`✅ Successfully imported ${res.count} verified questions into QRIS Repository!`);
    }
  };

  exports.renderQIACP = renderQIACP;
  exports.QIACPUI = QIACPUI;

  if (typeof window !== 'undefined') {
    window.renderQIACP = renderQIACP;
    window.QIACPUI = QIACPUI;
  }

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACPUI = window.QIACPUI || {}));
