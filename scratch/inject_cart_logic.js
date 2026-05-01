const fs = require('fs');
let js = fs.readFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\products.js', 'utf8');

// I will append the cart logic to the end of the DOMContentLoaded block.
// To do this reliably, I'll remove the last "});" and append my logic, then put it back.

if (!js.includes('let cart = [];')) {
    js = js.replace(/}\);\s*$/, ''); // Remove the trailing "});"
    
    const cartLogic = `
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
      itemEl.innerHTML = \`
        <img src="\${item.img}" class="cart-item-img" alt="\${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">\${item.name}</div>
          <div class="cart-item-price">₹\${item.price}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn minus" data-idx="\${index}">-</button>
          <div class="qty-num">\${item.qty}</div>
          <button class="qty-btn plus" data-idx="\${index}">+</button>
        </div>
      \`;
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
  
  // Intercept the renderGrid click events to open the modal
  // We'll delegate clicks from the grid to the product cards
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".prod-card");
    if (!card) return;
    
    const name = card.querySelector(".prod-name").innerText.split(" Tablet")[0];
    const product = allProducts.find(p => name.includes(p.name));
    if (product) {
      // If clicked exactly on "Add" button, add to cart instead of modal
      if(e.target.closest(".add-btn")) {
          addToCart(product);
          openCart();
          return;
      }
      openModal(product);
    }
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
    
    circle.style.width = circle.style.height = \`\${diameter}px\`;
    circle.style.left = \`\${e.clientX - rect.left - radius}px\`;
    circle.style.top = \`\${e.clientY - rect.top - radius}px\`;
    circle.classList.add("ripple");
    
    const existing = target.querySelector(".ripple");
    if (existing) {
        existing.remove();
    }
    
    target.appendChild(circle);
  });

});
`;
    js = js + cartLogic;
    fs.writeFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\products.js', js, 'utf8');
    console.log('Injected cart logic successfully.');
} else {
    console.log('Cart logic already present.');
}
