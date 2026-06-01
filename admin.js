/* ============================================
   KafeQR — Yönetim Paneli Mantığı (admin.js)
   ============================================ */

// ── Firebase Yapılandırması ──
// ⚠️ Kendi Firebase projenizin bilgilerini buraya girin!
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ── DOM Referansları ──
const notificationsGrid = document.getElementById("notifications-grid");
const emptyState = document.getElementById("empty-state");
const statWaiter = document.getElementById("stat-waiter");
const statBill = document.getElementById("stat-bill");
const statTotal = document.getElementById("stat-total");
const notificationCountBadge = document.getElementById("notification-count");
const soundToggleBtn = document.getElementById("sound-toggle");
const toastContainer = document.getElementById("toast-container");

// ── Uygulama Durumu ──
let activeRequests = {}; // Aktif talep ID'lerini tut
let completedToday = 0;
let soundEnabled = true;

// ── Ses Bildirimi: Web Audio API ──
// Tarayıcıda harici dosya gerekmeden ses üretmek için AudioContext kullan
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Duraklatılmışsa devam ettir
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// Bildirim sesi çal — iki tonlu uyarı zili
function playNotificationSound() {
  if (!soundEnabled) return;

  try {
    ensureAudioContext();

    const now = audioCtx.currentTime;

    // İlk ton (yüksek)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // İkinci ton (daha yüksek, kısa gecikme ile)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1100, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);

    // Üçüncü ton (en yüksek, vurgulu)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1320, now + 0.35);
    gain3.gain.setValueAtTime(0.25, now + 0.35);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.start(now + 0.35);
    osc3.stop(now + 0.7);
  } catch (e) {
    console.warn("Ses çalınamadı:", e);
  }
}

// ── Ses Aç/Kapat Butonu ──
soundToggleBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.classList.toggle("muted", !soundEnabled);
  soundToggleBtn.innerHTML = soundEnabled
    ? '🔔 <span>Ses Açık</span>'
    : '🔕 <span>Ses Kapalı</span>';

  // İlk tıklamada AudioContext başlat (tarayıcı politikası)
  if (soundEnabled) {
    ensureAudioContext();
  }
});

// ── Toast Bildirim ──
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  const icon = type === "success" ? "✅" : "📡";
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

// ── İstatistikleri Güncelle ──
function updateStats() {
  let waiterCount = 0;
  let billCount = 0;

  Object.values(activeRequests).forEach(req => {
    if (req.tip === "garson") waiterCount++;
    if (req.tip === "hesap") billCount++;
  });

  statWaiter.textContent = waiterCount;
  statBill.textContent = billCount;
  statTotal.textContent = completedToday;

  // Toplam aktif bildirim sayısını göster
  const totalActive = waiterCount + billCount;
  notificationCountBadge.textContent = totalActive;
  notificationCountBadge.classList.toggle("hidden", totalActive === 0);

  // Sayfa başlığında bildirim sayısı göster
  document.title = totalActive > 0
    ? `(${totalActive}) KafeQR — Yönetim Paneli`
    : "KafeQR — Yönetim Paneli";

  // Boş durum göster/gizle
  emptyState.style.display = totalActive === 0 ? "block" : "none";
}

// ── Geçen Süreyi Hesapla ──
function formatElapsed(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);

  if (diff < 60) return `${diff} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  return `${Math.floor(diff / 3600)} sa önce`;
}

// ── Bildirim Kartı Oluştur ──
function createNotificationCard(id, data) {
  const card = document.createElement("div");
  card.classList.add("notification-card", `type-${data.tip}`);
  card.id = `card-${id}`;

  const isWaiter = data.tip === "garson";
  const typeLabel = isWaiter ? "Garson Bekliyor" : "Hesap Talebi";
  const typeIcon = isWaiter ? "🙋" : "🧾";
  const statusText = isWaiter
    ? "Müşteri garson bekliyor..."
    : "Müşteri hesabı bekliyor...";

  card.innerHTML = `
    <div class="notification-card-header">
      <div class="notification-table">
        <div class="notification-table-icon">${typeIcon}</div>
        <div class="notification-table-info">
          <div class="table-number">Masa ${data.masa}</div>
          <div class="request-type">${typeLabel}</div>
        </div>
      </div>
      <div class="notification-time">
        <span class="elapsed" data-timestamp="${data.zaman}">${formatElapsed(data.zaman)}</span>
        <span>${data.zamanOkunabilir || ""}</span>
      </div>
    </div>
    <div class="notification-card-body">
      <div class="pulse-ring"></div>
      <span class="status-text">${statusText}</span>
    </div>
    <button class="btn-complete" data-id="${id}" type="button">
      ✅ Tamamlandı
    </button>
  `;

  // Tamamlandı butonu olay dinleyicisi
  const completeBtn = card.querySelector(".btn-complete");
  completeBtn.addEventListener("click", () => completeRequest(id));

  return card;
}

// ── Talep Tamamla (Sil) ──
function completeRequest(id) {
  const ref = database.ref(`talepler/${id}`);
  ref.remove()
    .then(() => {
      completedToday++;
      showToast("Talep tamamlandı ve silindi.", "success");
    })
    .catch(error => {
      console.error("Silme hatası:", error);
      showToast("Silme sırasında hata oluştu!", "error");
    });
}

// ── Geçen Süreleri Periyodik Güncelle ──
function startElapsedTimer() {
  setInterval(() => {
    document.querySelectorAll(".elapsed[data-timestamp]").forEach(el => {
      const ts = parseInt(el.getAttribute("data-timestamp"), 10);
      el.textContent = formatElapsed(ts);
    });
  }, 10000); // Her 10 saniyede bir güncelle
}

// ── Firebase Realtime Dinleyici ──
function startListening() {
  const ref = database.ref("talepler");

  // Yeni talep eklendi
  ref.on("child_added", (snapshot) => {
    const id = snapshot.key;
    const data = snapshot.val();

    // Eğer zaten varsa (sayfa yenilenmiş olabilir) tekrar ekleme
    if (activeRequests[id]) return;

    activeRequests[id] = data;

    // Bildirim kartını oluştur ve grid'e ekle
    const card = createNotificationCard(id, data);
    // Boş durum elemanından önce ekle (en üste)
    notificationsGrid.insertBefore(card, notificationsGrid.firstChild);

    // Ses çal
    playNotificationSound();

    // İstatistikleri güncelle
    updateStats();
  });

  // Talep silindi (Tamamlandı)
  ref.on("child_removed", (snapshot) => {
    const id = snapshot.key;

    // Kartı DOM'dan kaldır (animasyonlu)
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.style.transition = "all 0.3s ease";
      card.style.opacity = "0";
      card.style.transform = "scale(0.9) translateY(-10px)";
      setTimeout(() => card.remove(), 300);
    }

    // Aktif taleplerden sil
    delete activeRequests[id];

    // İstatistikleri güncelle
    updateStats();
  });
}

// ── Sayfa Yüklendiğinde Başlat ──
document.addEventListener("DOMContentLoaded", () => {
  startListening();
  startElapsedTimer();

  // Kullanıcıya bilgi ver
  showToast("Canlı dinleme aktif — talepler anında görünecek.", "success");
});
