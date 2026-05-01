const medicineData = [
  // Pain / Fever
  { category: "Pain Relief", molecule: "Paracetamol", brands: ["Crocin", "Calpol", "Dolo 650", "Metacin", "Pacimol"], rx: false, color: "bg-teal", icon: "💊" },
  { category: "Pain Relief", molecule: "Ibuprofen", brands: ["Brufen", "Ibugesic"], rx: false, color: "bg-amber", icon: "💊" },
  { category: "Pain Relief", molecule: "Diclofenac", brands: ["Voveran", "Dynapar"], rx: true, color: "bg-red", icon: "💊" },
  { category: "Pain Relief", molecule: "Aceclofenac", brands: ["Zerodol", "Hifenac"], rx: true, color: "bg-blue", icon: "💊" },
  { category: "Pain Relief", molecule: "Etoricoxib", brands: ["Nucoxia"], rx: true, color: "bg-purple", icon: "💊" },
  
  // Antibiotics
  { category: "Antibiotics", molecule: "Amoxicillin", brands: ["Mox", "Novamox"], rx: true, color: "bg-teal", icon: "🦠" },
  { category: "Antibiotics", molecule: "Amoxicillin + Clavulanate", brands: ["Augmentin", "Moxclav"], rx: true, color: "bg-blue", icon: "🦠" },
  { category: "Antibiotics", molecule: "Azithromycin", brands: ["Azithral", "Azee", "Zithrocin"], rx: true, color: "bg-purple", icon: "🦠" },
  { category: "Antibiotics", molecule: "Cefixime", brands: ["Taxim-O", "Zifi"], rx: true, color: "bg-red", icon: "🦠" },
  { category: "Antibiotics", molecule: "Cefuroxime", brands: ["Ceftum"], rx: true, color: "bg-teal", icon: "🦠" },
  { category: "Antibiotics", molecule: "Ofloxacin", brands: ["Oflomac", "Zanocin"], rx: true, color: "bg-amber", icon: "🦠" },
  { category: "Antibiotics", molecule: "Ciprofloxacin", brands: ["Ciplox", "Cifran"], rx: true, color: "bg-blue", icon: "🦠" },
  { category: "Antibiotics", molecule: "Levofloxacin", brands: ["Levoflox"], rx: true, color: "bg-green", icon: "🦠" },
  
  // Diabetes
  { category: "Diabetes", molecule: "Metformin", brands: ["Glycomet", "Obimet"], rx: true, color: "bg-teal", icon: "🩺" },
  { category: "Diabetes", molecule: "Glimepiride", brands: ["Amaryl"], rx: true, color: "bg-amber", icon: "🩺" },
  { category: "Diabetes", molecule: "Sitagliptin", brands: ["Januvia"], rx: true, color: "bg-blue", icon: "🩺" },
  { category: "Diabetes", molecule: "Vildagliptin", brands: ["Galvus"], rx: true, color: "bg-purple", icon: "🩺" },
  { category: "Diabetes", molecule: "Insulin", brands: ["Actrapid", "Mixtard"], rx: true, color: "bg-red", icon: "💉" },
  
  // Blood Pressure / Heart
  { category: "Cardiac Care", molecule: "Amlodipine", brands: ["Amlong", "Stamlo"], rx: true, color: "bg-red", icon: "❤️" },
  { category: "Cardiac Care", molecule: "Telmisartan", brands: ["Telma"], rx: true, color: "bg-teal", icon: "❤️" },
  { category: "Cardiac Care", molecule: "Losartan", brands: ["Losar"], rx: true, color: "bg-blue", icon: "❤️" },
  { category: "Cardiac Care", molecule: "Atenolol", brands: ["Aten"], rx: true, color: "bg-amber", icon: "❤️" },
  { category: "Cardiac Care", molecule: "Metoprolol", brands: ["Metolar"], rx: true, color: "bg-purple", icon: "❤️" },
  { category: "Cardiac Care", molecule: "Ramipril", brands: ["Cardace"], rx: true, color: "bg-green", icon: "❤️" },
  
  // Gastric / Acidity
  { category: "Digestion", molecule: "Pantoprazole", brands: ["Pantocid", "Pan"], rx: false, color: "bg-teal", icon: "🔥" },
  { category: "Digestion", molecule: "Omeprazole", brands: ["Omez"], rx: false, color: "bg-amber", icon: "🔥" },
  { category: "Digestion", molecule: "Rabeprazole", brands: ["Rablet"], rx: false, color: "bg-blue", icon: "🔥" },
  { category: "Digestion", molecule: "Esomeprazole", brands: ["Nexpro"], rx: false, color: "bg-purple", icon: "🔥" },
  { category: "Digestion", molecule: "Ranitidine", brands: ["Aciloc"], rx: false, color: "bg-teal", icon: "🔥" },
  
  // Allergy
  { category: "Allergy", molecule: "Cetirizine", brands: ["Cetzine"], rx: false, color: "bg-green", icon: "🤧" },
  { category: "Allergy", molecule: "Levocetirizine", brands: ["Xyzal"], rx: false, color: "bg-blue", icon: "🤧" },
  { category: "Allergy", molecule: "Fexofenadine", brands: ["Allegra"], rx: false, color: "bg-purple", icon: "🤧" },
  { category: "Allergy", molecule: "Chlorpheniramine", brands: ["Avil"], rx: false, color: "bg-teal", icon: "🤧" },
  
  // Respiratory / Cough
  { category: "Respiratory", molecule: "Ambroxol", brands: ["Mucolite"], rx: false, color: "bg-amber", icon: "🫁" },
  { category: "Respiratory", molecule: "Dextromethorphan", brands: ["Benadryl DR"], rx: false, color: "bg-red", icon: "🫁" },
  { category: "Respiratory", molecule: "Salbutamol", brands: ["Asthalin"], rx: true, color: "bg-blue", icon: "🫁" },
  { category: "Respiratory", molecule: "Montelukast", brands: ["Montair"], rx: true, color: "bg-teal", icon: "🫁" },
  
  // Vitamins / Supplements
  { category: "Supplements", molecule: "Vitamin B complex", brands: ["Becosules"], rx: false, color: "bg-amber", icon: "🧪" },
  { category: "Supplements", molecule: "Calcium", brands: ["Shelcal"], rx: false, color: "bg-sand", icon: "🦴" },
  { category: "Supplements", molecule: "Vitamin D3", brands: ["Uprise D3"], rx: false, color: "bg-amber", icon: "☀️" },
  { category: "Supplements", molecule: "Iron", brands: ["Dexorange"], rx: false, color: "bg-red", icon: "🩸" },
  { category: "Supplements", molecule: "Multivitamin", brands: ["Revital"], rx: false, color: "bg-purple", icon: "🧪" },
  
  // Antifungal & Skin / Steroid creams
  { category: "Dermatology", molecule: "Fluconazole", brands: ["Forcan"], rx: true, color: "bg-teal", icon: "🧴" },
  { category: "Dermatology", molecule: "Itraconazole", brands: ["Canditral"], rx: true, color: "bg-blue", icon: "🧴" },
  { category: "Dermatology", molecule: "Clotrimazole", brands: ["Candid"], rx: false, color: "bg-amber", icon: "🧴" },
  { category: "Dermatology", molecule: "Betamethasone", brands: ["Betnovate"], rx: true, color: "bg-red", icon: "🧴" },
  { category: "Dermatology", molecule: "Mometasone", brands: ["Momate"], rx: true, color: "bg-purple", icon: "🧴" },
  { category: "Dermatology", molecule: "Clobetasol", brands: ["Tenovate"], rx: true, color: "bg-teal", icon: "🧴" },
  
  // Neurology / Pain & Psychiatric
  { category: "Neurological", molecule: "Pregabalin", brands: ["Pregaba", "Maxgalin"], rx: true, color: "bg-purple", icon: "🧠" },
  { category: "Neurological", molecule: "Gabapentin", brands: ["Gabapin"], rx: true, color: "bg-blue", icon: "🧠" },
  { category: "Neurological", molecule: "Amitriptyline", brands: ["Tryptomer"], rx: true, color: "bg-amber", icon: "🧠" },
  { category: "Neurological", molecule: "Alprazolam", brands: ["Alprax"], rx: true, color: "bg-red", icon: "🧠" },
  { category: "Neurological", molecule: "Clonazepam", brands: ["Clonotril"], rx: true, color: "bg-teal", icon: "🧠" },
  { category: "Neurological", molecule: "Sertraline", brands: ["Sertima"], rx: true, color: "bg-purple", icon: "🧠" },
  
  // Hormones / Thyroid
  { category: "Thyroid", molecule: "Thyroxine", brands: ["Thyronorm"], rx: true, color: "bg-blue", icon: "🦋" },
  { category: "Thyroid", molecule: "Prednisolone", brands: ["Wysolone"], rx: true, color: "bg-amber", icon: "🦋" },
  
  // Anti-parasitic
  { category: "General", molecule: "Albendazole", brands: ["Zentel"], rx: true, color: "bg-teal", icon: "🐛" },
  { category: "General", molecule: "Ivermectin", brands: ["Ivecop"], rx: true, color: "bg-red", icon: "🐛" }
];

