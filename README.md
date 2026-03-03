# 天使數字 (Angel Number) ✨

![版本](https://img.shields.io/badge/version-1.0.0-purple)
![授權](https://img.shields.io/badge/license-MIT-green)

一個優雅的天使數字查詢與解讀應用，支援多國語言（英文、繁體中文、簡體中文），提供詳細的靈性數字解讀。

## ✨ 功能特色

- 🔮 **天使數字查詢**：輸入數字（如 111、222、333）取得詳細解讀
- 🌐 **多語言支援**：English、繁體中文、简体中文
- 📜 **查詢記錄**：自動儲存最近 30 筆查詢記錄
- 🔄 **重新查詢**：從歷史記錄一鍵重新查詢
- 🎨 **優雅介面**：柔和紫色系設計，支援行動裝置

## 🚀 快速開始

### 安裝與配置

1. **下載專案**
   ```bash
   git clone https://github.com/edchen13/AngelNumber.git
   cd AngelNumber

2. **設定 API 金鑰**
   複製範例配置文件：
   ```bash
   cp config.example.js config.js

   編輯 config.js，填入您的 DeepSeek API 金鑰：
    ```javascript
   window.DEEPSEEK_API_KEY_CONFIG = 'sk-您的API金鑰';

3. **取得 API 金鑰**
    前往 DeepSeek 開發者平台
    註冊/登入後，進入「API 管理」→「API 金鑰」
    點擊「建立新金鑰」，複製生成的金鑰

4. **執行應用**
    直接在瀏覽器打開 index.html 即可使用

📁 專案結構

AngelNumber/
├── index.html          # 主頁面
├── config.example.js   # API 配置範例（請複製為 config.js）
├── .gitignore          # Git 忽略文件配置
└── js/
    ├── translations.js # 多語言字典
    ├── history.js      # 歷史記錄管理
    └── main.js         # 核心邏輯

    
