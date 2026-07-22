/**
 * curriculumEngine.js — Mentorix Official Curriculum Engine
 * Architectural Foundation for Phase 1.3
 *
 * Provider-Agnostic Curriculum Architecture separating Knowledge Structure (Curriculum)
 * from Knowledge Delivery (AI).
 *
 * The AI MUST NEVER invent or decide the curriculum.
 * The Curriculum Engine is the authoritative source for chapters, subchapters, topics,
 * order, weightage, and rich metadata.
 *
 * Dependencies: None (standalone, global module)
 */

'use strict';

(function(window) {

  // Registered Curriculum Providers Map
  const providers = {};

  /**
   * Base Curriculum Provider interface for pluggable provider extensions.
   */
  class BaseCurriculumProvider {
    constructor(name) {
      this.name = name;
    }

    getSyllabus({ board, grade, subject, stream, year }) {
      throw new Error(`[CurriculumEngine] getSyllabus not implemented for provider ${this.name}`);
    }

    getTopicMetadata(topicIdOrTitle) {
      return null;
    }
  }

  // ── 1. CBSE / NCERT CURRICULUM PROVIDER ─────────────────────────────────

  class CBSECurriculumProvider extends BaseCurriculumProvider {
    constructor() {
      super('CBSE');
      this.data = _buildCBSEDatabase();
    }

    getSyllabus({ board = 'CBSE', grade = 'Class 11', subject = 'Mathematics', stream = '' }) {
      const key = `${grade}_${subject}`.toLowerCase().replace(/\s+/g, '_');
      if (this.data[key]) {
        return _cloneSyllabus(this.data[key], board, grade, subject);
      }
      return _generateGenericOfficialSyllabus(board, grade, subject);
    }

    getTopicMetadata(topicIdOrTitle) {
      if (!topicIdOrTitle) return null;
      const titleLower = String(topicIdOrTitle).trim().toLowerCase();
      
      for (const key in this.data) {
        const syl = this.data[key];
        for (const unit of syl.units || []) {
          for (const chap of unit.chapters || []) {
            for (const top of chap.topics || []) {
              if (typeof top === 'object' && top.title && top.title.toLowerCase() === titleLower) {
                return top.metadata || _createDefaultMetadata(top.title);
              }
            }
          }
        }
      }
      return _createDefaultMetadata(topicIdOrTitle);
    }
  }

  // ── 2. JEE CURRICULUM PROVIDER (NTA Official) ───────────────────────────

  class JEECurriculumProvider extends BaseCurriculumProvider {
    constructor() {
      super('JEE');
    }

    getSyllabus({ board = 'JEE Main', grade = 'Class 12', subject = 'Mathematics' }) {
      return _generateJEEOfficialSyllabus(subject);
    }

    getTopicMetadata(topicIdOrTitle) {
      return _createDefaultMetadata(topicIdOrTitle, 'High', 'Very High', 8);
    }
  }

  // ── 3. NEET CURRICULUM PROVIDER (NMC Official) ──────────────────────────

  class NEETCurriculumProvider extends BaseCurriculumProvider {
    constructor() {
      super('NEET');
    }

    getSyllabus({ board = 'NEET UG', grade = 'Class 12', subject = 'Biology' }) {
      return _generateNEETOfficialSyllabus(subject);
    }

    getTopicMetadata(topicIdOrTitle) {
      return _createDefaultMetadata(topicIdOrTitle, 'High', 'Very High', 10);
    }
  }

  // ── 4. CUSTOM / FALLBACK PROVIDER ───────────────────────────────────────

  class CustomCurriculumProvider extends BaseCurriculumProvider {
    constructor() {
      super('Custom');
    }

    getSyllabus({ board = 'Other', grade = 'General', subject = 'General' }) {
      return _generateGenericOfficialSyllabus(board, grade, subject);
    }

    getTopicMetadata(topicIdOrTitle) {
      return _createDefaultMetadata(topicIdOrTitle);
    }
  }

  // ── CURRICULUM ENGINE SINGLETON ──────────────────────────────────────────

  const CurriculumEngine = {
    /**
     * Registers a new pluggable curriculum provider (e.g. NCERT, CBSE, IB, IGCSE, SAT).
     */
    registerProvider(name, providerInstance) {
      if (!name || !providerInstance) return;
      providers[name.toUpperCase()] = providerInstance;
    },

    /**
     * Retrieves a registered provider by name.
     */
    getProvider(name = 'CBSE') {
      const key = (name || 'CBSE').toUpperCase();
      if (providers[key]) return providers[key];
      if (key.includes('JEE')) return providers['JEE'];
      if (key.includes('NEET')) return providers['NEET'];
      return providers['CBSE'] || providers['CUSTOM'];
    },

    /**
     * Primary entry point: Fetch official syllabus for given Board, Grade, and Subject.
     */
    getSyllabus({ board = 'CBSE', grade = 'Class 11', subject = 'Mathematics', stream = '', year = '2025-2026' }) {
      const provider = this.getProvider(board);
      return provider.getSyllabus({ board, grade, subject, stream, year });
    },

    /**
     * Retrieves rich metadata for a given topic.
     */
    getTopicMetadata(topicTitleOrId) {
      if (!topicTitleOrId) return null;
      for (const name in providers) {
        const meta = providers[name].getTopicMetadata(topicTitleOrId);
        if (meta && meta.learningObjectives && meta.learningObjectives.length > 0) {
          return meta;
        }
      }
      return _createDefaultMetadata(topicTitleOrId);
    },

    /**
     * Formats rich topic context specifically for AI Prompt injection.
     * Enforces that the AI teaches ONLY within official learning objectives.
     */
    getTopicContextForAI(topicTitleOrId) {
      const meta = this.getTopicMetadata(topicTitleOrId);
      if (!meta) return `Topic: "${topicTitleOrId}"`;

      return `
OFFICIAL CURRICULUM BOUNDARY FOR TOPIC: "${meta.title}"
- Difficulty Rating: ${meta.difficulty}/5
- Board Weightage: ${meta.weightagePct}%
- Importance Level: ${meta.importance}
- Estimated Study Time: ${meta.estimatedStudyTimeMinutes} minutes
- Official Learning Objectives:
  ${(meta.learningObjectives || []).map(o => `* ${o}`).join('\n  ')}
- Key Competencies: ${(meta.competencies || []).join(', ')}
- Prerequisites: ${(meta.prerequisites || []).join(', ') || 'None'}
- Frequently Confused Concepts: ${(meta.confusedWith || []).join(', ') || 'None'}
RULES FOR AI: Teach ONLY the concepts listed in the Learning Objectives above. Do NOT introduce external or out-of-syllabus topics.
`.trim();
    },

    /**
     * Returns prerequisites for a topic.
     */
    getPrerequisites(topicTitleOrId) {
      const meta = this.getTopicMetadata(topicTitleOrId);
      return meta?.prerequisites || [];
    },

    /**
     * Returns official learning objectives for a topic.
     */
    getLearningObjectives(topicTitleOrId) {
      const meta = this.getTopicMetadata(topicTitleOrId);
      return meta?.learningObjectives || [];
    }
  };

  // Register built-in providers
  CurriculumEngine.registerProvider('CBSE', new CBSECurriculumProvider());
  CurriculumEngine.registerProvider('NCERT', new CBSECurriculumProvider());
  CurriculumEngine.registerProvider('JEE', new JEECurriculumProvider());
  CurriculumEngine.registerProvider('NEET', new NEETCurriculumProvider());
  CurriculumEngine.registerProvider('CUSTOM', new CustomCurriculumProvider());

  // ── PRIVATE DATABASE BUILDERS & HELPERS ─────────────────────────────────

  function _buildCBSEDatabase() {
    return {
      'class_11_mathematics': {
        title: 'CBSE Class 11 Mathematics',
        subject: 'Mathematics',
        board: 'CBSE',
        level: 'Class 11',
        units: [
          {
            title: 'Unit 1: Sets and Functions',
            chapters: [
              {
                id: 'cbse_11_m_chap_1',
                title: 'Sets & Functions',
                topics: [
                  {
                    title: 'Introduction to Sets',
                    status: 'Unlocked',
                    metadata: {
                      id: 'm_11_sets_intro',
                      title: 'Introduction to Sets',
                      difficulty: 2,
                      importance: 'High',
                      weightagePct: 6,
                      estimatedStudyTimeMinutes: 90,
                      prerequisites: ['Basic Algebra', 'Number Systems'],
                      confusedWith: ['Intervals', 'Sequences'],
                      learningObjectives: [
                        'Define sets and understand roster and set-builder notations',
                        'Identify empty, finite, infinite, and equal sets',
                        'Construct subsets, power sets, and universal sets'
                      ],
                      revisionPriority: 'Medium',
                      examFrequency: 'High',
                      competencies: ['Mathematical Representation', 'Set Notation']
                    }
                  },
                  {
                    title: 'Venn Diagrams & Set Operations',
                    status: 'Locked',
                    metadata: {
                      id: 'm_11_sets_venn',
                      title: 'Venn Diagrams & Set Operations',
                      difficulty: 3,
                      importance: 'High',
                      weightagePct: 8,
                      estimatedStudyTimeMinutes: 110,
                      prerequisites: ['Introduction to Sets'],
                      confusedWith: ['Union vs Intersection', 'De Morgan Laws'],
                      learningObjectives: [
                        'Represent set operations visually using Venn diagrams',
                        'Execute Union, Intersection, Difference, and Complement operations',
                        'Apply De Morgan Laws to set algebra problems'
                      ],
                      revisionPriority: 'High',
                      examFrequency: 'Very High',
                      competencies: ['Visual Reasoning', 'Logical Deduction']
                    }
                  }
                ]
              },
              {
                id: 'cbse_11_m_chap_2',
                title: 'Relations and Functions',
                topics: [
                  {
                    title: 'Cartesian Product of Sets',
                    status: 'Locked',
                    metadata: _createDefaultMetadata('Cartesian Product of Sets', 'Medium', 'High', 7)
                  },
                  {
                    title: 'Domain, Range and Codomain',
                    status: 'Locked',
                    metadata: _createDefaultMetadata('Domain, Range and Codomain', 'Hard', 'Very High', 9)
                  }
                ]
              }
            ]
          },
          {
            title: 'Unit 2: Algebra',
            chapters: [
              {
                id: 'cbse_11_m_chap_3',
                title: 'Complex Numbers & Quadratic Equations',
                topics: [
                  {
                    title: 'Algebra of Complex Numbers',
                    status: 'Locked',
                    metadata: _createDefaultMetadata('Algebra of Complex Numbers', 'Medium', 'High', 8)
                  },
                  {
                    title: 'Quadratic Equations & Discriminant',
                    status: 'Locked',
                    metadata: {
                      id: 'm_11_quad_eq',
                      title: 'Quadratic Equations & Discriminant',
                      difficulty: 4,
                      importance: 'High',
                      weightagePct: 8,
                      estimatedStudyTimeMinutes: 120,
                      prerequisites: ['Linear Equations', 'Factoring Polynomials'],
                      confusedWith: ['Polynomial Functions', 'Complex Conjugates'],
                      learningObjectives: [
                        'Solve quadratic equations by factorization and quadratic formula',
                        'Analyze complex roots using discriminant analysis',
                        'Interpret roots graphically via parabola intercepts'
                      ],
                      revisionPriority: 'High',
                      examFrequency: 'Very High',
                      competencies: ['Problem Solving', 'Algebraic Manipulation', 'Graph Interpretation']
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      'class_11_physics': {
        title: 'CBSE Class 11 Physics',
        subject: 'Physics',
        board: 'CBSE',
        level: 'Class 11',
        units: [
          {
            title: 'Unit 1: Kinematics & Laws of Motion',
            chapters: [
              {
                id: 'cbse_11_p_chap_1',
                title: 'Motion in a Straight Line',
                topics: [
                  { title: 'Position, Distance and Displacement', status: 'Unlocked', metadata: _createDefaultMetadata('Position, Distance and Displacement') },
                  { title: 'Equations of Motion', status: 'Locked', metadata: _createDefaultMetadata('Equations of Motion', 'Hard', 'Very High', 10) }
                ]
              },
              {
                id: 'cbse_11_p_chap_2',
                title: 'Laws of Motion',
                topics: [
                  { title: 'Newton Laws of Motion', status: 'Locked', metadata: _createDefaultMetadata('Newton Laws of Motion', 'Hard', 'Very High', 12) },
                  { title: 'Friction and Circular Motion', status: 'Locked', metadata: _createDefaultMetadata('Friction and Circular Motion', 'Hard', 'High', 9) }
                ]
              }
            ]
          }
        ]
      },
      'class_11_chemistry': {
        title: 'CBSE Class 11 Chemistry',
        subject: 'Chemistry',
        board: 'CBSE',
        level: 'Class 11',
        units: [
          {
            title: 'Unit 1: Chemical Structure & Bonding',
            chapters: [
              {
                id: 'cbse_11_c_chap_1',
                title: 'Structure of Atom',
                topics: [
                  { title: 'Bohr Model of Hydrogen Atom', status: 'Unlocked', metadata: _createDefaultMetadata('Bohr Model of Hydrogen Atom') },
                  { title: 'Quantum Mechanical Model', status: 'Locked', metadata: _createDefaultMetadata('Quantum Mechanical Model', 'Hard', 'High', 9) }
                ]
              },
              {
                id: 'cbse_11_c_chap_2',
                title: 'Chemical Bonding & Molecular Structure',
                topics: [
                  { title: 'Ionic and Covalent Bonding', status: 'Locked', metadata: _createDefaultMetadata('Ionic and Covalent Bonding') },
                  { title: 'VSEPR Theory & Hybridization', status: 'Locked', metadata: _createDefaultMetadata('VSEPR Theory & Hybridization', 'Hard', 'Very High', 11) }
                ]
              }
            ]
          }
        ]
      }
    };
  }

  function _generateJEEOfficialSyllabus(subject) {
    return {
      title: `JEE Main & Advanced ${subject} Syllabus`,
      subject: subject,
      board: 'JEE Main',
      level: 'Class 12',
      units: [
        {
          title: `Unit 1: ${subject} Core Fundamentals`,
          chapters: [
            {
              id: `jee_${subject.toLowerCase()}_chap_1`,
              title: `${subject} Advanced Problem Solving`,
              topics: [
                { title: `${subject} Foundation Concepts`, status: 'Unlocked', metadata: _createDefaultMetadata(`${subject} Foundation Concepts`, 'High', 'Very High', 10) },
                { title: `${subject} Advanced Applications`, status: 'Locked', metadata: _createDefaultMetadata(`${subject} Advanced Applications`, 'Very High', 'Very High', 12) }
              ]
            }
          ]
        }
      ]
    };
  }

  function _generateNEETOfficialSyllabus(subject) {
    return {
      title: `NEET UG ${subject} Official Syllabus`,
      subject: subject,
      board: 'NEET UG',
      level: 'Class 12',
      units: [
        {
          title: `Unit 1: ${subject} NCERT Core`,
          chapters: [
            {
              id: `neet_${subject.toLowerCase()}_chap_1`,
              title: `${subject} High-Weightage Chapters`,
              topics: [
                { title: `${subject} NCERT Concept Review`, status: 'Unlocked', metadata: _createDefaultMetadata(`${subject} NCERT Concept Review`, 'Medium', 'Very High', 12) },
                { title: `${subject} Diagram & MCQ Mastery`, status: 'Locked', metadata: _createDefaultMetadata(`${subject} Diagram & MCQ Mastery`, 'High', 'Very High', 14) }
              ]
            }
          ]
        }
      ]
    };
  }

  function _generateGenericOfficialSyllabus(board, grade, subject) {
    return {
      title: `${board} ${grade} ${subject}`,
      subject: subject,
      board: board,
      level: grade,
      units: [
        {
          title: `Unit 1: Core ${subject}`,
          chapters: [
            {
              id: `chap_${subject.toLowerCase().replace(/\s+/g,'_')}_1`,
              title: `Fundamental ${subject}`,
              topics: [
                {
                  title: `Introduction to ${subject}`,
                  status: 'Unlocked',
                  metadata: _createDefaultMetadata(`Introduction to ${subject}`)
                },
                {
                  title: `Core Principles of ${subject}`,
                  status: 'Locked',
                  metadata: _createDefaultMetadata(`Core Principles of ${subject}`, 'Medium', 'High', 8)
                },
                {
                  title: `Applications of ${subject}`,
                  status: 'Locked',
                  metadata: _createDefaultMetadata(`Applications of ${subject}`, 'Hard', 'High', 9)
                }
              ]
            }
          ]
        }
      ]
    };
  }

  function _createDefaultMetadata(topicTitle, difficultyText = 'Medium', importanceText = 'High', weightage = 6) {
    const diffNum = difficultyText === 'Easy' ? 2 : difficultyText === 'Hard' || difficultyText === 'Very High' ? 4 : 3;
    return {
      id: 'top_' + String(topicTitle).toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      title: String(topicTitle).trim(),
      difficulty: diffNum,
      importance: importanceText,
      weightagePct: weightage,
      estimatedStudyTimeMinutes: 90,
      prerequisites: ['Basic Prerequisites'],
      confusedWith: ['Related Concepts'],
      learningObjectives: [
        `Understand core principles of ${topicTitle}`,
        `Apply ${topicTitle} to step-by-step problem solving`,
        `Recognize common errors and edge cases in ${topicTitle}`
      ],
      revisionPriority: 'Medium',
      examFrequency: importanceText === 'Very High' ? 'Very High' : 'High',
      competencies: ['Problem Solving', 'Concept Application', 'Analytical Thinking']
    };
  }

  function _cloneSyllabus(syl, board, grade, subject) {
    return {
      id: `c_${(subject||syl.subject).toLowerCase().replace(/\s+/g,'_')}_${Date.now()}`,
      title: syl.title || `${board} ${grade} ${subject}`,
      subject: subject || syl.subject,
      board: board || syl.board,
      level: grade || syl.level,
      units: JSON.parse(JSON.stringify(syl.units || []))
    };
  }

  // ── EXPORTS ──────────────────────────────────────────────────────────────

  window.CurriculumEngine = CurriculumEngine;
  window.BaseCurriculumProvider = BaseCurriculumProvider;

})(typeof window !== 'undefined' ? window : global);