// Generate products based on brands
let allProducts = [];

medicineData.forEach(item => {
  item.brands.forEach(brand => {
    // Generate a mock price between 20 and 400
    const price = Math.floor(Math.random() * 380) + 20;
    const mrp = Math.floor(price * 1.15); // 15% markup for MRP
    
    // Assign a specific image if it exists, else fallback to category defaults
    const brandLower = brand.toLowerCase().replace(/\s+/g, '-');
    const specificImages = {
      'crocin': 'images/crocin.png',
      'calpol': 'images/calpol.jpg',
      'dolo-650': 'images/dolo-650.png',
      'metacin': 'images/metacin.jpg',
      'pacimol': 'images/pacimol.png',
      'brufen': 'images/brufen.png',
      'augmentin': 'images/augmentin.png',
      'zifi': 'images/zifi.png',
      'glycomet': 'images/glycomet.png',
      'telma': 'images/telma.png',
      'taxim-o': 'images/taxim-o.jpg',
      'omez': 'images/omez.jpg',
      'allegra': 'images/allegra.jpg',
      'pantocid': 'images/pantocid.jpg',
      'becosules': 'images/becosules.jpg',
      'shelcal': 'images/shelcal.jpg',
      'revital': 'images/revital.jpg',
      'voveran': 'images/voveran.jpg',
      'zerodol': 'images/zerodol.jpg',
      'nucoxia': 'images/nucoxia.jpg',
      'electral': 'images/electral.png',
      'montair': 'images/montair.png',
      'hifenac': 'images/hifenac.jpg',
      'mox': 'images/mox.jpg',
      'novamox': 'images/novamox.jpg',
      'moxclav': 'images/moxclav.jpg',
      'azee': 'images/azee.jpg',
      'zithrocin': 'images/zithrocin.jpg',
      'ceftum': 'images/ceftum.jpg',
      'oflomac': 'images/oflomac.jpg',
      'zanocin': 'images/zanocin.jpg',
      'ciplox': 'images/ciplox.jpg',
      'cifran': 'images/cifran.jpg',
      'levoflox': 'images/levoflox.jpg',
      'obimet': 'images/obimet.jpg',
      'amaryl': 'images/amaryl.jpg',
      'januvia': 'images/januvia.jpg',
      'galvus': 'images/galvus.jpg',
      'actrapid': 'images/actrapid.jpg',
      'mixtard': 'images/mixtard.jpg',
      'amlong': 'images/amlong.jpg',
      'aten': 'images/aten.jpg',
      'stamlo': 'images/stamlo.jpg',
      'losar': 'images/losar.jpg'
    };
    
    let imgPath = specificImages[brandLower] || null;
    
    if (!imgPath) {
      // Fallback to category based generic images
      const cat = item.category;
      if (cat === "Antibiotics") imgPath = "images/tablets.png";
      else if (cat === "Cardiac Care") imgPath = "images/tablets.png";
      else if (cat === "Diabetes") imgPath = "images/tablets.png";
      else if (cat === "Respiratory") imgPath = item.molecule.includes("Inhaler") ? "images/inhaler.png" : "images/syrup.png";
      else if (cat === "Dermatology") imgPath = "images/cream.png";
      else if (cat === "Supplements") imgPath = "images/tablets.png";
      else imgPath = "images/tablets.png";
    }
    
    allProducts.push({
      id: brandLower,
      name: brand,
      molecule: item.molecule,
      category: item.category,
      rx: item.rx,
      color: item.color,
      icon: item.icon,
      price: price,
      mrp: mrp,
      pack: "Strip of 10 tablets",
      img: imgPath
    });
  });
});

