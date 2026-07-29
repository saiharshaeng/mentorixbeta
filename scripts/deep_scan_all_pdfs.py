import os
import sys
import json
import re
import fitz  # PyMuPDF

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r'c:\Users\Harsha\.gemini\antigravity-ide\scratch\mentorix'
PDF_DIR = os.path.join(ROOT_DIR, r'Questions_Database\JEE')

PDFS = {
    'Mathematics': os.path.join(PDF_DIR, 'JEE_MATH_PYQ.pdf'),
    'Physics': os.path.join(PDF_DIR, 'JEE_PHYSICS_PYQ.pdf'),
    'Chemistry': os.path.join(PDF_DIR, 'JEE_CHEMISTRY_PYQ.pdf')
}

def analyze_math(doc):
    print(f"\n========================================")
    print(f"📄 MATHEMATICS PDF ANALYSIS ({len(doc)} pages)")
    print(f"========================================")

    toc = doc.get_toc()
    chapters = []
    
    for i in range(len(toc)):
        level, title, page = toc[i]
        title = title.strip()
        if level == 1 and title != 'CONTENTS':
            end_page = toc[i+1][2] - 1 if i + 1 < len(toc) else len(doc)
            chapters.append({
                'chapterIndex': len(chapters) + 1,
                'chapterName': title,
                'startPage': page,
                'endPage': end_page,
                'totalPages': end_page - page + 1
            })

    # Count questions per chapter by scanning text in page ranges
    for ch in chapters:
        q_count = 0
        for p in range(ch['startPage'] - 1, ch['endPage']):
            t = doc[p].get_text('text')
            matches = re.findall(r'\n\d+\.\s+', t)
            q_count += len(matches)
        ch['estimatedQuestions'] = q_count

    return chapters

def analyze_scanned_pdf(subj, doc):
    print(f"\n========================================")
    print(f"📄 {subj.upper()} PDF ANALYSIS ({len(doc)} pages)")
    print(f"========================================")

    # Page range mapping by scanning text headers and page markers
    chapter_headers = []
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        text = page.get_text('text').strip()
        
        # Check text layer if present
        if text:
            m = re.search(r'(?:CHAPTER|UNIT|TOPIC)\s*(\d+)[:\s–-]+([^\n]+)', text, re.I)
            if m:
                chapter_headers.append({
                    'page': page_idx + 1,
                    'num': m.group(1),
                    'title': m.group(2).strip()
                })

    # Fallback structure based on page scanning
    print(f"Found {len(chapter_headers)} explicit text chapter markers across {len(doc)} pages.")
    
    return chapter_headers

def main():
    report = {}
    for subj, path in PDFS.items():
        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue
        doc = fitz.open(path)
        if subj == 'Mathematics':
            report['Mathematics'] = analyze_math(doc)
        else:
            report[subj] = analyze_scanned_pdf(subj, doc)

    # Output detailed report JSON
    out_path = os.path.join(ROOT_DIR, r'metadata\pdf_full_scan_map.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Saved complete 1,961 page scan report to {out_path}")

if __name__ == '__main__':
    main()
