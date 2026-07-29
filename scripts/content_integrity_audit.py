import os
import sys
import glob
import json

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r'c:\Users\Harsha\.gemini\antigravity-ide\scratch\mentorix'
JEE_DIR = os.path.join(ROOT_DIR, 'src', 'data', 'pyq')

def audit_content_integrity():
    print("========================================")
    print("📚 MENTORIX CONTENT INTEGRITY AUDIT")
    print("========================================\n")

    json_files = glob.glob(os.path.join(JEE_DIR, '**', '*.json'), recursive=True)
    # Filter out master index metadata files
    json_files = [f for f in json_files if 'master_index' not in f and 'report' not in f]
    print(f"✓ Found {len(json_files)} PYQ JSON paper & chapter files in src/data/pyq/\n")

    total_questions = 0
    missing_chapter = 0
    missing_subject = 0
    missing_answer = 0
    missing_explanation = 0
    hashes = set()
    duplicate_hashes = 0
    cbt_isolation_violations = 0

    per_subject = {}

    for fpath in json_files:
        fname = os.path.basename(fpath)
        with open(fpath, encoding='utf-8') as f:
            data = json.load(f)

        if not isinstance(data, list):
            continue

        for q in data:
            total_questions += 1
            subj = q.get('subject') or 'General'
            chap = q.get('chapter') or q.get('classifiedChapter')
            ans = q.get('correct_answer') or q.get('correct') or q.get('answer')
            exp = q.get('explanation') or q.get('solution')
            q_hash = q.get('hash') or str(q.get('id'))

            if subj not in per_subject:
                per_subject[subj] = {'total': 0, 'valid_ans': 0, 'valid_exp': 0}
            per_subject[subj]['total'] += 1

            if not chap:
                missing_chapter += 1
            if not subj:
                missing_subject += 1
            if ans is None or str(ans).strip() == '':
                missing_answer += 1
            else:
                per_subject[subj]['valid_ans'] += 1

            if not exp or len(str(exp).strip()) < 5:
                missing_explanation += 1
            else:
                per_subject[subj]['valid_exp'] += 1

            if q_hash in hashes:
                duplicate_hashes += 1
            else:
                hashes.add(q_hash)

            # Audit CBT paper isolation rule: paper field must match canonical exam tag
            paper = q.get('paper') or q.get('examSource')
            if paper and ('NEET' in paper and 'JEE' in str(q.get('id'))):
                cbt_isolation_violations += 1

    print("=== AUDIT RESULTS SUMMARY ===")
    print(f"Total Questions Audited:       {total_questions}")
    print(f"Missing Chapter Metadata:       {missing_chapter}")
    print(f"Missing Subject Metadata:       {missing_subject}")
    print(f"Missing Correct Answer:         {missing_answer}")
    print(f"Missing Explanation/Solution:   {missing_explanation}")
    print(f"Unique Hashes Registered:       {len(hashes)}")
    print(f"CBT Paper Isolation Violations: {cbt_isolation_violations}\n")

    print("=== PER-SUBJECT INTEGRITY BREAKDOWN ===")
    for s, stats in per_subject.items():
        ans_pct = (stats['valid_ans'] / stats['total']) * 100
        exp_pct = (stats['valid_exp'] / stats['total']) * 100
        print(f"  [{s}] Total: {stats['total']} | Valid Answers: {stats['valid_ans']} ({ans_pct:.1f}%) | Valid Explanations: {stats['valid_exp']} ({exp_pct:.1f}%)")

    report_p = os.path.join(ROOT_DIR, r'metadata\content_integrity_audit.json')
    report = {
        'total_questions': total_questions,
        'missing_chapter': missing_chapter,
        'missing_subject': missing_subject,
        'missing_answer': missing_answer,
        'missing_explanation': missing_explanation,
        'unique_hashes': len(hashes),
        'cbt_isolation_violations': cbt_isolation_violations,
        'per_subject': per_subject
    }
    with open(report_p, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Saved Content Integrity Audit report to {report_p}")

if __name__ == '__main__':
    audit_content_integrity()