// Initial Render
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".prod-grid");
  const pills = document.querySelectorAll(".cat-pill");
  
  // Ensure "Digestion" and "Allergy" are in the UI since the user provided them
  const catScroll = document.querySelector(".cat-scroll");
  if(catScroll) {
    if(!document.querySelector(".cat-pill[data-cat='Digestion']")) {
      const digPill = document.createElement("div");
      digPill.className = "cat-pill";
      digPill.setAttribute("data-cat", "Digestion");
      digPill.innerHTML = `<span class="cp-icon">🔥</span><span class="cp-label">Digestion</span>`;
      catScroll.appendChild(digPill);
    }
    if(!document.querySelector(".cat-pill[data-cat='Allergy']")) {
      const allPill = document.createElement("div");
      allPill.className = "cat-pill";
      allPill.setAttribute("data-cat", "Allergy");
      allPill.innerHTML = `<span class="cp-icon">🤧</span><span class="cp-label">Allergy</span>`;
      catScroll.appendChild(allPill);
    }
  }

  // Update pills query after potential additions
  const updatedPills = document.querySelectorAll(".cat-pill");

  function renderGrid(category) {
    if (!grid) return;
    grid.innerHTML = "";
    
    // Filter products
    const filtered = category === "All" 
      ? allProducts 
      : allProducts.filter(p => p.category === category);
      
    // Create elements
    filtered.forEach(p => {
      const card = document.createElement("div");
      card.className = "prod-card";
      card.setAttribute("data-aos", "fade-up");
      
      const badgeHTML = p.rx 
        ? `<div class="prod-badge rx">Rx Required</div>` 
        : `<div class="prod-badge">OTC Safe</div>`;
        
      card.innerHTML = `
        ${badgeHTML}
        <div class="prod-img ${p.color}">
          <img src="${p.img}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.95;">
        </div>
        <div class="prod-body">
          <div class="prod-tag">${p.category}</div>
          <div class="prod-name">${p.name} ${p.category === 'Supplements' || p.category === 'Dermatology' ? '' : 'Tablet'}</div>
          <div class="prod-mfr">${p.molecule}</div>
          <div class="prod-pack">${p.category === 'Dermatology' ? '1 Tube / 15g' : p.pack}</div>
          <div class="prod-foot">
            <div class="prod-price-wrap">
              <div class="prod-price">₹${p.price}</div>
              <div class="prod-mrp">₹${p.mrp}</div>
            </div>
            <button class="add-btn">Add</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
    
    // Refresh AOS animations on dynamically injected content
    if(typeof AOS !== 'undefined') AOS.refresh();
  }
  
  // Attach Event Listeners to Category Pills
  updatedPills.forEach(pill => {
    pill.addEventListener("click", () => {
      // Remove 'on' class from all
      updatedPills.forEach(p => p.classList.remove("on"));
      // Add 'on' to clicked
      pill.classList.add("on");
      
      // Get category text
      const catText = pill.querySelector(".cp-label").innerText;
      renderGrid(catText);
    });
  });
  
  
  // --- SIDEBAR & FILTER ROW EVENTS ---
  const sbItems = document.querySelectorAll('.sb-item');
  sbItems.forEach(item => {
    item.addEventListener('click', () => {
      sbItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const catText = item.querySelector('.sb-item-text').innerText;
      
      // Sync other menus
      document.querySelectorAll('.cat').forEach(c => c.classList.remove('on'));
      const matchCat = Array.from(document.querySelectorAll('.cat')).find(c => catText.includes(c.innerText));
      if(matchCat) matchCat.classList.add('on');
      
      renderGrid(catText);
    });
  });

  const filterCats = document.querySelectorAll('.cat');
  filterCats.forEach(cat => {
    cat.addEventListener('click', () => {
      filterCats.forEach(c => { c.classList.remove('on'); c.classList.add('off'); });
      cat.classList.remove('off');
      cat.classList.add('on');
      const catText = cat.innerText === 'All' ? 'All Products' : cat.innerText;
      renderGrid(catText);
    });
  });

  // Search bar functionality (with infinite mock generation)
  const searchInput = document.querySelector(".search-input");
  if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim().toLowerCase();
      
      if (!grid) return;
      grid.innerHTML = "";
      
      if (val === "") {
        renderGrid("All");
        return;
      }
      
      const searchFiltered = allProducts.filter(p => 
        p.name.toLowerCase().includes(val) || 
        p.molecule.toLowerCase().includes(val) ||
        p.category.toLowerCase().includes(val)
      );
      
      // If we don't find it, we dynamically generate it to simulate "world's all brands"
      if (searchFiltered.length === 0 && val.length > 2) {
        const mockName = val.charAt(0).toUpperCase() + val.slice(1);
        searchFiltered.push({
          id: val.replace(/\s+/g, '-'),
          name: mockName + " 500mg",
          molecule: mockName + " Hydrochloride",
          category: "General Pharmacy",
          rx: Math.random() > 0.5,
          color: "bg-teal",
          icon: "💊",
          price: Math.floor(Math.random() * 300) + 50,
          mrp: Math.floor(Math.random() * 400) + 80,
          img: "images/tablets.png"
        });
        searchFiltered.push({
          id: val.replace(/\s+/g, '-') + '-syrup',
          name: mockName + " Syrup",
          molecule: mockName + " Oral Suspension",
          category: "General Pharmacy",
          rx: false,
          color: "bg-sand",
          icon: "🧪",
          price: Math.floor(Math.random() * 150) + 40,
          mrp: Math.floor(Math.random() * 180) + 60,
          img: "images/syrup.png"
        });
      }
      
      searchFiltered.forEach(p => {
        const card = document.createElement("div");
        card.className = "prod-card";
        
        const badgeHTML = p.rx 
          ? `<div class="prod-badge rx">Rx Required</div>` 
          : `<div class="prod-badge">OTC Safe</div>`;
          
        card.innerHTML = `
          ${badgeHTML}
          <div class="prod-img ${p.color}">
            <img src="${p.img}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.95;">
          </div>
          <div class="prod-body">
            <div class="prod-tag">${p.category}</div>
            <div class="prod-name">${p.name} ${p.category === 'Supplements' || p.category === 'Dermatology' ? '' : 'Tablet'}</div>
            <div class="prod-mfr">${p.molecule}</div>
            <div class="prod-pack">${p.category === 'Dermatology' ? '1 Tube / 15g' : p.pack || 'Strip of 10'}</div>
            <div class="prod-foot">
              <div class="prod-price-wrap">
                <div class="prod-price">₹${p.price}</div>
                <div class="prod-mrp">₹${p.mrp}</div>
              </div>
              <button class="add-btn">Add</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    });
  }

  // Initial render (All categories)
  renderGrid("All");

  // --- CART & MODAL LOGIC ---
  let cart = [];
  let currentModalProduct = null;

  const cartOverlay = document.getElementById("cartOverlay");
  const cartSidebar = document.getElementById("cartSidebar");
  const cartBody = document.getElementById("cartBody");
  const cartSub = document.getElementById("cartSub");
  const cartTotal = document.getElementById("cartTotal");
  const cartBadge = document.querySelector(".cart-badge");
  
  const modalOverlay = document.getElementById("modalOverlay");
  const prodModal = document.getElementById("prodModal");
  
  // Elements inside Modal
  const pmImg = document.getElementById("pmImg");
  const pmTag = document.getElementById("pmTag");
  const pmName = document.getElementById("pmName");
  const pmMol = document.getElementById("pmMol");
  const pmPrice = document.getElementById("pmPrice");
  const pmMrp = document.getElementById("pmMrp");

  function openCart() {
    cartOverlay.classList.add("active");
    cartSidebar.classList.add("active");
  }

  function closeCart() {
    cartOverlay.classList.remove("active");
    cartSidebar.classList.remove("active");
  }

  function openModal(product) {
    currentModalProduct = product;
    pmImg.src = product.img;
    pmTag.innerText = product.category;
    pmName.innerText = product.name;
    pmMol.innerText = product.molecule;
    pmPrice.innerText = "₹" + product.price;
    pmMrp.innerText = "₹" + product.mrp;
    
    modalOverlay.classList.add("active");
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
  }

  function updateCartUI() {
    if (cart.length === 0) {
      cartBody.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
      cartBadge.innerText = "0";
      cartSub.innerText = "₹0";
      cartTotal.innerText = "₹0";
      return;
    }

    cartBody.innerHTML = "";
    let totalAmount = 0;
    let totalItems = 0;

    cart.forEach((item, index) => {
      totalAmount += item.price * item.qty;
      totalItems += item.qty;

      const itemEl = document.createElement("div");
      itemEl.className = "cart-item";
      itemEl.innerHTML = `
        <img src="${item.img}" class="cart-item-img" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn minus" data-idx="${index}">-</button>
          <div class="qty-num">${item.qty}</div>
          <button class="qty-btn plus" data-idx="${index}">+</button>
        </div>
      `;
      cartBody.appendChild(itemEl);
    });

    cartBadge.innerText = totalItems;
    cartSub.innerText = "₹" + totalAmount;
    cartTotal.innerText = "₹" + totalAmount;
    
    // Add event listeners to + / -
    document.querySelectorAll(".qty-btn.minus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-idx"));
        if(cart[idx].qty > 1) {
          cart[idx].qty--;
        } else {
          cart.splice(idx, 1);
        }
        updateCartUI();
      });
    });

    document.querySelectorAll(".qty-btn.plus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-idx"));
        cart[idx].qty++;
        updateCartUI();
      });
    });
  }

  function addToCart(product) {
    const existing = cart.find(p => p.id === product.id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
    
    // Animate badge
    cartBadge.style.transform = "scale(1.5)";
    setTimeout(() => {
        cartBadge.style.transform = "scale(1)";
    }, 200);
  }

  // --- ATTACH EVENTS ---
  
  // Intercept all clicks on prod-cards across the whole document
  document.body.addEventListener("click", (e) => {
    const card = e.target.closest(".prod-card");
    if (!card) return;
    
    // If clicked exactly on "Add" button, we handle it separately
    const isAddBtn = e.target.closest(".add-btn");
    
    const nameEl = card.querySelector(".prod-name");
    if(!nameEl) return;
    const name = nameEl.innerText.split(" Tablet")[0];
    
    let product = allProducts.find(p => name.includes(p.name) || p.name.includes(name));
    
    // Fallback for static cards in HTML not present in allProducts array
    if (!product) {
      const priceText = card.querySelector(".prod-price") ? card.querySelector(".prod-price").innerText.replace("₹", "") : "100";
      const mrpText = card.querySelector(".prod-mrp") ? card.querySelector(".prod-mrp").innerText.replace("₹", "") : "120";
      const imgEl = card.querySelector("img");
      const tagEl = card.querySelector(".prod-tag");
      const molEl = card.querySelector(".prod-mfr");
      
      product = {
        id: name.toLowerCase().replace(/\\s+/g, '-'),
        name: name,
        molecule: molEl ? molEl.innerText : "Medicine",
        category: tagEl ? tagEl.innerText : "General",
        price: parseInt(priceText),
        mrp: parseInt(mrpText),
        img: imgEl ? imgEl.src : "images/tablets.png"
      };
    }
    
    if (isAddBtn) {
        addToCart(product);
        openCart();
        return;
    }
    openModal(product);
  });

  // Modal Buttons
  document.getElementById("pmAddToCart").addEventListener("click", () => {
    if(currentModalProduct) {
      addToCart(currentModalProduct);
      closeModal();
      openCart();
    }
  });
  
  document.getElementById("pmBookNow").addEventListener("click", () => {
    if(currentModalProduct) {
      addToCart(currentModalProduct);
      closeModal();
      window.location.href = "#checkout"; // Scroll or route to checkout
      alert("Proceeding to Immediate Booking checkout...");
    }
  });

  // Topbar Cart Button
  document.querySelector(".cart-btn").addEventListener("click", openCart);

  // Close handlers
  document.getElementById("closeCart").addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  document.getElementById("closeModal").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if(e.target === modalOverlay) closeModal();
  });

  // Ripple Animation for Buttons
  document.addEventListener("click", function(e) {
    const target = e.target.closest(".ripple-btn");
    if (!target) return;
    
    const circle = document.createElement("span");
    const diameter = Math.max(target.clientWidth, target.clientHeight);
    const radius = diameter / 2;
    
    const rect = target.getBoundingClientRect();
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");
    
    const existing = target.querySelector(".ripple");
    if (existing) {
        existing.remove();
    }
    
    target.appendChild(circle);
  });

});
