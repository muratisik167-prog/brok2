let myAssets = [];
let marketPrices = {};

// 1. Backend'den Portföyü Çek
async function fetchPortfolio() {
    try {
        const res = await fetch('/api/portfolio');
        myAssets = await res.json();
        renderAssets(); // Veri gelince tabloyu çiz
    } catch (err) {
        console.error("Portföy yüklenemedi", err);
    }
}

// 2. Binance'den Fiyatları Çek
async function fetchPrices() {
    try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price');
        const data = await res.json();
        
        // Fiyatları objeye çevir { "BTCTRY": 3200000, ... }
        data.forEach(item => {
            marketPrices[item.symbol] = parseFloat(item.price);
        });

        renderAssets(); // Fiyat güncellenince tabloyu ve toplamı güncelle
    } catch (err) {
        console.error("Market verisi alınamadı", err);
    }
}

// 3. Tabloyu ve Toplamı Hesapla/Çiz
function renderAssets() {
    const container = document.getElementById('assetsContainer');
    const totalBalanceEl = document.getElementById('totalBalance');
    const totalPnlEl = document.getElementById('totalPnl');

    // Eğer henüz fiyat veya asset yoksa bekle
    if (Object.keys(marketPrices).length === 0) return;

    let totalValue = 0;
    let totalCost = 0;
    let html = '';

    if (myAssets.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#555;">Henüz varlık eklemediniz.</div>';
        totalBalanceEl.innerText = "0.00";
        totalPnlEl.innerHTML = "---";
        return;
    }

    myAssets.forEach(asset => {
        const currentPrice = marketPrices[asset.symbol] || 0;
        const assetValue = currentPrice * asset.amount; // Anlık Değer
        const assetCost = asset.buy_price * asset.amount; // Maliyet

        totalValue += assetValue;
        totalCost += assetCost;

        // Kar Zarar Hesabı
        const pnl = assetValue - assetCost;
        const pnlPercent = ((pnl / assetCost) * 100).toFixed(2);
        const isProfit = pnl >= 0;

        html += `
            <div class="asset-item">
                <div class="asset-name">
                    ${asset.symbol.replace('TRY', '')}
                    <div style="font-size:0.7rem; color:#666;">${asset.amount} Adet</div>
                </div>
                <div class="asset-price">
                    ₺${formatMoney(currentPrice)}
                </div>
                <div class="asset-value">
                    ₺${formatMoney(assetValue)}
                </div>
                <div class="${isProfit ? 'text-green' : 'text-red'}">
                    ${isProfit ? '+' : ''}₺${formatMoney(pnl)}
                    <br><span style="font-size:0.7rem;">%${pnlPercent}</span>
                </div>
                <button class="delete-btn" onclick="deleteAsset(${asset.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Toplam Kartını Güncelle
    totalBalanceEl.innerText = formatMoney(totalValue);
    
    const totalPnl = totalValue - totalCost;
    const totalPnlClass = totalPnl >= 0 ? 'bg-green-soft' : 'bg-red-soft';
    const sign = totalPnl >= 0 ? '+' : '';
    
    totalPnlEl.className = `pnl-wrapper ${totalPnlClass}`;
    totalPnlEl.innerHTML = `Kar/Zarar: ${sign}₺${formatMoney(totalPnl)}`;
}

// Para Formatlama
function formatMoney(num) {
    return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 4. Yeni Varlık Ekleme (Form Submit)
document.getElementById('addAssetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const symbol = document.getElementById('coinSymbol').value;
    const amount = document.getElementById('coinAmount').value;
    const price = document.getElementById('coinPrice').value;

    const res = await fetch('/api/portfolio/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, amount, price })
    });

    if (res.ok) {
        // Formu temizle ve verileri yenile
        document.getElementById('addAssetForm').reset();
        fetchPortfolio(); 
    } else {
        alert("Hata oluştu!");
    }
});

// 5. Varlık Silme
async function deleteAsset(id) {
    if(confirm('Bu varlığı silmek istediğine emin misin?')) {
        await fetch(`/api/portfolio/delete/${id}`, { method: 'DELETE' });
        fetchPortfolio();
    }
}

// Başlatma
fetchPortfolio();     // Önce veritabanındaki varlıkları al
fetchPrices();        // Sonra fiyatları al
setInterval(fetchPrices, 2000); // Her 2 saniyede bir fiyatları güncelle