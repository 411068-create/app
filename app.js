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

const STORAGE_KEY = 'vocabCards';
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

  fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${單字}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('無法取得字典資料');
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data) || !data.length) {
        throw new Error('找不到此單字資訊');
      }
      const entry = data[0];
      const meaning = entry.meanings?.[0];
      const definition = meaning?.definitions?.[0];

      translationInput.value = definition?.definition || translationInput.value || '';
      partOfSpeechInput.value = meaning?.partOfSpeech || partOfSpeechInput.value || '';
      exampleInput.value = definition?.example || exampleInput.value || '';
      rootAnalysisInput.value = guessRootAnalysis(english);
    })
    .catch((error) => {
      console.warn(error);
      alert('自動填入失敗，請稍後重試或手動填寫。');
    })
    .finally(() => {
      autoFillBtn.disabled = false;
      autoFillBtn.textContent = '自動填入';
    });
}

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
