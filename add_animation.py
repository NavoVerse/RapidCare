import os

css_path = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare\patient_Dashboard\style.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Add a universal view animation class
animation_css = """
/* Universal Tab Switching Animation */
#dashboard-view,
#details-view,
#tracking-view,
#insurance-view,
#analytics-view,
#history-view,
#payments-view {
    animation: fadeIn 0.4s ease forwards;
}
"""

with open(css_path, "a", encoding="utf-8") as f:
    f.write("\n" + animation_css)

print("Animation applied to all views.")
