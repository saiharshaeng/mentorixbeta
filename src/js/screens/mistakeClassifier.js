'use strict';

(function() {
    /**
     * MistakeClassifier module to classify wrong answers into meaningful error types.
     */
    const MistakeClassifier = {
        /**
         * Classify a mistake based on time, confidence, hint level, etc.
         * @param {Object} question The question object
         * @param {*} studentAnswer The student's answer
         * @param {number} timeMs Time taken in milliseconds
         * @param {string} confidence Student's confidence level ('very_confident', 'somewhat_confident', 'guessing')
         * @param {number} hintLevel Number of hints used
         * @returns {string} The classification type
         */
        classify: function(question, studentAnswer, timeMs, confidence, hintLevel) {
            try {
                if (confidence === 'guessing') return 'blind_guess';
                if (confidence === 'very_confident') return 'overconfident';
                if (timeMs < 15000) return 'careless';
                if (timeMs < 30000 && confidence !== 'guessing') return 'reading_error';
                if (hintLevel >= 3) return 'formula_error';
                if (timeMs > 240000) return 'time_pressure';
                if (question && question.conceptTested) return 'concept_error';
                return 'calculation_error';
            } catch (e) {
                console.error('Error classifying mistake', e);
                return 'calculation_error';
            }
        },

        /**
         * Get human-readable label and emoji for a mistake type.
         * @param {string} type The mistake type
         * @returns {string} The formatted label
         */
        getLabel: function(type) {
            const labels = {
                'concept_error': '🧠 Concept Gap',
                'formula_error': '📐 Formula Error',
                'calculation_error': '🔢 Calculation Error',
                'reading_error': '👁️ Reading Error',
                'careless': '⚡ Careless Mistake',
                'time_pressure': '⏱️ Time Pressure',
                'blind_guess': '🎲 Blind Guess',
                'overconfident': '🎯 Overconfident'
            };
            return labels[type] || '🔢 Calculation Error';
        },

        /**
         * Get an actionable intervention for a mistake type.
         * @param {string} type The mistake type
         * @returns {string} The intervention string
         */
        getIntervention: function(type) {
            const interventions = {
                'concept_error': 'Revisit this topic in the Learning module',
                'formula_error': 'Review formula sheets for this chapter',
                'calculation_error': 'Practice numerical questions with full working',
                'reading_error': 'Read questions twice before answering',
                'careless': 'Slow down — you have enough time',
                'time_pressure': 'Practice under timed conditions more',
                'blind_guess': 'Build confidence in this chapter through practice',
                'overconfident': 'Double-check answers before submitting'
            };
            return interventions[type] || 'Practice more to improve accuracy';
        },

        /**
         * Classify all wrong answers in a session.
         * @param {Array} questionResults Array of result objects { question, studentAnswer, timeMs, confidence, hintLevel, isCorrect }
         * @returns {Object} Classifications and breakdown
         */
        classifySession: function(questionResults) {
            try {
                const classifications = [];
                const breakdown = {
                    concept_error: 0, formula_error: 0, calculation_error: 0,
                    reading_error: 0, careless: 0, time_pressure: 0,
                    blind_guess: 0, overconfident: 0
                };

                for (const result of questionResults) {
                    if (!result.isCorrect) {
                        const type = this.classify(
                            result.question,
                            result.studentAnswer,
                            result.timeMs,
                            result.confidence,
                            result.hintLevel
                        );
                        classifications.push({
                            ...result,
                            mistakeType: type
                        });
                        if (breakdown[type] !== undefined) {
                            breakdown[type]++;
                        } else {
                            breakdown[type] = 1;
                        }
                    }
                }

                return { classifications, breakdown };
            } catch (e) {
                console.error('Error classifying session', e);
                return { classifications: [], breakdown: {} };
            }
        }
    };

    window.MistakeClassifier = MistakeClassifier;
})();
