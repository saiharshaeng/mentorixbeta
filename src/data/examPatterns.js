const EXAM_PATTERNS = {
  jee_main: {
    name: "JEE Main",
    durationMinutes: 180,
    totalQuestions: 75,
    subjects: ["Mathematics", "Physics", "Chemistry"],
    sections: [
      {
        name: "Section A",
        type: "mcq",
        questionsPerSubject: 20,
        marking: { correct: 4, wrong: -1 }
      },
      {
        name: "Section B",
        type: "numerical",
        questionsPerSubject: 5,
        marking: { correct: 4, wrong: 0 }
      }
    ]
  },
  neet: {
    name: "NEET",
    durationMinutes: 180,
    totalQuestions: 180,
    subjects: ["Physics", "Chemistry", "Biology"],
    sections: [
      {
        name: "Section A",
        type: "mcq",
        questionsPerSubject: {
          Physics: 45,
          Chemistry: 45,
          Biology: 90
        },
        marking: { correct: 4, wrong: -1 }
      }
    ]
  },
  jee_adv: {
    name: "JEE Advanced",
    durationMinutes: 180,
    totalQuestions: 54,
    subjects: ["Mathematics", "Physics", "Chemistry"],
    sections: [
      {
        name: "Section 1",
        type: "mcq",
        questionsPerSubject: 4,
        marking: { correct: 3, wrong: -1 }
      },
      {
        name: "Section 2",
        type: "msq",
        questionsPerSubject: 6,
        marking: { correct: 4, wrong: -2, partial: true }
      },
      {
        name: "Section 3",
        type: "numerical",
        questionsPerSubject: 4,
        marking: { correct: 4, wrong: 0 }
      },
      {
        name: "Section 4",
        type: "mcq",
        questionsPerSubject: 4,
        marking: { correct: 3, wrong: -1 }
      }
    ]
  },
  default: {
    name: "Mock Exam",
    durationMinutes: 60,
    totalQuestions: 30,
    subjects: ["General Studies"],
    sections: [
      {
        name: "Section A",
        type: "mcq",
        questionsPerSubject: 30,
        marking: { correct: 4, wrong: -1 }
      }
    ]
  }
};

if (typeof module !== 'undefined') {
  module.exports = EXAM_PATTERNS;
} else {
  window.EXAM_PATTERNS = EXAM_PATTERNS;
}
