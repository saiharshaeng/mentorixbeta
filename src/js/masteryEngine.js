/**
 * masteryEngine.js — Mentorix Multidimensional Mastery & Error Intelligence System
 * Handles concept mastery profiling, error classification, confidence matrices,
 * and logs to the Mistake Diary (Error Intelligence System).
 */

'use strict';

(function(window) {

  let profile = {
    conceptMastery: {},       // topicTitle -> mastery pct (0-100)
    retention: 85,            // simulated base
    accuracy: 0,              // correct / total attempts
    consistency: 50,          // based on consecutive correct streaks
    confidenceRating: 70,     // confidence level based on ratings
    solvingSpeedSec: 0,       // average speed in seconds
    applicationScore: 60,
    reasoningScore: 60,
    growthScore: 10,
    learningMomentum: 50,
    totalAttempts: 0,
    correctAttempts: 0,
    solvingSpeedHistory: []
  };

  let mistakeDiary = []; // array of mistake records

  // Issue 21 fix: Returns a user-scoped key so mastery data is per-profile, not shared across accounts
  function masteryKey(base) {
    try {
      const s = typeof getSession === 'function' ? getSession() : null;
      return s?.id ? `mx3_${s.id}_${base}` : `mx3_${base}`;
    } catch(e) { return `mx3_${base}`; }
  }

  function init() {
    try {
      const storedProfile = localStorage.getItem(masteryKey('mastery_profile'));
      if (storedProfile) {
        profile = JSON.parse(storedProfile);
      }

      const storedDiary = localStorage.getItem(masteryKey('mistake_diary'));
      if (storedDiary) {
        mistakeDiary = JSON.parse(storedDiary);
      }
    } catch (e) {
      console.error('[MasteryEngine] Load error:', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(masteryKey('mastery_profile'), JSON.stringify(profile));
      localStorage.setItem(masteryKey('mistake_diary'), JSON.stringify(mistakeDiary));
    } catch (e) {
      console.error('[MasteryEngine] Save error:', e);
    }
  }

  // Internal helper — marks matching weakSpots in D.memory as solved when concept/topic is reattempted
  function _resolveWeakSpots(topic, concept = null) {
    try {
      if (window.D && window.D.memory && Array.isArray(window.D.memory.weakSpots)) {
        let changed = false;
        const topicNorm = String(topic || '').trim().toLowerCase();
        const conceptNorm = concept ? String(concept).trim().toLowerCase() : null;

        window.D.memory.weakSpots.forEach(ws => {
          if (!ws.solved && ws.topic && ws.topic.toLowerCase() === topicNorm) {
            if (!conceptNorm || (ws.concept && ws.concept.toLowerCase().includes(conceptNorm)) || !ws.concept) {
              ws.solved = true;
              ws.resolvedAt = Date.now();
              ws.specificConceptReattempted = true;
              changed = true;
            }
          }
        });
        if (changed && typeof window.saveAll === 'function') window.saveAll();
      }
    } catch (e) { /* non-critical */ }
  }

  const MasteryEngine = {
    init() {
      init();
    },

    getTopicDecayedMastery(topic) {
      if (!topic) return 0;
      const baseM = (profile.conceptMastery && profile.conceptMastery[topic]) || 0;
      if (baseM === 0) return 0;
      const lastAttempt = profile.lastAttemptDates && profile.lastAttemptDates[topic];
      if (!lastAttempt) return baseM;
      const daysSince = (Date.now() - new Date(lastAttempt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 14) return baseM;
      const weeksOverdue = (daysSince - 14) / 7;
      const decayFactor = Math.pow(0.92, weeksOverdue);
      return Math.round(Math.max(baseM * 0.35, baseM * decayFactor));
    },

    initTopicMastery(topic) {
      if (!topic) return { level: 'Improving', dimensions: { conceptUnderstanding: 3, problemSolving: 2, speed: 2, confidence: 3, retention: 2, examReadiness: 2 } };
      const m = this.getTopicDecayedMastery(topic);

      // --- Independent dimension calculation (Fix 8: each dimension uses real data, not aliased from one 'stars') ---

      // Concept understanding: directly from topic mastery %
      const conceptUnderstanding = Math.min(5, Math.max(1, Math.round(m / 20)));

      // Problem solving: from application + reasoning scores, scaled to 1-5
      const problemSolving = Math.min(5, Math.max(1,
        Math.round(((profile.applicationScore || 60) + (profile.reasoningScore || 60)) / 40)
      ));

      // Speed: from solvingSpeedSec — faster = higher (under 10s=5, 10-20s=4, 20-40s=3, 40-80s=2, >80s=1)
      const speedSec = profile.solvingSpeedSec || 0;
      const speed = speedSec === 0 ? 3
        : speedSec < 10 ? 5
        : speedSec < 20 ? 4
        : speedSec < 40 ? 3
        : speedSec < 80 ? 2 : 1;

      // Confidence: from confidenceRating (0-100 -> 1-5)
      const confidence = Math.min(5, Math.max(1, Math.round((profile.confidenceRating || 70) / 20)));

      // Retention: decay based on days since last attempt on this topic (Fix 9: dynamic, not hardcoded 85)
      let retention = 3; // default 'Improving'
      const lastAttemptDate = profile.lastAttemptDates && profile.lastAttemptDates[topic];
      if (lastAttemptDate) {
        const daysSince = (Date.now() - new Date(lastAttemptDate).getTime()) / (1000 * 60 * 60 * 24);
        retention = daysSince < 1 ? 5
          : daysSince < 3 ? 4
          : daysSince < 7 ? 3
          : daysSince < 14 ? 2 : 1;
      } else if (m >= 80) {
        retention = 4; // strong mastery but no date logged = assume recent
      }

      // Exam readiness: combined score of concept, problem solving, and confidence
      const examReadiness = Math.min(5, Math.max(1,
        Math.round((conceptUnderstanding + problemSolving + confidence) / 3)
      ));

      return {
        level: m >= 80 ? 'Mastered' : m >= 50 ? 'Improving' : 'Needs Practice',
        dimensions: { conceptUnderstanding, problemSolving, speed, confidence, retention, examReadiness }
      };
    },

    logAttempt({ topic, concept = null, questionText, correctAnswer, selectedAnswer, isCorrect, difficulty, timeTakenSeconds, confidence, errorType = 'Conceptual misunderstanding' }) {
      profile.totalAttempts++;
      if (isCorrect) {
        profile.correctAttempts++;
      }

      // Update accuracy
      profile.accuracy = Math.round((profile.correctAttempts / profile.totalAttempts) * 100);

      // Update speed history
      if (typeof timeTakenSeconds === 'number' && timeTakenSeconds > 0) {
        profile.solvingSpeedHistory.push(timeTakenSeconds);
        if (profile.solvingSpeedHistory.length > 50) profile.solvingSpeedHistory.shift();
        const totalSpeed = profile.solvingSpeedHistory.reduce((sum, val) => sum + val, 0);
        profile.solvingSpeedSec = Math.round(totalSpeed / profile.solvingSpeedHistory.length);
      }

      // Update Topic-specific mastery
      if (topic) {
        const currentM = profile.conceptMastery[topic] || 0;
        let delta = 0;
        if (isCorrect) {
          delta = difficulty === 'hard' ? 20 : difficulty === 'medium' ? 15 : 10;
        } else {
          delta = difficulty === 'hard' ? -5 : difficulty === 'medium' ? -10 : -15;
        }
        profile.conceptMastery[topic] = Math.max(0, Math.min(100, currentM + delta));

        // Fix 9: Track last attempt date per topic for retention calculation
        if (!profile.lastAttemptDates) profile.lastAttemptDates = {};
        profile.lastAttemptDates[topic] = new Date().toISOString();

        // Resolve weak spots in D.memory: by specific concept or mastery >= 80
        if (isCorrect) {
          if (concept) _resolveWeakSpots(topic, concept);
          if (profile.conceptMastery[topic] >= 80) _resolveWeakSpots(topic, null);
        }
      }

      // Update confidence metric
      let confVal = 50;
      if (confidence === 'Very Confident') confVal = 100;
      else if (confidence === 'Confident') confVal = 80;
      else if (confidence === 'Unsure') confVal = 40;
      else if (confidence === 'Guess') confVal = 20;

      profile.confidenceRating = Math.round((profile.confidenceRating * 0.9) + (confVal * 0.1));

      // Log to Mistake Diary if incorrect
      if (!isCorrect) {
        const metadata = window.CurriculumEngine ? window.CurriculumEngine.getTopicMetadata(topic) : null;
        
        // Error Classification Logic
        let derivedErrorType = errorType;
        if (!errorType || errorType === 'Conceptual misunderstanding') {
          if (confidence === 'Very Confident' || confidence === 'Confident') {
            derivedErrorType = 'Careless mistake'; // Confident but wrong usually implies careless slip or deep misconception
          } else if (confidence === 'Guess') {
            derivedErrorType = 'Guessing';
          } else if (timeTakenSeconds < 5) {
            derivedErrorType = 'Time pressure';
          }
        }

        const mistakeRecord = {
          id: 'mistake_' + Math.random().toString(36).substring(2, 11),
          question: questionText || 'Concept Check Question',
          correctAnswer: correctAnswer || '',
          studentAnswer: selectedAnswer || '',
          concept: topic || 'General Topic',
          subtopic: metadata?.subchapter || 'Core Basics',
          chapter: metadata?.chapter || 'Core Basics',
          date: new Date().toISOString(),
          difficulty: difficulty || 'medium',
          timeTaken: timeTakenSeconds || 0,
          confidence: confidence || 'Unsure',
          errorType: derivedErrorType,
          correctedLater: false,
          frequency: 1
        };

        // Check if identical question already exists in diary to increase frequency
        const existing = mistakeDiary.find(m => m.question === mistakeRecord.question);
        if (existing) {
          existing.frequency++;
          existing.date = mistakeRecord.date;
        } else {
          mistakeDiary.push(mistakeRecord);
        }
        if (mistakeDiary.length > 100) mistakeDiary.shift(); // Keep logs tight
      } else {
        // If correct, check if we resolve any previous mistakes in the diary
        mistakeDiary.forEach(m => {
          if (m.concept === topic && !m.correctedLater) {
            m.correctedLater = true;
          }
        });
      }

      // Update other scores
      if (isCorrect) {
        profile.growthScore = Math.min(100, profile.growthScore + 2);
        profile.learningMomentum = Math.min(100, profile.learningMomentum + 5);
        if (difficulty === 'hard') profile.reasoningScore = Math.min(100, profile.reasoningScore + 4);
        if (difficulty === 'medium') profile.applicationScore = Math.min(100, profile.applicationScore + 3);
      } else {
        profile.learningMomentum = Math.max(10, profile.learningMomentum - 3);
      }

      save();
    },

    getMasteryProfile() {
      return {
        conceptMastery: profile.conceptMastery,
        retention: profile.retention,
        accuracy: profile.accuracy || 0,
        consistency: profile.consistency,
        confidence: profile.confidenceRating,
        speed: profile.solvingSpeedSec || 12,
        application: profile.applicationScore,
        reasoning: profile.reasoningScore,
        growth: profile.growthScore,
        momentum: profile.learningMomentum
      };
    },

    getMistakeDiary() {
      return mistakeDiary;
    },

    getDangerousMisconceptions() {
      // Wrong + Confident / Very Confident
      return mistakeDiary.filter(m => (m.confidence === 'Very Confident' || m.confidence === 'Confident') && !m.correctedLater);
    },

    getMistakeBreakdown() {
      if (mistakeDiary.length === 0) return {};
      const counts = {};
      mistakeDiary.forEach(m => {
        counts[m.errorType] = (counts[m.errorType] || 0) + 1;
      });
      const breakdown = {};
      for (const type in counts) {
        breakdown[type] = Math.round((counts[type] / mistakeDiary.length) * 100);
      }
      return breakdown;
    },

    getMostCommonErrorType() {
      const breakdown = this.getMistakeBreakdown();
      const entries = Object.entries(breakdown);
      if (entries.length === 0) return { type: 'None', pct: 0 };
      entries.sort((a, b) => b[1] - a[1]);
      return { type: entries[0][0], pct: entries[0][1] };
    },

    getAIContext(activeTopicTitle) {
      if (!activeTopicTitle) return '';
      const topicLower = activeTopicTitle.trim().toLowerCase();
      const relevantMistakes = mistakeDiary.filter(m => String(m.concept).trim().toLowerCase() === topicLower);
      const misconceptions = relevantMistakes.map(m => `* Question: "${m.question}" | Error Type: ${m.errorType}`).join('\n');
      
      if (relevantMistakes.length === 0) return '';

      return `
STUDENT'S RECENT HISTORICAL MISTAKES ON ACTIVE TOPIC "${activeTopicTitle}":
${misconceptions}
TIO INSTRUCTION: The student has struggled with the questions above. Frame explanations to gently correct these misconceptions without explicitly saying they got them wrong.
`.trim();
    }
  };

  window.MasteryEngine = MasteryEngine;
  MasteryEngine.init();

})(typeof window !== 'undefined' ? window : global);
