// ========== js/history.js ==========
// 歷史記錄管理模組 (修改版)

const STORAGE_KEY = 'angelNumberHistory';

// 載入記錄 (保持不變)
function loadHistory() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// 儲存記錄 (保持不變)
function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// 新增記錄 (保持不變)
function addHistoryRecord(number, quickSummary) {
    if (!number || !quickSummary) return;
    let history = loadHistory();
    const now = new Date();
    const record = {
        id: Date.now() + Math.random(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        number: number,
        summary: quickSummary.substring(0, 100) + (quickSummary.length > 100 ? '…' : '')
    };
    history.unshift(record);
    if (history.length > 30) history = history.slice(0, 30);
    saveHistory(history);
}

// 刪除單筆記錄 (保持不變)
function deleteHistoryRecord(id) {
    let history = loadHistory();
    history = history.filter(rec => rec.id != id);
    saveHistory(history);
}

// === 修改：渲染歷史記錄浮層 (增加重新查詢按鈕) ===
function renderHistoryModal() {
    const container = document.getElementById('historyListContainer');
    const history = loadHistory();
    const t = window.translations[window.currentLang];

    if (!t) return;

    if (history.length === 0) {
        container.innerHTML = `<div class="empty-history">${t.emptyHistory}</div>`;
        return;
    }

    let html = '<ul class="history-list">';
    history.forEach(rec => {
        html += `
            <li class="history-item">
                <small>${rec.date} ${rec.time}</small>
                <div class="history-number">🔢 ${rec.number}</div>
                <div class="history-summary">${rec.summary}</div>
                <div class="history-actions"> <!-- 新增一個容器來放兩個按鈕 -->
                    <button class="requery-record" data-number="${rec.number}" data-lang="${window.currentLang}" title="Requery this number">🔄</button>
                    <button class="delete-record" data-id="${rec.id}" title="Delete">✕</button>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    container.innerHTML = html;

    // 綁定重新查詢事件 (新增)
    container.querySelectorAll('.requery-record').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const number = btn.getAttribute('data-number');
            const lang = btn.getAttribute('data-lang'); // 獲取記錄當時的語言，但我們會用當前語言查詢

            // 1. 關閉歷史浮層
            const modal = document.getElementById('historyModal');
            if (modal) modal.classList.add('hidden');

            // 2. 將數字填入主畫面的輸入框
            const inputEl = document.getElementById('angelInput');
            if (inputEl) inputEl.value = number;

            // 3. **可選：切換到記錄時的語言？** 需求是「以該記錄的天使數字及語言」，所以我們需要切換語言
            // 為了精確滿足需求，我們加上語言切換
            if (window.currentLang !== lang) {
                // 觸發語言切換 (假設 setLanguage 是全域可用的)
                if (typeof setLanguage === 'function') {
                    setLanguage(lang);
                } else {
                    // 如果 setLanguage 不在全域，我們需要另一種方式觸發。這裡假設它存在。
                    console.warn('setLanguage function not found, cannot switch language.');
                }
            }

            // 4. 自動觸發查詢
            // 等待一下讓 DOM 更新和語言切換完成（如果是非同步）
            setTimeout(() => {
                const fetchBtn = document.getElementById('fetchBtn');
                if (fetchBtn) fetchBtn.click();
            }, 100); // 短暫延遲以確保語言切換完成
        });
    });

    // 綁定刪除事件 (保持不變)
    container.querySelectorAll('.delete-record').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            deleteHistoryRecord(id);
            renderHistoryModal(); // 重新渲染
        });
    });
}

// 注意：為了讓 setLanguage 能在 history.js 中被呼叫，您需要確保它在全域作用域。
// 在 main.js 中，setLanguage 是一個內部函數。為了讓 history.js 能呼叫它，
// 您需要在 main.js 中將 setLanguage 賦值給一個全域變數，例如：window.setLanguage = setLanguage;
// 請在 main.js 的 setLanguage 函數定義後方，加上這一行：window.setLanguage = setLanguage;