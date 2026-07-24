/**
 * sharedConfig.js — Central configuration specifications for Competitive Exams
 * Defines marking schemes, Supported exams, runtime constraints, and thematic properties.
 */

'use strict';

(function(window) {

  const SharedConfig = {
    // 1. Supported Exams configuration
    EXAMS: {
      jee_main: {
        id: 'jee_main',
        name: 'JEE Main',
        subjects: ['Mathematics', 'Physics', 'Chemistry'],
        durationMinutes: 180,
        marking: {
          positive: 4,
          negative: -1,
          partial: 0
        }
      },
      jee_adv: {
        id: 'jee_adv',
        name: 'JEE Advanced',
        subjects: ['Mathematics', 'Physics', 'Chemistry'],
        durationMinutes: 180,
        marking: {
          positive: 4,
          negative: -2,
          partial: 1
        }
      },
      neet: {
        id: 'neet',
        name: 'NEET',
        subjects: ['Physics', 'Chemistry', 'Biology'],
        durationMinutes: 200,
        marking: {
          positive: 4,
          negative: -1,
          partial: 0
        }
      }
    },

    // 2. Runtime default values
    RUNTIME_DEFAULTS: {
      timeLimitSeconds: 10800, // 3 hours
      strictExamMode: false,
      enableAutosave: true,
      autosaveIntervalMs: 15000,
      katexTolerance: true
    },

    // 3. Exam theme properties vs play theme
    THEMES: {
      practice: 'Mentorix Default (Friendly, Interactive)',
      mock_cbt: 'Competitive (Professional, Minimal, Calm, Light Grey)'
    }
  };

  // Export SharedConfig
  window.SharedConfig = SharedConfig;
  if (window.CEE) {
    window.CEE.SharedConfig = SharedConfig;
  }

})(typeof window !== 'undefined' ? window : global);
