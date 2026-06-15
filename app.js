const studyTab = document.getElementById('studyTab');
const manageTab = document.getElementById('manageTab');
const studyView = document.getElementById('studyView');
const manageView = document.getElementById('manageView');
const wordCard = document.getElementById('wordCard');
const cardFrontText = document.getElementById('cardFrontText');
const cardTranslation = document.getElementById('cardTranslation');
const cardPartOfSpeech = document.getElementById('cardPartOfSpeech');
const cardExample = document.getElementById('cardExample');
const cardRootAnalysis = document.getElementById('cardRootAnalysis');
const prevWordBtn = document.getElementById('prevWord');
const nextWordBtn = document.getElementById('nextWord');
const randomWordBtn = document.getElementById('randomWord');
const englishInput = document.getElementById('englishInput');
const translationInput = document.getElementById('translationInput');
const partOfSpeechInput = document.getElementById('partOfSpeechInput');
const exampleInput = document.getElementById('exampleInput');
const rootAnalysisInput = document.getElementById('rootAnalysisInput');
const autoFillBtn = document.getElementById('autoFillBtn');
const saveWordBtn = document.getElementById('saveWordBtn');
const wordList = document.getElementById('wordList');

const STORAGE_KEY = 'https://script.google.com/macros/s/AKfycbyQJ5jqrHlDTIiGV0KTQSTmoGkQKwzSv_Fi5erEk_nCxa5-onXu7Flcw622AVIC6-zs/exec';
// 若要將單字送到 Google Apps Script，請在此填入部署後的 Web App URL
const GAS_ENDPOINT = '';
// 如需驗證，可設定此密鑰，並在 Apps Script 檢查此 header
const GAS_SECRET = '';
// 外部 API 設定（可留空以跳過）
// LibreTranslate 範例 endpoint（可使用 https://libretranslate.de/translate）
const TRANSLATE_API_URL = '';
const TRANSLATE_API_KEY = '';
// Wordnik 用於取得例句、詞性與詞源
const WORDNIK_API_KEY = '';
let currentIndex = 0;
let cards = [];
let editIndex = null;

const defaultCards = [
  {
    english: 'journey',
    translation: '旅程；旅行',
    partOfSpeech: 'noun',
    example: 'The journey was long but full of beautiful views.',
    rootAnalysis: 'jour = road, path; -ney 表示狀態或過程。',
  },
  {
    english: 'adapt',
    translation: '適應',
    partOfSpeech: 'verb',
    example: 'She had to adapt quickly to the new environment.',
    rootAnalysis: 'ad- 向；apt = fit, 適合。',
  },
  {
    english: 'benefit',
    translation: '利益；好處',
    partOfSpeech: 'noun / verb',
    example: 'Everyone can benefit from enough sleep.',
    rootAnalysis: 'bene- 好；fit = 適合。',
  },
];

function loadCards() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      cards = JSON.parse(stored);
    } catch (error) {
      cards = defaultCards;
    }
  } else {
    cards = defaultCards;
  }
}

function saveCards() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function updateCard() {
  if (!cards.length) {
    cardFrontText.textContent = '請先新增單字';
    cardTranslation.textContent = '-';
    cardPartOfSpeech.textContent = '-';
    cardExample.textContent = '-';
    cardRootAnalysis.textContent = '-';
    return;
  }

  const card = cards[currentIndex];
  cardFrontText.textContent = card.english;
  cardTranslation.textContent = card.translation || '-';
  cardPartOfSpeech.textContent = card.partOfSpeech || '-';
  cardExample.textContent = card.example || '-';
  cardRootAnalysis.textContent = card.rootAnalysis || '-';
}

