// ========== js/main.js ==========
// 主要應用邏輯

(function() {
    // ---------- 全域變數 ----------
    window.currentLang = 'en';           // 供 history.js 使用
    let angelNumber = '';
    let lastQueriedNumber = '';
    let loading = false;
    let hasResult = false;

    // DOM 元素
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

    const defaultImage = 'http://www.pericles.net/ftp1/edmond/expertit/Apps/Angel-Image.jpeg';
    const goldenImage = 'http://www.pericles.net/ftp1/edmond/expertit/Apps/Angel-Image-1.jpeg';

    // 取得當前語言的字典
    function t() {
        return window.translations[window.currentLang];
    }

    // 套用語言到 UI
    function applyLanguage() {
        const lang = window.currentLang;
        const trans = t();
        mainTitle.textContent = trans.title;
        inputEl.placeholder = trans.inputPlaceholder;
        fetchBtn.textContent = loading ? trans.buttonLoading : trans.buttonNormal;
        bannerMessage.innerHTML = `${trans.bannerText} <span class="dots">...</span>`;
        if (hasResult) imageCaption.textContent = trans.imageCaption;
        historyBtn.textContent = trans.historyBtn;
        modalTitle.textContent = trans.modalTitle;
        footerNote.textContent = trans.footerNote;
        modalFooterNote.textContent = trans.modalFooterNote;
    }

    // 切換語言 (更新全域變數 + UI + 自動重查)
    async function setLanguage(lang) {
        if (lang === window.currentLang) return;
        window.currentLang = lang;
        langOptions.forEach(opt => {
            opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
        });
        applyLanguage();
        if (lastQueriedNumber && !loading) {
            inputEl.value = lastQueriedNumber;
            angelNumber = lastQueriedNumber;
            await fetchMeaning(true);
        }
    }

    // 顯示錯誤
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

    // 從 API 文字中萃取 Quick Essence
    function extractQuickEssence(apiText) {
        const match = apiText.match(/(?:✨ Quick Essence|✨ 快速核心|✨ 快速核心)：?\s*([^\n]+)/i);
        return match ? match[1].trim() : '';
    }

    // 解析並渲染結果
    function parseAndRenderResult(apiText, number) {
        const trans = t();
        let html = '';

        const coreQuick = (apiText.match(/(?:✨ Quick Essence|✨ 快速核心|✨ 快速核心)：?\s*([^\n]+)/i) || [])[1] || '';
        const coreDetailed = (apiText.match(/(?:📖 Detailed Interpretation|📖 詳細解釋|📖 详细解释)：?\s*([\s\S]+?)(?=🏷️|🌈|$)/i) || [])[1] || '';
        const keywordsRaw = (apiText.match(/(?:🏷️ Keywords|🏷️ 關鍵字標籤|🏷️ 关键词标签)：?\s*([^\n]+)/i) || [])[1] || '';

        const love = (apiText.match(/(?:❤️ Love & Relationships|❤️ 愛情／人際|❤️ 爱情／人际)：?\s*([^\n]+)/i) || [])[1] || '';
        const career = (apiText.match(/(?:💼 Career \/ Finance|💼 事業／財富|💼 事业／财富)：?\s*([^\n]+)/i) || [])[1] || '';
        const health = (apiText.match(/(?:🧘 Health & Well-being|🧘 健康／身心靈|🧘 健康／身心)：?\s*([^\n]+)/i) || [])[1] || '';
        const spirit = (apiText.match(/(?:✨ Spiritual Growth|✨ 精神成長|✨ 精神成长)：?\s*([^\n]+)/i) || [])[1] || '';

        const stepsMatch = apiText.match(/(?:📝 1–3 Steps You Can Take Now|📝 立即採取 1–3 步驟|📝 立即采取 1–3 步骤)：?\s*([\s\S]+?)(?=🕯️|🔁|$)/i);
        let stepsHtml = '';
        if (stepsMatch) {
            const block = stepsMatch[1];
            const lines = block.split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'));
            if (lines.length) {
                stepsHtml = '<ul class="steps-list">' + lines.map(l => {
                    const text = l.replace(/^[•\-]\s*/, '').trim();
                    return `<li><span class="step-number">•</span> ${text}</li>`;
                }).join('') + '</ul>';
            } else {
                stepsHtml = `<div>${block}</div>`;
            }
        }

        const ritual = (apiText.match(/(?:🕯️ Meditation \/ Ritual|🕯️ 冥想／儀式|🕯️ 冥想／仪式)：?\s*([^\n]+(?:[^\n]*))/i) || [])[1] || '';
        const affirmation = (apiText.match(/(?:🔁 Affirmation \/ Mantra|🔁 肯定語／咒語|🔁 肯定语／咒语)：?\s*([^\n]+)/i) || [])[1] || '';

        html += `<div class="section"><div class="section-header"><span>🔮</span><h3>${trans.coreTitle}</h3></div>`;
        if (coreQuick) html += `<div class="core-quick">${coreQuick}</div>`;
        if (coreDetailed) html += `<div class="core-detailed">${coreDetailed}</div>`;
        if (keywordsRaw) html += `<div class="keyword-tags">${keywordsRaw.split(',').map(k => `<span class="tag">${k.trim()}</span>`).join('')}</div>`;
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

        if (coreQuick) {
            addHistoryRecord(number, coreQuick);
        }
    }

    // 主要查詢函數
    async function fetchMeaning(fromLangSwitch = false) {
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
        hasResult = false;
        hideError();
        loading = true;
        
        resultArea.classList.add('hidden');
        waitingBanner.classList.remove('hidden');
        angelImg.src = defaultImage;
        imageCaption.classList.add('hidden');
        
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
                    'Authorization': 'Bearer sk-d6b0de1ceb3d4fc0a1de4bcef89f1db2'
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
                hasResult = true;
                angelImg.src = goldenImage;
                imageCaption.textContent = trans.imageCaption;
                imageCaption.classList.remove('hidden');
                parseAndRenderResult(content, angelNumber);
            } else {
                throw new Error(data.error?.message || 'API error');
            }
        } catch (err) {
            showError(err.message);
            hasResult = false;
            angelImg.src = defaultImage;
            imageCaption.classList.add('hidden');
        } finally {
            loading = false;
            waitingBanner.classList.add('hidden');
            applyLanguage();
        }
    }

    // 顯示歷史記錄浮層
    function showHistoryModal() {
        renderHistoryModal(); // 來自 history.js
        document.getElementById('historyModal').classList.remove('hidden');
    }

    function hideHistoryModal() {
        document.getElementById('historyModal').classList.add('hidden');
    }

    // ---------- 事件綁定 ----------
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
})();