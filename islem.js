/* ============================================
   KafeQR — NFC İşlem Sayfası Mantığı (islem.js)
   ============================================ */

// ── Firebase Yapılandırması ──
// ⚠️ Kendi Firebase projenizin bilgilerini buraya girin!
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

// ── Token Sözlüğü (Masa Haritası) ──
// Her masanın NFC etiketine yazılmış benzersiz token'ı
// ⚠️ Bu token'ları kendi NFC etiketlerinize göre güncelleyin!
const masaHaritasi = {
  "1": "aB3kL9pQwX",
  "2": "mN7vR2tYzH",
  "3": "cD5fG8jKsE",
  "4": "uW1xA6bCnO",
  "5": "x9Fk2pL8mQ",
  "6": "hJ4rT0yVdI",
  "7": "eP6sU3wBgM",
  "8": "qZ8nF1lRkC",
  "9": "oY2iH5xAmW",
  "10": "vK7dJ9pEtS"
};

// ── Sabitler ──
const SPAM_SURESI_MS = 60000; // 1 dakika (60 saniye)
const LS_KEY = "kafeqr_son_islem_zamani";

// ── DOM Referansları ──
const islemLoading = document.getElementById("islem-loading");
const islemResult = document.getElementById("islem-result");
const resultIcon = document.getElementById("result-icon");
const resultTitle = document.getElementById("result-title");
const resultDesc = document.getElementById("result-desc");
const resultTableInfo = document.getElementById("result-table-info");
const btnBackMenu = document.getElementById("btn-back-menu");

// ── URL Parametrelerini Oku ──
function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    masa: params.get("masa"),
    aksiyon: params.get("aksiyon"),
    token: params.get("token")
  };
}

// ── Sonucu Ekrana Yaz ──
function showResult(type, icon, title, desc, masa) {
  // Yükleniyor animasyonunu gizle
  islemLoading.style.display = "none";

  // Sonuç ikonunu ayarla
  resultIcon.className = "result-icon " + type;
  resultIcon.textContent = icon;

  // Metinleri ayarla
  resultTitle.textContent = title;
  resultDesc.textContent = desc;

  // Masa bilgisini göster (başarılı ise)
  if (masa && type === "success") {
    resultTableInfo.style.display = "inline-flex";
    resultTableInfo.innerHTML = `<span>☕</span> Masa ${masa}`;

    // Menüye dön butonu
    btnBackMenu.style.display = "inline-block";
    btnBackMenu.addEventListener("click", () => {
      window.location.href = `index.html?masa=${masa}`;
    });
  }

  // Hata durumunda da menüye dön butonu göster
  if (type === "error" || type === "warning") {
    btnBackMenu.style.display = "inline-block";
    btnBackMenu.addEventListener("click", () => {
      const p = getParams();
      const masaNo = p.masa || "";
      if (masaNo) {
        window.location.href = `index.html?masa=${masaNo}`;
      } else {
        window.location.href = "index.html";
      }
    });
  }

  // Sonuç kartını göster
  islemResult.classList.add("visible");
}

// ── Spam Kontrolü (LocalStorage) ──
function spamKontrolu() {
  const sonIslem = localStorage.getItem(LS_KEY);
  if (!sonIslem) return false; // Daha önce hiç istek atılmamış

  const gecenSure = Date.now() - parseInt(sonIslem, 10);
  if (gecenSure < SPAM_SURESI_MS) {
    const kalanSaniye = Math.ceil((SPAM_SURESI_MS - gecenSure) / 1000);
    return kalanSaniye; // Spam tespit edildi, kalan süreyi döndür
  }

  return false; // Süre dolmuş, istek atılabilir
}

// ── Spam Zamanını Kaydet ──
function spamZamaniKaydet() {
  localStorage.setItem(LS_KEY, Date.now().toString());
}

// ── Ana İşlem Akışı ──
async function islemBaslat() {
  const { masa, aksiyon, token } = getParams();

  // 1️⃣ Parametre Doğrulama
  if (!masa || !aksiyon || !token) {
    setTimeout(() => {
      showResult(
        "error",
        "❌",
        "Geçersiz İstek",
        "Eksik veya hatalı parametreler. Lütfen NFC etiketini tekrar okutun."
      );
    }, 800);
    return;
  }

  // 2️⃣ Aksiyon Doğrulama
  const gecerliAksiyonlar = ["garson", "hesap"];
  if (!gecerliAksiyonlar.includes(aksiyon)) {
    setTimeout(() => {
      showResult(
        "error",
        "❌",
        "Geçersiz İşlem Türü",
        "Desteklenmeyen bir işlem talep edildi."
      );
    }, 800);
    return;
  }

  // 3️⃣ Token Doğrulama (Güvenlik Kontrolü)
  const beklenenToken = masaHaritasi[masa];
  if (!beklenenToken || beklenenToken !== token) {
    setTimeout(() => {
      showResult(
        "error",
        "🚫",
        "Geçersiz NFC Etiketi",
        "Bu NFC etiketi tanınmıyor veya masa eşleşmesi hatalı. Lütfen personele başvurun."
      );
    }, 1000);
    return;
  }

  // 4️⃣ Spam Kontrolü (LocalStorage)
  const spamDurumu = spamKontrolu();
  if (spamDurumu !== false) {
    setTimeout(() => {
      showResult(
        "warning",
        "⏳",
        "Lütfen Bekleyin",
        `Lütfen yeni bir çağrı için ${spamDurumu} saniye bekleyin. Talebiniz zaten iletildi.`,
        masa
      );
    }, 800);
    return;
  }

  // 5️⃣ Firebase'e Talep Gönder
  try {
    const talepVerisi = {
      masa: masa,
      tip: aksiyon,
      kaynak: "nfc",
      zaman: Date.now(),
      zamanOkunabilir: new Date().toLocaleString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    };

    // Firebase Realtime Database'e yaz
    await database.ref("talepler").push(talepVerisi);

    // Spam zamanlayıcısını kaydet
    spamZamaniKaydet();

    // Başarılı sonuç
    const aksiyonMetni = aksiyon === "garson"
      ? "Garsonumuz masanıza yönlendiriliyor."
      : "Hesabınız hazırlanıyor.";

    setTimeout(() => {
      showResult(
        "success",
        "✅",
        "Talebiniz İletildi!",
        aksiyonMetni,
        masa
      );
    }, 1200);

  } catch (error) {
    console.error("Firebase yazma hatası:", error);
    setTimeout(() => {
      showResult(
        "error",
        "❌",
        "Bağlantı Hatası",
        "Talebiniz gönderilemedi. Lütfen tekrar deneyin veya personele başvurun."
      );
    }, 800);
  }
}

// ── Sayfa Yüklendiğinde İşlemi Başlat ──
document.addEventListener("DOMContentLoaded", islemBaslat);
