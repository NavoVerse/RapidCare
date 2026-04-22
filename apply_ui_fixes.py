import os

css_path = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare\patient_Dashboard\style.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix analytics-container padding
content = content.replace("padding: 32px 40px;", "padding: 24px;")

# Fix card border radii in analytics
content = content.replace("border-radius: 24px;", "border-radius: 16px;")

# Fix horizontal scrollbar in history detail-pane
# Find .detail-pane { and inject overflow-x: hidden;
if ".detail-pane {" in content:
    content = content.replace(".detail-pane {", ".detail-pane {\n    overflow-x: hidden;")

# Fix background colors for payments, analytics, and history
# Add a CSS rule to explicitly set their background to var(--bg-main)
background_fix = """
#analytics-view, #history-view, #payments-view {
    background-color: var(--bg-main);
}
"""
content += background_fix

with open(css_path, "w", encoding="utf-8") as f:
    f.write(content)

print("CSS UI fixes applied!")
