import os
import re

base_dir = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare"
patient_html = os.path.join(base_dir, "patient_Dashboard", "index.html")
analytics_html = os.path.join(base_dir, "analytics_interface", "index.html")
history_html = os.path.join(base_dir, "history_patient", "index.html")

def extract_content(file_path, start_marker, end_marker=None):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_idx = content.find(start_marker)
    if start_idx == -1: return ""
    
    if end_marker:
        end_idx = content.find(end_marker, start_idx)
        if end_idx == -1: return ""
        return content[start_idx:end_idx]
    return content[start_idx:]

# Extract Analytics
analytics_content = extract_content(analytics_html, '<div class="analytics-container">', '</main>')
analytics_modal = extract_content(analytics_html, '<!-- Simulation Modal -->', '<script')

# Extract History
history_content = extract_content(history_html, '<div class="history-container">', '</main>')
history_modal = extract_content(history_html, '<!-- Booking Modal -->', '<script')

# Build the injected views
injected_html = f"""
        <div id="analytics-view" style="display: none; flex-grow: 1; overflow-y: auto; padding: 20px;">
            {analytics_content}
        </div>
        {analytics_modal}
        
        <div id="history-view" style="display: none; flex-grow: 1; overflow-y: auto; padding: 20px;">
            {history_content}
        </div>
        {history_modal}
"""

# Inject into patient dashboard
with open(patient_html, 'r', encoding='utf-8') as f:
    patient_content = f.read()

target_marker = '<!-- Payment View -->'
if target_marker in patient_content:
    patient_content = patient_content.replace(target_marker, injected_html + "\n        " + target_marker)
    with open(patient_html, 'w', encoding='utf-8') as f:
        f.write(patient_content)
    print("Injected HTML successfully.")
else:
    print("Target marker not found in patient_Dashboard/index.html")

# Append CSS
with open(os.path.join(base_dir, "patient_Dashboard", "style.css"), 'a', encoding='utf-8') as f:
    f.write("\n\n/* --- ANALYTICS STYLES --- */\n")
    with open(os.path.join(base_dir, "analytics_interface", "style.css"), 'r', encoding='utf-8') as af:
        f.write(af.read())
    f.write("\n\n/* --- HISTORY STYLES --- */\n")
    with open(os.path.join(base_dir, "history_patient", "style.css"), 'r', encoding='utf-8') as hf:
        f.write(hf.read())
print("Appended CSS successfully.")

# Append JS
def filter_js(js_content):
    # Remove DOMContentLoaded wrapper to avoid variable redeclaration scope issues if any,
    # or just let it be if it's fine. It's safer to just append it since they use document.addEventListener('DOMContentLoaded')
    # Actually analytics_interface/script.js has some const declarations inside DOMContentLoaded that might be okay.
    # history_patient/script.js has top-level consts and an init() call. It's fine to just append.
    return js_content

with open(os.path.join(base_dir, "patient_Dashboard", "script.js"), 'a', encoding='utf-8') as f:
    f.write("\n\n// --- ANALYTICS SCRIPT --- \n")
    with open(os.path.join(base_dir, "analytics_interface", "script.js"), 'r', encoding='utf-8') as af:
        f.write(filter_js(af.read()))
    f.write("\n\n// --- HISTORY SCRIPT --- \n")
    with open(os.path.join(base_dir, "history_patient", "script.js"), 'r', encoding='utf-8') as hf:
        f.write(filter_js(hf.read()))
print("Appended JS successfully.")
