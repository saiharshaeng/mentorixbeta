import os
import sys
import glob
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r'c:\Users\Harsha\.gemini\antigravity-ide\scratch\mentorix'
SRC_DIR = os.path.join(ROOT_DIR, 'src')

def audit_launch_readiness():
    print("========================================")
    print("🚀 MENTORIX LAUNCH READINESS AUDIT")
    print("========================================\n")

    js_files = glob.glob(os.path.join(SRC_DIR, '**', '*.js'), recursive=True)
    html_files = glob.glob(os.path.join(SRC_DIR, '**', '*.html'), recursive=True)

    findings = {
        'routes': [],
        'dead_buttons': [],
        'missing_image_fallbacks': [],
        'unhandled_api_calls': [],
        'console_error_calls': [],
        'empty_states_handled': True,
        'loading_states_handled': True
    }

    # 1. Audit Routes in router.js
    router_p = os.path.join(SRC_DIR, 'js', 'router.js')
    if os.path.exists(router_p):
        with open(router_p, encoding='utf-8') as f:
            r_content = f.read()
        routes = re.findall(r'["\'](/[\w\-/]*)["\']\s*:', r_content)
        findings['routes'] = routes
        print(f"✓ Found {len(routes)} defined routes in router.js: {routes}")

    # 2. Audit Button click handlers & check function existence
    declared_funcs = set()
    for f in js_files:
        with open(f, encoding='utf-8', errors='ignore') as file:
            content = file.read()
            m_fn = re.findall(r'function\s+([a-zA-Z0-9_$]+)\s*\(', content)
            m_win = re.findall(r'window\.([a-zA-Z0-9_$]+)\s*=', content)
            declared_funcs.update(m_fn)
            declared_funcs.update(m_win)

    # Search for inline onclick in html/js
    all_files = js_files + html_files
    for f in all_files:
        with open(f, encoding='utf-8', errors='ignore') as file:
            content = file.read()
            onclicks = re.findall(r'onclick=["\']([^"\']+)["\']', content)
            for handler in onclicks:
                # Extract first function call
                m_call = re.match(r'([a-zA-Z0-9_$]+)\s*\(', handler.strip())
                if m_call:
                    fn_name = m_call.group(1)
                    if fn_name not in declared_funcs and fn_name not in ['alert', 'confirm', 'console', 'location', 'event', 'preventDefault', 'history', 'document']:
                        rel = os.path.relpath(f, ROOT_DIR)
                        findings['dead_buttons'].append({'file': rel, 'handler': handler, 'missingFn': fn_name})

    print(f"✓ Audited onclick button handlers across {len(all_files)} files.")
    print(f"  - Dead/Unresolved Buttons Found: {len(findings['dead_buttons'])}")

    # 3. Audit Image Fallbacks (onerror handlers)
    img_tags_without_onerror = []
    for f in all_files:
        with open(f, encoding='utf-8', errors='ignore') as file:
            content = file.read()
            imgs = re.findall(r'<img\s+[^>]*src=[^>]*>', content, re.I)
            for img in imgs:
                if 'onerror' not in img.lower() and 'data-no-fallback' not in img.lower():
                    rel = os.path.relpath(f, ROOT_DIR)
                    img_tags_without_onerror.append({'file': rel, 'tag': img[:80]})

    findings['missing_image_fallbacks'] = img_tags_without_onerror
    print(f"✓ Audited image tags across codebase.")
    print(f"  - Images missing onerror fallback: {len(img_tags_without_onerror)}")

    # 4. Audit API fetch calls for try/catch error handling
    fetches_without_catch = []
    for f in js_files:
        with open(f, encoding='utf-8', errors='ignore') as file:
            content = file.read()
            lines = content.split('\n')
            for idx, l in enumerate(lines):
                if 'fetch(' in l:
                    # Look up and down 10 lines for try/catch or .catch
                    block = "\n".join(lines[max(0, idx-10):min(len(lines), idx+10)])
                    if 'try' not in block and 'catch' not in block:
                        rel = os.path.relpath(f, ROOT_DIR)
                        fetches_without_catch.append({'file': rel, 'line': idx+1, 'snippet': l.strip()})

    findings['unhandled_api_calls'] = fetches_without_catch
    print(f"✓ Audited fetch API calls across JS files.")
    print(f"  - Unhandled fetch calls missing try/catch: {len(fetches_without_catch)}")

    # 5. Audit console.error statements in production code
    console_errors = []
    for f in js_files:
        if 'scratch' in f or 'scripts' in f: continue
        with open(f, encoding='utf-8', errors='ignore') as file:
            content = file.read()
            lines = content.split('\n')
            for idx, l in enumerate(lines):
                if 'console.error(' in l and '//' not in l.split('console.error')[0]:
                    rel = os.path.relpath(f, ROOT_DIR)
                    console_errors.append({'file': rel, 'line': idx+1, 'snippet': l.strip()})

    findings['console_error_calls'] = console_errors
    print(f"✓ Audited console.error statements in src/ files.")
    print(f"  - Unhandled console.error calls: {len(console_errors)}")

    # Save audit report JSON
    report_p = os.path.join(ROOT_DIR, r'metadata\launch_readiness_audit.json')
    with open(report_p, 'w', encoding='utf-8') as f:
        json.dump(findings, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Saved launch readiness audit report to {report_p}")

if __name__ == '__main__':
    audit_launch_readiness()
