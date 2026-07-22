/**
 * constants.js — Mentorix Application Constants & Configuration
 * Extracted from mentorix_v2_4.html — Stage 2 of SPA modularization.
 *
 * Contains: AI config, badges, curriculum data, explore categories,
 *           daily challenges, screen titles, course limits.
 *
 * No dependencies. No side effects. Load before any other module.
 */

'use strict';

/* ── AI CONFIGURATION ───────────────────────────────────────── */

/** Mentorix Cloudflare Worker proxy — routes to Groq without exposing keys */
const GROQ  = 'https://mentorix-ai-proxy.mentorix.workers.dev/';
const MODEL_CHAT = 'llama-3.3-70b-versatile';
const MODEL_VISION = 'llama-3.2-11b-vision-preview'; 
const MODEL_REASON = 'qwen-qwq-32b';
const MODEL = MODEL_CHAT;

/* ── COURSE LIMITS ──────────────────────────────────────────── */

const MAX_COURSES = 10;

/* ── BADGES ─────────────────────────────────────────────────── */

const BADGES = [
  {id:'First Step',      ic:'👣', d:'Completed onboarding'},
  {id:'Quick Learner',   ic:'📖', d:'Completed first course topic'},
  {id:'Curious Mind',    ic:'🔍', d:'Explored 3 categories'},
  {id:'Quiz Hero',       ic:'🧠', d:'Perfect score on a quiz'},
  {id:'Champion',        ic:'🏆', d:'Scored 7+ on a test'},
  {id:'Perfect Score',   ic:'💯', d:'All 8 correct on a test'},
  {id:'Career Seeker',   ic:'🚀', d:'Generated career roadmap'},
  {id:'Roadmap Pro',     ic:'🗺️', d:'Generated 3+ career roadmaps'},
  {id:'Knowledge Seeker',ic:'📚', d:'Completed 10+ course topics'},
  {id:'Streak 7',        ic:'🔥', d:'7-day learning streak'},
  {id:'Streak 30',       ic:'💎', d:'30-day learning streak'},
];

/* ── CURRICULUM — ONBOARDING ────────────────────────────────── */

const STREAMS_11_12 = ['Science', 'Commerce', 'Humanities'];

const SUBJECTS_BY_STREAM = {
  'Science':    ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Physical Education', 'English'],
  'Commerce':   ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Computer Science', 'English'],
  'Humanities': ['History', 'Political Science', 'Geography', 'Sociology', 'Psychology', 'Economics', 'English']
};

const SUBJECTS_K10 = ['Mathematics', 'Science', 'English', 'Social Science', 'Second Language', 'Computer Science'];

/* ── EXPLORE CATEGORIES ─────────────────────────────────────── */

const CATS = [
  {e:'🔬', n:'Science',     col:'#8B5CF6', ts:['Quantum Physics','Neuroscience','Climate Change','Black Holes','CRISPR','Particle Physics','String Theory','Dark Matter']},
  {e:'💻', n:'Technology',  col:'#06B6D4', ts:['Artificial Intelligence','Blockchain','Cybersecurity','Cloud Computing','Quantum Computing','Robotics','Web3','5G Networks']},
  {e:'🧮', n:'Mathematics', col:'#10B981', ts:['Calculus','Linear Algebra','Statistics','Number Theory','Game Theory','Topology','Probability','Cryptography']},
  {e:'📜', n:'History',     col:'#F59E0B', ts:['Ancient Rome','World War II','Industrial Revolution','Ancient Egypt','The Renaissance','Cold War','Mesopotamia','Silk Road']},
  {e:'💼', n:'Business',    col:'#EC4899', ts:['Entrepreneurship','Marketing Strategy','Stock Markets','Behavioral Economics','Leadership','Venture Capital','Supply Chain','Brand Building']},
  {e:'🧠', n:'Psychology',  col:'#A78BFA', ts:['Cognitive Biases','Behavioral Science','Memory','Emotional Intelligence','Personality','Habit Formation','Motivation','Decision Making']},
  {e:'🗺️', n:'Space',       col:'#67E8F9', ts:['Solar System','Star Formation','Dark Matter','Space Travel','Exoplanets','Big Bang','Neutron Stars','Black Holes']},
  {e:'🎨', n:'Arts & Ideas',col:'#F9A8D4', ts:['Philosophy','Art History','Music Theory','Literature','Film Theory','Ethics','Aesthetics','Critical Thinking']},
];

/* ── DAILY CHALLENGES ───────────────────────────────────────── */

const DC = [
  {e:'🔬', t:'Why is the sky blue?',            c:'Physics'},
  {e:'🧮', t:'What is the Fibonacci sequence?', c:'Math'},
  {e:'🏛️', t:'How did the Roman Empire fall?',  c:'History'},
  {e:'💻', t:'How does AI actually work?',       c:'Technology'},
  {e:'🧬', t:'How does DNA replication work?',   c:'Biology'},
  {e:'⚡', t:'How does electricity flow?',       c:'Physics'},
  {e:'🌌', t:'What happens inside a black hole?',c:'Space'},
];

/* ── SCREEN TITLES ──────────────────────────────────────────── */

const SCREEN_TITLES = {
  dash:     'Dashboard',
  courses:  'Courses',
  recovery: 'Recovery Center',
  notebook: 'AI Notebook',
  revision: 'Smart Revision',
  explore:  'Explore',
  careers:  'Career Explorer',
  tests:    'Tests & Assessments',
  progress: 'Analytics',
  mentor:   'Tio AI Mentor',
  settings: 'Settings',
  learn:    'Course Workspace',
  comp:     'Competitive Exams',
};


/* ── EDUCATION BOARDS ──────────────────────────────────────── */

const EDU_BOARDS = ['CBSE', 'ICSE', 'State Board', 'Cambridge', 'IB', 'IGCSE', 'Other'];

/* ── EXPORTS ────────────────────────────────────────────────── */
window.GROQ             = GROQ;
window.MODEL_CHAT       = MODEL_CHAT;
window.MODEL_VISION     = MODEL_VISION;
window.MODEL_REASON     = MODEL_REASON;
window.MODEL            = MODEL;
window.MAX_COURSES      = MAX_COURSES;
window.BADGES           = BADGES;
window.STREAMS_11_12    = STREAMS_11_12;
window.SUBJECTS_BY_STREAM = SUBJECTS_BY_STREAM;
window.SUBJECTS_K10     = SUBJECTS_K10;
window.CATS             = CATS;
window.DC               = DC;
window.SCREEN_TITLES    = SCREEN_TITLES;
window.EDU_BOARDS       = EDU_BOARDS;
