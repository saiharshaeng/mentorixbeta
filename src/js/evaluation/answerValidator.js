/**
 * evaluation/answerValidator.js — Answer Validator for Mentorix ESE
 */
(function() {
  'use strict';

  const AnswerValidator = {
    validateResponse(response, officialQuestion) {
      if (!response || !response.isAnswered) {
        return { status: 'SKIPPED', isCorrect: false };
      }

      const studentAns = response.selectedAnswer;
      const officialAns = officialQuestion ? (officialQuestion.ans !== undefined ? officialQuestion.ans : officialQuestion.correctAnswer) : response.correctAnswer;

      if (officialAns === undefined || officialAns === null) {
        // Fallback: If official answer is missing from repository, treat skipped
        return { status: 'SKIPPED', isCorrect: false };
      }

      // Check Numerical vs Single Choice
      const isNumerical = typeof studentAns === 'string' && isNaN(Number(studentAns)) === false && typeof officialAns === 'number';

      if (isNumerical) {
        const studentNum = parseFloat(studentAns);
        const officialNum = parseFloat(officialAns);
        const isMatch = Math.abs(studentNum - officialNum) <= 0.01;
        return {
          status: isMatch ? 'CORRECT' : 'INCORRECT',
          isCorrect: isMatch,
          studentAnswer: studentNum,
          officialAnswer: officialNum
        };
      }

      // Single choice string / number equality
      const isMatch = String(studentAns).trim() === String(officialAns).trim();
      return {
        status: isMatch ? 'CORRECT' : 'INCORRECT',
        isCorrect: isMatch,
        studentAnswer: studentAns,
        officialAnswer: officialAns
      };
    }
  };

  window.AnswerValidator = AnswerValidator;
})(typeof window !== 'undefined' ? window : global);
