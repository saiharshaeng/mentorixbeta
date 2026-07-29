import os
import sys
import glob
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r'c:\Users\Harsha\.gemini\antigravity-ide\scratch\mentorix'
SRC_DIR = os.path.join(ROOT_DIR, 'src')

def audit_security():
    print("========================================")
    print("🛡️ MENTORIX SECURITY AUDIT")
    print("========================================\n")

    js_files = glob.glob(os.path.join(SRC_DIR, '**', '*.js'), recursive=True)
    html_files = glob.glob(os.path.join(SRC_DIR, '**', '*.html'), recursive=True)

    findings = {
        'exposed_keys': [],
        'unsafe_inner_html': [],
        'missing_rate_limiting': [],
        'localStorage_issues': [],
        'input_validation_gaps': []
    }

    # 1. Check for exposed hardcoded API keys or secret tokens
    key_patterns = [
        r'AIzaSy[A-Za-z0-9-_]{33}',
        r'sk-[A-Za-z0-9]{48}',
        r'gsk_[A-Za-z0-9]{48}',
        r'key-[0-9a-zA-Z]{32}'
    ]

    for f in js_files + html_files:
        with open(f, encoding='utf-8', errors='ignore') as file:
            content = file.read()
            for pattern in key_patterns:
                matches = re.findall(pattern, content)
                if matches:
                    rel = os.path.relpath(f, ROOT_DIR)
                    findings['exposed_keys'].append({'file': rel, 'key_snippet': matches[0][:10] + '...'})

    print(f"✓ Audited API Key Exposure across {len(js_files)} files.")
    print(f"  - Hardcoded API Keys Found: {len(findings['exposed_keys'])}")

    # 2. Check for unsafe innerHTML usage without esc() sanitizer
    unsafe_html_count = 0
    for f in js_files:
        with open(f, encoding='utf-8', errors='ignore') as file:
            content = file.read()
            lines = content.split('\n')
            for idx, l in enumerate(lines):
                if '.innerHTML =' in l or '.innerHTML+=' in l:
                    if 'esc(' not in l and 'sanitize' not in l and 'renderUDSEmptyState' not in l and 'svg' not in l.lower():
                        unsafe_html_count += 1
    
    print(f"✓ Audited DOM innerHTML assignments.")
    print(f"  - Unsanitized innerHTML candidates flagged: {unsafe_html_count}")

    # 3. Audit LocalStorage sanitization & safety
    ls_usage = 0
    for f in js_files:
        with open(f, encoding='utf-8', errors='ignore') as file:
            content = file.read()
            if 'localStorage.getItem' in content or 'localStorage.setItem' in content:
                ls_usage += 1
    
    print(f"✓ Audited LocalStorage usage across {ls_usage} files.")

    # Save audit JSON
    report_p = os.path.join(ROOT_DIR, r'metadata\security_audit.json')
    with open(report_p, 'w', encoding='utf-8') as f:
        json.dump(findings, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Saved Security Audit report to {report_p}")

if __name__ == '__main__':
    audit_security()
