const fs = require('fs');
let html = fs.readFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\index.html', 'utf8');

const cssToInject = `
/* ── CART SIDEBAR ── */
.cart-overlay { position: fixed; inset: 0; background: rgba(0,70,67,0.6); z-index: 99999; backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity 0.3s; }
.cart-overlay.active { opacity: 1; pointer-events: auto; }
.cart-sidebar { position: fixed; right: -400px; top: 0; bottom: 0; width: 400px; max-width: 100vw; background: var(--sand); z-index: 100000; box-shadow: -10px 0 30px rgba(0,0,0,0.15); transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; }
.cart-sidebar.active { right: 0; }
.cart-header { padding: 24px; border-bottom: 1px solid var(--sand-border); display: flex; align-items: center; justify-content: space-between; background: var(--white); }
.cart-title { font-family: var(--headline); font-size: 28px; color: var(--cyprus); letter-spacing: 0.03em; }
.cart-close { background: var(--cyprus-dim); border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--cyprus); font-size: 18px; transition: background 0.2s; }
.cart-close:hover { background: rgba(0,70,67,0.15); }
.cart-body { flex: 1; overflow-y: auto; padding: 24px; }
.cart-empty { text-align: center; color: var(--ink-faint); margin-top: 50px; font-size: 15px; font-weight: 700; }
.cart-item { background: var(--white); border-radius: 12px; padding: 14px; margin-bottom: 12px; display: flex; gap: 14px; align-items: center; border: 1px solid var(--sand-border); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.cart-item-img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
.cart-item-info { flex: 1; }
.cart-item-name { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 2px; }
.cart-item-price { font-family: var(--headline); font-size: 20px; color: var(--cyprus); }
.cart-item-qty { display: flex; align-items: center; gap: 10px; background: var(--sand); border-radius: 8px; padding: 4px 8px; }
.qty-btn { background: transparent; border: none; cursor: pointer; color: var(--cyprus); font-weight: bold; font-size: 16px; width: 20px; text-align: center; }
.qty-num { font-size: 13px; font-weight: 700; width: 15px; text-align: center; }
.cart-footer { padding: 24px; background: var(--white); border-top: 1px solid var(--sand-border); }
.cart-summary-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--ink-mid); margin-bottom: 8px; font-weight: 700; }
.cart-total-row { display: flex; justify-content: space-between; font-size: 18px; color: var(--cyprus); margin-bottom: 16px; font-family: var(--headline); font-size: 26px; border-top: 1px dashed var(--sand-border); padding-top: 12px; margin-top: 4px; }
.checkout-btn { width: 100%; background: var(--amber); color: var(--ink); border: none; border-radius: 12px; padding: 16px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: var(--body); box-shadow: 0 6px 20px rgba(245,166,35,0.3); transition: all 0.2s; position: relative; overflow: hidden; }
.checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(245,166,35,0.4); }

/* ── PRODUCT MODAL ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,70,67,0.7); z-index: 100000; backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; padding: 20px; }
.modal-overlay.active { opacity: 1; pointer-events: auto; }
.prod-modal { background: var(--white); border-radius: 24px; max-width: 800px; width: 100%; display: flex; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); transform: scale(0.95) translateY(20px); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); position: relative; }
.modal-overlay.active .prod-modal { transform: scale(1) translateY(0); }
.pm-close { position: absolute; top: 16px; right: 16px; background: var(--sand); border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 16px; cursor: pointer; color: var(--cyprus); transition: background 0.2s; z-index: 10; display:flex; align-items:center; justify-content:center;}
.pm-close:hover { background: var(--sand-dark); }
.pm-img-sec { flex: 1; background: var(--sand); display: flex; align-items: center; justify-content: center; padding: 40px; }
.pm-img { width: 100%; max-width: 300px; height: auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); object-fit:cover; aspect-ratio: 1/1; }
.pm-info-sec { flex: 1.2; padding: 40px; display: flex; flex-direction: column; }
.pm-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: var(--cyprus); text-transform: uppercase; margin-bottom: 8px; }
.pm-name { font-family: var(--headline); font-size: 42px; color: var(--ink); line-height: 1; margin-bottom: 6px; }
.pm-mol { font-size: 15px; color: var(--ink-mid); margin-bottom: 16px; font-weight: 700;}
.pm-desc { font-size: 14px; color: var(--ink-faint); line-height: 1.6; margin-bottom: 24px; }
.pm-price-wrap { display: flex; align-items: baseline; gap: 10px; margin-bottom: 30px; }
.pm-price { font-family: var(--headline); font-size: 38px; color: var(--cyprus); }
.pm-mrp { font-size: 16px; color: var(--ink-faint); text-decoration: line-through; }
.pm-actions { display: flex; gap: 14px; margin-top: auto; }
.pm-btn-cart { flex: 1; background: var(--cyprus); color: var(--white); border: none; border-radius: 12px; padding: 16px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; position: relative; overflow: hidden; }
.pm-btn-cart:hover { background: var(--cyprus-hover); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,70,67,0.2); }
.pm-btn-book { flex: 1; background: var(--amber); color: var(--ink); border: none; border-radius: 12px; padding: 16px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; position: relative; overflow: hidden;}
.pm-btn-book:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245,166,35,0.3); }

/* Ripple effect */
.ripple { position: absolute; border-radius: 50%; transform: scale(0); animation: ripple 0.6s linear; background-color: rgba(255, 255, 255, 0.4); }
@keyframes ripple { to { transform: scale(4); opacity: 0; } }

@media (max-width: 768px) {
  .prod-modal { flex-direction: column; max-height: 90vh; overflow-y: auto;}
  .pm-img-sec { padding: 30px; height: 250px; }
  .pm-img { max-height: 100%; width: auto; }
  .pm-actions { flex-direction: column; }
}
`;

