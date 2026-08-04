/**
 * cbtSessionManager.js — Modular Session Manager for JEE Main & JEE Advanced (v1.2)
 * Handles single paper vs 2-Paper JEE Advanced sequence (Paper 1 -> Hidden Evaluation -> Paper 2 -> Combined Report).
 */

(function () {
  'use strict';

  class CBTSessionManager {
    constructor() {
      this.currentExamId = 'jee_main';
      this.paperSequence = [];
      this.activePaperIndex = 0;
      this.hiddenEvaluations = [];
      this.isComplete = false;
      this.violations = [];
      this.isMonitoring = false;
      this.securityPolicy = 'warning_only'; // 'warning_only' | 'pause_timer' | 'disqualify'
      this._boundVisibilityHandler = null;
      this._boundBlurHandler = null;
    }

    startSecurityMonitoring(onViolationCallback) {
      if (this.isMonitoring) return;
      this.isMonitoring = true;

      const recordViolation = (type, details) => {
        const item = { type, details, timestamp: Date.now() };
        this.violations.push(item);
        console.warn(`[CBT Security Violation] ${type}: ${details}`);
        if (typeof onViolationCallback === 'function') {
          onViolationCallback(item, this.violations.length);
        } else if (typeof window !== 'undefined' && window.toast) {
          window.toast(`⚠️ Security Warning: Tab switch or focus loss detected (${this.violations.length}x)`, 'err');
        }
      };

      this._boundVisibilityHandler = () => {
        if (document.visibilityState === 'hidden') {
          recordViolation('TAB_SWITCH', 'Switched tab or minimized browser window');
        }
      };

      this._boundBlurHandler = () => {
        recordViolation('WINDOW_BLUR', 'Focus lost from exam environment');
      };

      if (typeof window !== 'undefined') {
        document.addEventListener('visibilitychange', this._boundVisibilityHandler);
        window.addEventListener('blur', this._boundBlurHandler);
      }
    }

    stopSecurityMonitoring() {
      if (!this.isMonitoring) return;
      this.isMonitoring = false;
      if (typeof window !== 'undefined') {
        if (this._boundVisibilityHandler) {
          document.removeEventListener('visibilitychange', this._boundVisibilityHandler);
        }
        if (this._boundBlurHandler) {
          window.removeEventListener('blur', this._boundBlurHandler);
        }
      }
    }

    initSession(examId) {
      this.currentExamId = examId;
      this.activePaperIndex = 0;
      this.hiddenEvaluations = [];
      this.isComplete = false;

      if (examId === 'jee_adv' || examId === 'jee_advanced') {
        this.paperSequence = [
          { paperId: 'Paper 1', durationMinutes: 180, totalQuestions: 54 },
          { paperId: 'Paper 2', durationMinutes: 180, totalQuestions: 54 }
        ];
      } else {
        this.paperSequence = [
          { paperId: 'Full Mock', durationMinutes: 180, totalQuestions: 75 }
        ];
      }

      return this.getActivePaperInfo();
    }

    getActivePaperInfo() {
      return this.paperSequence[this.activePaperIndex] || null;
    }

    recordPaperSubmission(paperResult) {
      this.hiddenEvaluations.push({
        paperId: this.paperSequence[this.activePaperIndex].paperId,
        result: paperResult,
        timestamp: Date.now()
      });

      if (this.activePaperIndex < this.paperSequence.length - 1) {
        this.activePaperIndex++;
        return { hasNextPaper: true, nextPaper: this.getActivePaperInfo() };
      } else {
        this.isComplete = true;
        return { hasNextPaper: false, finalCombinedReport: this.generateCombinedReport() };
      }
    }

    generateCombinedReport() {
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      let totalCorrect = 0;
      let totalWrong = 0;
      let totalUnattempted = 0;
      const subjectBreakdown = {};

      for (const evalItem of this.hiddenEvaluations) {
        const res = evalItem.result;
        totalMarksObtained += res.score || 0;
        totalMaxMarks += res.maxScore || 0;
        totalCorrect += res.correctCount || 0;
        totalWrong += res.wrongCount || 0;
        totalUnattempted += res.unattemptedCount || 0;

        if (res.subjectScores) {
          for (const subj in res.subjectScores) {
            if (!subjectBreakdown[subj]) {
              subjectBreakdown[subj] = { score: 0, correct: 0, wrong: 0, unattempted: 0 };
            }
            subjectBreakdown[subj].score += res.subjectScores[subj].score || 0;
            subjectBreakdown[subj].correct += res.subjectScores[subj].correct || 0;
            subjectBreakdown[subj].wrong += res.subjectScores[subj].wrong || 0;
            subjectBreakdown[subj].unattempted += res.subjectScores[subj].unattempted || 0;
          }
        }
      }

      const accuracy = (totalCorrect + totalWrong > 0)
        ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
        : 0;

      return {
        examId: this.currentExamId,
        papersCount: this.hiddenEvaluations.length,
        totalMarksObtained,
        totalMaxMarks,
        totalCorrect,
        totalWrong,
        totalUnattempted,
        accuracy,
        subjectBreakdown,
        evaluations: this.hiddenEvaluations
      };
    }
  }

  const managerInstance = new CBTSessionManager();

  if (typeof window !== 'undefined') {
    window.CBTSessionManager = managerInstance;
  }
  if (typeof module !== 'undefined') {
    module.exports = CBTSessionManager;
  }
})();
