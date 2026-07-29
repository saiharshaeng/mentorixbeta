import os
import sys
import json
import re
import glob

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r'c:\Users\Harsha\.gemini\antigravity-ide\scratch\mentorix'
Q_DIR = os.path.join(ROOT_DIR, r'questions\jee')
ASSETS_DIR = os.path.join(ROOT_DIR, r'assets\images')
REPORT_PATH = os.path.join(ROOT_DIR, r'metadata\integration_report.json')

def audit_dataset():
    files = glob.glob(os.path.join(Q_DIR, '**', '*.json'), recursive=True)
    
    report = {
        'totalIntegrated': 0,
        'totalRejected': 0,
        'healthScores': {
            'score100': 0,
            'score95': 0,
            'score70': 0,
            'needsReview': 0
        },
        'perSubjectStats': {
            'Mathematics': {'total': 0, 'withImages': 0, 'missingImages': 0, 'withLatex': 0, 'withExpl': 0, 'duplicates': 0, 'needsReview': 0},
            'Physics': {'total': 0, 'withImages': 0, 'missingImages': 0, 'withLatex': 0, 'withExpl': 0, 'duplicates': 0, 'needsReview': 0},
            'Chemistry': {'total': 0, 'withImages': 0, 'missingImages': 0, 'withLatex': 0, 'withExpl': 0, 'duplicates': 0, 'needsReview': 0}
        },
        'duplicateHashes': set(),
        'brokenImages': [],
        'rejectedQuestions': []
    }

    seen_hashes = set()

    for fpath in files:
        try:
            questions = json.load(open(fpath, encoding='utf-8'))
            if not isinstance(questions, list): continue

            for q in questions:
                subj = q.get('processed', {}).get('subject') or 'Physics'
                if subj not in report['perSubjectStats']:
                    subj = 'Physics'
                
                stats = report['perSubjectStats'][subj]
                report['totalIntegrated'] += 1
                stats['total'] += 1

                p = q.get('processed', q)
                m = q.get('metadata', {})
                stem = p.get('stem') or p.get('q') or ''
                opts = p.get('options') or p.get('opts') or []
                ans = p.get('correctAnswer')
                expl = p.get('explanations', {}).get('intermediate') or p.get('expl') or ''
                q_hash = m.get('hash') or ''

                # Duplicate Hash Check
                if q_hash and q_hash in seen_hashes:
                    stats['duplicates'] += 1
                    report['duplicateHashes'].add(q_hash)
                else:
                    if q_hash: seen_hashes.add(q_hash)

                # LaTeX Check
                has_latex = '\\(' in stem or '\\[' in stem or '\\ce{' in stem or '$' in stem
                if has_latex:
                    stats['withLatex'] += 1

                # Explanation Check
                if expl and len(str(expl).strip()) > 10:
                    stats['withExpl'] += 1

                # Image Integrity Check
                has_img = p.get('hasImage') or p.get('imageRef')
                if has_img:
                    stats['withImages'] += 1
                    img_ref = p.get('imageRef')
                    if img_ref:
                        clean_ref = img_ref.lstrip('/')
                        full_img_p = os.path.join(ROOT_DIR, clean_ref)
                        if not os.path.exists(full_img_p):
                            stats['missingImages'] += 1
                            report['brokenImages'].append({
                                'id': q.get('id'),
                                'imageRef': img_ref
                            })

                # Health Scoring Engine
                score = 100
                issues = []

                if not stem or len(stem.strip()) < 10:
                    score = 0
                    issues.append('Empty stem')
                if not opts or len(opts) < 2:
                    score = 0
                    issues.append('Fewer than 2 options')
                if ans is None:
                    score -= 30
                    issues.append('Missing answer index')

                # Unbalanced LaTeX brackets
                if stem.count('\\(') != stem.count('\\)'):
                    score -= 15
                    issues.append('Unbalanced LaTeX delimiters')

                if score == 100:
                    report['healthScores']['score100'] += 1
                elif score >= 95:
                    report['healthScores']['score95'] += 1
                elif score >= 70:
                    report['healthScores']['score70'] += 1
                else:
                    report['healthScores']['needsReview'] += 1
                    stats['needsReview'] += 1

        except Exception as e:
            print(f"Error auditing file {fpath}: {e}")

    report['duplicateHashesCount'] = len(report['duplicateHashes'])
    del report['duplicateHashes']  # Not serializable as set

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("\n========================================")
    print("🏆 FULL QUESTION INTELLIGENCE ENGINE INTEGRATION REPORT")
    print("========================================")
    print(f"Total Questions Audited & Integrated: {report['totalIntegrated']}")
    print(f"Health Score 100% (Perfect): {report['healthScores']['score100']} ({report['healthScores']['score100']/report['totalIntegrated']*100:.1f}%)")
    print(f"Health Score 95%: {report['healthScores']['score95']}")
    print(f"Health Score 70%: {report['healthScores']['score70']}")
    print(f"Needs Review: {report['healthScores']['needsReview']}")
    print(f"Duplicate Hashes Flagged: {report['duplicateHashesCount']}")
    print(f"\nPer Subject Statistics:")
    for s, st in report['perSubjectStats'].items():
        print(f"  [{s}] Total: {st['total']} | Explanations: {st['withExpl']} | LaTeX: {st['withLatex']} | Duplicates: {st['duplicates']}")

    print(f"\n✓ Saved report JSON to {REPORT_PATH}")

if __name__ == '__main__':
    audit_dataset()
