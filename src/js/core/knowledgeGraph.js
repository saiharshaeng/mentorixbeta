/**
 * knowledgeGraph.js — Mentorix V2 Phase 4: Universal Knowledge Graph Engine
 * 
 * Implements the Prerequisite & Dependency Hierarchy as a Directed Acyclic Graph (DAG).
 * 
 * Difference from Curriculum Tree:
 *   - Curriculum Tree = Chapter & topic structural hierarchy (Grade -> Subject -> Chapter -> Topic).
 *   - Knowledge Graph = Prerequisite dependency hierarchy (Newton II -> Force -> Vectors -> Units -> SI).
 * 
 * Key Capabilities:
 *   - Directed Acyclic Graph (DAG) with cycle detection (isCyclic).
 *   - Recursive prerequisite traversal (getPrerequisites).
 *   - Downstream dependent topic traversal (getDependents).
 *   - Topological sort for optimal learning path recommendations.
 * 
 * Powers: Weak Spot Engine, Smart Revision, Tio Grounding, Adaptive Learning Paths.
 */

'use strict';

(function(window) {

  class KnowledgeGraph {
    constructor() {
      this.adjacencyList = new Map(); // topicId -> Array of prerequisite topicIds
      this.topicMetadata = new Map(); // topicId -> { name, subject, difficulty }
    }

    /**
     * Add a node to the Knowledge Graph
     */
    addTopic(id, name, subject = 'General', difficulty = 'Medium') {
      if (!this.adjacencyList.has(id)) {
        this.adjacencyList.set(id, []);
        this.topicMetadata.set(id, { id, name, subject, difficulty });
      }
      return this;
    }

    /**
     * Add a prerequisite dependency: topicId depends on prerequisiteId
     * Example: addPrerequisite('top_torque', 'top_force') => Torque depends on Force
     */
    addPrerequisite(topicId, prerequisiteId) {
      if (!this.adjacencyList.has(topicId)) {
        this.addTopic(topicId, topicId);
      }
      if (!this.adjacencyList.has(prerequisiteId)) {
        this.addTopic(prerequisiteId, prerequisiteId);
      }

      const currentPrereqs = this.adjacencyList.get(topicId);
      if (!currentPrereqs.includes(prerequisiteId)) {
        currentPrereqs.push(prerequisiteId);
      }

      // Check if adding this edge created a cycle in the DAG
      if (this.isCyclic()) {
        // Rollback edge if cycle created
        const index = currentPrereqs.indexOf(prerequisiteId);
        if (index > -1) currentPrereqs.splice(index, 1);
        throw new Error(`[KnowledgeGraph] Dependency '${topicId}' -> '${prerequisiteId}' creates a cycle in the DAG! Edge rejected.`);
      }

      return this;
    }

    /**
     * Cycle detection engine for DAG using Depth-First Search (DFS)
     */
    isCyclic() {
      const visited = new Map();
      const recStack = new Map();

      for (const node of this.adjacencyList.keys()) {
        visited.set(node, false);
        recStack.set(node, false);
      }

      for (const node of this.adjacencyList.keys()) {
        if (!visited.get(node)) {
          if (this._isCyclicUtil(node, visited, recStack)) {
            return true;
          }
        }
      }

      return false;
    }

    _isCyclicUtil(node, visited, recStack) {
      visited.set(node, true);
      recStack.set(node, true);

      const neighbors = this.adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.get(neighbor)) {
          if (this._isCyclicUtil(neighbor, visited, recStack)) {
            return true;
          }
        } else if (recStack.get(neighbor)) {
          return true;
        }
      }

      recStack.set(node, false);
      return false;
    }

    /**
     * Recursively fetch all prerequisite topics for a given topicId
     * Returns an array ordered from foundational root up to direct prerequisite
     */
    getPrerequisites(topicId) {
      const prerequisites = [];
      const visited = new Set();

      const traverse = (currentId) => {
        const directPrereqs = this.adjacencyList.get(currentId) || [];
        for (const prereqId of directPrereqs) {
          if (!visited.has(prereqId)) {
            visited.add(prereqId);
            traverse(prereqId);
            const meta = this.topicMetadata.get(prereqId) || { id: prereqId, name: prereqId };
            prerequisites.push(meta);
          }
        }
      };

      traverse(topicId);
      return prerequisites;
    }

    /**
     * Fetch downstream topics that depend on the given topicId
     */
    getDependents(topicId) {
      const dependents = [];
      for (const [node, prereqs] of this.adjacencyList.entries()) {
        if (prereqs.includes(topicId)) {
          const meta = this.topicMetadata.get(node) || { id: node, name: node };
          dependents.push(meta);
        }
      }
      return dependents;
    }
  }

  // Instantiate global singleton Knowledge Graph
  const graph = new KnowledgeGraph();

  // ── SEED CLASSIC PHYSICS & MATH DEPENDENCY DAG ──────────────────────────

  // Foundation: Units & Dimensions -> Vectors -> Force -> Newton's Laws -> Torque -> Rotational Dynamics
  graph.addTopic('top_si_units', 'SI Units & Measurement', 'Physics', 'Easy');
  graph.addTopic('top_vectors', 'Vectors & Vector Algebra', 'Physics', 'Medium');
  graph.addTopic('top_kinematics', '1D & 2D Kinematics', 'Physics', 'Medium');
  graph.addTopic('top_force', 'Force & Friction', 'Physics', 'Medium');
  graph.addTopic('top_newton_laws', 'Newton Laws of Motion', 'Physics', 'Hard');
  graph.addTopic('top_work_energy', 'Work, Energy & Power', 'Physics', 'Medium');
  graph.addTopic('top_center_mass', 'Center of Mass & Linear Momentum', 'Physics', 'Hard');
  graph.addTopic('top_torque', 'Torque & Angular Acceleration', 'Physics', 'Hard');
  graph.addTopic('top_rotational_dynamics', 'Rotational Dynamics & Angular Momentum', 'Physics', 'Hard');

  // Define DAG Dependencies
  graph.addPrerequisite('top_vectors', 'top_si_units');
  graph.addPrerequisite('top_kinematics', 'top_vectors');
  graph.addPrerequisite('top_force', 'top_vectors');
  graph.addPrerequisite('top_newton_laws', 'top_force');
  graph.addPrerequisite('top_newton_laws', 'top_kinematics');
  graph.addPrerequisite('top_work_energy', 'top_force');
  graph.addPrerequisite('top_center_mass', 'top_newton_laws');
  graph.addPrerequisite('top_torque', 'top_force');
  graph.addPrerequisite('top_torque', 'top_center_mass');
  graph.addPrerequisite('top_rotational_dynamics', 'top_torque');

  // Export API
  window.KnowledgeGraph = graph;

})(typeof window !== 'undefined' ? window : global);