function showWordList() {
  wordList.innerHTML = '';
  if (!cards.length) {
    const emptyLabel = document.createElement('p');
    emptyLabel.textContent = '目前尚無單字，請新增。';
    emptyLabel.className = 'tip';
    wordList.appendChild(emptyLabel);
    return;
  }

  cards.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'word-card';
    cardEl.innerHTML = `
      <div class="meta">
        <strong>${card.english}</strong>
        <small>翻譯：${card.translation || '—'}</small>
        <small>詞性：${card.partOfSpeech || '—'}</small>
      </div>
      <div class="word-actions">
        <button type="button" class="edit">編輯</button>
        <button type="button" class="delete">刪除</button>
      </div>
    `;

    const editBtn = cardEl.querySelector('.edit');
    const deleteBtn = cardEl.querySelector('.delete');

    editBtn.addEventListener('click', () => loadForEdit(index));
    deleteBtn.addEventListener('click', () => removeCard(index));

    wordList.appendChild(cardEl);
  });
}

function loadForEdit(index) {
  const card = cards[index];
  englishInput.value = card.english;
  translationInput.value = card.translation;
  partOfSpeechInput.value = card.partOfSpeech;
  exampleInput.value = card.example;
  rootAnalysisInput.value = card.rootAnalysis;
  editIndex = index;
  scrollToTop();
}

function removeCard(index) {
  if (!confirm(`是否刪除「${cards[index].english}」？`)) {
    return;
  }
  cards.splice(index, 1);
  if (currentIndex >= cards.length) {
    currentIndex = Math.max(cards.length - 1, 0);
  }
  saveCards();
  updateCard();
  showWordList();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearForm() {
  englishInput.value = '';
  translationInput.value = '';
  partOfSpeechInput.value = '';
  exampleInput.value = '';
  rootAnalysisInput.value = '';
  editIndex = null;
}

function normalizeWord(value) {
  return value.trim();
}

function saveWord() {
  const english = normalizeWord(englishInput.value);
  if (!english) {
    alert('請輸入英文單字。');
    englishInput.focus();
    return;
  }

  const newCard = {
    english,
    translation: translationInput.value.trim(),
    partOfSpeech: partOfSpeechInput.value.trim(),
    example: exampleInput.value.trim(),
    rootAnalysis: rootAnalysisInput.value.trim(),
  };

  if (editIndex !== null) {
    cards[editIndex] = newCard;
    currentIndex = editIndex;
  } else {
    cards.push(newCard);
    currentIndex = cards.length - 1;
  }

  saveCards();
  updateCard();
  showWordList();
  clearForm();
  alert('單字已儲存。');

  // 如果有設定 GAS_ENDPOINT，非同步送出到後端（不阻塞 UI）
  if (GAS_ENDPOINT) {
    sendToBackend(newCard);
  }
}

function sendToBackend(card) {
  if (!GAS_ENDPOINT) return;

  const payload = {
    english: card.english,
    translation: card.translation,
    partOfSpeech: card.partOfSpeech,
    example: card.example,
    rootAnalysis: card.rootAnalysis,
    timestamp: new Date().toISOString(),
  };

  const headers = { 'Content-Type': 'application/json' };
  if (GAS_SECRET) headers['X-GAS-SECRET'] = GAS_SECRET;

  fetch(GAS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    mode: 'cors',
  })
    .then((res) => {
      if (!res.ok) throw new Error('後端回傳錯誤');
      return res.text();
    })
    .then(() => {
      console.log('已將單字送至後端');
    })
    .catch((err) => {
      console.warn('送出到後端失敗：', err);
    });
}

function guessRootAnalysis(word) {
  const lowered = word.toLowerCase();
  const suffixes = [
    ['ing', '動名詞/現在分詞形式'],
    ['ed', '過去式/過去分詞形式'],
    ['ly', '副詞字尾'],
    ['tion', '名詞字尾'],
    ['sion', '名詞字尾'],
    ['able', '可…的形容詞字尾'],
    ['ment', '名詞字尾'],
  ];
  for (const [suffix, meaning] of suffixes) {
    if (lowered.endsWith(suffix) && lowered.length > suffix.length + 2) {
      return `${word} 可能由字根「${lowered.slice(0, -suffix.length)}」+ 字尾「-${suffix}」（${meaning}）。`;
    }
  }

  const commonRoots = {
    tele: '遠；遠距離',
    bio: '生命；生物',
    chrono: '時間',
    phot: '光',
    auto: '自己',
    graph: '寫；畫',
  };

  for (const root of Object.keys(commonRoots)) {
    if (lowered.includes(root)) {
      return `${word} 可能包含字根「${root}」（${commonRoots[root]}）。`;
    }
  }

  return '暫無字根資料，可自行補充。';
}

