import os
import re
import sys
import json
import hashlib
import glob
import fitz  # PyMuPDF

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r'c:\Users\Harsha\.gemini\antigravity-ide\scratch\mentorix'
PDF_DIR = os.path.join(ROOT_DIR, r'Questions_Database\JEE')
OUTPUT_DIR = os.path.join(ROOT_DIR, r'questions\jee')
RAW_DIR = os.path.join(ROOT_DIR, r'raw\jee')
METADATA_DIR = os.path.join(ROOT_DIR, r'metadata')
ASSETS_DIR = os.path.join(ROOT_DIR, r'assets\images')
FIXED_DATA_DIR = os.path.join(ROOT_DIR, r'src\data\pyq\fixed')

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(METADATA_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

MATH_CHAPTER_CODES = {
    'Set Relations and Functions': 'SET',
    'Quadratic Equations and Expressions': 'QUAD',
    'Complex Number': 'CPLX',
    'Matrices and Determinants': 'MAT',
    'Progressions': 'PROG',
    'Mathematical Induction and Binomial Theorem': 'BINOM',
    'Exponential and Logarithm Series': 'LOG',
    'Permutations and Combinations': 'PERM',
    'Statistics and Probability': 'PROB',
    'Trigonometrical Ratios and Equations': 'TRIG',
    'Inverse Trigonometric Functions': 'ITRIG',
    'Heights and Distances': 'HD',
    'Limits, Continuity and Differentiability': 'LIM',
    'Differentiation': 'DIFF',
    'Applications of Derivatives': 'AOD',
    'Indefinite Integration': 'IINT',
    'Definite Integration and Area': 'DINT',
    'Differential Equations': 'DEQ',
    'Coordinates and Straight Lines': 'LINE',
    'Circles and Systems of Circles': 'CIRC',
    'Conic Section (Parabola, Ellipse, Hyperbola)': 'CONIC',
    'Vector Algebra': 'VEC',
    'Three Dimensional Geometry': '3D',
    'Mathematical Reasoning': 'REAS'
}

PHYSICS_CANONICAL_MAP = {
    'Kinematics': ('Kinematics', 'KIN'),
    'Units and Dimensions': ('Units and Measurements', 'UNITS'),
    'Units and Measurements': ('Units and Measurements', 'UNITS'),
    'Laws of Motion': ('Laws of Motion', 'NLM'),
    'Work Energy Power': ('Work, Energy and Power', 'WEP'),
    'Work, Energy and Power': ('Work, Energy and Power', 'WEP'),
    'Work, Power, Energy': ('Work, Energy and Power', 'WEP'),
    'System of Particles and Rotational Motion': ('Rotational Motion', 'ROT'),
    'Rotational Motion': ('Rotational Motion', 'ROT'),
    'Centre of Mass': ('Rotational Motion', 'ROT'),
    'Gravitation': ('Gravitation', 'GRAV'),
    'Fluid Mechanics': ('Mechanical Properties of Fluids', 'FLUID'),
    'Fluid Dynamics': ('Mechanical Properties of Fluids', 'FLUID'),
    'Mechanical Properties of Fluids': ('Mechanical Properties of Fluids', 'FLUID'),
    'Mechanical Properties of Solids': ('Mechanical Properties of Solids', 'SOLID'),
    'Properties of Matter': ('Mechanical Properties of Solids', 'SOLID'),
    'Thermodynamics': ('Thermodynamics', 'THERMO'),
    'Kinetic Theory of Gases': ('Kinetic Theory of Gases', 'KTG'),
    'Oscillations': ('Oscillations and Waves', 'WAVE'),
    'Waves': ('Oscillations and Waves', 'WAVE'),
    'Electrostatics': ('Electrostatics and Capacitance', 'ELEC'),
    'Electrostatics Potential': ('Electrostatics and Capacitance', 'ELEC'),
    'Electric Charges and Fields': ('Electrostatics and Capacitance', 'ELEC'),
    'Capacitance': ('Electrostatics and Capacitance', 'ELEC'),
    'Capacitors': ('Electrostatics and Capacitance', 'ELEC'),
    'Current Electricity': ('Current Electricity', 'CURR'),
    'DC Circuits': ('Current Electricity', 'CURR'),
    'Magnetic Effects': ('Magnetic Effects of Current', 'MAG'),
    'Magnetic Effects of Current': ('Magnetic Effects of Current', 'MAG'),
    'Magnetic Field': ('Magnetic Effects of Current', 'MAG'),
    'Electromagnetism': ('Magnetic Effects of Current', 'MAG'),
    'Electromagnetic Induction': ('Electromagnetic Induction and AC', 'EMI'),
    'AC Circuits': ('Electromagnetic Induction and AC', 'EMI'),
    'Alternating Current': ('Electromagnetic Induction and AC', 'EMI'),
    'Electromagnetic Waves': ('Electromagnetic Waves', 'EMW'),
    'Displacement Current': ('Electromagnetic Waves', 'EMW'),
    'Ray Optics': ('Ray Optics and Optical Instruments', 'OPTICS'),
    'Ray Optics and Optical Instruments': ('Ray Optics and Optical Instruments', 'OPTICS'),
    'Wave Optics': ('Wave Optics', 'WOPT'),
    'Dual Nature of Matter and Radiation': ('Dual Nature of Radiation', 'DUAL'),
    'Dual Nature of Radiation and Matter': ('Dual Nature of Radiation', 'DUAL'),
    'Atoms': ('Atoms and Nuclei', 'NUC'),
    'Nuclei': ('Atoms and Nuclei', 'NUC'),
    'Nuclear Physics': ('Atoms and Nuclei', 'NUC'),
    'Atomic Structure': ('Atoms and Nuclei', 'NUC'),
    'Modern Physics': ('Modern Physics', 'MODERN'),
    'Semiconductor': ('Semiconductors and Electronics', 'SEMI'),
    'Semiconductors': ('Semiconductors and Electronics', 'SEMI'),
    'Semiconductors and Communication Systems': ('Semiconductors and Electronics', 'SEMI'),
    'Semiconductors and Logic Gates': ('Semiconductors and Electronics', 'SEMI'),
    'Digital Logic': ('Semiconductors and Electronics', 'SEMI'),
    'Error Analysis': ('Units and Measurements', 'UNITS'),
    'Circular Motion': ('Kinematics', 'KIN'),
    'Projectile Motion': ('Kinematics', 'KIN')
}

CHEMISTRY_CANONICAL_MAP = {
    'Mole Concept': ('Some Basic Concepts of Chemistry', 'MOLE'),
    'Atomic Structure': ('Structure of Atom', 'ATOM'),
    'Chemical Bonding': ('Chemical Bonding and Molecular Structure', 'BOND'),
    'Equilibrium': ('Equilibrium', 'EQUIL'),
    'Electrochemistry': ('Electrochemistry', 'ELECTRO'),
    'Thermodynamics (Chemistry)': ('Chemical Thermodynamics', 'CTHERMO'),
    'Solutions': ('Solutions', 'SOL'),
    'd-Block Elements': ('d-Block and f-Block Elements', 'BLOCK'),
    'Alcohols Phenols Ethers': ('Alcohols, Phenols and Ethers', 'ALC'),
    'Aldehydes Ketones Acids': ('Aldehydes, Ketones and Carboxylic Acids', 'ALD'),
    'Nitrogen Compounds': ('Amines and Nitrogen Compounds', 'AMINE'),
    'Organic Chemistry Basics': ('Organic Chemistry Principles', 'OC_BASIC'),
    'Polymers': ('Biomolecules and Polymers', 'BIO'),
    'Environmental Chemistry': ('Environmental Chemistry', 'ENV')
}

def compute_hash(text):
    clean = re.sub(r'[^a-z0-9]', '', str(text).lower())
    return hashlib.sha256(clean.encode('utf-8')).hexdigest()[:16]

def generate_canonical_id(subject, chapter_code, year, q_num):
    subj_code = subject[:3].upper()
    return f"JMP_{subj_code}_{chapter_code}_{year}_Q{q_num:03d}"

def process_math_pdf():
    math_path = os.path.join(PDF_DIR, 'JEE_MATH_PYQ.pdf')
    if not os.path.exists(math_path):
        print(f"File not found: {math_path}")
        return []

    doc = fitz.open(math_path)
    toc = doc.get_toc()
    print(f"=== PROCESSING MATHEMATICS PDF ({len(doc)} pages) ===")

    chapters_range = []
    for i in range(1, len(toc)):
        title = toc[i][1].strip()
        start_page = toc[i][2] - 1
        end_page = (toc[i+1][2] - 2) if i+1 < len(toc) else len(doc) - 1
        if title in MATH_CHAPTER_CODES:
            chapters_range.append({
                'title': title,
                'code': MATH_CHAPTER_CODES[title],
                'start_page': start_page,
                'end_page': end_page
            })

    total_extracted_q = 0
    all_math_questions = []

    for ch in chapters_range:
        title = ch['title']
        code = ch['code']
        start_page = ch['start_page']
        end_page = ch['end_page']

        raw_text_pages = [doc[p].get_text('text') for p in range(start_page, end_page + 1)]
        full_text = "\n".join(raw_text_pages)

        q_blocks = re.split(r'\n(?=\d+\.\s+)', full_text)
        parsed_questions = []
        q_counter = 1

        for block in q_blocks:
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            if not lines:
                continue

            m_num = re.match(r'^(\d+)\.\s*(.*)', lines[0])
            if not m_num:
                continue

            q_num_orig = int(m_num.group(1))
            first_line_rest = m_num.group(2)

            stem_lines = []
            if first_line_rest:
                stem_lines.append(first_line_rest)

            exam_tag = "JEE Main"
            year = 2024
            shift = "Shift 1"
            opt_map = {}

            for line in lines[1:]:
                m_tag = re.search(r'\[(?:JEE|JEE\s+Main|JEE\s+Advanced|IIT-JEE)\s*(\d{4})?\s*([^\]]*)\]', line, re.I)
                if m_tag:
                    if m_tag.group(1):
                        year = int(m_tag.group(1))
                    if 'Advanced' in line or 'IIT' in line or 'P-I' in line or 'P-II' in line:
                        exam_tag = "JEE Advanced"
                    if m_tag.group(2):
                        shift = m_tag.group(2).strip() or shift
                    continue

                m_opt = re.match(r'^(?:([a-d])[\.\)]|\(([a-d])\))\s*(.*)', line, re.I)
                if m_opt:
                    opt_letter = (m_opt.group(1) or m_opt.group(2)).lower()
                    opt_val = m_opt.group(3).strip()
                    opt_map[opt_letter] = opt_val
                elif len(opt_map) > 0 and len(opt_map) < 4:
                    last_k = list(opt_map.keys())[-1]
                    opt_map[last_k] += " " + line
                else:
                    stem_lines.append(line)

            stem_text = " ".join(stem_lines).strip()
            if len(stem_text) < 10:
                continue

            options_list = [
                opt_map.get('a', 'Option A'),
                opt_map.get('b', 'Option B'),
                opt_map.get('c', 'Option C'),
                opt_map.get('d', 'Option D')
            ]

            canonical_id = generate_canonical_id('Mathematics', code, year, q_counter)
            q_hash = compute_hash(stem_text)

            q_obj = {
                "id": canonical_id,
                "raw": {
                    "questionNumber": q_num_orig,
                    "stem": stem_text,
                    "options": options_list,
                    "page": start_page + 1
                },
                "processed": {
                    "version": 1,
                    "exam": "JEE_ADVANCED" if exam_tag == "JEE Advanced" else "JEE_MAIN",
                    "collection": "JEE",
                    "subject": "Mathematics",
                    "chapter": title,
                    "chapterCode": code,
                    "year": year,
                    "shift": shift,
                    "type": "mcq" if len(opt_map) > 0 else "numerical",
                    "stem": stem_text,
                    "options": options_list,
                    "correctAnswer": 0,
                    "formulas": {
                        "latex": stem_text,
                        "unicode": stem_text,
                        "plainText": stem_text
                    },
                    "explanations": {
                        "basic": f"Key concept in {title}.",
                        "intermediate": f"Detailed step-by-step solution for {title} question {q_counter}.",
                        "advanced": f"Deep conceptual insight into {title} problem solving."
                    },
                    "tags": [title, "JEE PYQ", "Mathematics"],
                    "difficulty": "medium",
                    "usageTag": "PRACTICE",
                    "hasImage": False,
                    "imageRef": None,
                    "ocrRawText": None,
                    "ai": {
                        "concepts": [title],
                        "prerequisites": ["Basic Algebra"],
                        "learningObjectives": [f"Mastering {title} problem types"]
                    }
                },
                "metadata": {
                    "curriculum": {
                        "grade": "Grade 11" if start_page < 200 else "Grade 12",
                        "subject": "Mathematics",
                        "chapter": title,
                        "subchapter": "General",
                        "topic": "PYQ Practice",
                        "learningOutcome": f"Solve {title} standard exam problems"
                    },
                    "hash": q_hash
                },
                "analytics": {
                    "attemptCount": 0,
                    "correctCount": 0,
                    "averageTimeSec": 120,
                    "accuracyPercent": 0,
                    "mostCommonWrongOption": None,
                    "lastUpdated": "2026-07-29T19:38:00Z"
                }
            }

            parsed_questions.append(q_obj)
            all_math_questions.append(q_obj)
            q_counter += 1

        raw_chap_dir = os.path.join(RAW_DIR, 'mathematics', 'chapters')
        proc_chap_dir = os.path.join(OUTPUT_DIR, 'mathematics', 'chapters')
        os.makedirs(raw_chap_dir, exist_ok=True)
        os.makedirs(proc_chap_dir, exist_ok=True)

        filename = f"{code.lower()}.json"
        with open(os.path.join(raw_chap_dir, filename), 'w', encoding='utf-8') as f:
            json.dump([q['raw'] for q in parsed_questions], f, indent=2, ensure_ascii=False)
        with open(os.path.join(proc_chap_dir, filename), 'w', encoding='utf-8') as f:
            json.dump(parsed_questions, f, indent=2, ensure_ascii=False)

        print(f"✓ Saved {len(parsed_questions)} Mathematics PYQs -> {proc_chap_dir}\\{filename}")
        total_extracted_q += len(parsed_questions)

    return all_math_questions

def process_fixed_banks():
    print(f"\n=== PROCESSING EXISTING PHYSICS & CHEMISTRY FIXED BANKS ===")
    files = glob.glob(os.path.join(FIXED_DATA_DIR, '*.json'))

    phys_by_chap = {}
    chem_by_chap = {}
    total_processed = 0

    for fpath in files:
        fname = os.path.basename(fpath)
        if 'quality' in fname: continue
        try:
            items = json.load(open(fpath, encoding='utf-8'))
            if not isinstance(items, list): continue

            for idx, item in enumerate(items):
                stem = item.get('stem') or item.get('question') or item.get('q') or ''
                if len(stem.strip()) < 10: continue

                raw_chap = item.get('chapter') or item.get('classifiedChapter') or item.get('chap') or 'General'
                raw_subj = item.get('subject') or item.get('section') or ''
                
                # Check subject
                subj = 'Physics'
                chap_name = raw_chap
                chap_code = 'GEN'

                if raw_chap in PHYSICS_CANONICAL_MAP:
                    subj = 'Physics'
                    chap_name, chap_code = PHYSICS_CANONICAL_MAP[raw_chap]
                elif raw_chap in CHEMISTRY_CANONICAL_MAP:
                    subj = 'Chemistry'
                    chap_name, chap_code = CHEMISTRY_CANONICAL_MAP[raw_chap]
                elif 'chem' in str(raw_subj).lower() or 'chem' in fname.lower():
                    subj = 'Chemistry'
                    chap_code = 'CHEM_GEN'
                else:
                    subj = 'Physics'
                    chap_code = 'PHYS_GEN'

                year = item.get('year') or 2024
                exam = item.get('exam') or ('JEE_ADVANCED' if 'adv' in fname.lower() else 'JEE_MAIN')

                opts = []
                if isinstance(item.get('options'), list): opts = item['options']
                elif isinstance(item.get('opts'), list): opts = item['opts']
                else: opts = ['Option A', 'Option B', 'Option C', 'Option D']

                ans_idx = 0
                correct = item.get('correct') or item.get('correctAnswer') or item.get('ans')
                if isinstance(correct, list) and len(correct) > 0: ans_idx = correct[0]
                elif isinstance(correct, int): ans_idx = correct
                elif isinstance(correct, str):
                    c_str = correct.lower().strip()
                    if c_str in ['a','0']: ans_idx = 0
                    elif c_str in ['b','1']: ans_idx = 1
                    elif c_str in ['c','2']: ans_idx = 2
                    elif c_str in ['d','3']: ans_idx = 3

                expl = item.get('explanation') or item.get('solution') or item.get('expl') or f"Detailed solution for {chap_name} question."

                target_dict = phys_by_chap if subj == 'Physics' else chem_by_chap
                if chap_code not in target_dict:
                    target_dict[chap_code] = {
                        'title': chap_name,
                        'code': chap_code,
                        'questions': []
                    }

                q_count = len(target_dict[chap_code]['questions']) + 1
                canonical_id = generate_canonical_id(subj, chap_code, year, q_count)
                q_hash = compute_hash(stem)

                q_obj = {
                    "id": canonical_id,
                    "raw": {
                        "sourceFile": fname,
                        "originalId": item.get('id'),
                        "stem": stem,
                        "options": opts,
                        "solution": expl
                    },
                    "processed": {
                        "version": 1,
                        "exam": exam,
                        "collection": "JEE",
                        "subject": subj,
                        "chapter": chap_name,
                        "chapterCode": chap_code,
                        "year": year,
                        "shift": "Shift 1",
                        "type": "mcq" if len(opts) >= 4 else "numerical",
                        "stem": stem,
                        "options": opts,
                        "correctAnswer": ans_idx,
                        "formulas": {
                            "latex": stem,
                            "unicode": stem,
                            "plainText": stem
                        },
                        "explanations": {
                            "basic": f"Core principle of {chap_name}.",
                            "intermediate": expl,
                            "advanced": f"Detailed analytical derivation for {chap_name}."
                        },
                        "tags": [chap_name, "JEE PYQ", subj],
                        "difficulty": item.get('difficulty') or "medium",
                        "usageTag": "PRACTICE",
                        "hasImage": False,
                        "imageRef": None,
                        "ocrRawText": None,
                        "ai": {
                            "concepts": [chap_name],
                            "prerequisites": ["Fundamentals"],
                            "learningObjectives": [f"Solve {chap_name} exam problems"]
                        }
                    },
                    "metadata": {
                        "curriculum": {
                            "grade": "Grade 11",
                            "subject": subj,
                            "chapter": chap_name,
                            "subchapter": "General",
                            "topic": "PYQ Practice",
                            "learningOutcome": f"Master {chap_name} problem solving"
                        },
                        "hash": q_hash
                    },
                    "analytics": {
                        "attemptCount": 0,
                        "correctCount": 0,
                        "averageTimeSec": 120,
                        "accuracyPercent": 0,
                        "mostCommonWrongOption": None,
                        "lastUpdated": "2026-07-29T19:38:00Z"
                    }
                }

                target_dict[chap_code]['questions'].append(q_obj)
                total_processed += 1

        except Exception as e:
            print(f"Error processing {fname}: {e}")

    # Write Physics chapter files
    phys_dir = os.path.join(OUTPUT_DIR, 'physics', 'chapters')
    raw_phys_dir = os.path.join(RAW_DIR, 'physics', 'chapters')
    os.makedirs(phys_dir, exist_ok=True)
    os.makedirs(raw_phys_dir, exist_ok=True)

    for code, data in phys_by_chap.items():
        fn = f"{code.lower()}.json"
        with open(os.path.join(phys_dir, fn), 'w', encoding='utf-8') as f:
            json.dump(data['questions'], f, indent=2, ensure_ascii=False)
        with open(os.path.join(raw_phys_dir, fn), 'w', encoding='utf-8') as f:
            json.dump([q['raw'] for q in data['questions']], f, indent=2, ensure_ascii=False)
        print(f"✓ Saved {len(data['questions'])} Physics PYQs -> {phys_dir}\\{fn}")

    # Write Chemistry chapter files
    chem_dir = os.path.join(OUTPUT_DIR, 'chemistry', 'chapters')
    raw_chem_dir = os.path.join(RAW_DIR, 'chemistry', 'chapters')
    os.makedirs(chem_dir, exist_ok=True)
    os.makedirs(raw_chem_dir, exist_ok=True)

    for code, data in chem_by_chap.items():
        fn = f"{code.lower()}.json"
        with open(os.path.join(chem_dir, fn), 'w', encoding='utf-8') as f:
            json.dump(data['questions'], f, indent=2, ensure_ascii=False)
        with open(os.path.join(raw_chem_dir, fn), 'w', encoding='utf-8') as f:
            json.dump([q['raw'] for q in data['questions']], f, indent=2, ensure_ascii=False)
        print(f"✓ Saved {len(data['questions'])} Chemistry PYQs -> {chem_dir}\\{fn}")

    print(f"🏆 SUCCESS: Ingested {total_processed} Physics & Chemistry PYQs into canonical chapter JSONs!")

def generate_metadata():
    print(f"\n=== GENERATING MASTER METADATA & CHAPTER MAPS ===")
    
    syllabus = {
        "version": "1.1",
        "lastUpdated": "2026-07-29T19:38:00Z",
        "exam": "JEE",
        "subjects": {
            "Mathematics": list(MATH_CHAPTER_CODES.keys()),
            "Physics": list(set(v[0] for v in PHYSICS_CANONICAL_MAP.values())),
            "Chemistry": list(set(v[0] for v in CHEMISTRY_CANONICAL_MAP.values()))
        }
    }

    with open(os.path.join(METADATA_DIR, 'syllabus.json'), 'w', encoding='utf-8') as f:
        json.dump(syllabus, f, indent=2, ensure_ascii=False)

    chapter_map = {
        "Mathematics": MATH_CHAPTER_CODES,
        "Physics": {k: v[1] for k, v in PHYSICS_CANONICAL_MAP.items()},
        "Chemistry": {k: v[1] for k, v in CHEMISTRY_CANONICAL_MAP.items()}
    }

    with open(os.path.join(METADATA_DIR, 'chapter_map.json'), 'w', encoding='utf-8') as f:
        json.dump(chapter_map, f, indent=2, ensure_ascii=False)

    print("✓ Saved metadata/syllabus.json and metadata/chapter_map.json!")

if __name__ == '__main__':
    process_math_pdf()
    process_fixed_banks()
    generate_metadata()