const htmlToInject = `
<!-- CART SIDEBAR -->
<div class="cart-overlay" id="cartOverlay"></div>
<div class="cart-sidebar" id="cartSidebar">
  <div class="cart-header">
    <div class="cart-title">YOUR CART</div>
    <button class="cart-close" id="closeCart">✕</button>
  </div>
  <div class="cart-body" id="cartBody">
    <div class="cart-empty">Your cart is empty.</div>
  </div>
  <div class="cart-footer">
    <div class="cart-summary-row"><span>Subtotal</span><span id="cartSub">₹0</span></div>
    <div class="cart-summary-row"><span>Delivery Fee</span><span style="color:var(--green)">FREE</span></div>
    <div class="cart-total-row"><span>Total</span><span id="cartTotal">₹0</span></div>
    <button class="checkout-btn ripple-btn">Checkout securely →</button>
  </div>
</div>

<!-- PRODUCT MODAL -->
<div class="modal-overlay" id="modalOverlay">
  <div class="prod-modal" id="prodModal">
    <button class="pm-close" id="closeModal">✕</button>
    <div class="pm-img-sec">
      <img src="" alt="Product" class="pm-img" id="pmImg">
    </div>
    <div class="pm-info-sec">
      <div class="pm-tag" id="pmTag">Category</div>
      <div class="pm-name" id="pmName">Product Name</div>
      <div class="pm-mol" id="pmMol">Molecule Name</div>
      <div class="pm-desc" id="pmDesc">This is a high quality essential medicine verified by CDSCO. Sourced directly from verified manufacturers and partner pharmacies to ensure 100% genuine quality.</div>
      <div class="pm-price-wrap">
        <div class="pm-price" id="pmPrice">₹0</div>
        <div class="pm-mrp" id="pmMrp">₹0</div>
      </div>
      <div class="pm-actions">
        <button class="pm-btn-cart ripple-btn" id="pmAddToCart">🛒 Add to Cart</button>
        <button class="pm-btn-book ripple-btn" id="pmBookNow">⚡ Immediate Book</button>
      </div>
    </div>
  </div>
</div>
`;

if (!html.includes('cart-sidebar')) {
  // Inject CSS
  html = html.replace('</style>', cssToInject + '\n</style>');
  // Inject HTML
  html = html.replace('<!-- FOOTER -->', htmlToInject + '\n<!-- FOOTER -->');
  fs.writeFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\index.html', html, 'utf8');
  console.log('Injected cart and modal HTML/CSS.');
} else {
  console.log('Cart already injected.');
}