const localDictionary = {
  journey: {
    translation: '旅程；旅行',
    partOfSpeech: 'noun',
    example: 'The journey was long but full of beautiful views.',
    rootAnalysis: 'jour = road, path; -ney 表示狀態或過程。',
  },
  adapt: {
    translation: '適應',
    partOfSpeech: 'verb',
    example: 'She had to adapt quickly to the new environment.',
    rootAnalysis: 'ad- 向；apt = fit, 適合。',
  },
  benefit: {
    translation: '利益；好處',
    partOfSpeech: 'noun / verb',
    example: 'Everyone can benefit from enough sleep.',
    rootAnalysis: 'bene- 好；fit = 適合。',
  },
  photograph: {
    translation: '照片；攝影',
    partOfSpeech: 'noun / verb',
    example: 'She took a beautiful photograph at sunset.',
    rootAnalysis: 'photo- 光；-graph 寫、畫。',
  },
  biography: {
    translation: '傳記；生平',
    partOfSpeech: 'noun',
    example: 'He read a biography of the famous scientist.',
    rootAnalysis: 'bio- 生命；-graphy 書寫或記錄。',
  },
};

function randomIndex() {
  return Math.floor(Math.random() * cards.length);
}

function setActiveTab(tab) {
  if (tab === 'study') {
    studyTab.classList.add('active');
    manageTab.classList.remove('active');
    studyView.classList.add('active-view');
    manageView.classList.remove('active-view');
  } else {
    studyTab.classList.remove('active');
    manageTab.classList.add('active');
    studyView.classList.remove('active-view');
    manageView.classList.add('active-view');
  }
}

function autoFillFromApi() {
  const english = normalizeWord(englishInput.value);
  if (!english) {
    alert('請先輸入英文單字，再按下自動填入。');
    englishInput.focus();
    return;
  }

  autoFillBtn.disabled = true;
  autoFillBtn.textContent = '載入中…';

  const word = english;
  const lower = word.toLowerCase();

  const results = {
    translation: '',
    partOfSpeech: '',
    example: '',
    rootAnalysis: '',
  };

  const tasks = [];

  // 1) 翻譯：LibreTranslate-like API
  if (TRANSLATE_API_URL) {
    const tBody = { q: word, source: 'en', target: 'zh', format: 'text' };
    if (TRANSLATE_API_KEY) tBody.api_key = TRANSLATE_API_KEY;
    tasks.push(
      fetch(TRANSLATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tBody),
      })
        .then((r) => r.json())
        .then((data) => {
          // LibreTranslate 回傳可能為 { translatedText: '...' } 或類似
          results.translation = data.translatedText || data.result || data.translation || '';
        })
        .catch(() => {
          /* ignore */
        })
    );
  }

  // 確保這段程式碼所在的外部 function 有加上 async，例如：async function handleAutoFill() { ... }

if (WORDNIK_API_KEY) {
  // 1. 查詢：單字定義與詞性 (Definitions)
  tasks.push(
    fetch(`https://api.wordnik.com/v4/word.json/${encodeURIComponent(lower)}/definitions?limit=5&includeRelated=false&useCanonical=true&api_key=${WORDNIK_API_KEY}`)
      .then((r) => r.ok ? r.json() : null)
      .then((defs) => {
        if (Array.isArray(defs) && defs.length) {
          const d = defs[0];
          if (!results.partOfSpeech && d.partOfSpeech) results.partOfSpeech = d.partOfSpeech;
          if (!results.translation && d.text) results.translation = d.text;
        }
      })
      .catch(() => {})
  );

  // 2. 查詢：例句 (Examples)
  tasks.push(
    fetch(`https://api.wordnik.com/v4/word.json/${encodeURIComponent(lower)}/examples?limit=5&api_key=${WORDNIK_API_KEY}`)
      .then((r) => r.ok ? r.json() : null)
      .then((ex) => {
        if (ex && Array.isArray(ex.examples) && ex.examples.length) {
          results.example = ex.examples[0].text || '';
        }
      })
      .catch(() => {})
  );

  // 3. 查詢：字源分析 (Etymologies)
  tasks.push(
    fetch(`https://api.wordnik.com/v4/word.json/${encodeURIComponent(lower)}/etymologies?api_key=${WORDNIK_API_KEY}`)
      .then((r) => r.ok ? r.json() : null)
      .then((et) => {
        if (Array.isArray(et) && et.length) {
          const rawEtymology = et[0] || '';
          results.rootAnalysis = rawEtymology.replace(/<\/?[^>]+(>|$)/g, "").trim();
        }
      })
      .catch(() => {})
  );
}

