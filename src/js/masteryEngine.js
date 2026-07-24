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

  function init() {
    try {
      const storedProfile = localStorage.getItem('mx3_mastery_profile');
      if (storedProfile) {
        profile = JSON.parse(storedProfile);
      }
      
      const storedDiary = localStorage.getItem('mx3_mistake_diary');
      if (storedDiary) {
        mistakeDiary = JSON.parse(storedDiary);
      }
    } catch (e) {
      console.error('[MasteryEngine] Load error:', e);
    }
  }

  function save() {
    try {
      localStorage.setItem('mx3_mastery_profile', JSON.stringify(profile));
      localStorage.setItem('mx3_mistake_diary', JSON.stringify(mistakeDiary));
    } catch (e) {
      console.error('[MasteryEngine] Save error:', e);
    }
  }

  const MasteryEngine = {
    init() {
      init();
    },

    logAttempt({ topic, questionText, correctAnswer, selectedAnswer, isCorrect, difficulty, timeTakenSeconds, confidence, errorType = 'Conceptual misunderstanding' }) {
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
