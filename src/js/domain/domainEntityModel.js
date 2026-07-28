/**
 * domainEntityModel.js — Canonical Domain & Business Entities Architecture
 * Mentorix Data & State Architecture (Part 2)
 *
 * Defines explicit business entity models across 6 parent domains:
 * 1. Identity (User, Device, Session)
 * 2. Education (Subject, Course, Chapter, Topic, Lesson, KnowledgeUnit)
 * 3. Practice (PracticeQuestion, Attempt)
 * 4. Competitive Exams (Mock, TestSession)
 * 5. Revision (RevisionQueue, RevisionEvidence, Mastery)
 * 6. AI & User Goals (TioConversation, Goal, Achievement, Notification)
 *
 * Enforces strict separation between static Educational Content and dynamic Learner Progress.
 */

'use strict';

(function(exports) {

  /* ── 1. IDENTITY DOMAIN ENTITIES ── */

  class UserEntity {
    constructor(data = {}) {
      this.id = data.id || '';
      this.name = data.name || 'Learner';
      this.username = data.username || '';
      this.email = data.email || '';
      this.grade = data.grade || 'Class 11';
      this.board = data.board || 'CBSE';
      this.targetExams = data.targetExams || ['JEE Main'];
      this.createdAt = data.createdAt || new Date().toISOString();
    }
  }

  /* ── 2. EDUCATION DOMAIN ENTITIES (Static Content) ── */

  class SubjectEntity {
    constructor(data = {}) {
      this.id = data.id || '';
      this.name = data.name || '';
      this.code = data.code || '';
      this.icon = data.icon || '📚';
    }
  }

  class CourseEntity {
    constructor(data = {}) {
      this.id = data.id || '';
      this.subjectId = data.subjectId || '';
      this.title = data.title || '';
      this.version = data.version || '1.0.0';
      this.chapters = data.chapters || [];
      this.isPublished = data.isPublished !== false;
    }
  }

  class ChapterEntity {
    constructor(data = {}) {
      this.id = data.id || '';
      this.courseId = data.courseId || '';
      this.title = data.title || '';
      this.order = data.order || 1;
      this.topicIds = data.topicIds || [];
    }
  }

  class TopicEntity {
    constructor(data = {}) {
      this.id = data.id || '';
      this.chapterId = data.chapterId || '';
      this.title = data.title || '';
      this.estimatedMinutes = data.estimatedMinutes || 25;
      this.knowledgeUnitIds = data.knowledgeUnitIds || [];
    }
  }

  class LessonEntity {
    constructor(data = {}) {
      this.id = data.id || '';
      this.topicId = data.topicId || '';
      this.title = data.title || '';
      this.sections = data.sections || [];
      this.version = data.version || '1.0.0';
    }
  }

  class KnowledgeUnitEntity {
    constructor(data = {}) {
      this.id = data.id || '';
      this.topicId = data.topicId || '';
      this.title = data.title || '';
      this.type = data.type || 'concept'; // 'definition'|'formula'|'law'|'concept'|'diagram'|'process'|'exception'|'common_mistake'|'real_world_app'
      this.examWeightage = data.examWeightage || 'medium';
    }
  }

  /* ── 3. PRACTICE & ASSESSMENT ENTITIES ── */

  class PracticeQuestionEntity {
    constructor(data = {}) {
      this.id = data.id || '';
      this.knowledgeUnitIds = data.knowledgeUnitIds || [];
      this.question = data.question || '';
      this.options = data.options || [];
      this.answer = data.answer || 0;
      this.explanation = data.explanation || '';
      this.difficulty = data.difficulty || 'medium';
    }
  }

  class AttemptEntity {
    constructor(data = {}) {
      this.id = data.id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      this.questionId = data.questionId || '';
      this.userId = data.userId || '';
      this.selectedAnswer = data.selectedAnswer;
      this.isCorrect = Boolean(data.isCorrect);
      this.confidence = data.confidence || 'medium';
      this.timeTakenSeconds = data.timeTakenSeconds || 0;
      this.timestamp = data.timestamp || Date.now();
    }
  }

  /* ── 4. REVISION & MASTERY ENTITIES (Dynamic Learner State) ── */

  class RevisionEvidenceEntity {
    constructor(data = {}) {
      this.id = data.id || `ev_${Date.now()}`;
      this.unitId = data.unitId || '';
      this.userId = data.userId || '';
      this.recallSuccess = Boolean(data.recallSuccess);
      this.confidence = data.confidence || 'medium';
      this.latencyMs = data.latencyMs || 0;
      this.timestamp = data.timestamp || Date.now();
    }
  }

  class MasteryEntity {
    constructor(data = {}) {
      this.unitId = data.unitId || '';
      this.userId = data.userId || '';
      this.score = data.score || 0; // 0-100
      this.status = data.status || 'unlearned'; // 'mastered' | 'review_needed' | 'unlearned'
      this.lastReviewedAt = data.lastReviewedAt || null;
    }
  }

  /* ── 5. AI & COMPANION ENTITIES ── */

  class TioConversationEntity {
    constructor(data = {}) {
      this.id = data.id || `conv_${Date.now()}`;
      this.userId = data.userId || '';
      this.messages = data.messages || [];
      this.referencedUnitIds = data.referencedUnitIds || [];
      this.updatedAt = data.updatedAt || new Date().toISOString();
    }
  }

  // Exports
  const DomainEntityModel = {
    UserEntity,
    SubjectEntity,
    CourseEntity,
    ChapterEntity,
    TopicEntity,
    LessonEntity,
    KnowledgeUnitEntity,
    PracticeQuestionEntity,
    AttemptEntity,
    RevisionEvidenceEntity,
    MasteryEntity,
    TioConversationEntity
  };

  if (typeof window !== 'undefined') window.DomainEntityModel = DomainEntityModel;
  exports.DomainEntityModel = DomainEntityModel;

})(typeof exports !== 'undefined' ? exports : window);
