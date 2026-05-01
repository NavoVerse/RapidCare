const fs = require('fs');
let js = fs.readFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\products.js', 'utf8');

const enhancedSearchLogic = `
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
          id: val.replace(/\\s+/g, '-'),
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
          id: val.replace(/\\s+/g, '-') + '-syrup',
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
          ? \`<div class="prod-badge rx">Rx Required</div>\` 
          : \`<div class="prod-badge">OTC Safe</div>\`;
          
        card.innerHTML = \`
          \${badgeHTML}
          <div class="prod-img \${p.color}">
            <img src="\${p.img}" alt="\${p.name}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.95;">
          </div>
          <div class="prod-body">
            <div class="prod-tag">\${p.category}</div>
            <div class="prod-name">\${p.name} \${p.category === 'Supplements' || p.category === 'Dermatology' ? '' : 'Tablet'}</div>
            <div class="prod-mfr">\${p.molecule}</div>
            <div class="prod-pack">\${p.category === 'Dermatology' ? '1 Tube / 15g' : p.pack || 'Strip of 10'}</div>
            <div class="prod-foot">
              <div class="prod-price-wrap">
                <div class="prod-price">₹\${p.price}</div>
                <div class="prod-mrp">₹\${p.mrp}</div>
              </div>
              <button class="add-btn">Add</button>
            </div>
          </div>
        \`;
        grid.appendChild(card);
      });
    });
  }
`;

// Replace the old search block
// It starts with "// Search bar functionality" and ends before "// Initial render (All categories)"
const parts = js.split("// Search bar functionality");
if(parts.length > 1) {
  const parts2 = parts[1].split("// Initial render (All categories)");
  js = parts[0] + enhancedSearchLogic + "\n  // Initial render (All categories)" + parts2[1];
  fs.writeFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\products.js', js, 'utf8');
  console.log('Successfully updated search and sidebar logic.');
} else {
  console.log('Could not find search block.');
}
