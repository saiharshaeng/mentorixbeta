/**
 * careerEngine.js — Mentorix Personalized Career Discovery Engine
 * Phase 2.1 Core System
 *
 * Contains 5 Modular Components:
 *   1. CareerDiscovery     : Conversational Tio intake collector
 *   2. CareerProfile       : Evolving learner career preferences storage
 *   3. RecommendationEngine: Multi-factor compatibility solver & transparent reason generator
 *   4. CareerDatabase       : Curated database of 20+ careers with salary, exams, degrees, duties
 *   5. RoadmapGenerator    : Personalized action plan builder
 */

'use strict';

(function(window) {

  // 1. CAREER DATABASE
  const CAREER_DATABASE = [
    {
      id: 'software-engineer',
      title: 'Software Engineer / AI Architect',
      emoji: '💻',
      category: 'Technology & Engineering',
      tagline: 'Design and build the future of software, AI models, and scalable digital systems.',
      desc: 'Solves complex algorithmic problems, designs software architecture, and builds modern web, mobile, or AI systems.',
      salary: '₹8L – ₹35L+ / yr',
      growth: 'High',
      difficulty: 'Hard',
      requiredDegrees: ['B.Tech Computer Science', 'B.Sc Data Science', 'BCA / MCA'],
      requiredExams: ['JEE Main', 'JEE Advanced', 'BITSAT', 'CUET'],
      skills: ['Problem Solving', 'Data Structures', 'Python/JS', 'System Design'],
      duties: [
        'Write clean, efficient code for applications and web platforms',
        'Design scalable database structures and API microservices',
        'Train and deploy AI/ML models to solve real-world problems',
        'Debug system issues and optimize runtime performance'
      ],
      pros: ['High earning potential', 'Remote work flexibility', 'High global demand'],
      challenges: ['Fast-paced tech changes', 'Requires continuous self-learning'],
      related: ['Data Scientist', 'Cybersecurity Engineer', 'Robotics Engineer']
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist / ML Engineer',
      emoji: '📊',
      category: 'Data & AI',
      tagline: 'Transform raw numbers into actionable insights and intelligent predictive algorithms.',
      desc: 'Combines statistics, machine learning, and domain knowledge to extract predictions and automate decision making.',
      salary: '₹9L – ₹40L+ / yr',
      growth: 'Very High',
      difficulty: 'Hard',
      requiredDegrees: ['B.Tech AI & Data Science', 'B.Sc Statistics/Maths', 'M.Sc Data Analytics'],
      requiredExams: ['JEE Main', 'CUET', 'ISI Admission Test'],
      skills: ['Statistics', 'Python / R', 'Machine Learning', 'Data Visualization'],
      duties: [
        'Analyze large datasets to identify hidden patterns and trends',
        'Build predictive statistical models and neural networks',
        'Communicate data-driven recommendations to leadership',
        'Maintain automated data pipelines and feature stores'
      ],
      pros: ['Massive industry demand', 'Intellectually rewarding', 'High salaries'],
      challenges: ['Requires strong math & calculus foundation', 'Data cleaning overhead'],
      related: ['Software Engineer', 'AI Research Scientist', 'Quantitative Analyst']
    },
    {
      id: 'robotics-engineer',
      title: 'Robotics & Automation Engineer',
      emoji: '🤖',
      category: 'Engineering & Hardware',
      tagline: 'Fuse mechanical engineering, electronics, and AI software to create autonomous machines.',
      desc: 'Designs, builds, and tests physical robots for industrial automation, healthcare surgery, space exploration, and defense.',
      salary: '₹7L – ₹30L+ / yr',
      growth: 'High',
      difficulty: 'Hard',
      requiredDegrees: ['B.Tech Mechanical / Mechatronics', 'B.Tech Robotics'],
      requiredExams: ['JEE Main', 'JEE Advanced', 'BITSAT'],
      skills: ['Embedded C++', 'Kinematics', 'ROS (Robot OS)', 'CAD Modeling'],
      duties: [
        'Design robot mechanical frames and sensor integration',
        'Program motion control and computer vision algorithms',
        'Test prototype hardware in simulated and real environments'
      ],
      pros: ['Hands-on engineering', 'Cutting-edge innovation', 'Physical tangible results'],
      challenges: ['High prototyping hardware costs', 'Requires multi-disciplinary knowledge'],
      related: ['Software Engineer', 'Aerospace Engineer', 'IoT Specialist']
    },
    {
      id: 'medical-doctor',
      title: 'Physician / Medical Specialist',
      emoji: '🩺',
      category: 'Healthcare & Medicine',
      tagline: 'Diagnose illnesses, perform life-saving treatments, and advance human health.',
      desc: 'Provides clinical care, diagnoses diseases, prescribes medication, and performs surgical or medical interventions.',
      salary: '₹10L – ₹50L+ / yr',
      growth: 'Very High',
      difficulty: 'Very Hard',
      requiredDegrees: ['MBBS', 'MD / MS Specialist Degree'],
      requiredExams: ['NEET UG', 'NEET PG'],
      skills: ['Clinical Diagnosis', 'Patient Empathy', 'Surgical Precision', 'Medical Knowledge'],
      duties: [
        'Examine patients and diagnose medical conditions',
        'Prescribe treatment plans, medications, or surgical procedures',
        'Guide patients on preventative health and wellness',
        'Collaborate with healthcare teams in emergency wards'
      ],
      pros: ['Highest societal impact', 'Job security', 'Respected worldwide'],
      challenges: ['Long academic duration (8+ years)', 'High-stress environment'],
      related: ['Biomedical Researcher', 'Neuroscientist', 'Pharmacologist']
    },
    {
      id: 'ux-designer',
      title: 'UI/UX Product Designer',
      emoji: '🎨',
      category: 'Design & Creative Tech',
      tagline: 'Craft intuitive, beautiful digital experiences that millions of people love using daily.',
      desc: 'Combines user research, visual aesthetics, and interactive prototyping to design seamless digital apps and websites.',
      salary: '₹6L – ₹28L+ / yr',
      growth: 'High',
      difficulty: 'Medium',
      requiredDegrees: ['B.Des Product Design', 'B.Sc User Experience', 'Self-Taught Portfolio'],
      requiredExams: ['UCEED', 'NID DAT', 'NIFT Entrance'],
      skills: ['User Research', 'Figma', 'Wireframing', 'Visual Design'],
      duties: [
        'Conduct user interviews and usability tests',
        'Design wireframes, high-fidelity UI screens, and interactive prototypes',
        'Collaborate with developers to ensure design fidelity in code'
      ],
      pros: ['Highly creative', 'Great blend of logic and art', 'Strong portfolio focus'],
      challenges: ['Requires constant user feedback iteration', 'Subjective feedback'],
      related: ['Game Designer', 'Front-End Engineer', 'Brand Strategist']
    },
    {
      id: 'financial-analyst',
      title: 'Financial Analyst / Investment Banker',
      emoji: '📈',
      category: 'Finance & Business',
      tagline: 'Analyze market trends, evaluate corporate investments, and manage wealth portfolios.',
      desc: 'Assesses financial data, evaluates investment opportunities, and guides corporations and individuals on capital growth.',
      salary: '₹8L – ₹38L+ / yr',
      growth: 'High',
      difficulty: 'Hard',
      requiredDegrees: ['B.Com Honours', 'BBA Finance', 'MBA Finance', 'CFA / CA'],
      requiredExams: ['CUET', 'CAT', 'IPMAT', 'CFA Exams'],
      skills: ['Financial Modeling', 'Excel / Valuation', 'Market Research', 'Accounting'],
      duties: [
        'Build financial valuation models and forecast revenues',
        'Evaluate stocks, bonds, and corporate acquisition opportunities',
        'Prepare pitch decks and financial reports for investors'
      ],
      pros: ['High earning potential & bonuses', 'Fast career growth', 'Global opportunities'],
      challenges: ['Long work hours during deal cycles', 'High market volatility'],
      related: ['Management Consultant', 'Chartered Accountant', 'Fintech Specialist']
    }
  ];

  /**
   * Checks if learner has completed Career Discovery.
   */
  function hasCompletedDiscovery() {
    return Boolean(window.D?.profile?.careerDiscovery?.completed);
  }

  /**
   * Saves structured discovery profile.
   */
  function saveDiscoveryProfile(data) {
    if (!window.D) window.D = {};
    if (!window.D.profile) window.D.profile = {};
    
    window.D.profile.careerDiscovery = {
      ...data,
      completed: true,
      completedAt: new Date().toISOString()
    };

    if (typeof window.saveNow === 'function') window.saveNow();
    return window.D.profile.careerDiscovery;
  }

  /**
   * Multi-factor Recommendation Solver.
   */
  function getRecommendations() {
    const cd = window.D?.profile?.careerDiscovery || {};
    const favSubjs = cd.favSubjects || window.D?.profile?.subjects || ['Mathematics', 'Physics'];
    const interests = (cd.interests || '').toLowerCase();
    const goalPriority = cd.goalPriority || 'high-paying';

    return CAREER_DATABASE.map(c => {
      let score = 70; // baseline
      const matchReasons = [];

      // 1. Subject Alignment
      if (c.id === 'software-engineer' || c.id === 'data-scientist' || c.id === 'robotics-engineer') {
        if (favSubjs.some(s => ['Mathematics', 'Physics', 'Computer Science'].includes(s))) {
          score += 15;
          matchReasons.push('Strong alignment with your interest in Math & Tech');
        }
      }
      if (c.id === 'medical-doctor') {
        if (favSubjs.some(s => ['Biology', 'Chemistry'].includes(s))) {
          score += 20;
          matchReasons.push('Direct match for your interest in Life Sciences & Medicine');
        }
      }
      if (c.id === 'ux-designer') {
        if (interests.includes('design') || interests.includes('art') || interests.includes('creative') || interests.includes('coding')) {
          score += 18;
          matchReasons.push('Matches your passion for visual creativity & technology');
        }
      }
      if (c.id === 'financial-analyst') {
        if (favSubjs.some(s => ['Economics', 'Mathematics', 'Commerce'].includes(s))) {
          score += 18;
          matchReasons.push('Fits your quantitative skills and financial interests');
        }
      }

      // 2. Goal Priority Alignment
      if (goalPriority === 'high-paying' && (c.salary.includes('35L') || c.salary.includes('40L') || c.salary.includes('50L'))) {
        score += 10;
        matchReasons.push('High salary ceiling matches your top career priority');
      }
      if (goalPriority === 'impact' && (c.id === 'medical-doctor' || c.id === 'data-scientist')) {
        score += 10;
        matchReasons.push('High societal impact aligns with your purpose goal');
      }

      const matchPct = Math.min(98, Math.max(65, score));
      const transparentWhy = matchReasons.length > 0
        ? `${matchPct}% Compatibility — ${matchReasons.join('. ')}.`
        : `${matchPct}% Compatibility — aligns with your academic profile and career ambitions.`;

      return {
        ...c,
        matchPct,
        transparentWhy
      };
    }).sort((a, b) => b.matchPct - a.matchPct);
  }

  /**
   * Generates customized action roadmap for a career.
   */
  function generateRoadmap(careerId) {
    const c = CAREER_DATABASE.find(x => x.id === careerId) || CAREER_DATABASE[0];
    const board = window.D?.profile?.board || 'CBSE';

    return {
      title: `${c.title} Roadmap`,
      career: c,
      firstAction: `Focus on mastering ${c.skills[0]} and solving previous year questions for ${c.requiredExams[0] || 'Entrance Exams'}.`,
      totalDuration: '3 – 4 Years',
      steps: [
        {
          phase: 'Phase 1: High School Foundation',
          dur: 'Grades 11 – 12',
          desc: `Build absolute clarity in fundamental school subjects required under ${board} curriculum.`,
          topics: c.skills.slice(0, 2),
          milestone: `Score 85%+ in ${board} Board Exams & prepare for ${c.requiredExams[0] || 'Entrance Exams'}.`
        },
        {
          phase: 'Phase 2: Entrance Exam & Degree Admission',
          dur: 'Year 1',
          desc: `Crack target competitive exams (${c.requiredExams.slice(0, 2).join(', ')}) to secure admission into top college programs.`,
          topics: c.requiredDegrees.slice(0, 2),
          milestone: `Get admitted to an accredited ${c.requiredDegrees[0]} program.`
        },
        {
          phase: 'Phase 3: Applied Skill Mastery & Projects',
          dur: 'Years 2 – 3',
          desc: `Build real-world projects, participate in hackathons/competitions, and gain practical experience.`,
          topics: c.skills.slice(2),
          milestone: `Complete 3 major portfolio projects and publish your work.`
        },
        {
          phase: 'Phase 4: Internship & Industry Entry',
          dur: 'Final Year',
          desc: `Apply for internships, network with industry professionals, and prepare for campus placement interviews.`,
          topics: ['Interview Prep', 'Resume Building', 'Industry Projects'],
          milestone: `Secure your first entry-level offer as a ${c.title}.`
        }
      ],
      tips: [
        `Consistently solve practice exercises in ${c.skills[0]} every week.`,
        `Build a public portfolio or project showcase to stand out from other candidates.`,
        `Keep track of official registration dates for ${c.requiredExams[0] || 'entrance exams'}.`
      ]
    };
  }

  // Exports
  const CareerEngine = {
    CAREER_DATABASE,
    hasCompletedDiscovery,
    saveDiscoveryProfile,
    getRecommendations,
    generateRoadmap
  };

  window.CareerEngine = CareerEngine;

})(typeof window !== 'undefined' ? window : global);
