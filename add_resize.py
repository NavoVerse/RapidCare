import os

css_path = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare\patient_Dashboard\style.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

resize_css = """
/* Resizable Dashboard Cards */
#dashboard-view .main-grid {
    display: flex;
    flex-direction: row;
    align-items: stretch;
}

#dashboard-view .main-grid > .card:first-child {
    flex: 0 0 auto;
    width: 35%;
    min-width: 300px;
    max-width: 65%;
    resize: horizontal;
    overflow: auto; /* Required for CSS resize handle to appear */
    position: relative;
}

/* Custom styling for the resize handle area to make it more obvious */
#dashboard-view .main-grid > .card:first-child::-webkit-resizer {
    background-color: var(--primary-green);
    border-radius: 50%;
}

#dashboard-view .main-grid > .card:first-child::after {
    content: "↔";
    position: absolute;
    bottom: 4px;
    right: 4px;
    font-size: 14px;
    color: white;
    pointer-events: none;
    background: var(--primary-green);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}


#dashboard-view .main-grid > .card.tracking-card {
    flex: 1;
    min-width: 350px;
    overflow: hidden;
}

@media (max-width: 1024px) {
    #dashboard-view .main-grid {
        flex-direction: column;
    }
    #dashboard-view .main-grid > .card:first-child {
        width: 100% !important;
        max-width: 100%;
        resize: none;
    }
    #dashboard-view .main-grid > .card:first-child::after {
        display: none;
    }
}
"""

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css + "\n" + resize_css)

print("Resizable cards CSS added.")
