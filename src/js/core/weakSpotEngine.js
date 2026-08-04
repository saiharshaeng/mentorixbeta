/**
 * weakSpotEngine.js — Mentorix V2 Phase 7: Intelligent Weak Spot Engine
 * 
 * Architecture Principles:
 *   - Every incorrect attempt updates topic mastery scores.
 *   - Weak spots automatically link to Knowledge Graph DAG prerequisites.
 * 
 * Key Difference:
 *   When a student fails 'Torque', naive systems recommend 'Retry Torque'.
 *   Mentorix V2 queries Knowledge Graph DAG (Torque -> Force -> Vectors) and recommends:
 *   "Review Vectors & Force first before retrying Torque".
 * 
 * State Tracked per Topic:
 *   - attempts (total attempts)
 *   - correct (correct attempts)
 *   - incorrect (incorrect attempts)
 *   - confidence ('sure' | 'maybe' | 'guessing')
 *   - mastery_score (0 - 100%)
 */

'use strict';

(function(window) {

  class WeakSpotEngine {
    constructor() {
      this.weakSpots = new Map(); // topicId -> { topicId, attempts, correct, incorrect, mastery_score, last_attempt }
    }

    /**
     * Record an attempt on a question for a topic
     * @param {string} topicId
     * @param {boolean} isCorrect
     * @param {string} confidence - 'sure' | 'maybe' | 'guessing'
     */
    recordAttempt(topicId, isCorrect, confidence = 'sure') {
      let spot = this.weakSpots.get(topicId) || {
        topic_id: topicId,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        confidence,
        mastery_score: 50,
        last_attempt: new Date().toISOString()
      };

      spot.attempts += 1;
      spot.confidence = confidence;
      spot.last_attempt = new Date().toISOString();

      if (isCorrect) {
        spot.correct += 1;
        // Increase mastery (+15% for sure, +10% for maybe, +5% for guessing)
        const boost = confidence === 'sure' ? 15 : (confidence === 'maybe' ? 10 : 5);
        spot.mastery_score = Math.min(100, spot.mastery_score + boost);
      } else {
        spot.incorrect += 1;
        // Decrease mastery (-20% for sure/overconfident error, -15% for maybe, -10% for guessing)
        const penalty = confidence === 'sure' ? 20 : (confidence === 'maybe' ? 15 : 10);
        spot.mastery_score = Math.max(0, spot.mastery_score - penalty);
      }

      this.weakSpots.set(topicId, spot);

      // Persist to user state object D if available
      if (typeof window.D !== 'undefined') {
        window.D.weakSpots = Array.from(this.weakSpots.values());
      }

      return spot;
    }

    /**
     * Get Intelligent Remediation Recommendation linked to Knowledge Graph DAG
     * @param {string} topicId
     */
    getRemediationRecommendation(topicId) {
      const spot = this.weakSpots.get(topicId);
      const isWeak = spot && spot.mastery_score < 60;

      let prerequisiteChain = [];
      if (window.KnowledgeGraph) {
        try {
          prerequisiteChain = window.KnowledgeGraph.getPrerequisites(topicId);
        } catch (e) {
          console.warn('[WeakSpotEngine] DAG lookup error:', e);
        }
      }

      if (isWeak && prerequisiteChain.length > 0) {
        // Find lowest foundational prerequisite to recommend
        const recommendedPrereq = prerequisiteChain[0]; // foundational root or direct parent
        return {
          type: 'prerequisite_remediation',
          failed_topic_id: topicId,
          mastery_score: spot ? spot.mastery_score : 0,
          recommended_topic: recommendedPrereq,
          prerequisite_chain: prerequisiteChain,
          message: `Noticeable gap in ${topicId} (${spot ? spot.mastery_score : 0}% mastery). We recommend reviewing prerequisite '${recommendedPrereq.name}' first before retrying!`
        };
      }

      return {
        type: 'direct_practice',
        failed_topic_id: topicId,
        mastery_score: spot ? spot.mastery_score : 100,
        recommended_topic: { id: topicId, name: topicId },
        prerequisite_chain: [],
        message: `Good progress on ${topicId}. Practice more questions to lock in 100% mastery!`
      };
    }

    /**
     * Get all weak spots (mastery < 60%) ordered by lowest mastery
     */
    getAllWeakSpots() {
      return Array.from(this.weakSpots.values())
        .filter(spot => spot.mastery_score < 60)
        .sort((a, b) => a.mastery_score - b.mastery_score);
    }
  }

  // Export Singleton
  window.WeakSpotEngine = new WeakSpotEngine();

})(typeof window !== 'undefined' ? window : global);
