// ---------- State ----------
const state = {
  cards: [],
  filteredCards: [],
  currentIndex: 0,
  selectedTopics: new Set(), // multi-select
  promptLanguage: "en",      // "en" | "el" | "random"
  currentSide: "en",
  translationShown: false,
  phoneticsShown: false
};

// ---------- DOM references ----------
const promptEl = document.getElementById("prompt");
const promptPhonEl = document.getElementById("promptPhonetic");
const translationTextEl = document.getElementById("translationText");
const translationPhonEl = document.getElementById("translationPhonetic");
const progressEl = document.getElementById("progress");
const topicButton = document.getElementById("topicButton");

const showTranslationBtn = document.getElementById("showTranslationBtn");
const showPhoneticsBtn = document.getElementById("showPhoneticsBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// Topic modal
const topicModalBackdrop = document.getElementById("topicModalBackdrop");
const topicClose = document.getElementById("topicClose");
const topicListContainer = document.getElementById("topicList");

// Settings modal
const settingsButton = document.getElementById("settingsButton");
const settingsModalBackdrop = document.getElementById("settingsModalBackdrop");
const settingsClose = document.getElementById("settingsClose");
const promptLanguageSelect = document.getElementById("promptLanguageSelect");
const shuffleCheckbox = document.getElementById("shuffleCheckbox");
const themeSelect = document.getElementById("themeSelect");

// ---------- Helpers ----------
function currentCard() {
  return state.filteredCards[state.currentIndex] || null;
}

function choosePromptSide() {
  if (state.promptLanguage === "random") {
    return Math.random() < 0.5 ? "en" : "el";
  }
  return state.promptLanguage;
}

function setVisible(el, on) {
  if (!el) return;
  el.classList.toggle("visible", !!on);
}

function getUniqueTopics() {
  const topics = Array.from(new Set(state.cards.map(c => c.topic))).filter(Boolean);
  topics.sort();
  return topics;
}

function buildTopicButtonsFromDeck() {
  const topics = getUniqueTopics();
  topicListContainer.innerHTML = "";

  topics.forEach(topic => {
    const btn = document.createElement("button");
    btn.className = "topic-choice";
    btn.textContent = topic;
    btn.dataset.topic = topic;
    btn.setAttribute("aria-pressed", "false");
    topicListContainer.appendChild(btn);
  });
}

function saveSelectedTopics() {
  try {
    const arr = Array.from(state.selectedTopics);
    localStorage.setItem("selectedTopics", JSON.stringify(arr));
  } catch (e) {}
}

function loadSelectedTopicsFromStorage(allTopics) {
  try {
    const raw = localStorage.getItem("selectedTopics");
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const valid = arr.filter(t => allTopics.includes(t));
    if (valid.length === 0) return null;
    return new Set(valid);
  } catch {
    return null;
  }
}

function syncTopicPillsSelection() {
  const buttons = topicListContainer.querySelectorAll(".topic-choice");
  buttons.forEach(btn => {
    const topic = btn.dataset.topic;
    const selected = state.selectedTopics.has(topic);
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

// ---------- Render ----------
function renderCard(resetReveal = true) {
  const card = currentCard();
  if (!card) {
    promptEl.textContent = "Loading…";
    promptPhonEl.textContent = "";
    translationTextEl.textContent = "";
    translationPhonEl.textContent = "";
    setVisible(promptPhonEl, false);
    setVisible(translationTextEl, false);
    setVisible(translationPhonEl, false);
    setVisible(showPhoneticsBtn, false);
    progressEl.textContent = "0/0";
    return;
  }

  const total = state.filteredCards.length;
  const index = state.currentIndex + 1;
  progressEl.textContent = `${index}/${total}`;

  if (resetReveal) {
    state.currentSide = choosePromptSide();
    state.translationShown = false;
    state.phoneticsShown = false;
  }

  const side = state.currentSide;

  // Reset UI
  promptPhonEl.textContent = "";
  translationTextEl.textContent = "";
  translationPhonEl.textContent = "";
  setVisible(promptPhonEl, false);
  setVisible(translationTextEl, false);
  setVisible(translationPhonEl, false);
  setVisible(showPhoneticsBtn, false);

  if (side === "en") {
    // English prompt
    promptEl.textContent = card.en;

    if (state.translationShown) {
      translationTextEl.textContent = `${card.el_upper}\n${card.el_lower}`;
      setVisible(translationTextEl, true);

      setVisible(showPhoneticsBtn, true);
      if (state.phoneticsShown) {
        translationPhonEl.textContent = card.rom;
        setVisible(translationPhonEl, true);
      }
    }
  } else {
    // Greek prompt
    promptEl.textContent = `${card.el_upper}\n${card.el_lower}`;

    setVisible(showPhoneticsBtn, true);

    if (state.phoneticsShown) {
      promptPhonEl.textContent = card.rom;
      setVisible(promptPhonEl, true);
    }

    if (state.translationShown) {
      translationTextEl.textContent = card.en;
      setVisible(translationTextEl, true);
    }
  }
}

// ---------- Topic filtering ----------
function applyTopicFilter() {
  const selected = state.selectedTopics;
  if (selected.size === 0) {
    state.filteredCards = [];
    renderCard(true);
    topicButton.textContent = "No topic";
    return;
  }

  state.filteredCards = state.cards.filter(c => selected.has(c.topic));

  if (shuffleCheckbox.checked) {
    for (let i = state.filteredCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.filteredCards[i], state.filteredCards[j]] = [
        state.filteredCards[j],
        state.filteredCards[i]
      ];
    }
  }

  state.currentIndex = 0;

  // Header label summarizing selected topics
  const topics = Array.from(selected);
  if (topics.length === 1) {
    topicButton.textContent = topics[0];
  } else {
    topicButton.textContent = `${topics[0]} + ${topics.length - 1}`;
  }

  syncTopicPillsSelection();
  saveSelectedTopics();
  renderCard(true);
}

// ---------- Navigation ----------
function goTo(index) {
  const total = state.filteredCards.length;
  if (total === 0) return;
  const clamped = Math.max(0, Math.min(index, total - 1));
  state.currentIndex = clamped;
  renderCard(true);
}

function nextCard() {
  const total = state.filteredCards.length;
  if (total === 0) return;
  const next = (state.currentIndex + 1) % total;
  goTo(next);
}

function prevCard() {
  const total = state.filteredCards.length;
  if (total === 0) return;
  const prev = (state.currentIndex - 1 + total) % total;
  goTo(prev);
}

// ---------- Preferences ----------
function loadPreferences() {
  try {
    const savedPromptLang = localStorage.getItem("promptLanguage");
    if (["en", "el", "random"].includes(savedPromptLang)) {
      state.promptLanguage = savedPromptLang;
    }
    const savedShuffle = localStorage.getItem("shuffle");
    shuffleCheckbox.checked = savedShuffle === "1";

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      themeSelect.value = "dark";
      document.body.classList.add("dark");
    } else if (savedTheme === "light") {
      themeSelect.value = "light";
      document.body.classList.remove("dark");
    }
  } catch (e) {}

  promptLanguageSelect.value = state.promptLanguage;
}

// ---------- Deck loading ----------
async function loadDeck() {
  loadPreferences();
  try {
    const res = await fetch("deck.json");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("deck.json is empty or not an array");
    }

    state.cards = data;
    buildTopicButtonsFromDeck();

    const allTopics = getUniqueTopics();

    // Try restoring previous selection
    let restored = loadSelectedTopicsFromStorage(allTopics);

    if (!restored) {
      // Default: Alphabet only if present, else all topics
      if (allTopics.includes("Alphabet")) {
        restored = new Set(["Alphabet"]);
      } else {
        restored = new Set(allTopics);
      }
    }

    state.selectedTopics = restored;
    applyTopicFilter();
  } catch (err) {
    console.error("Error loading deck:", err);
    promptEl.textContent = "Error loading deck.json";
    progressEl.textContent = "0/0";
  }
}

// ---------- Event wiring ----------

// Reveal
showTranslationBtn.addEventListener("click", () => {
  if (!currentCard()) return;
  state.translationShown = true;
  renderCard(false);
});

showPhoneticsBtn.addEventListener("click", () => {
  if (!currentCard()) return;
  state.phoneticsShown = true;
  renderCard(false);
});

// Navigation
nextBtn.addEventListener("click", nextCard);
prevBtn.addEventListener("click", prevCard);

// Topic modal open/close
topicButton.addEventListener("click", () => {
  topicModalBackdrop.classList.add("active");
  topicModalBackdrop.setAttribute("aria-hidden", "false");
});

topicClose.addEventListener("click", closeTopicModal);

topicModalBackdrop.addEventListener("click", (e) => {
  if (e.target === topicModalBackdrop) {
    closeTopicModal();
    return;
  }
  const btn = e.target.closest(".topic-choice");
  if (!btn) return;

  const topic = btn.dataset.topic;
  if (state.selectedTopics.has(topic)) {
    state.selectedTopics.delete(topic);
  } else {
    state.selectedTopics.add(topic);
  }

  // Ensure at least one topic is always selected
  if (state.selectedTopics.size === 0) {
    state.selectedTopics.add(topic);
  }

  applyTopicFilter();
});

function closeTopicModal() {
  topicModalBackdrop.classList.remove("active");
  topicModalBackdrop.setAttribute("aria-hidden", "true");
}

// Settings modal
settingsButton.addEventListener("click", () => {
  settingsModalBackdrop.classList.add("active");
  settingsModalBackdrop.setAttribute("aria-hidden", "false");
});

settingsClose.addEventListener("click", () => {
  settingsModalBackdrop.classList.remove("active");
  settingsModalBackdrop.setAttribute("aria-hidden", "true");
});

settingsModalBackdrop.addEventListener("click", (e) => {
  if (e.target === settingsModalBackdrop) {
    settingsModalBackdrop.classList.remove("active");
    settingsModalBackdrop.setAttribute("aria-hidden", "true");
  }
});

// Settings controls
promptLanguageSelect.addEventListener("change", () => {
  state.promptLanguage = promptLanguageSelect.value;
  try {
    localStorage.setItem("promptLanguage", state.promptLanguage);
  } catch (e) {}
  renderCard(true);
});

shuffleCheckbox.addEventListener("change", () => {
  try {
    localStorage.setItem("shuffle", shuffleCheckbox.checked ? "1" : "0");
  } catch (e) {}
  applyTopicFilter();
});

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;
  document.body.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {}
});

// ---------- Init ----------
loadDeck();
