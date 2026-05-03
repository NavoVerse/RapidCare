import React from 'react';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div>
        <div className="footer-brand-name">RAPIDCARE</div>
        <p className="footer-brand-desc">India's most trusted online pharmacy. CDSCO licensed, WHO-GMP certified, with 2,000+ partner pharmacies.</p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div className="footer-badge">CDSCO Licensed</div>
          <div className="footer-badge">WHO-GMP</div>
          <div className="footer-badge">ISO 9001:2015</div>
        </div>
      </div>
      <div>
        <div className="footer-col-title">SHOP</div>
        <div className="footer-link">Medicines</div>
        <div className="footer-link">Emergency Kits</div>
        <div className="footer-link">Oxygen Supply</div>
      </div>
      <div>
        <div className="footer-col-title">SUPPORT</div>
        <div className="footer-link">Track Order</div>
        <div className="footer-link">Returns Policy</div>
        <div className="footer-link">Pharmacist Chat</div>
      </div>
      <div>
        <div className="footer-col-title">COMPANY</div>
        <div className="footer-link">About RapidCare</div>
        <div className="footer-link">Careers</div>
        <div className="footer-link">Privacy Policy</div>
      </div>
    </div>
    <div className="footer-bottom">
      <div className="footer-copy">© 2025 RapidCare Medicine Hub. All rights reserved.</div>
      <div className="footer-badges">
        <div className="footer-badge">🇮🇳 Made in India</div>
        <div className="footer-badge">Helpline: 1800-RC-CARE</div>
      </div>
    </div>
  </footer>
);

export default Footer;
