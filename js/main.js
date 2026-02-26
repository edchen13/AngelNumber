// ========== js/main.js ==========
// 主要應用邏輯 (修改版)

(function() {
    // ---------- 全域變數 ----------
    window.currentLang = 'en';
    let angelNumber = '';
    let lastQueriedNumber = ''; // 用於記錄上次成功查詢的數字
    let loading = false;
    let hasResult = false;

    // DOM 元素 (與您原有程式碼相同)
    const inputEl = document.getElementById('angelInput');
    const fetchBtn = document.getElementById('fetchBtn');
    const historyBtn = document.getElementById('historyBtn');
    const waitingBanner = document.getElementById('waitingBanner');
    const bannerMessage = document.getElementById('bannerMessage');
    const errorDiv = document.getElementById('errorMessage');
    const errorTextSpan = document.getElementById('errorText');
    const resultArea = document.getElementById('resultArea');
    const angelImg = document.getElementById('angelImg');
    const imageCaption = document.getElementById('imageCaption');
    const mainTitle = document.getElementById('mainTitle');
    const langOptions = document.querySelectorAll('.lang-option');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const footerNote = document.getElementById('footerNote');
    const modalFooterNote = document.getElementById('modalFooterNote');
    const DEEPSEEK_API_KEY = window.DEEPSEEK_API_KEY_CONFIG || 'fallback-key-warning';

    const defaultImage = 'http://www.pericles.net/ftp1/edmond/expertit/Apps/Angel-Image.jpeg';
    const goldenImage = 'http://www.pericles.net/ftp1/edmond/expertit/Apps/Angel-Image-1.jpeg';

    // 取得當前語言的字典
    function t() {
        return window.translations[window.currentLang];
    }

    // 套用語言到 UI
    function applyLanguage() {
        const trans = t();
        mainTitle.textContent = trans.title;
        inputEl.placeholder = trans.inputPlaceholder;
        fetchBtn.textContent = loading ? trans.buttonLoading : trans.buttonNormal;
        bannerMessage.innerHTML = `${trans.bannerText} <span class="dots">...</span>`;
        // 修改：圖像說明文字的顯示與否，現在由 hasResult 控制
        if (hasResult) {
            imageCaption.textContent = trans.imageCaption;
            imageCaption.classList.remove('hidden');
        } else {
            imageCaption.classList.add('hidden');
        }
        historyBtn.textContent = trans.historyBtn;
        modalTitle.textContent = trans.modalTitle;
        footerNote.textContent = trans.footerNote;
        modalFooterNote.textContent = trans.modalFooterNote;
    }

    // === 修改 1：切換語言的行為 ===
    async function setLanguage(lang) {
        if (lang === window.currentLang) return;
        window.currentLang = lang;
        langOptions.forEach(opt => {
            opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
        });

        // 1. 清除最近的數字和查詢狀態
        lastQueriedNumber = '';
        hasResult = false;
        // 2. 清空輸入框
        inputEl.value = '';
        // 3. 隱藏結果區域和圖像說明，將圖片恢復為預設
        resultArea.classList.add('hidden');
        imageCaption.classList.add('hidden');
        angelImg.src = defaultImage;
        // 4. 更新 UI 文字
        applyLanguage();
        // 注意：不再自動觸發重新搜尋
    }

    // 顯示錯誤 (保持不變)
    function showError(message) {
        const trans = t();
        let displayMsg = message;
        if (message.includes('Please enter') && window.currentLang !== 'en') displayMsg = trans.alertEmpty;
        else if (message.startsWith('Error:') && window.currentLang !== 'en') displayMsg = message.replace('Error:', trans.errorDefault);
        errorTextSpan.textContent = displayMsg;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    }
    function hideError() { errorDiv.classList.add('hidden'); }

    // 從 API 文字中萃取 Quick Essence (保持不變)
    function extractQuickEssence(apiText) {
        // 注意：這個函數目前沒有被使用，但保留它
        const match = apiText.match(/(?:✨ Quick Essence|✨ 快速核心|✨ 快速核心)：?\s*([^\n]+)/i);
        return match ? match[1].trim() : '';
    }

    // === 修改 2：強化解析與清理函數 ===
    function parseAndRenderResult(apiText, number) {
        const trans = t();
        let html = '';

        // 輔助函數：清理提取到的文字 (去除開頭多餘的標點符號)
        function cleanText(text) {
            if (!text) return '';
            // 去除開頭的冒號、引號、空格及其組合，直到遇到第一個中文字母或數字
            return text.replace(/^[\s:：""“”''""]+/, '').trim();
        }

        // 使用更靈活的正則表達式，適應可能有多餘符號的情況
        const coreQuick = cleanText((apiText.match(/(?:✨ Quick Essence|✨ 快速核心|✨ 快速核心)[：:]*\s*([^\n]+)/i) || [])[1]);
        const coreDetailed = cleanText((apiText.match(/(?:📖 Detailed Interpretation|📖 詳細解釋|📖 详细解释)[：:]*\s*([\s\S]+?)(?=🏷️|🌈|$)/i) || [])[1]);
        const keywordsRaw = cleanText((apiText.match(/(?:🏷️ Keywords|🏷️ 關鍵字標籤|🏷️ 关键词标签)[：:]*\s*([^\n]+)/i) || [])[1]);

        const love = cleanText((apiText.match(/(?:❤️ Love & Relationships|❤️ 愛情／人際|❤️ 爱情／人际)[：:]*\s*([^\n]+)/i) || [])[1]);
        const career = cleanText((apiText.match(/(?:💼 Career \/ Finance|💼 事業／財富|💼 事业／财富)[：:]*\s*([^\n]+)/i) || [])[1]);
        const health = cleanText((apiText.match(/(?:🧘 Health & Well-being|🧘 健康／身心靈|🧘 健康／身心)[：:]*\s*([^\n]+)/i) || [])[1]);
        const spirit = cleanText((apiText.match(/(?:✨ Spiritual Growth|✨ 精神成長|✨ 精神成长)[：:]*\s*([^\n]+)/i) || [])[1]);

        // 處理步驟列表
        const stepsMatch = apiText.match(/(?:📝 1–3 Steps You Can Take Now|📝 立即採取 1–3 步驟|📝 立即采取 1–3 步骤)[：:]*\s*([\s\S]+?)(?=🕯️|🔁|$)/i);
        let stepsHtml = '';
        if (stepsMatch) {
            const block = stepsMatch[1];
            // 清理區塊內容，並分割行
            const lines = block.split('\n').map(line => line.trim()).filter(line => line.startsWith('•') || line.startsWith('-'));
            if (lines.length) {
                stepsHtml = '<ul class="steps-list">' + lines.map(l => {
                    // 移除開頭的項目符號並清理文字
                    const text = l.replace(/^[•\-]\s*/, '').trim();
                    return `<li><span class="step-number">•</span> ${text}</li>`;
                }).join('') + '</ul>';
            } else {
                // 如果沒有標準的列表格式，就當作一般文字顯示
                stepsHtml = `<div>${cleanText(block)}</div>`;
            }
        }

        const ritual = cleanText((apiText.match(/(?:🕯️ Meditation \/ Ritual|🕯️ 冥想／儀式|🕯️ 冥想／仪式)[：:]*\s*([^\n]+(?:[^\n]*))/i) || [])[1]);
        const affirmation = cleanText((apiText.match(/(?:🔁 Affirmation \/ Mantra|🔁 肯定語／咒語|🔁 肯定语／咒语)[：:]*\s*([^\n]+)/i) || [])[1]);

        // --- 開始組裝 HTML (結構與您原有邏輯相同，但使用清理後的變數) ---
        html += `<div class="section"><div class="section-header"><span>🔮</span><h3>${trans.coreTitle}</h3></div>`;
        if (coreQuick) html += `<div class="core-quick">${coreQuick}</div>`;
        if (coreDetailed) html += `<div class="core-detailed">${coreDetailed}</div>`;
        if (keywordsRaw) {
            // 清理關鍵字中的多餘空格和符號
            const keywords = keywordsRaw.split(',').map(k => k.replace(/^[\s"“”']+|[\s"“”']+$/g, '').trim()).filter(k => k);
            if (keywords.length) {
                html += `<div class="keyword-tags">${keywords.map(k => `<span class="tag">${k}</span>`).join('')}</div>`;
            }
        }
        html += `</div>`;

        html += `<div class="section"><div class="section-header"><span>🌈</span><h3>${trans.dimensionTitle}</h3></div><div class="dimension-grid">`;
        if (love) html += `<div class="dimension-item"><div class="dimension-title">❤️ ${trans.love.replace(/❤️ /,'')}</div><div class="dimension-text">${love}</div></div>`;
        if (career) html += `<div class="dimension-item"><div class="dimension-title">💼 ${trans.career.replace(/💼 /,'')}</div><div class="dimension-text">${career}</div></div>`;
        if (health) html += `<div class="dimension-item"><div class="dimension-title">🧘 ${trans.health.replace(/🧘 /,'')}</div><div class="dimension-text">${health}</div></div>`;
        if (spirit) html += `<div class="dimension-item"><div class="dimension-title">✨ ${trans.spirit.replace(/✨ /,'')}</div><div class="dimension-text">${spirit}</div></div>`;
        html += `</div></div>`;

        html += `<div class="section"><div class="section-header"><span>⚡</span><h3>${trans.actionTitle}</h3></div>`;
        if (stepsHtml) html += `<div class="action-steps"><div class="sub-section-title">${trans.immediateSteps}</div>${stepsHtml}</div>`;
        if (ritual) html += `<div class="ritual-box"><div class="sub-section-title">${trans.ritual}</div><div>${ritual}</div></div>`;
        if (affirmation) html += `<div class="affirmation-box"><div class="sub-section-title">${trans.affirmation}</div><div class="affirmation-text">"${affirmation}"</div></div>`;
        html += `</div>`;

        resultArea.innerHTML = html;
        resultArea.classList.remove('hidden');

        // 記錄到歷史
        if (coreQuick) {
            addHistoryRecord(number, coreQuick);
        }
    }

    // 主要查詢函數 (修改圖像渲染部分)
    async function fetchMeaning(fromLangSwitch = false) {
        // ... 此函數前半部的邏輯與您原有程式碼完全相同 ...
        let inputVal;
        if (fromLangSwitch) {
            if (!lastQueriedNumber) return;
            inputVal = lastQueriedNumber;
        } else {
            inputVal = inputEl.value.trim();
            if (!inputVal) {
                showError(t().alertEmpty);
                return;
            }
        }

        angelNumber = inputVal;
        hasResult = false; // 查詢開始時設為 false
        hideError();
        loading = true;

        resultArea.classList.add('hidden');
        waitingBanner.classList.remove('hidden');
        angelImg.src = defaultImage; // 查詢中顯示預設圖
        imageCaption.classList.add('hidden'); // 查詢中隱藏說明

        applyLanguage();

        try {
            const trans = t();
            let userMsg = `Number: ${angelNumber}`;
            if (window.currentLang === 'zh-tw') userMsg = `數字：${angelNumber}`;
            else if (window.currentLang === 'zh-cn') userMsg = `数字：${angelNumber}`;

            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: trans.systemPrompt },
                        { role: 'user', content: userMsg }
                    ],
                    temperature: 0.5,
                    max_tokens: 1000
                })
            });

            const raw = await response.text();
            if (!raw) throw new Error('Empty response');
            const data = JSON.parse(raw);
            if (response.ok && data.choices?.[0]?.message?.content) {
                const content = data.choices[0].message.content;
                lastQueriedNumber = angelNumber;
                hasResult = true; // 查詢成功設為 true

                // === 修改：成功時才更換圖片和顯示說明 ===
                angelImg.src = goldenImage;
                imageCaption.textContent = trans.imageCaption;
                imageCaption.classList.remove('hidden'); // 顯示說明

                parseAndRenderResult(content, angelNumber);
            } else {
                throw new Error(data.error?.message || 'API error');
            }
        } catch (err) {
            showError(err.message);
            hasResult = false; // 失敗保持 false
            angelImg.src = defaultImage;
            imageCaption.classList.add('hidden'); // 失敗隱藏說明
        } finally {
            loading = false;
            waitingBanner.classList.add('hidden');
            applyLanguage(); // 更新按鈕文字等
        }
    }

    // 顯示歷史記錄浮層 (保持不變)
    function showHistoryModal() {
        if (typeof renderHistoryModal === 'function') {
            renderHistoryModal();
        }
        document.getElementById('historyModal').classList.remove('hidden');
    }

    function hideHistoryModal() {
        document.getElementById('historyModal').classList.add('hidden');
    }

    // ---------- 事件綁定 (保持不變) ----------
    fetchBtn.addEventListener('click', () => fetchMeaning(false));
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchMeaning(false); });
    historyBtn.addEventListener('click', showHistoryModal);
    closeModalBtn.addEventListener('click', hideHistoryModal);
    document.getElementById('historyModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) hideHistoryModal();
    });

    langOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            const lang = e.target.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    // 初始化
    setLanguage('en');
    // 在 main.js 的最後加上這一行
    window.setLanguage = setLanguage;
})();