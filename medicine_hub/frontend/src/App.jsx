import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, X, Plus, Minus, Camera, Activity, Star } from 'lucide-react';
import { allProducts } from './products.js';
import './App.css';

// Components
import EmergencyBanner from './components/EmergencyBanner';
import TrustStrip from './components/TrustStrip';
import KitSection from './components/KitSection';
import OxygenSection from './components/OxygenSection';
import DeliveryBar from './components/DeliveryBar';
import Footer from './components/Footer';

// ── Medicine Purchase Receipt ──
function showMedicineReceipt(cart, total, paymentId, orderId) {
  const existing = document.querySelector('.receipt-overlay');
  if (existing) existing.remove();
  const itemRows = cart.map((item, i) =>
    `<div class="receipt-row" style="animation-delay:${0.25 + i * 0.06}s">
      <span>${item.name} × ${item.qty}</span>
      <span>₹${item.price * item.qty}</span>
    </div>`
  ).join('');
  const now = new Date();
  const invoiceNo = 'MH-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + '-' + String(Date.now()).slice(-6);
  const overlay = document.createElement('div');
  overlay.className = 'receipt-overlay';
  overlay.innerHTML = `<style>
    .receipt-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s}
    .receipt-overlay.show{opacity:1}
    .receipt-card{background:#fff;border-radius:20px;width:440px;max-width:94vw;max-height:90vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.25);transform:scale(.85) translateY(30px);transition:transform .4s cubic-bezier(.34,1.56,.64,1);padding:32px 28px}
    .receipt-overlay.show .receipt-card{transform:scale(1) translateY(0)}
    .receipt-check{width:64px;height:64px;border-radius:50%;background:#059669;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;animation:rc-in .4s cubic-bezier(.34,1.56,.64,1) .2s both}
    .receipt-check::after{content:'';width:20px;height:10px;border-left:3px solid #fff;border-bottom:3px solid #fff;transform:rotate(-45deg) translateY(-2px)}
    @keyframes rc-in{0%{transform:scale(0)}100%{transform:scale(1)}}
    .receipt-header{text-align:center;margin-bottom:16px}
    .receipt-header h2{margin:0;font-size:1.3rem;color:#059669;font-weight:700}
    .receipt-header p{margin:4px 0 0;font-size:.85rem;color:#64748b}
    .receipt-divider{height:1px;background:linear-gradient(90deg,transparent,#cbd5e1,transparent);margin:14px 0}
    .receipt-row{display:flex;justify-content:space-between;padding:4px 0;font-size:.88rem;color:#334155;opacity:0;transform:translateY(8px);animation:rc-up .3s ease forwards}
    .receipt-row.label{color:#64748b;font-size:.82rem}
    .receipt-row.total{font-weight:700;font-size:1rem;color:#059669;border-top:1.5px dashed #cbd5e1;margin-top:6px;padding-top:12px}
    @keyframes rc-up{to{opacity:1;transform:translateY(0)}}
    .receipt-actions{display:flex;gap:10px;margin-top:20px}
    .receipt-actions button{flex:1;padding:12px;border:none;border-radius:12px;font-weight:600;font-size:.9rem;cursor:pointer;transition:all .2s}
    .btn-print{background:#059669;color:#fff}
    .btn-print:hover{background:#047857}
    .btn-close{background:#f1f5f9;color:#475569}
    .btn-close:hover{background:#e2e8f0}
    .receipt-items{max-height:200px;overflow-y:auto;margin:8px 0}
    .receipt-items::-webkit-scrollbar{width:4px}
    .receipt-items::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
    @media print{body *{visibility:hidden}.receipt-overlay,.receipt-overlay *{visibility:visible}.receipt-overlay{position:absolute;opacity:1!important;background:none;backdrop-filter:none}.receipt-card{box-shadow:none;transform:none!important;border:1px solid #e2e8f0}.receipt-actions{display:none}.receipt-row{opacity:1!important;transform:none!important}}
  </style>
  <div class="receipt-card">
    <div class="receipt-check"></div>
    <div class="receipt-header">
      <h2>Order Confirmed</h2>
      <p>RapidCare Medicine Hub</p>
      <span style="display:inline-block;padding:3px 14px;border-radius:20px;font-size:.75rem;font-weight:600;background:#d1fae5;color:#065f46;margin-top:8px">● Paid</span>
    </div>
    <div class="receipt-divider"></div>
    <div class="receipt-row label" style="animation-delay:.1s"><span>Invoice</span><span>${invoiceNo}</span></div>
    <div class="receipt-row label" style="animation-delay:.13s"><span>Date</span><span>${now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} ${now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span></div>
    <div class="receipt-divider"></div>
    <div class="receipt-items">${itemRows}</div>
    <div class="receipt-divider"></div>
    <div class="receipt-row label" style="animation-delay:.45s"><span>Items</span><span>${cart.length}</span></div>
    <div class="receipt-row total" style="animation-delay:.5s"><span>Total Paid</span><span>₹${total}</span></div>
    <div style="font-size:.75rem;color:#94a3b8;text-align:center;animation:rc-up .3s .55s both;margin-top:10px">Transaction: ${paymentId}${orderId ? '<br>Order: ' + orderId : ''}</div>
    <div class="receipt-actions">
      <button class="btn-print" onclick="window.print()">📄 Download / Print</button>
      <button class="btn-close" onclick="this.closest('.receipt-overlay').remove()">Close</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

function App() {
  const [medicines, setMedicines] = useState([]);
  const [kits, setKits] = useState([]);
  const [oxygen, setOxygen] = useState(null);
  const [devices, setDevices] = useState([]);
  const [ayurveda, setAyurveda] = useState([]);

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('rc-cart') || '[]'));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);

  // Use local product data
  useEffect(() => {
    setMedicines(allProducts);
  }, []);

  useEffect(() => {
    localStorage.setItem('rc-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchAll();
  }, []);

  // Filter products locally
  const filteredMedicines = useMemo(() => {
    let result = medicines;
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.molecule.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [medicines, activeCategory, searchQuery]);

  const fetchAll = async () => {
    // kits, oxygen, devices, ayurveda still fetched — keep those working
    try {
      const res = await Promise.all([
        fetch('https://rapidcare-backend-mcg2.onrender.com/api/kits').then(r => r.json()).catch(() => []),
        fetch('https://rapidcare-backend-mcg2.onrender.com/api/oxygen').then(r => r.json()).catch(() => null),
        fetch('https://rapidcare-backend-mcg2.onrender.com/api/devices').then(r => r.json()).catch(() => []),
        fetch('https://rapidcare-backend-mcg2.onrender.com/api/ayurveda').then(r => r.json()).catch(() => [])
      ]);
      setKits(res[0]); setOxygen(res[1]); setDevices(res[2]); setAyurveda(res[3]);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`https://rapidcare-backend-mcg2.onrender.com/api/medicines`, {
        params: { category: activeCategory, search: searchQuery }
      });
      setMedicines(response.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, clearCart, setIsCartOpen, cartTotal, cartCount }}>
      <div className="hub">
        <Topbar cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
        
        <main>
          <Hero onOpenRx={() => setIsRxModalOpen(true)} />
          <TrustStrip />

          <div className="filter-row">
            <div className="search-wrap">
              <Search size={18} color="#9a9a90" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search medicines, brands..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="cats">
              {['All', 'Pain Relief', 'Antibiotics', 'Cardiac Care', 'Diabetes', 'Supplements'].map(cat => (
                <button 
                  key={cat} 
                  className={`cat ${activeCategory === cat ? 'on' : 'off'}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="content">
            <aside className="sidebar">
              <Sidebar activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
            </aside>
            
            <section className="main">
              <EmergencyBanner />
              
              <div id="section-medicines" className="sec-hd">
                <h2 className="sec-title">ESSENTIAL MEDICINES</h2>
                <div className="sec-link">View all →</div>
              </div>
              <div className="prod-grid">
                <AnimatePresence>
                  {filteredMedicines.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </div>

              <KitSection kits={kits} />
              <OxygenSection data={oxygen} />
              
              <div className="sec-hd">
                <h2 className="sec-title">MEDICAL DEVICES</h2>
              </div>
              <div className="devices-grid">
                {devices.map(device => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>

              <div className="sec-hd">
                <h2 className="sec-title">AYURVEDA & HERBAL</h2>
              </div>
              <div className="herbal-grid">
                {ayurveda.map(item => (
                  <HerbalCard key={item.id} item={item} />
                ))}
              </div>

              <DeliveryBar />
            </section>
          </div>
        </main>

        <Footer />
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <RxModal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} />
      </div>
    </CartContext.Provider>
  );
}

// Sub-components
const Topbar = ({ cartCount, onOpenCart }) => (
  <nav className="topbar">
    <div className="topbar-brand">
      <div className="topbar-rc">RAPIDCARE</div>
      <div className="topbar-sep"></div>
      <div className="topbar-sub">MEDICINE HUB</div>
    </div>
    <div className="topbar-right">
      <button className="cart-btn" onClick={onOpenCart}>
        <ShoppingCart size={18} />
        Cart <span className="cart-badge">{cartCount}</span>
      </button>
    </div>
  </nav>
);

const Hero = ({ onOpenRx }) => (
  <section className="hero">
    <motion.div 
      initial={{ opacity: 0, x: -50 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="hero-left"
    >
      <div className="hero-eyebrow">RAPIDCARE / PATIENT PORTAL</div>
      <h1 className="hero-title">MEDICINE<br /><span>HUB</span></h1>
      <p className="hero-desc">India's most trusted online pharmacy — medicines delivered in 30 minutes.</p>
      <div className="hero-actions">
        <button className="btn-primary">Shop now</button>
        <button className="btn-outline" onClick={onOpenRx}>🚨 Upload Rx</button>
      </div>
    </motion.div>
    <div className="hero-stats">
      <Stat num="2,000+" label="PHARMACIES" />
      <Stat num="30 min" label="DELIVERY" />
    </div>
  </section>
);

const Stat = ({ num, label }) => (
  <div className="hstat">
    <div className="hstat-num">{num}</div>
    <div className="hstat-label">{label}</div>
  </div>
);

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const rating = (4 + Math.random() * 1).toFixed(1);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="prod-card"
    >
      <div className="prod-img-wrap">
        <div className={`prod-img ${product.rx ? 'rx-bg' : 'otc-bg'}`}>
          <img src={product.img} alt={product.name} loading="lazy" />
        </div>
        {product.rx && <span className="prod-badge rx">Rx</span>}
        <span className="prod-badge discount">-{product.discount}</span>
        <button className="prod-wish" onClick={(e) => { e.stopPropagation(); }}>♡</button>
      </div>
      <div className="prod-body">
        <div className="prod-tag">{product.category}</div>
        <div className="prod-name">{product.name}</div>
        <div className="prod-mfr">{product.molecule}</div>
        <div className="prod-rating">
          <Star size={12} fill="#f5a623" color="#f5a623" />
          <span>{rating}</span>
          <span className="prod-rating-count">({Math.floor(Math.random() * 500 + 50)})</span>
        </div>
        <div className="prod-pack">{product.pack}</div>
        <div className="prod-foot">
          <div className="prod-price-wrap">
            <div className="prod-price">₹{product.price}</div>
            <div className="prod-mrp">MRP <span>₹{product.mrp}</span></div>
          </div>
          <button className="add-btn" onClick={() => addToCart(product)}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const DeviceCard = ({ device }) => {
  const { addToCart } = useCart();
  return (
    <div className="device-card">
      <div className="device-img"><img src={device.img} alt={device.name} /></div>
      <div className="device-body">
        <div className="prod-tag">{device.category}</div>
        <div className="device-name">{device.name}</div>
        <div className="device-sub">{device.sub}</div>
        <div className="device-price">₹{device.price}</div>
        <button className="add-btn" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }} onClick={() => addToCart(device)}>Add</button>
      </div>
    </div>
  );
};

const HerbalCard = ({ item }) => {
  const { addToCart } = useCart();
  return (
    <div className="herbal-card">
      <div className="herbal-img"><img src={item.img} alt={item.name} /></div>
      <div className="herbal-body">
        <div className="herbal-tag">{item.category}</div>
        <div className="herbal-name">{item.name}</div>
        <div className="herbal-sub">{item.sub}</div>
        <div className="herbal-foot">
          <div className="herbal-price">₹{item.price}</div>
          <button className="add-btn" onClick={() => addToCart(item)}>Add</button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ activeCategory, onSelectCategory }) => (
  <>
    <div className="sb-section">
      <h3 className="sb-title">CATEGORIES</h3>
      {['All', 'Pain Relief', 'Antibiotics', 'Cardiac Care', 'Diabetes', 'Respiratory', 'Supplements'].map(cat => (
        <div 
          key={cat} 
          className={`sb-item ${activeCategory === cat ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat)}
        >
          <div className={`sb-item-dot ${activeCategory === cat ? '' : 'off'}`}></div>
          <div className="sb-item-text">{cat}</div>
        </div>
      ))}
    </div>
    <div className="sb-promo">
      <div className="sb-promo-label">PRESCRIPTION</div>
      <div className="sb-promo-title">UPLOAD & ORDER</div>
      <div className="sb-promo-sub">Deliver within 30 minutes.</div>
      <button className="sb-promo-btn">📷 Upload Rx</button>
    </div>
  </>
);

