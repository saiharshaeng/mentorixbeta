/**
 * curriculumTree.js — Mentorix V2 Phase 3: Curriculum Engine
 * 
 * Implements the 6-Level Pure Structural Curriculum Hierarchy:
 * Grade -> Subject -> Book -> Chapter -> Topic -> Microtopic
 * 
 * Every node strictly contains:
 *   - id
 *   - parent_id
 *   - children (array of node IDs)
 *   - difficulty ('Easy' | 'Medium' | 'Hard')
 *   - estimated_time (in minutes)
 *   - pyq_links (array of PYQ shift paper references)
 *   - lesson_id (DB lesson FK reference)
 *   - question_ids (array of question IDs)
 * 
 * Zero AI calls. Pure local structural data source of truth.
 */

'use strict';

(function(window) {

  class CurriculumNode {
    constructor({
      id,
      name,
      level, // 'grade' | 'subject' | 'book' | 'chapter' | 'topic' | 'microtopic'
      parent_id = null,
      children = [],
      difficulty = 'Medium',
      estimated_time = 30,
      pyq_links = [],
      lesson_id = null,
      question_ids = []
    }) {
      this.id = id;
      this.name = name;
      this.level = level;
      this.parent_id = parent_id;
      this.children = children;
      this.difficulty = difficulty;
      this.estimated_time = estimated_time;
      this.pyq_links = pyq_links;
      this.lesson_id = lesson_id || `lesson_${id}`;
      this.question_ids = question_ids;
    }
  }

  const nodes = new Map();

  function registerNode(nodeData) {
    const node = new CurriculumNode(nodeData);
    nodes.set(node.id, node);
    if (node.parent_id && nodes.has(node.parent_id)) {
      const parent = nodes.get(node.parent_id);
      if (!parent.children.includes(node.id)) {
        parent.children.push(node.id);
      }
    }
    return node;
  }

  function getNode(id) {
    return nodes.get(id) || null;
  }

  function getChildren(id) {
    const node = nodes.get(id);
    if (!node) return [];
    return node.children.map(childId => nodes.get(childId)).filter(Boolean);
  }

  function getAncestors(id) {
    const ancestors = [];
    let curr = nodes.get(id);
    while (curr && curr.parent_id) {
      const parent = nodes.get(curr.parent_id);
      if (parent) {
        ancestors.unshift(parent);
        curr = parent;
      } else {
        break;
      }
    }
    return ancestors;
  }

  // ── SEED INITIAL OFFICIAL CURRICULUM TREE ─────────────────────────────────

  // Grade 11 -> Physics -> Mechanics -> Rotational Motion -> Torque -> Moment of Inertia -> Angular Momentum
  registerNode({ id: 'grade_11', name: 'Grade 11', level: 'grade' });
  
  registerNode({ id: 'g11_physics', name: 'Physics', level: 'subject', parent_id: 'grade_11' });
  registerNode({ id: 'g11_chemistry', name: 'Chemistry', level: 'subject', parent_id: 'grade_11' });
  registerNode({ id: 'g11_maths', name: 'Mathematics', level: 'subject', parent_id: 'grade_11' });
  registerNode({ id: 'g11_biology', name: 'Biology', level: 'subject', parent_id: 'grade_11' });

  // Physics -> Mechanics Book
  registerNode({ id: 'g11_phy_mechanics', name: 'Mechanics & Dynamics', level: 'book', parent_id: 'g11_physics' });

  // Mechanics Book -> Rotational Motion Chapter
  registerNode({ 
    id: 'chap_rotational_motion', 
    name: 'System of Particles & Rotational Motion', 
    level: 'chapter', 
    parent_id: 'g11_phy_mechanics',
    pyq_links: ['jee_main_2025_shift1_q12', 'jee_main_2024_shift2_q15']
  });

  // Chapter -> Topics
  registerNode({ 
    id: 'top_centre_of_mass', 
    name: 'Centre of Mass', 
    level: 'topic', 
    parent_id: 'chap_rotational_motion',
    difficulty: 'Easy',
    estimated_time: 25
  });

  registerNode({ 
    id: 'top_torque', 
    name: 'Torque & Angular Momentum', 
    level: 'topic', 
    parent_id: 'chap_rotational_motion',
    difficulty: 'Hard',
    estimated_time: 45
  });

  // Topic -> Microtopics
  registerNode({ 
    id: 'micro_torque_def', 
    name: 'Torque Definition & Cross Product', 
    level: 'microtopic', 
    parent_id: 'top_torque',
    difficulty: 'Medium',
    estimated_time: 15,
    question_ids: ['q_torque_1', 'q_torque_2', 'q_torque_3', 'q_torque_4', 'q_torque_5']
  });

  registerNode({ 
    id: 'micro_moment_of_inertia', 
    name: 'Moment of Inertia & Parallel Axis Theorem', 
    level: 'microtopic', 
    parent_id: 'top_torque',
    difficulty: 'Hard',
    estimated_time: 20,
    question_ids: ['q_moi_1', 'q_moi_2', 'q_moi_3', 'q_moi_4', 'q_moi_5']
  });

  registerNode({ 
    id: 'micro_angular_momentum', 
    name: 'Conservation of Angular Momentum', 
    level: 'microtopic', 
    parent_id: 'top_torque',
    difficulty: 'Hard',
    estimated_time: 20,
    question_ids: ['q_ang_1', 'q_ang_2', 'q_ang_3', 'q_ang_4', 'q_ang_5']
  });

  // Export API
  window.CurriculumTree = {
    registerNode,
    getNode,
    getChildren,
    getAncestors,
    getAllNodes: () => Array.from(nodes.values())
  };

})(typeof window !== 'undefined' ? window : global);
