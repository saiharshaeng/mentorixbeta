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
        marking: { correct: 4, wrong: -1 }
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
        questionsPerSubject: 45, // Physics 45, Chemistry 45, Biology 90 (which is Botany 45 + Zoology 45)
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
        name: "Section A",
        type: "mcq",
        questionsPerSubject: 10,
        marking: { correct: 3, wrong: -1 }
      },
      {
        name: "Section B",
        type: "numerical",
        questionsPerSubject: 8,
        marking: { correct: 4, wrong: 0 }
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
