/**
 * sessionContextManager.js — Session Context & Desk Memory Manager
 * Mobile Phase L5 (Study Workspace & Context Preservation)
 *
 * Quietly tracks session memory during an active study session:
 * - Current lesson position & paragraph
 * - Recent concepts covered (last 3-5)
 * - Encountered formulas (session-scoped)
 * - Recent mistakes made during session
 * - Recently expanded diagrams
 * - Questions marked for later
 *
 * Exposes getSessionContextForTio() for contextual AI assistance.
 */

'use strict';

(function(exports) {

  class SessionContextManager {
    constructor() {
      this.resetContext();
    }

    resetContext() {
      this.context = {
        sessionId: null,
        currentLesson: null,
        chapter: null,
        unit: null,
        recentConcepts: [],
        encounteredFormulas: [],
        recentMistakes: [],
        expandedDiagrams: [],
        markedQuestions: [],
        scrollPosition: 0,
        startTime: null
      };
    }

    initSession(lessonTitle = '', chapter = '', unit = '') {
      this.resetContext();
      this.context.sessionId = `workspace-sess-${Date.now()}`;
      this.context.currentLesson = lessonTitle;
      this.context.chapter = chapter;
      this.context.unit = unit;
      this.context.startTime = Date.now();
      console.log(`[SessionContextManager] Session initialized for: ${lessonTitle}`);
    }

    addConcept(conceptName = '') {
      if (!conceptName) return;
      if (!this.context.recentConcepts.includes(conceptName)) {
        this.context.recentConcepts.push(conceptName);
        if (this.context.recentConcepts.length > 5) {
          this.context.recentConcepts.shift(); // Keep last 5
        }
      }
    }

    addFormula(formulaText = '', label = 'Formula') {
      if (!formulaText) return;
      const exists = this.context.encounteredFormulas.some(f => f.formula === formulaText);
      if (!exists) {
        this.context.encounteredFormulas.push({
          formula: formulaText,
          label: label || 'Session Formula',
          timestamp: Date.now()
        });
      }
    }

    addMistake(conceptName = '', qId = '') {
      if (!conceptName) return;
      const exists = this.context.recentMistakes.some(m => m.qId === qId);
      if (!exists) {
        this.context.recentMistakes.push({
          concept: conceptName,
          qId,
          timestamp: Date.now()
        });
      }
    }

    addExpandedDiagram(src = '', caption = '') {
      if (!src) return;
      const exists = this.context.expandedDiagrams.some(d => d.src === src);
      if (!exists) {
        this.context.expandedDiagrams.push({
          src,
          caption: caption || 'Concept Diagram',
          timestamp: Date.now()
        });
      }
    }

    toggleMarkQuestion(qData = {}) {
      if (!qData || !qData.id) return;
      const idx = this.context.markedQuestions.findIndex(q => q.id === qData.id);
      if (idx >= 0) {
        this.context.markedQuestions.splice(idx, 1);
      } else {
        this.context.markedQuestions.push({
          id: qData.id,
          question: qData.question || 'Marked Question',
          timestamp: Date.now()
        });
      }
    }

    getSessionContextForTio() {
      return {
        lesson: this.context.currentLesson,
        chapter: this.context.chapter,
        recentConcepts: [...this.context.recentConcepts],
        formulas: this.context.encounteredFormulas.map(f => `${f.label}: ${f.formula}`),
        recentMistakes: this.context.recentMistakes.map(m => m.concept),
        markedQuestionsCount: this.context.markedQuestions.length
      };
    }
  }

  const instance = new SessionContextManager();
  if (typeof window !== 'undefined') window.SessionContextManager = instance;
  exports.SessionContextManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
