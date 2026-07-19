const fs = require('fs');
const path = require('path');

const jeeData = require('./jeeData.js');

const srcFile = path.join(__dirname, 'pyq/normalized/jee_main_normalized.json');
const destDir = path.join(__dirname, 'pyq/classified');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let questions = [];
try {
  questions = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
} catch (e) {
  console.error('Failed to read normalized questions:', e);
  process.exit(1);
}

const CHAPTER_KEYWORDS = {
  "Sets, Relations and Functions": 
    ["equivalence relation", "bijective", 
     "onto function", "one-one", "inverse function"],
  "Complex Numbers and Quadratic Equations": 
    ["complex number", "argand", "argument", 
     "modulus", "conjugate", "root of unity", "z ="],
  "Matrices and Determinants": 
    ["matrix", "determinant", "adj", "trace",
     "singular", "cofactor", "rank"],
  "Sequences and Series": 
    ["A.P", "G.P", "H.P", "arithmetic", 
     "geometric", "harmonic", "sum of series",
     "a_n", "a_1"],
  "Binomial Theorem": 
    ["binomial", "C(n,r)", "nCr", "expansion",
     "middle term", "coefficient of x"],
  "Differential Equations": 
    ["differential equation", "dy/dx", "d²y/dx²",
     "integrating factor", "order", "degree of DE"],
  "Coordinate Geometry - Straight Lines": 
    ["slope", "intercept", "perpendicular distance",
     "angle bisector", "collinear", "image of point"],
  "Coordinate Geometry - Conics": 
    ["parabola", "ellipse", "hyperbola", 
     "focus", "directrix", "eccentricity",
     "latus rectum", "tangent to"],
  "3D Geometry": 
    ["three dimensional", "3D", "direction cosine",
     "shortest distance", "plane equation",
     "foot of perpendicular", "skew lines"],
  "Integral Calculus": 
    ["integral", "∫", "integration", 
     "area under", "definite integral"],
  "Electric Charges and Fields": 
    ["electric field", "coulomb", "gauss",
     "charge density", "flux", "dipole"],
  "Current Electricity": 
    ["resistance", "kirchhoff", "ohm",
     "potentiometer", "meter bridge", 
     "wheatstone", "EMF"],
  "Ray Optics": 
    ["mirror", "lens", "refraction", 
     "total internal reflection", "prism",
     "magnification", "focal length"],
  "Modern Physics": 
    ["photoelectric", "de broglie", 
     "bohr", "radioactive", "half-life",
     "nuclear", "binding energy"],
  "Thermodynamics (Chemistry)": 
    ["enthalpy", "entropy", "gibbs", 
     "hess", "bond energy", "ΔH", "ΔS", "ΔG"],
  "Coordination Compounds": 
    ["coordination", "ligand", "CFSE", 
     "crystal field", "chelate", 
     "coordination number", "complex ion"],
  "Electrochemistry": 
    ["faraday", "electrolysis", "nernst",
     "cell potential", "EMF of cell",
     "conductance", "kohlrausch"],
  "Chemical Kinetics": 
    ["rate of reaction", "rate constant",
     "order of reaction", "half life of",
     "arrhenius", "activation energy"],
  "Organic Chemistry - Basic Principles": 
    ["iupac", "isomer", "inductive effect",
     "resonance structure", "carbocation",
     "carbanion", "intermediate"],
  "Aldehydes, Ketones and Carboxylic Acids": 
    ["aldehyde", "ketone", "carboxylic",
     "aldol", "cannizzaro", "fehling",
     "tollens", "esterification"]
};

// Build flat list of all valid chapters from jeeData.js
const validChapters = new Set();
Object.keys(jeeData.syllabus).forEach(subj => {
  jeeData.syllabus[subj].forEach(ch => {
    validChapters.add(ch.chapter);
  });
});

let classifiedCount = 0;
let confidenceHigh = 0;
let confidenceMedium = 0;
let confidenceLow = 0;
let unclassifiedCount = 0;

const classifiedQuestions = questions.map(q => {
  let classifiedChapter = "Unclassified";
  let classificationConfidence = "low";
  let classifiedBy = "unclassified";

  // Strategy 1: Check existing chapter field
  if (q.chapter && validChapters.has(q.chapter)) {
    classifiedChapter = q.chapter;
    classificationConfidence = "high";
    classifiedBy = "existing";
  } else {
    // Strategy 2: Keyword matching
    const textToMatch = ((q.question || "") + " " + (q.topic || "")).toLowerCase();
    let bestChapter = null;
    let maxMatches = 0;

    Object.entries(CHAPTER_KEYWORDS).forEach(([chName, keywords]) => {
      let matches = 0;
      keywords.forEach(keyword => {
        if (textToMatch.includes(keyword.toLowerCase())) {
          matches++;
        }
      });

      if (matches > maxMatches) {
        maxMatches = matches;
        bestChapter = chName;
      }
    });

    if (bestChapter && maxMatches > 0) {
      classifiedChapter = bestChapter;
      classificationConfidence = maxMatches > 1 ? "high" : "medium";
      classifiedBy = "keyword";
    }
  }

  // Update statistics
  if (classifiedChapter !== "Unclassified") {
    classifiedCount++;
    if (classificationConfidence === "high") confidenceHigh++;
    else if (classificationConfidence === "medium") confidenceMedium++;
    else confidenceLow++;
  } else {
    unclassifiedCount++;
    confidenceLow++;
  }

  return {
    ...q,
    classifiedChapter,
    classificationConfidence,
    classifiedBy
  };
});

// Save to classified destination
const destFile = path.join(destDir, 'jee_classified.json');
fs.writeFileSync(destFile, JSON.stringify(classifiedQuestions, null, 2), 'utf8');

console.log('=== CLASSIFICATION SUMMARY ===');
console.log(`Total Questions: ${questions.length}`);
console.log(`Classified Questions: ${classifiedCount}`);
console.log(`Unclassified Questions (low confidence): ${unclassifiedCount}`);
console.log(`  Confidence High: ${confidenceHigh}`);
console.log(`  Confidence Medium: ${confidenceMedium}`);
console.log(`  Confidence Low: ${confidenceLow}`);
console.log(`Classification report saved to: ${destFile}`);
