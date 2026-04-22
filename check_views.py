import re
with open("patient_Dashboard/index.html", encoding="utf-8") as f:
    html = f.read()

views = re.findall(r'<div id="[a-zA-Z0-9-]+-view"[^>]*>', html)
for v in views:
    print(v)
