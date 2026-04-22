import os
import re

base_dir = r"c:\Users\upal5\OneDrive\Documents\GitHub\RapidCare\patient_Dashboard"
html_path = os.path.join(base_dir, "index.html")

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Replace sidebar tab text
html = re.sub(
    r'<a href="#" class="nav-item"\s*data-view="payments">\s*([\s\S]*?)<span>Payments</span>\s*</a>',
    r'<a href="#" class="nav-item" data-view="payments">\n\1<span>Payment History</span>\n            </a>',
    html
)

# 2. Extract out the old #payments-view and replace it
start_idx = html.find('<!-- Payment View -->')
end_idx = html.find('<!-- Edit Modal -->')

if start_idx != -1 and end_idx != -1:
    new_payments_view = """<!-- Payment View -->
        <div id="payments-view" style="display: none;">
            <div class="dashboard-container">
                <div class="card">
                    <div class="card-header" style="margin-bottom: 24px;">
                        <h3>Payment History</h3>
                        <div class="filters-row" style="margin-top: 16px;">
                            <span class="filter-chip active">All Payments</span>
                            <span class="filter-chip">Ambulance</span>
                            <span class="filter-chip">Consultations</span>
                            <span class="filter-chip">Pharmacy</span>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Service Type</th>
                                    <th>Provider / Detail</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>22 Apr 2026</td>
                                    <td>Emergency Ambulance</td>
                                    <td>Apollo Gleneagles</td>
                                    <td class="amt" style="font-weight: 700;">₹500</td>
                                    <td><span class="badge-insurance approved">Paid</span></td>
                                    <td><a href="#" style="color: var(--primary-green); text-decoration: none; font-weight: 600;">Download</a></td>
                                </tr>
                                <tr>
                                    <td>15 Mar 2026</td>
                                    <td>Cardiology Consultation</td>
                                    <td>Dr. Sarah Mitchell</td>
                                    <td class="amt" style="font-weight: 700;">₹1,200</td>
                                    <td><span class="badge-insurance approved">Paid</span></td>
                                    <td><a href="#" style="color: var(--primary-green); text-decoration: none; font-weight: 600;">Download</a></td>
                                </tr>
                                <tr>
                                    <td>10 Jan 2026</td>
                                    <td>Lab Test (Blood Work)</td>
                                    <td>City Lab Diagnostics</td>
                                    <td class="amt" style="font-weight: 700;">₹850</td>
                                    <td><span class="badge-insurance approved">Paid</span></td>
                                    <td><a href="#" style="color: var(--primary-green); text-decoration: none; font-weight: 600;">Download</a></td>
                                </tr>
                                <tr>
                                    <td>03 Nov 2025</td>
                                    <td>Pharmacy Prescription</td>
                                    <td>RapidCare Meds</td>
                                    <td class="amt" style="font-weight: 700;">₹430</td>
                                    <td><span class="badge-insurance approved">Paid</span></td>
                                    <td><a href="#" style="color: var(--primary-green); text-decoration: none; font-weight: 600;">Download</a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        """
    html = html[:start_idx] + new_payments_view + html[end_idx:]

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Payment History view implemented!")
