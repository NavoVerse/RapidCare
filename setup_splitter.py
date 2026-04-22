import os
import re

base_dir = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare\patient_Dashboard"
html_path = os.path.join(base_dir, "index.html")
css_path = os.path.join(base_dir, "style.css")
js_path = os.path.join(base_dir, "script.js")

# 1. Update HTML
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

if "<!-- Resizer -->" not in html:
    html = html.replace(
        "<!-- Map View -->",
        "<!-- Resizer -->\n                    <div class=\"resizer\" id=\"dragMe\"></div>\n\n                    <!-- Map View -->"
    )
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

# 2. Update CSS
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Remove the old resize block
if "/* Resizable Dashboard Cards */" in css:
    css = css[:css.find("/* Resizable Dashboard Cards */")]

new_css = """
/* Resizable Dashboard Cards */
#dashboard-view .main-grid {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0; /* Let resizer provide the gap */
}

#dashboard-view .main-grid > .card:first-child {
    flex: 0 0 auto;
    width: 40%;
    min-width: 300px;
    max-width: 70%;
}

.resizer {
    width: 24px;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
    z-index: 10;
}

.resizer::after {
    content: "";
    width: 6px;
    height: 48px;
    background-color: var(--border);
    border-radius: 10px;
    transition: background-color 0.2s, height 0.2s;
}

.resizer:hover::after, .resizer.resizing::after {
    background-color: var(--primary-green);
    height: 60px;
}

#dashboard-view .main-grid > .card.tracking-card {
    flex: 1;
    min-width: 350px;
    overflow: hidden;
}

@media (max-width: 1024px) {
    #dashboard-view .main-grid {
        flex-direction: column;
        gap: 24px;
    }
    #dashboard-view .main-grid > .card:first-child {
        width: 100% !important;
        max-width: 100%;
    }
    .resizer {
        display: none;
    }
}
"""

css += new_css

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)


# 3. Update JS
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

if "dragMe" not in js:
    new_js = """
// Resizer Logic
document.addEventListener('DOMContentLoaded', () => {
    const resizer = document.getElementById('dragMe');
    if (!resizer) return;
    
    const leftSide = resizer.previousElementSibling;
    const rightSide = resizer.nextElementSibling;

    let x = 0;
    let leftWidth = 0;

    const mouseDownHandler = function (e) {
        x = e.clientX;
        leftWidth = leftSide.getBoundingClientRect().width;
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        
        leftSide.style.pointerEvents = 'none';
        rightSide.style.pointerEvents = 'none';
        leftSide.style.userSelect = 'none';
        rightSide.style.userSelect = 'none';
    };

    const mouseMoveHandler = function (e) {
        const dx = e.clientX - x;
        const parentWidth = resizer.parentNode.getBoundingClientRect().width;
        // Calculate new width in percentage to keep it responsive
        const newLeftWidth = ((leftWidth + dx) * 100) / parentWidth;
        
        // Limits
        if (newLeftWidth > 20 && newLeftWidth < 75) {
            leftSide.style.width = newLeftWidth + '%';
        }
    };

    const mouseUpHandler = function () {
        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        
        leftSide.style.pointerEvents = '';
        rightSide.style.pointerEvents = '';
        leftSide.style.userSelect = '';
        rightSide.style.userSelect = '';

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        
        // Trigger resize event for map rendering if needed
        window.dispatchEvent(new Event('resize'));
    };

    resizer.addEventListener('mousedown', mouseDownHandler);
});
"""
    js += new_js
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js)

print("Splitter logic implemented.")