// ==========================================
// 流程判斷與資料填入
// ==========================================

if (tasks.length > 0) {
  try {
    // 【核心修正】等待所有 Wordnik API 請求並行完成
    await Promise.all(tasks);
    
    // API 執行完畢，將結果填入輸入框（若 API 沒查到則留空或維持原樣）
    translationInput.value = results.translation || '';
    partOfSpeechInput.value = results.partOfSpeech || '';
    exampleInput.value = results.example || '';
    // 如果 API 沒查到字源，則降級使用字根猜測
    rootAnalysisInput.value = results.rootAnalysis || guessRootAnalysis(word);

  } catch (error) {
    console.error('API 執行時發生未知錯誤:', error);
  } finally {
    // 恢復按鈕狀態
    autoFillBtn.disabled = false;
    autoFillBtn.textContent = '自動填入';
  }

} else {
  // 無外部 API 任務 (tasks.length === 0)，走本地或猜測邏輯
  const entry = localDictionary[lower];
  if (entry) {
    translationInput.value = entry.translation || '';
    partOfSpeechInput.value = entry.partOfSpeech || '';
    exampleInput.value = entry.example || '';
    rootAnalysisInput.value = entry.rootAnalysis || guessRootAnalysis(word);
    
    autoFillBtn.disabled = false;
    autoFillBtn.textContent = '自動填入';
    return;
  }

  // 無 API、無本地資料：僅猜測字根
  rootAnalysisInput.value = guessRootAnalysis(word);
  alert('未設定外部 API，已以字根猜測填入字根分析，請手動補充其他欄位。');
  autoFillBtn.disabled = false;
  autoFillBtn.textContent = '自動填入';
}

  Promise.all(tasks)
    .finally(() => {
      // 優先以 API 回傳為主，若 API 未回傳則 fallback 到本地詞庫或空值
      const entry = localDictionary[lower] || {};
      translationInput.value = results.translation || entry.translation || translationInput.value || '';
      partOfSpeechInput.value = results.partOfSpeech || entry.partOfSpeech || partOfSpeechInput.value || '';
      exampleInput.value = results.example || entry.example || exampleInput.value || '';
      rootAnalysisInput.value = results.rootAnalysis || entry.rootAnalysis || guessRootAnalysis(word);

      autoFillBtn.disabled = false;
      autoFillBtn.textContent = '自動填入';
    });


wordCard.addEventListener('click', () => {
  wordCard.classList.toggle('flipped');
});

prevWordBtn.addEventListener('click', () => {
  if (!cards.length) return;
  currentIndex = (currentIndex - 1 + cards.length) % cards.length;
  updateCard();
  wordCard.classList.remove('flipped');
});

nextWordBtn.addEventListener('click', () => {
  if (!cards.length) return;
  currentIndex = (currentIndex + 1) % cards.length;
  updateCard();
  wordCard.classList.remove('flipped');
});

randomWordBtn.addEventListener('click', () => {
  if (!cards.length) return;
  currentIndex = randomIndex();
  updateCard();
  wordCard.classList.remove('flipped');
});

studyTab.addEventListener('click', () => setActiveTab('study'));
manageTab.addEventListener('click', () => setActiveTab('manage'));
autoFillBtn.addEventListener('click', autoFillFromApi);
saveWordBtn.addEventListener('click', saveWord);

loadCards();
updateCard();
showWordList();