const CartSidebar = ({ isOpen, onClose }) => {
  const { cart, updateQty, clearCart, cartTotal } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!window.Razorpay) return alert('Razorpay SDK failed to load. Check your internet.');
    setLoading(true);
    try {
      const res = await fetch('https://rapidcare-backend-mcg2.onrender.com/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(cartTotal), currency: 'INR' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Order creation failed');

      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'RapidCare Medicine Hub',
        description: 'Medicines & Healthcare',
        order_id: data.order.id,
        prefill: { contact: '', email: '' },
        theme: { color: '#004643' },
        handler: async (response) => {
            // Save cart snapshot before any state changes
            const items = [...cart];
            const total = cartTotal;
          try {
            await fetch('https://rapidcare-backend-mcg2.onrender.com/api/v1/payments/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentDetails: { amount: Math.round(total) },
              }),
            });
          } catch {
            // verify failed but payment still went through
          }
            clearCart();
            onClose();
            showMedicineReceipt(items, total, response.razorpay_payment_id, response.razorpay_order_id);
        },
        modal: { ondismiss: () => setLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => alert('❌ Payment failed. Please try again.'));
      rzp.open();
    } catch (err) {
      alert('Payment error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="cart-overlay" onClick={onClose}
          />
        )}
      </AnimatePresence>
      <motion.div
        className="cart-sidebar"
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="cart-header">
          <h2 className="cart-title">YOUR CART</h2>
          <button className="cart-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">Your cart is empty.</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.img} className="cart-item-img" alt={item.name} />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₹{item.price}</div>
                </div>
                <div className="cart-item-qty">
                  <button onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                  <span className="qty-num">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer">
          <div className="cart-total-row">
            <span>TOTAL</span>
            <span>₹{cartTotal}</span>
          </div>
          <button className="checkout-btn" onClick={handleCheckout} disabled={loading || cart.length === 0}>
            {loading ? 'Processing…' : 'Checkout securely →'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

const RxModal = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="rx-overlay"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="rx-modal"
        >
          <button className="rx-close" onClick={onClose}><X size={20} /></button>
          <h2 className="rx-title">UPLOAD Rx</h2>
          <p className="rx-sub">Upload your doctor's prescription.</p>
          <div className="rx-drop">
            <Camera size={48} color="#004643" />
            <p className="rx-drop-text">Tap to upload</p>
          </div>
          <button className="rx-submit" onClick={onClose}>📤 Submit Prescription</button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default App;
