/**
 * curriculumMappingEngine.js — Mentorix Academic Intelligence Layer (AIL)
 * The single source of truth for competitive syllabus, registries, relationships, and lifecycles.
 */

'use strict';

(function(window) {

  // Central InMemory Store for Registries
  const _examRegistry = {};
  const _curriculumRegistry = { nodes: {}, subjects: {}, chapters: {}, topics: {} };
  const _questionRegistry = {};
  const _conceptGraph = { prerequisites: {}, dependencies: {} };
  const _questionLifecycle = {}; // questionId -> state ('Imported' | 'Parsed' | 'Verified' | 'Mapped' | 'Reviewed' | 'Production Ready')
  
  // Cache of student stats telemetry for DifficultyEngine
  let _studentStatsCache = {};

  function normalizeId(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').replace(/[^a-z0-9]+/g, '_');
  }

  // Initialize registries from window.EXAM_SPECS & window.pyqService
  function init() {
    // 1. Load Exams from specs
    const specs = window.EXAM_SPECS || {};
    for (const examId in specs) {
      const spec = specs[examId];
      _examRegistry[examId] = {
        id: spec.id,
        name: spec.name,
        fullName: spec.fullName,
        body: spec.body,
        durationMinutes: spec.durationMinutes,
        totalQuestions: spec.totalQuestions,
        maxScore: spec.maxScore,
        markingScheme: spec.markingScheme,
        subjects: spec.subjects,
        sections: spec.sections,
        syllabusVersion: '2026-NTA-NMC'
      };

      // 2. Parse syllabus tree into Curriculum Registry
      if (spec.syllabus) {
        for (const subjectName in spec.syllabus) {
          const subjectId = `sub_${examId}_${normalizeId(subjectName)}`;
          _curriculumRegistry.subjects[subjectId] = { id: subjectId, name: subjectName, examId };
          _curriculumRegistry.nodes[subjectId] = { id: subjectId, type: 'Subject', name: subjectName, examId: examId, children: [] };

          const units = spec.syllabus[subjectName];
          units.forEach((unitObj, unitIndex) => {
            const unitId = `unit_${examId}_${normalizeId(subjectName)}_${unitIndex}`;
            _curriculumRegistry.nodes[unitId] = { id: unitId, type: 'Unit', name: unitObj.unit, parent: subjectId, children: [] };
            _curriculumRegistry.nodes[subjectId].children.push(unitId);

            unitObj.chapters.forEach(chapObj => {
              const chapId = `ch_${normalizeId(subjectName)}_${normalizeId(chapObj.name)}`;
              _curriculumRegistry.chapters[chapId] = { id: chapId, name: chapObj.name, subject: subjectName, weight: chapObj.weight || 3 };
              _curriculumRegistry.nodes[chapId] = { id: chapId, type: 'Chapter', name: chapObj.name, parent: unitId, children: [] };
              _curriculumRegistry.nodes[unitId].children.push(chapId);

              (chapObj.topics || []).forEach(topicName => {
                const topicId = `t_${normalizeId(subjectName)}_${normalizeId(topicName)}`;
                _curriculumRegistry.topics[topicId] = { id: topicId, name: topicName, chapterId: chapId };
                _curriculumRegistry.nodes[topicId] = { id: topicId, type: 'Topic', name: topicName, parent: chapId };
                _curriculumRegistry.nodes[chapId].children.push(topicId);
              });
            });
          });
        }
      }
    }

    // 3. Define Hardcoded Concept Prerequisite Graph
    defineConceptDependencies();

    // 4. Preload Questions from pyqService
    loadQuestionsFromService();

    // 5. Load telemetry stats cache from localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const storedProgress = localStorage.getItem('mx3_cee_progress');
        if (storedProgress) {
          const parsed = JSON.parse(storedProgress);
          _studentStatsCache = parsed.attempts || {};
        }
      }
    } catch (e) {
      console.warn('[AIL] Telemetry load notice:', e);
    }
  }

  function defineConceptDependencies() {
    const dependencies = [
      // Calculus Chain
      { id: 'ch_mathematics_limits_and_continuity', prereqs: ['ch_mathematics_complex_numbers', 'ch_mathematics_quadratic_equations'] },
      { id: 'ch_mathematics_limits_continuity_differentiability', prereqs: ['ch_mathematics_complex_numbers', 'ch_mathematics_quadratic_equations'] },
      { id: 'ch_mathematics_limits_and_continuity', prereqs: ['ch_mathematics_limits_continuity_differentiability'] },
      { id: 'ch_mathematics_application_of_derivatives_max_min', prereqs: ['ch_mathematics_limits_continuity_differentiability'] },

      { id: 'ch_mathematics_differentiation', prereqs: ['ch_mathematics_limits_and_continuity'] },
      { id: 'ch_mathematics_integrals', prereqs: ['ch_mathematics_differentiation'] },
      { id: 'ch_mathematics_differential_equations', prereqs: ['ch_mathematics_integrals', 'ch_mathematics_differentiation'] },
      
      // Physics Mechanics Chain
      { id: 'ch_physics_laws_of_motion', prereqs: ['ch_physics_kinematics'] },
      { id: 'ch_physics_rotational_motion', prereqs: ['ch_physics_kinematics', 'ch_physics_laws_of_motion'] },
      
      // Physics Electrodynamics Chain
      { id: 'ch_physics_current_electricity', prereqs: ['ch_physics_electrostatics'] },
      
      // Biology Chain
      { id: 'ch_biology_molecular_basis_of_inheritance', prereqs: ['ch_biology_principles_of_inheritance_and_variation'] }
    ];

    dependencies.forEach(d => {
      _conceptGraph.prerequisites[d.id] = d.prereqs;
      d.prereqs.forEach(pre => {
        if (!_conceptGraph.dependencies[pre]) {
          _conceptGraph.dependencies[pre] = [];
        }
        _conceptGraph.dependencies[pre].push(d.id);
      });
    });
  }

  function loadQuestionsFromService() {
    const exams = ['jee_main', 'jee_adv', 'neet', 'bitSat'];
    exams.forEach(examId => {
      if (window.pyqService && typeof window.pyqService.getQuestions === 'function') {
        const res = window.pyqService.getQuestions({ examId, count: 100 });
        if (Array.isArray(res)) {
          res.forEach(q => registerQuestion(q));
        } else if (res && res.questions) {
          res.questions.forEach(q => registerQuestion(q));
        }
      }
    });
  }

  function registerQuestion(q) {
    if (!q || !q.id) return;
    
    // Classify / Map question to correct node path
    const mapping = QuestionClassificationEngine.classify(q);
    
    _questionRegistry[q.id] = {
      id: q.id,
      exam: q.exam || 'jee_main',
      year: q.year || 2025,
      session: q.shift || q.session || 'January Shift 1',
      subject: mapping.subject,
      unit: mapping.unit,
      chapter: mapping.chapter,
      topic: mapping.topic,
      concepts: q.concepts || [mapping.topic || 'General Concept'],
      difficulty: q.difficulty || 'medium',
      type: q.type || 'mcq',
      marks: q.marking ? q.marking.correct : 4,
      negativeMarking: q.marking ? q.marking.wrong : -1,
      officialAnswer: q.ans,
      explanation: q.expl || '',
      estimatedTime: q.estimatedTime || 120,
      relatedQuestions: []
    };

    // Initialize Question Validation Status (QA Lifecycle)
    validateQuestionQA(q.id);
  }

  const QuestionRenderingValidationPipeline = {
    validate(q) {
      const report = {
        katexValid: true,
        imagesValid: true,
        tablesValid: true,
        optionsValid: true,
        explanationValid: true,
        noBrokenHtml: true,
        mobileLayoutValid: true,
        accessibilityValid: true,
        errors: []
      };

      // 1. KaTeX check
      const textToCheck = (q.q || '') + ' ' + (q.explanation || '');
      const dollarsCount = (textToCheck.match(/\$/g) || []).length;
      if (dollarsCount % 2 !== 0) {
        report.katexValid = false;
        report.errors.push('Unclosed math delimiter ($ or $$)');
      }

      // Check common LaTeX formula syntax errors
      if (textToCheck.includes('\\frac') && !textToCheck.includes('{')) {
        report.katexValid = false;
        report.errors.push('Malformed \\frac syntax missing argument braces');
      }

      // 2. Images check
      if (Array.isArray(q.images)) {
        q.images.forEach(url => {
          if (!url || typeof url !== 'string' || (!url.startsWith('http') && !url.startsWith('img/') && !url.startsWith('data:'))) {
            report.imagesValid = false;
            report.errors.push(`Invalid image URL format: ${url}`);
          }
        });
      }

      // 3. Tables check
      const tableOpen = (textToCheck.match(/<table/g) || []).length;
      const tableClose = (textToCheck.match(/<\/table>/g) || []).length;
      if (tableOpen !== tableClose) {
        report.tablesValid = false;
        report.errors.push('Mismatched HTML table tags');
      }

      // 4. Options check
      if (q.type === 'mcq') {
        if (!Array.isArray(q.opts) || q.opts.length < 2) {
          report.optionsValid = false;
          report.errors.push('MCQ must have at least 2 options');
        } else {
          q.opts.forEach((opt, idx) => {
            if (!opt || opt.trim().length === 0) {
              report.optionsValid = false;
              report.errors.push(`Option ${idx} is empty`);
            }
          });
        }
      }

      // 5. Explanation check
      if (!q.explanation || q.explanation.trim().length < 5) {
        report.explanationValid = false;
        report.errors.push('Explanation must not be empty');
      }

      // 6. Broken HTML check
      const htmlTags = ['div', 'span', 'b', 'i', 'strong', 'em', 'p'];
      htmlTags.forEach(tag => {
        const open = (textToCheck.match(new RegExp(`<${tag}[>\\s]`, 'g')) || []).length;
        const close = (textToCheck.match(new RegExp(`</${tag}>`, 'g')) || []).length;
        if (open !== close) {
          report.noBrokenHtml = false;
          report.errors.push(`Mismatched HTML tag: <${tag}>`);
        }
      });

      // 7. Mobile Layout check
      if (textToCheck.match(/[^\s]{80,}/)) {
        report.mobileLayoutValid = false;
        report.errors.push('Unbreakable text block exceeded 80 characters');
      }

      // 8. Accessibility check
      if (Array.isArray(q.images) && q.images.length > 0 && (!q.imageAlts || q.imageAlts.length < q.images.length)) {
        report.accessibilityValid = false;
        report.errors.push('Images missing alt texts');
      }

      return report;
    }
  };

  function validateQuestionQA(qId) {
    const q = _questionRegistry[qId];
    if (!q) return;

    // Enforce structured validation lifecycle
    let state = 'Imported';
    
    const hasOptions = q.type !== 'numerical' ? (q.officialAnswer !== undefined) : true;

    if (q.id && q.exam && q.subject) {
      state = 'Parsed';
    }
    if (state === 'Parsed' && hasOptions) {
      state = 'Verified';
    }
    if (state === 'Verified' && q.chapter && q.topic) {
      state = 'Mapped';
    }
    if (state === 'Mapped') {
      state = 'Reviewed';
    }
    if (state === 'Reviewed') {
      const pipelineReport = QuestionRenderingValidationPipeline.validate(q);
      if (pipelineReport.katexValid && 
          pipelineReport.imagesValid && 
          pipelineReport.tablesValid && 
          pipelineReport.optionsValid && 
          pipelineReport.explanationValid && 
          pipelineReport.noBrokenHtml && 
          pipelineReport.mobileLayoutValid && 
          pipelineReport.accessibilityValid) {
        state = 'Production Ready';
      }
    }

    _questionLifecycle[qId] = state;
  }

  // ── 5. QUESTION CLASSIFICATION ENGINE ─────────────────────────────────────
  const QuestionClassificationEngine = {
    classify(q) {
      const subject = q.section || q.subject || 'Mathematics';
      let chapter = q.chap || q.chapter || '';
      let topic = q.topic || '';

      // Normalize string checks to find matching curriculum nodes
      const normChapter = chapter.toLowerCase().trim();
      let matchedChapId = null;
      let matchedTopicId = null;
      let matchedUnit = 'General';

      for (const chapId in _curriculumRegistry.chapters) {
        const chapObj = _curriculumRegistry.chapters[chapId];
        if (chapObj.name.toLowerCase().trim() === normChapter || normChapter.includes(chapObj.name.toLowerCase().trim())) {
          matchedChapId = chapObj.name;
          const node = _curriculumRegistry.nodes[chapId];
          if (node && node.parent) {
            const unitNode = _curriculumRegistry.nodes[node.parent];
            if (unitNode) matchedUnit = unitNode.name;
          }
          
          // Match Topic inside this chapter
          const topics = node.children || [];
          for (const topId of topics) {
            const topObj = _curriculumRegistry.nodes[topId];
            if (topObj && (q.q.toLowerCase().includes(topObj.name.toLowerCase()) || (topic && topic.toLowerCase() === topObj.name.toLowerCase()))) {
              matchedTopicId = topObj.name;
              break;
            }
          }
          break;
        }
      }

      return {
        subject: subject,
        unit: matchedUnit,
        chapter: matchedChapId || chapter || 'General Chapter',
        topic: matchedTopicId || topic || 'General Concept'
      };
    }
  };

  // ── 6. TREND ENGINE ───────────────────────────────────────────────────────
  const TrendEngine = {
    getTrendStats(examId, nodeType, nodeName) {
      const qList = Object.values(_questionRegistry).filter(q => q.exam === examId);
      let count = 0;
      const yearFrequency = {};

      qList.forEach(q => {
        let match = false;
        if (nodeType === 'Chapter' && q.chapter === nodeName) match = true;
        if (nodeType === 'Topic' && q.topic === nodeName) match = true;
        if (nodeType === 'Subject' && q.subject === nodeName) match = true;

        if (match) {
          count++;
          yearFrequency[q.year] = (yearFrequency[q.year] || 0) + 1;
        }
      });

      // Deterministic yield trend analysis
      const years = Object.keys(yearFrequency).map(Number).sort((a, b) => b - a);
      let trend = 'Stable';
      if (years.length >= 2) {
        const recent = yearFrequency[years[0]] || 0;
        const prev = yearFrequency[years[1]] || 0;
        trend = recent > prev ? 'Increasing Yield' : recent < prev ? 'Decreasing Yield' : 'Stable';
      }

      return {
        totalPYQs: count,
        distributionByYear: yearFrequency,
        averageQuestionsPerExam: parseFloat((count / Math.max(1, years.length)).toFixed(1)),
        trendStatus: trend,
        importanceRating: count >= 5 ? 'High Yield' : count >= 2 ? 'Medium Yield' : 'Low Yield'
      };
    }
  };

  // ── 7. DIFFICULTY ENGINE ──────────────────────────────────────────────────
  const DifficultyEngine = {
    getDifficulty(qId) {
      const q = _questionRegistry[qId];
      if (!q) return 'medium';

      // 1. Calculate Concept Complexity weight
      let conceptPrereqs = 0;
      for (const chapId in _curriculumRegistry.chapters) {
        const chap = _curriculumRegistry.chapters[chapId];
        if (chap.name === q.chapter) {
          const prereqs = _conceptGraph.prerequisites[chapId] || [];
          conceptPrereqs = prereqs.length;
          break;
        }
      }

      // 2. Load student telemetry evidence
      const attempt = _studentStatsCache[qId];
      let successRate = 0.6; // default historical baseline
      let avgTime = q.estimatedTime;
      
      if (attempt) {
        successRate = attempt.isCorrect ? 1.0 : 0.0;
        avgTime = attempt.timeTakenSeconds || avgTime;
      }

      // Evidence-based difficulty classification
      let score = 50; // base score out of 100
      score += conceptPrereqs * 15; // penalize multi-concept dependency
      if (successRate < 0.4) score += 25; // student struggle
      if (successRate > 0.8) score -= 20; // student success
      if (avgTime > 150) score += 15; // slow speed indicator

      if (score >= 75) return 'hard';
      if (score >= 40) return 'medium';
      return 'easy';
    }
  };

  // ── 8. QA LIFECYCLE ENGINE ────────────────────────────────────────────────
  const QALifecycleEngine = {
    getLifecycleState(qId) {
      return _questionLifecycle[qId] || 'Imported';
    },

    changeQAState(qId, newState) {
      const validStates = ['Imported', 'Parsed', 'Verified', 'Mapped', 'Reviewed', 'Production Ready'];
      if (validStates.includes(newState) && _questionRegistry[qId]) {
        _questionLifecycle[qId] = newState;
        return true;
      }
      return false;
    }
  };

  // ── 9. ACADEMIC QUERY ENGINE (AIL PUBLIC API) ─────────────────────────────
  const AcademicQueryEngine = {
    getQuestionChapter(questionId) {
      const q = _questionRegistry[questionId];
      return q ? q.chapter : 'General Chapter';
    },

    getQuestionTopic(questionId) {
      const q = _questionRegistry[questionId];
      return q ? q.topic : 'General Concept';
    },

    getExamsForTopic(topicName) {
      const exams = [];
      for (const tId in _curriculumRegistry.topics) {
        const top = _curriculumRegistry.topics[tId];
        if (top.name.toLowerCase() === topicName.toLowerCase()) {
          const parentChap = _curriculumRegistry.nodes[top.chapterId];
          if (parentChap) {
            let pNode = _curriculumRegistry.nodes[parentChap.parent];
            while (pNode && pNode.type !== 'Subject') {
              pNode = _curriculumRegistry.nodes[pNode.parent];
            }
            if (pNode && pNode.examId) {
              exams.push(pNode.examId.replace('sub_', '').toUpperCase());
            }
          }
        }
      }
      return [...new Set(exams)];
    },

    getPyqCount(nodeName) {
      let count = 0;
      Object.values(_questionRegistry).forEach(q => {
        if (q.chapter === nodeName || q.topic === nodeName) {
          count++;
        }
      });
      return count;
    },

    getPrerequisites(chapterName) {
      for (const chapId in _curriculumRegistry.chapters) {
        const chapObj = _curriculumRegistry.chapters[chapId];
        if (chapObj.name === chapterName) {
          const preIds = _conceptGraph.prerequisites[chapId] || [];
          return preIds.map(id => _curriculumRegistry.nodes[id]?.name || id);
        }
      }
      return [];
    },

    getPostRequisites(chapterName) {
      for (const chapId in _curriculumRegistry.chapters) {
        const chapObj = _curriculumRegistry.chapters[chapId];
        if (chapObj.name === chapterName) {
          const postIds = _conceptGraph.dependencies[chapId] || [];
          return postIds.map(id => _curriculumRegistry.nodes[id]?.name || id);
        }
      }
      return [];
    },

    getAppearanceFrequency(topicName) {
      return this.getPyqCount(topicName);
    },

    getEvidenceDifficulty(questionId) {
      return DifficultyEngine.getDifficulty(questionId);
    },

    getTargetStudents(questionId) {
      const diff = this.getEvidenceDifficulty(questionId);
      return diff === 'hard' ? 'Advanced' : diff === 'medium' ? 'Intermediate' : 'Beginner';
    },

    getDownstreamSystems(questionId) {
      // Maps exactly which subsystems update on attempt submit
      return [
        'Student Profile (cumulative XP/streaks)',
        'Question State (proficiency transitions)',
        'Topic Engine (recalculates accuracy)',
        'Chapter Engine (recalculates mastery)',
        'Analytics Engine (momentum, speed, global accuracy)',
        'Mistake Diary (error classification logs)',
        'Revision Engine (SM-2 intervals schedules)',
        'Dashboard UI (triggers redraw callbacks)',
        'Cloud Sync (updates localStorage indices)',
        'Tio Coaching Context (telemetry prompt vector)'
      ];
    }
  };

  // Expose window endpoints
  const AIL = {
    ExamRegistry: {
      getSpecs(examId) { return _examRegistry[examId]; }
    },
    CurriculumRegistry: {
      getSyllabusTree(examId) {
        return _curriculumRegistry;
      }
    },
    QuestionRegistry: {
      getQuestion(qId) { return _questionRegistry[qId]; },
      getAll() { return _questionRegistry; }
    },
    ConceptGraph: {
      getPrerequisites(nodeId) { return _conceptGraph.prerequisites[nodeId] || []; },
      getDependencies(nodeId) { return _conceptGraph.dependencies[nodeId] || []; }
    },
    QuestionClassificationEngine,
    TrendEngine,
    DifficultyEngine,
    QALifecycleEngine,
    ValidationPipeline: QuestionRenderingValidationPipeline,
    Query: AcademicQueryEngine,
    init
  };

  window.AIL = AIL;
  if (window.CEE) {
    window.CEE.AIL = AIL;
  }
  
  // Auto-initialize when file loads
  init();

})(typeof window !== 'undefined' ? window : global);
