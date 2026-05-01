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

// Image sets based on form/category
const imgMap = {
  "tablets": ["images/tablets.png"],
  "syrup": ["images/syrup.png"],
  "cream": ["images/cream.png"],
  "inhaler": ["images/inhaler.png"]
};

medicineData.forEach(item => {
  item.brands.forEach(brand => {
    // Generate a mock price between 20 and 400
    const price = Math.floor(Math.random() * 380) + 20;
    const mrp = Math.floor(price * 1.15); // 15% markup for MRP
    
    let imgList = imgMap.tablets;
    if(item.category === "Dermatology") imgList = imgMap.cream;
    else if(item.category === "Respiratory") imgList = imgMap.inhaler;
    else if(item.category === "Digestion") imgList = imgMap.syrup;
    
    const randomImg = imgList[Math.floor(Math.random() * imgList.length)];
    
    allProducts.push({
      id: brand.toLowerCase().replace(/\\s+/g, '-'),
      name: brand,
      molecule: item.molecule,
      category: item.category,
      rx: item.rx,
      color: item.color,
      icon: item.icon,
      price: price,
      mrp: mrp,
      pack: "Strip of 10 tablets",
      img: randomImg
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
  
  // Search bar functionality
  const searchInput = document.querySelector(".search-input");
  if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase();
      
      // Re-render filtering logic
      if (!grid) return;
      grid.innerHTML = "";
      
      const searchFiltered = allProducts.filter(p => 
        p.name.toLowerCase().includes(val) || 
        p.molecule.toLowerCase().includes(val) ||
        p.category.toLowerCase().includes(val)
      );
      
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
    });
  }

  // Initial render (All categories)
  renderGrid("All");
});
