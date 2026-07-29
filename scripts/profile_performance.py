import os
import sys
import glob
import json

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r'c:\Users\Harsha\.gemini\antigravity-ide\scratch\mentorix'
SRC_DIR = os.path.join(ROOT_DIR, 'src')

def profile_files():
    js_files = glob.glob(os.path.join(SRC_DIR, '**', '*.js'), recursive=True)
    jsx_files = glob.glob(os.path.join(SRC_DIR, '**', '*.jsx'), recursive=True)
    css_files = glob.glob(os.path.join(SRC_DIR, '**', '*.css'), recursive=True)
    html_files = glob.glob(os.path.join(SRC_DIR, '**', '*.html'), recursive=True)

    total_js_bytes = sum(os.path.getsize(f) for f in js_files + jsx_files)
    total_css_bytes = sum(os.path.getsize(f) for f in css_files)

    print("========================================")
    print("⚡ MENTORIX PERFORMANCE PROFILE REPORT")
    print("========================================")
    print(f"Total JS/JSX Files:  {len(js_files) + len(jsx_files)}")
    print(f"Total JS/JSX Size:   {total_js_bytes / (1024*1024):.2f} MB ({total_js_bytes:,} bytes)")
    print(f"Total CSS Files:     {len(css_files)}")
    print(f"Total CSS Size:      {total_css_bytes / (1024*1024):.2f} MB ({total_css_bytes:,} bytes)")

    # Top 10 largest JS files
    all_js = [(f, os.path.getsize(f)) for f in js_files + jsx_files]
    all_js.sort(key=lambda x: x[1], reverse=True)

    print("\n📦 Top 10 Largest JS Files:")
    for f, sz in all_js[:10]:
        rel = os.path.relpath(f, ROOT_DIR)
        print(f"  - {rel}: {sz / 1024:.1f} KB ({sz:,} bytes)")

    # Audit index.html scripts
    index_html = os.path.join(SRC_DIR, 'index.html')
    if os.path.exists(index_html):
        with open(index_html, encoding='utf-8') as f:
            content = f.read()
        scripts = len(glob.glob(os.path.join(SRC_DIR, '**', '*.js'), recursive=True))
        script_tags = len(re.findall(r'<script\s+[^>]*src=', content))
        css_tags = len(re.findall(r'<link\s+[^>]*rel=["\']stylesheet["\']', content))
        print(f"\n📄 index.html Load Footprint:")
        print(f"  - Total <script src=...> tags: {script_tags}")
        print(f"  - Total <link rel=stylesheet> tags: {css_tags}")

if __name__ == '__main__':
    import re
    profile_files()
