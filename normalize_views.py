import os
import re

html_path = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare\patient_Dashboard\index.html"
css_path = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare\patient_Dashboard\style.css"

# 1. Update index.html inline styles to be clean
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Replace history-view inline styles
html = re.sub(
    r'<div id="history-view" style="display: none;[^"]*">',
    r'<div id="history-view" style="display: none;">',
    html
)

# Replace analytics-view inline styles
html = re.sub(
    r'<div id="analytics-view" style="display: none;[^"]*">',
    r'<div id="analytics-view" style="display: none;">',
    html
)

# Replace payments-view inline styles
html = re.sub(
    r'<div id="payments-view" style="display: none;[^"]*">',
    r'<div id="payments-view" style="display: none;">',
    html
)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

# 2. Update style.css to handle views properly
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Append specific rules for views
views_css = """
#history-view {
    height: calc(100vh - 90px);
    display: flex;
    flex-direction: column;
}

#analytics-view {
    /* Main content handles scrolling, just add padding if container lacks it, 
       but .analytics-container handles it. */
    width: 100%;
}

#payments-view {
    padding: 32px; /* Match dashboard-container */
    width: 100%;
}
"""
css += views_css

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Views layout normalized.")
