# Google Apps Script 與前端整合說明（中文）

此文件說明如何將 `背單字卡片` 前端應用與 Google 試算表（Google Sheets）透過 Google Apps Script (GAS) 整合，讓管理者在表單按下「儲存單字」後，資料會被寫入試算表。

## 需求欄位
前端表單會送出以下欄位（JSON）：
- `english`：英文單字
- `translation`：中文翻譯
- `rootAnalysis`：字根分析
- `example`：例句
- `partOfSpeech`：詞性
- `timestamp`：ISO 時間字串（由前端附加）

## 步驟總覽
1. 建立 Google 試算表並準備欄位標頭
2. 建立 Apps Script（綁定或獨立皆可），並編寫 `doPost(e)` 接收 JSON
3. 部署 Apps Script 為 Web App，設定可由「任何人（甚至匿名者）」存取（或依需求調整）
4. 取得 Web App URL，並將其設定到前端 `app.js` 中的 `GAS_ENDPOINT`
5. （可選）設定驗證密鑰以避免濫用

---

## 1. 建立 Google 試算表
1. 開啟 Google Sheets，建立新試算表。建議第一列為欄位標頭：
   - A1: 英文單字
   - B1: 中文翻譯
   - C1: 字根分析
   - D1: 例句
   - E1: 詞性
   - F1: Timestamp
2. 記下試算表的 ID（在網址中，例如 `https://docs.google.com/spreadsheets/d/<<SPREADSHEET_ID>>/edit`）。

## 2. 建立 Apps Script
1. 在試算表中，功能表：擴充功能 → Apps Script（或至 https://script.google.com 建立新專案）。
2. 將下列範例程式貼入 `Code.gs`：

```javascript
const SHEET_NAME = '工作表1'; // 若你的工作表名稱不同請修改
// 若使用密鑰驗證，請在此設定
const EXPECTED_SECRET = 'REPLACE_WITH_YOUR_SECRET_IF_NEEDED';

function doPost(e) {
  try {
    const contentType = e.postData && e.postData.type;
    let data = {};
    if (contentType === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter && Object.keys(e.parameter).length) {
      // fallback: form-urlencoded
      data = e.parameter;
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'No data' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 驗證密鑰（如需）
    const secret = e && e.postData && e.postData.type === 'application/json'
      ? (e.postData && e.postData.contents && (() => { try { return JSON.parse(e.postData.contents).secret } catch(e){ return null } })())
      : (e.parameter && e.parameter.secret);

    // 或從 header 讀取（Apps Script 部署成 Web App 時，無法直接取得自訂 header，若需 header 驗證，請使用 Web App 與 Google Cloud Endpoints 或在 URL 上加密參數）

    if (EXPECTED_SECRET && EXPECTED_SECRET !== '' ) {
      if (!secret || secret !== EXPECTED_SECRET) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'Invalid secret' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('找不到指定工作表');

    const row = [
      data.english || '',
      data.translation || '',
      data.rootAnalysis || '',
      data.example || '',
      data.partOfSpeech || '',
      data.timestamp || new Date().toISOString(),
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

說明：上面 `doPost` 會嘗試解析 JSON（`application/json`），並將欄位以一列附加到試算表。

## 3. 部署為 Web App
1. 在 Apps Script 編輯器，點選「部署」→「新增部署」。
2. 類型選擇「網路應用程式（Web app）」。
3. 設定：
   - `執行應用程式的人`：選擇「我」
   - `可以使用應用程式的人`：若要從任何網頁送出（包含未登入者），請選「任何人（包含匿名使用者）」。
4. 部署後，會得到一個 Web App URL，形如 `https://script.google.com/macros/s/AKfycbx.../exec`。

> 注意：若您不想開放給匿名者，選擇受限存取並搭配 OAuth 或內部身分驗證，但此作法需要前端具備 OAuth 流程，複雜度較高。

## 4. 在前端設定 `GAS_ENDPOINT`
1. 開啟 `app.js`，找到頂端的 `GAS_ENDPOINT` 常數，將部署後的 Web App URL 貼上：

```js
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx.../exec';
// (選填) 若你在 Apps Script 使用密鑰驗證，請設定一致的值：
const GAS_SECRET = 'YOUR_SECRET_IF_USED';
```

2. 預設前端在儲存完畢後會非同步將單字送到該 URL（不會阻塞 UI）。若網路失敗，會在瀏覽器 console 顯示錯誤訊息。

## 5. 測試
1. 手動在前端新增一筆單字，按下「儲存單字」。
2. 前端 console 應顯示「已將單字送至後端」或錯誤資訊。
3. 到 Google 試算表查看是否有新增列。

### 使用 curl 測試（範例）
```bash
curl -X POST 'https://script.google.com/macros/s/AKfycbx.../exec' \
  -H 'Content-Type: application/json' \
  -d '{"english":"test","translation":"測試","rootAnalysis":"test-root","example":"This is a test.","partOfSpeech":"noun","timestamp":"2026-06-15T00:00:00Z"}'
```

## 6. 安全性建議
- 若不希望開放匿名發送，請設定 `EXPECT_SECRET`，並在前端 `GAS_SECRET` 傳遞相同密鑰。
- Apps Script 無法直接讀取自訂 HTTP header（在瀏覽器直接呼叫時有時會被瀏覽器行為或代理移除），較可靠的做法是把密鑰放到 query string（例如 `?secret=xxx`）或把密鑰納入 JSON body。
- 若需更強保護，將後端放到您能控制的伺服器或使用 Cloud Functions / Cloud Run 並設定 IAM 或 API key。

## 7. 常見問題
- Q：部署後前端呼叫失敗，GAS 收不到請求？
  - A：先用 `curl` 測試 URL 是否能收到回應；檢查 Apps Script 的執行紀錄（編輯器的「執行紀錄」）以查看錯誤。

- Q：欄位順序不對？
  - A：請確認試算表欄位標頭順序與 `doPost` 中 `row` 陣列對應一致。

---

若您要我直接：
- 幫您在 `app.js` 中預填 `GAS_ENDPOINT` 範例（我可以先填 `''` 並示範如何修改），
- 或協助您撰寫及部署 Apps Script（需要您提供 Google 帳號權限或讓我指導每一步），
請告訴我下一步要我代勞哪一項。