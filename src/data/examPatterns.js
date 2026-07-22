const EXAM_PATTERNS = {

  JEE_MAIN: {
    name: "JEE Main",
    authority: "NTA",
    patternYear: "2025 onwards",
    totalTime: 180,
    totalMarks: 300,
    totalQuestions: 75,
    instructions: [
      "Duration: 3 hours",
      "75 questions across 3 subjects",
      "Section A: 20 MCQs per subject (attempt all)",
      "Section B: 5 Numerical per subject (attempt ALL — no choice from 2025)",
      "MCQ Correct: +4 | MCQ Wrong: -1 | MCQ Skip: 0",
      "Numerical Correct: +4 | Numerical Wrong: 0 | Numerical Skip: 0",
      "Total: 300 marks"
    ],
    sections: [
      {
        subject: "Physics",
        sectionA: {
          type: "MCQ",
          count: 20,
          attemptAll: true,
          marksCorrect: 4,
          marksWrong: -1,
          marksSkip: 0
        },
        sectionB: {
          type: "Numerical",
          count: 5,
          attemptAll: true,
          marksCorrect: 4,
          marksWrong: 0,
          marksSkip: 0
        }
      },
      {
        subject: "Chemistry",
        sectionA: { type:"MCQ", count:20, attemptAll:true, marksCorrect:4, marksWrong:-1, marksSkip:0 },
        sectionB: { type:"Numerical", count:5, attemptAll:true, marksCorrect:4, marksWrong:0, marksSkip:0 }
      },
      {
        subject: "Mathematics",
        sectionA: { type:"MCQ", count:20, attemptAll:true, marksCorrect:4, marksWrong:-1, marksSkip:0 },
        sectionB: { type:"Numerical", count:5, attemptAll:true, marksCorrect:4, marksWrong:0, marksSkip:0 }
      }
    ]
  },

  JEE_ADVANCED: {
    name: "JEE Advanced",
    authority: "IIT (rotating)",
    patternYear: "2025",
    totalTime: 180,
    totalMarks: 180,
    totalQuestions: 54,
    papers: 2,
    combinedMarks: 360,
    instructions: [
      "2 compulsory papers, 3 hours each",
      "180 marks per paper, 360 total",
      "51-54 questions per paper (varies by year)",
      "4 sections per subject with DIFFERENT marking per section",
      "Section 1: Single correct MCQ — +3 correct, -1 wrong",
      "Section 2: Multiple correct MCQ — partial marking, -2 wrong",
      "Section 3: Numerical answer — +4 correct, 0 wrong",
      "Section 4: Match list — +3 correct, -1 wrong",
      "Partial marking applies to multiple-correct questions",
      "Pattern changes slightly every year — this is 2025 pattern"
    ],
    questionsPerSubject: 17,
    sections: [
      {
        id: "section1",
        type: "MCQ_Single",
        questionsPerSubject: 4,
        marksCorrect: 3,
        marksWrong: -1,
        marksSkip: 0,
        maxMarksPerSubject: 12
      },
      {
        id: "section2",
        type: "MCQ_Multiple",
        questionsPerSubject: 3,
        partialMarking: true,
        marksAllCorrect: 4,
        marksThreeCorrect: 3,
        marksTwoCorrect: 2,
        marksOneCorrect: 1,
        marksWrong: -2,
        marksSkip: 0,
        maxMarksPerSubject: 12
      },
      {
        id: "section3",
        type: "Numerical",
        questionsPerSubject: 6,
        marksCorrect: 4,
        marksWrong: 0,
        marksSkip: 0,
        maxMarksPerSubject: 24
      },
      {
        id: "section4",
        type: "MatchList",
        questionsPerSubject: 4,
        marksCorrect: 3,
        marksWrong: -1,
        marksSkip: 0,
        maxMarksPerSubject: 12
      }
    ],
    note: "Pattern verified from IIT Kanpur JEE Advanced 2025 official brochure"
  },

  NEET: {
    name: "NEET UG",
    authority: "NTA",
    patternYear: "2025 onwards",
    totalTime: 180,
    totalMarks: 720,
    totalQuestions: 180,
    mode: "Offline (Pen and Paper)",
    instructions: [
      "Duration: 3 hours (changed from 200 min in 2024)",
      "180 compulsory questions — no optional questions from 2025",
      "Physics: 45 questions",
      "Chemistry: 45 questions",
      "Biology: 90 questions (45 Botany + 45 Zoology)",
      "Correct: +4 | Wrong: -1 | Skip: 0",
      "Total: 720 marks",
      "Section B optional questions DISCONTINUED from 2025"
    ],
    sections: [
      {
        subject: "Physics",
        count: 45,
        attemptAll: true,
        marksCorrect: 4,
        marksWrong: -1,
        marksSkip: 0
      },
      {
        subject: "Chemistry",
        count: 45,
        attemptAll: true,
        marksCorrect: 4,
        marksWrong: -1,
        marksSkip: 0
      },
      {
        subject: "Botany",
        count: 45,
        attemptAll: true,
        marksCorrect: 4,
        marksWrong: -1,
        marksSkip: 0
      },
      {
        subject: "Zoology",
        count: 45,
        attemptAll: true,
        marksCorrect: 4,
        marksWrong: -1,
        marksSkip: 0
      }
    ]
  },

  EAMCET_ENG: {
    name: "AP/TS EAMCET Engineering",
    authority: "JNTU",
    totalTime: 180,
    totalMarks: 160,
    totalQuestions: 160,
    instructions: [
      "Duration: 3 hours",
      "160 questions total",
      "No negative marking",
      "Correct: +1 | Wrong: 0"
    ],
    sections: [
      { subject:"Mathematics", count:80, marksCorrect:1, marksWrong:0 },
      { subject:"Physics", count:40, marksCorrect:1, marksWrong:0 },
      { subject:"Chemistry", count:40, marksCorrect:1, marksWrong:0 }
    ]
  },

  SAT: {
    name: "SAT",
    authority: "College Board",
    totalTime: 134,
    totalMarks: 1600,
    instructions: [
      "Total: 2 hours 14 minutes",
      "Reading & Writing: 64 minutes, 54 questions",
      "Math: 70 minutes, 44 questions",
      "No penalty for wrong answers",
      "Score range: 400-1600"
    ],
    sections: [
      { subject:"Reading & Writing", count:54, time:64, marksCorrect:1, marksWrong:0 },
      { subject:"Mathematics", count:44, time:70, marksCorrect:1, marksWrong:0 }
    ]
  },

  CAT: {
    name: "CAT",
    authority: "IIM",
    totalTime: 120,
    totalMarks: 198,
    instructions: [
      "Duration: 2 hours",
      "3 sections, 40 minutes each",
      "VARC: 24 questions",
      "DILR: 20 questions",
      "QA: 22 questions",
      "MCQ Correct: +3 | MCQ Wrong: -1",
      "Non-MCQ Correct: +3 | Non-MCQ Wrong: 0"
    ],
    sections: [
      { subject:"VARC", count:24, marksCorrect:3, marksWrong:-1 },
      { subject:"DILR", count:20, marksCorrect:3, marksWrong:-1 },
      { subject:"QA", count:22, marksCorrect:3, marksWrong:-1 }
    ]
  }
};

// Backward compatibility mappings
EXAM_PATTERNS.jee_main = EXAM_PATTERNS.JEE_MAIN;
EXAM_PATTERNS.jee_adv = EXAM_PATTERNS.JEE_ADVANCED;
EXAM_PATTERNS.jee_advanced = EXAM_PATTERNS.JEE_ADVANCED;
EXAM_PATTERNS.neet = EXAM_PATTERNS.NEET;
EXAM_PATTERNS.eamcet_eng = EXAM_PATTERNS.EAMCET_ENG;
EXAM_PATTERNS.sat = EXAM_PATTERNS.SAT;
EXAM_PATTERNS.cat = EXAM_PATTERNS.CAT;

if (typeof module !== 'undefined') {
  module.exports = EXAM_PATTERNS;
} else {
  window.EXAM_PATTERNS = EXAM_PATTERNS;
}
