// ========== js/history.js ==========
// 歷史記錄管理模組 (localStorage)

const STORAGE_KEY = 'angelNumberHistory';

// 載入記錄
function loadHistory() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// 儲存記錄
function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// 新增記錄 (自動維護最多30筆)
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

// 刪除單筆記錄
function deleteHistoryRecord(id) {
    let history = loadHistory();
    history = history.filter(rec => rec.id != id);
    saveHistory(history);
}

// 渲染歷史記錄浮層 (依賴當前語言全域變數)
function renderHistoryModal() {
    const container = document.getElementById('historyListContainer');
    const history = loadHistory();
    const t = window.translations[window.currentLang]; // 由 main.js 提供全域變數

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
                <button class="delete-record" data-id="${rec.id}" title="Delete">✕</button>
            </li>
        `;
    });
    html += '</ul>';
    container.innerHTML = html;

    // 綁定刪除事件
    container.querySelectorAll('.delete-record').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            deleteHistoryRecord(id);
            renderHistoryModal(); // 重新渲染
        });
    });
}