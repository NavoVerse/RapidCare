import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, X, Plus, Minus, Camera, Activity, ShieldCheck, Truck, Clock } from 'lucide-react';
import axios from 'axios';
import './App.css';

// Components
import EmergencyBanner from './components/EmergencyBanner';
import TrustStrip from './components/TrustStrip';
import KitSection from './components/KitSection';
import OxygenSection from './components/OxygenSection';
import DeliveryBar from './components/DeliveryBar';
import Footer from './components/Footer';

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

  useEffect(() => {
    localStorage.setItem('rc-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [activeCategory, searchQuery]);

  const fetchAll = async () => {
    try {
      const [k, o, d, a] = await Promise.all([
        axios.get('http://localhost:5000/api/kits'),
        axios.get('http://localhost:5000/api/oxygen'),
        axios.get('http://localhost:5000/api/devices'),
        axios.get('http://localhost:5000/api/ayurveda')
      ]);
      setKits(k.data);
      setOxygen(o.data);
      setDevices(d.data);
      setAyurveda(a.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/medicines`, {
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, setIsCartOpen, cartTotal, cartCount }}>
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
                  {medicines.map(product => (
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
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="prod-card"
    >
      {product.rx && <div className="prod-badge rx">Rx Required</div>}
      <div className={`prod-img ${product.color}`}>
        <img src={product.img} alt={product.name} />
      </div>
      <div className="prod-body">
        <div className="prod-tag">{product.category}</div>
        <div className="prod-name">{product.name}</div>
        <div className="prod-mfr">{product.molecule}</div>
        <div className="prod-foot">
          <div className="prod-price-wrap">
            <div className="prod-price">₹{product.price}</div>
            <div className="prod-mrp">₹{product.mrp}</div>
          </div>
          <button className="add-btn" onClick={() => addToCart(product)}>Add</button>
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
  const { cart, updateQty, cartTotal } = useCart();
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
          <button className="checkout-btn">Checkout securely &rarr;</button>
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
