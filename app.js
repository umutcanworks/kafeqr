/* ============================================
   KafeQR — Müşteri Tarafı Uygulama Mantığı (app.js)
   ============================================ */

// ── Firebase Yapılandırması ──
const firebaseConfig = {
  apiKey: "AIzaSyCj_E-msfP7pCQiYnYhmI_LzkrlGmaDf0w",
  authDomain: "kafe-test-1fb8a.firebaseapp.com",
  databaseURL: "https://kafe-test-1fb8a-default-rtdb.firebaseio.com/",
  projectId: "kafe-test-1fb8a",
  storageBucket: "kafe-test-1fb8a.firebasestorage.app",
  messagingSenderId: "504947954115",
  appId: "1:504947954115:web:390f51eed00673ffa02d76"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ── Menü Verisi (Görselli ve S/M/L Seçenekli JSON) ──
const menuData = [
  {
    id: "sicak-kahveler",
    name: "Sıcak Kahveler",
    emoji: "☕",
    items: [
      { name: "Türk Kahvesi", desc: "Geleneksel ince çekilmiş, köpüklü Türk kahvesi", price: 65, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&h=200&fit=crop" },
      { name: "Espresso", desc: "Yoğun ve aromatik İtalyan espresso", price: 70, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=200&h=200&fit=crop" },
      { name: "Cappuccino", desc: "Kadifemsi süt köpüğü ile espresso", price: 90, image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&h=200&fit=crop" },
      { name: "Latte", desc: "Bol sütlü, yumuşak espresso", sizes: { S: 85, M: 95, L: 105 }, price: 95, image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=200&h=200&fit=crop" },
      { name: "Filtre Kahve", desc: "Özenle demlenen, hafif gövdeli filtre kahve", sizes: { S: 65, M: 75, L: 85 }, price: 75, image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=200&h=200&fit=crop" },
      { name: "Mocha", desc: "Çikolata ve espressonun muhteşem buluşması", price: 100, image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=200&h=200&fit=crop" }
    ]
  },
  {
    id: "soguk-icecekler",
    name: "Soğuk İçecekler",
    emoji: "🧊",
    items: [
      { name: "Ice Latte", desc: "Buzlu süt ve espresso karışımı", sizes: { S: 90, M: 100, L: 110 }, price: 100, image: "https://images.unsplash.com/photo-1461023058943-0708e5215cbd?w=200&h=200&fit=crop" },
      { name: "Ice Americano", desc: "Buz gibi serinleten Americano", price: 90, image: "https://images.unsplash.com/photo-1517701550927-30cfcb64db88?w=200&h=200&fit=crop" },
      { name: "Limonata", desc: "Taze sıkılmış, nane yapraklı limonata", price: 70, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&h=200&fit=crop" },
      { name: "Smoothie Bowl", desc: "Mevsim meyveleriyle hazırlanan smoothie", price: 110, image: "https://images.unsplash.com/photo-1626082895617-2c6328af3307?w=200&h=200&fit=crop" },
      { name: "Soğuk Çay", desc: "Şeftali aromalı, buzlu soğuk çay", price: 60, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop" }
    ]
  },
  {
    id: "tatlilar",
    name: "Tatlılar",
    emoji: "🍰",
    items: [
      { name: "San Sebastian", desc: "Kremalı, karamelize yüzeyli cheesecake", price: 130, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200&h=200&fit=crop" },
      { name: "Brownie", desc: "Sıcak servis, ıslak dokulu çikolatalı brownie", price: 95, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop" },
      { name: "Tiramisu", desc: "Mascarpone kremalı İtalyan klasiği", price: 120, image: "https://images.unsplash.com/photo-1571115177098-24edf5818984?w=200&h=200&fit=crop" },
      { name: "Cookie", desc: "Taze pişmiş, bol parçacıklı kurabiye", price: 55, image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&h=200&fit=crop" },
      { name: "Waffle", desc: "Çikolata sos ve meyve ile servis", price: 115, image: "https://images.unsplash.com/photo-1562376552-0d1b072215c0?w=200&h=200&fit=crop" }
    ]
  }
];

// ── DOM Referansları ──
const tableLabel = document.getElementById("table-label");
const categoryTabs = document.getElementById("category-tabs");
const menuContainer = document.getElementById("menu-container");
const btnWaiter = document.getElementById("btn-waiter");
const btnBill = document.getElementById("btn-bill");
const toastContainer = document.getElementById("toast-container");

// ── Masa Numarasını URL'den Al (Sade Mantık) ──
function getTableNumber() {
  const params = new URLSearchParams(window.location.search);
  return params.get("masa") || "?";
}

const tableNumber = getTableNumber();
if(tableLabel) {
   tableLabel.textContent = `Masa ${tableNumber}`;
}

// ── Kategori Navigasyonunu Oluştur (Sliding Indicator) ──
function renderCategoryTabs() {
  const indicator = document.createElement("div");
  indicator.classList.add("tab-indicator");
  categoryTabs.appendChild(indicator);

  menuData.forEach((category, index) => {
    const tab = document.createElement("button");
    tab.classList.add("category-tab");
    if (index === 0) tab.classList.add("active");
    tab.textContent = `${category.emoji} ${category.name}`;
    tab.type = "button";
    tab.setAttribute("data-category", category.id);

    tab.addEventListener("click", () => {
      document.querySelectorAll(".category-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      moveIndicator(tab);
      
      const section = document.getElementById(`section-${category.id}`);
      if (section) {
        const headerHeight = document.getElementById("customer-header").offsetHeight;
        const navHeight = document.getElementById("category-nav").offsetHeight;
        const offset = headerHeight + navHeight + 12;
        const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
    
    categoryTabs.appendChild(tab);
  });

  requestAnimationFrame(() => {
    const firstTab = categoryTabs.querySelector(".category-tab.active");
    if (firstTab) moveIndicator(firstTab, true);
  });
}

// ── Kayan Gösterge Pozisyonlama ──
function moveIndicator(tab, instant = false) {
  const indicator = categoryTabs.querySelector(".tab-indicator");
  if (!indicator || !tab) return;
  
  const navRect = categoryTabs.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  const scrollLeft = categoryTabs.scrollLeft;
  
  indicator.style.transition = instant ? "none" : "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
  indicator.style.width = `${tabRect.width}px`;
  indicator.style.left = `${tabRect.left - navRect.left + scrollLeft}px`;
}

// ── Menü Kartlarını Oluştur (S/M/L + Staggered Animasyon) ──
let cardIndex = 0;
function renderMenu() {
  menuContainer.innerHTML = "";
  cardIndex = 0;
  
  menuData.forEach(category => {
    const section = document.createElement("section");
    section.classList.add("category-section");
    section.id = `section-${category.id}`;
    
    const title = document.createElement("h2");
    title.classList.add("category-title");
    title.innerHTML = `<span class="emoji">${category.emoji}</span> ${category.name}`;
    section.appendChild(title);
    
    const grid = document.createElement("div");
    grid.classList.add("menu-grid");
    
    category.items.forEach(item => {
      const card = document.createElement("div");
      card.classList.add("menu-card");
      card.style.animationDelay = `${cardIndex * 60}ms`;
      cardIndex++;
      
      const hasSizes = item.sizes && typeof item.sizes === "object";
      const defaultSize = "M";
      const displayPrice = hasSizes ? item.sizes[defaultSize] : item.price;
      
      let sizesHTML = "";
      if (hasSizes) {
        sizesHTML = `
          <div class="size-selector">
            ${Object.keys(item.sizes).map(size => `
              <button class="size-pill${size === defaultSize ? " active" : ""}" 
                      data-size="${size}" 
                      data-price="${item.sizes[size]}" 
                      type="button">
                ${size}
              </button>
            `).join("")}
          </div>
        `;
      }
      
      card.innerHTML = `
        <div class="menu-card-icon">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
        </div>
        <div class="menu-card-info">
          <div class="menu-card-name">${item.name}</div>
          <div class="menu-card-desc">${item.desc}</div>
          ${sizesHTML}
        </div>
        <div class="menu-card-price" data-price-display>₺${displayPrice}</div>
      `;
      
      if (hasSizes) {
        const pills = card.querySelectorAll(".size-pill");
        const priceEl = card.querySelector("[data-price-display]");
        pills.forEach(pill => {
          pill.addEventListener("click", () => {
            pills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            
            const newPrice = pill.getAttribute("data-price");
            priceEl.classList.add("price-updating");
            
            setTimeout(() => {
              priceEl.textContent = `₺${newPrice}`;
              priceEl.classList.remove("price-updating");
              priceEl.classList.add("price-updated");
              setTimeout(() => priceEl.classList.remove("price-updated"), 300);
            }, 150);
          });
        });
      }
      grid.appendChild(card);
    });
    
    section.appendChild(grid);
    menuContainer.appendChild(section);
  });
}

// ── Toast Bildirim Göster ──
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  const icon = type === "success" ? "✅" : "⚠️";
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove());
  }, 3000);
}

// ── Kaydırma ile Aktif Kategori Takibi ──
function setupScrollSpy() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace("section-", "");
          document.querySelectorAll(".category-tab").forEach(tab => {
            const isActive = tab.getAttribute("data-category") === id;
            tab.classList.toggle("active", isActive);
            if (isActive) moveIndicator(tab);
          });
        }
      });
    },
    { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
  );
  
  menuData.forEach(cat => {
    const el = document.getElementById(`section-${cat.id}`);
    if (el) observer.observe(el);
  });
}

// ── NFC Yönlendirme Modalı ──
function createNfcModal() {
  if (document.getElementById("nfc-modal")) return;
  const overlay = document.createElement("div");
  overlay.classList.add("nfc-modal-overlay");
  overlay.id = "nfc-modal";
  
  overlay.innerHTML = `
    <div class="nfc-modal-card">
      <button class="nfc-modal-close" id="nfc-modal-close" type="button" aria-label="Kapat">✕</button>
      <div class="nfc-icon-wrapper">
        <div class="nfc-ripple"></div>
        <div class="nfc-ripple nfc-ripple-2"></div>
        <div class="nfc-ripple nfc-ripple-3"></div>
        <div class="nfc-icon-circle">
          <svg class="nfc-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 48C40.8366 48 48 40.8366 48 32C48 23.1634 40.8366 16 32 16" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4">
              <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M32 42C37.5228 42 42 37.5228 42 32C42 26.4772 37.5228 22 32 22" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" begin="0.3s" repeatCount="indefinite"/>
            </path>
            <path d="M32 36C34.2091 36 36 34.2091 36 32C36 29.7909 34.2091 28 32 28" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.8">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin="0.6s" repeatCount="indefinite"/>
            </path>
            <circle cx="32" cy="32" r="4" fill="currentColor">
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      </div>
      <h3 class="nfc-modal-title" id="nfc-modal-title">NFC ile Anında İletişim</h3>
      <p class="nfc-modal-desc" id="nfc-modal-desc">
        Masanızdaki <strong>NFC noktasına</strong> telefonunuzu dokundurarak anında işlem yapabilirsiniz.
      </p>
      <div class="nfc-modal-steps">
        <div class="nfc-step">
          <span class="nfc-step-num">1</span>
          <span>Masadaki NFC etiketini bulun</span>
        </div>
        <div class="nfc-step">
          <span class="nfc-step-num">2</span>
          <span>Telefonunuzu yaklaştırın</span>
        </div>
        <div class="nfc-step">
          <span class="nfc-step-num">3</span>
          <span>İşlem otomatik olarak başlar</span>
        </div>
      </div>
      <button class="nfc-modal-btn" id="nfc-modal-ok" type="button">Tamam, Anladım</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  document.getElementById("nfc-modal-close").addEventListener("click", closeNfcModal);
  document.getElementById("nfc-modal-ok").addEventListener("click", closeNfcModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeNfcModal();
  });
}

function showNfcModal(aksiyonTipi) {
  createNfcModal();
  const modal = document.getElementById("nfc-modal");
  const title = document.getElementById("nfc-modal-title");
  const desc = document.getElementById("nfc-modal-desc");
  
  if (aksiyonTipi === "garson") {
    title.textContent = "Garson Çağır — NFC";
    desc.innerHTML = 'Masanızdaki <strong>NFC noktasına</strong> telefonunuzu dokundurarak anında garson çağırabilirsiniz.';
  } else {
    title.textContent = "Hesap İste — NFC";
    desc.innerHTML = 'Masanızdaki <strong>NFC noktasına</strong> telefonunuzu dokundurarak hesap talebinizi iletebilirsiniz.';
  }
  
  requestAnimationFrame(() => {
    modal.classList.add("visible");
  });
}

function closeNfcModal() {
  const modal = document.getElementById("nfc-modal");
  if (!modal) return;
  
  modal.classList.remove("visible");
  modal.classList.add("closing");
  
  modal.addEventListener("animationend", () => {
    modal.remove();
  }, { once: true });
  
  setTimeout(() => {
    if (document.getElementById("nfc-modal")) modal.remove();
  }, 400);
}

// ── Buton Olay Dinleyicileri ──
if(btnWaiter) btnWaiter.addEventListener("click", () => showNfcModal("garson"));
if(btnBill) btnBill.addEventListener("click", () => showNfcModal("hesap"));

// ── Sayfa Yüklendiğinde Çalıştır ──
document.addEventListener("DOMContentLoaded", () => {
  renderCategoryTabs();
  renderMenu();
  setupScrollSpy();
});