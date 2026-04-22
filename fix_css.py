import os

base_dir = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare"
patient_css_path = os.path.join(base_dir, "patient_Dashboard", "style.css")
analytics_css_path = os.path.join(base_dir, "analytics_interface", "style.css")
history_css_path = os.path.join(base_dir, "history_patient", "style.css")

# 1. Revert patient_Dashboard/style.css
with open(patient_css_path, "r", encoding="utf-8") as f:
    patient_css = f.read()

idx = patient_css.find("/* --- ANALYTICS STYLES --- */")
if idx != -1:
    patient_css = patient_css[:idx]

# 2. Extract analytics specific CSS
with open(analytics_css_path, "r", encoding="utf-8") as f:
    analytics_css = f.read()

start_idx = analytics_css.find("/* Analytics Container */")
end_idx = analytics_css.find("/* Modal */")
analytics_core = analytics_css[start_idx:end_idx]

analytics_responsive = """
/* Analytics Responsive */
@media (max-width: 1200px) {
    .main-grid { grid-template-columns: 1fr; }
    .metrics-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
    .analytics-container { padding: 20px; }
    .metrics-grid { grid-template-columns: 1fr; }
}
"""

# 3. Extract history specific CSS
with open(history_css_path, "r", encoding="utf-8") as f:
    history_css = f.read()

start_idx_hist = history_css.find("/* History Layout */")
end_idx_hist = history_css.find("/* Transitions for dark mode */")
history_core = history_css[start_idx_hist:end_idx_hist]

history_responsive = """
/* History Responsive */
@media (max-width: 1024px) {
    .history-container {
        padding: 16px;
        gap: 16px;
    }
    .timeline-pane {
        flex: 0 0 320px;
    }
}

@media (max-width: 768px) {
    .history-container {
        flex-direction: column;
        padding: 12px;
        position: relative;
    }
    
    .timeline-pane {
        flex: 1;
        width: 100%;
    }
    
    .detail-pane {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
        display: none;
        padding: 20px;
    }
    
    .detail-pane.mobile-active {
        display: flex;
    }
    
    .detail-grid {
        grid-template-columns: 1fr;
    }
    
    .detail-card {
        grid-column: span 1 !important;
    }
}
"""

history_mobile_back = """
/* Mobile Back Button */
.mobile-back-btn {
    display: none;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    color: var(--primary-green);
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 16px;
}

@media (max-width: 768px) {
    .mobile-back-btn {
        display: flex;
    }
}
"""

# 4. Extract Modals (Sim and Booking)
sim_modal = analytics_css[analytics_css.find("/* Modal */"):analytics_css.find("/* Responsive */")]
# Replace .modal-overlay, etc. with more specific ones if needed, or leave it if patient dashboard uses it.
# Wait, patient dashboard might already have .modal-overlay.
# Let's check if patient_css has .modal-overlay
if ".modal-overlay" not in patient_css:
    modal_css = sim_modal
else:
    # If it already has it, we might not need to append it.
    # Actually, we will just append the specific parts or let it merge gracefully.
    # Since modal styles are often identical, let's just append sim_modal.
    modal_css = sim_modal

# Write back to patient_Dashboard/style.css
with open(patient_css_path, "w", encoding="utf-8") as f:
    f.write(patient_css)
    f.write("\n\n/* --- ANALYTICS STYLES --- */\n")
    f.write(analytics_core)
    f.write(analytics_responsive)
    f.write("\n\n/* --- HISTORY STYLES --- */\n")
    f.write(history_core)
    f.write(history_responsive)
    f.write(history_mobile_back)
    if ".modal-overlay" not in patient_css:
        f.write("\n\n/* --- MODAL STYLES --- */\n")
        f.write(modal_css)

print("CSS Fixed!")
