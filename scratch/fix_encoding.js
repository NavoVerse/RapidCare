const fs = require('fs');
try {
  let html = fs.readFileSync('C:\\Users\\DELL\\Downloads\\rapidcare_medicine_hub_full (2).html', 'utf8');
  
  // 1. Add AOS CSS
  html = html.replace('</head>', '  <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">\n</head>');
  
  // 2. Add AOS JS and initialize
  const aosInit = '<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>\n<script>AOS.init({duration: 800, once: true, offset: 50});</script>\n</body>';
  html = html.replace('</body>', aosInit);
  
  // 3. Inject Responsive CSS
  const css = `
/* ── RESPONSIVE STYLES ── */
@media (max-width: 1024px) {
  .hero { flex-direction: column; align-items: flex-start; padding: 40px 30px; }
  .hero-stats { flex-wrap: wrap; justify-content: flex-start; margin-top: 24px; }
  .content { flex-direction: column; padding: 30px; }
  .sidebar { display: none; }
  .prod-grid, .herbal-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .devices-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
  .kit-grid { grid-template-columns: 1fr; }
  .oxy-row { grid-template-columns: 1fr; }
  .oxy-main { grid-column: 1 / 2; flex-direction: column; align-items: flex-start; }
  .oxy-img-block { width: 100%; height: 200px; }
  .promo-banner { flex-direction: column; align-items: flex-start; }
  .footer-inner { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .topbar { padding: 0 20px; }
  .topbar-nav { display: none; }
  .hero { padding: 30px 20px; }
  .hero-title { font-size: 42px; }
  .hero-actions { flex-direction: column; width: 100%; align-items: stretch; }
  .btn-primary, .btn-outline { width: 100%; text-align: center; }
  .filter-row { padding: 15px 20px; }
  .search-wrap { max-width: 100%; flex: 1 1 100%; order: -1; margin-bottom: 10px; }
  .cats { flex: 1 1 100%; }
  .sort-wrap { flex: 1 1 100%; margin-left: 0; margin-top: 10px; }
  .content { padding: 20px; }
  .prod-grid, .herbal-grid { grid-template-columns: 1fr; }
  .devices-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .emerg { flex-direction: column; align-items: flex-start; gap: 15px; padding: 20px; }
  .emerg-right { width: 100%; flex-direction: column; align-items: stretch; }
  .emerg-btn { width: 100%; }
  .del-bar { flex-direction: column; padding: 15px; gap: 10px; }
  .del-item { border-right: none !important; border-bottom: 1px solid var(--sand-border); padding: 10px 0 !important; }
  .del-item:last-child { border-bottom: none; }
  .footer { padding: 30px 20px; }
  .cat-scroll { padding: 15px 20px; }
}

@media (max-width: 480px) {
  .topbar-brand { flex-direction: column; align-items: flex-start; gap: 0; }
  .topbar-sep { display: none; }
  .topbar-sub { font-size: 10px; margin-top: 2px; }
  .hero-title { font-size: 32px; }
  .hero-stats { flex-direction: column; gap: 15px; }
  .hstat { text-align: left; }
  .devices-grid { grid-template-columns: 1fr; }
  .promo-right { flex-direction: column; width: 100%; align-items: stretch; }
  .promo-stat { width: 100%; }
  .promo-btn { width: 100%; }
  .footer-inner { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; align-items: flex-start; gap: 15px; }
}
  `;
  html = html.replace('</style>', css + '\n</style>');
  
  // 4. Inject AOS Data attributes
  html = html.replace(/class="prod-card"/g, 'class="prod-card" data-aos="fade-up"');
  html = html.replace(/class="kit-card"/g, 'class="kit-card" data-aos="fade-up"');
  html = html.replace(/class="herbal-card"/g, 'class="herbal-card" data-aos="fade-up"');
  html = html.replace(/class="device-card"/g, 'class="device-card" data-aos="fade-up"');
  html = html.replace(/class="sec-hd"/g, 'class="sec-hd" data-aos="fade-up"');
  html = html.replace(/class="emerg"/g, 'class="emerg" data-aos="zoom-in"');
  html = html.replace(/class="promo-banner"/g, 'class="promo-banner" data-aos="fade-up"');
  html = html.replace(/class="hero-left"/g, 'class="hero-left" data-aos="fade-right"');
  html = html.replace(/class="hero-stats"/g, 'class="hero-stats" data-aos="fade-left"');
  html = html.replace(/class="oxy-main"/g, 'class="oxy-main" data-aos="fade-right"');
  html = html.replace(/class="oxy-side"/g, 'class="oxy-side" data-aos="fade-left"');
  html = html.replace(/class="del-item"/g, 'class="del-item" data-aos="fade-up"');

  fs.writeFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\index.html', html, 'utf8');
  console.log('Fixed encoding and injected animations!');
} catch(e) {
  console.error(e);
}
