import re

css_path = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare\patient_Dashboard\style.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# 1. Update body
css = re.sub(
    r'body\s*\{[^}]*\}',
    r'body {\n    background-color: var(--bg-main);\n    color: var(--text-main);\n    display: flex;\n    height: 100vh;\n    overflow: hidden;\n}',
    css, count=1
)

# 2. Update .main-content
css = re.sub(
    r'\.main-content\s*\{[^}]*\}',
    r'.main-content {\n    flex-grow: 1;\n    display: flex;\n    flex-direction: column;\n    overflow: hidden;\n    height: 100vh;\n}',
    css, count=1
)

# 3. Ensure header has flex-shrink: 0
if "flex-shrink: 0;" not in re.search(r'header\s*\{[^}]*\}', css).group():
    css = re.sub(
        r'(header\s*\{[^}]*)(\})',
        r'\1    flex-shrink: 0;\n\2',
        css, count=1
    )

# 4. Remove previous #history-view, #analytics-view, #payments-view rules added by normalize_views.py
css = re.sub(r'#history-view\s*\{[^}]*\}', '', css)
css = re.sub(r'#analytics-view\s*\{[^}]*\}', '', css)
css = re.sub(r'#payments-view\s*\{[^}]*\}', '', css)
css = re.sub(r'#analytics-view, #history-view, #payments-view\s*\{[^}]*\}', '', css)

# 5. Add universal rules for the views
view_rules = """
/* View Scrolling and Layout Rules */
#dashboard-view,
#details-view,
#tracking-view,
#insurance-view,
#analytics-view,
#payments-view {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
}

#history-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

#analytics-view, #history-view, #payments-view {
    background-color: var(--bg-main);
}

#payments-view {
    padding: 32px;
}
"""

css += view_rules

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Scrolling logic updated!")
