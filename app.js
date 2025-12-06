// Basic state
const state = {
  cards: [],
  filteredCards: [],
  currentIndex: 0,
  currentTopic: "Alphabet",
  promptLanguage: "en", // "en" | "el" | "random"
  currentSide: "en",
  translationShown: false,
  phoneticsShown: false
};

// DOM refs
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

// Settings modal
const settingsButton = document.getElementById("settingsButton");
const settingsModalBackdrop = document.getElementById("settingsModalBackdrop");
const settingsClose = document.getElementById("settingsClose");
const promptLanguageSelect = document.getElementById("promptLanguageSelect");
const shuffleCheckbox = document.getElementById("shuffleCheckbox");
const themeSelect = document.getElementById("themeSelect");

// Helpers
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

// Render
function renderCard(resetReveal = true) {
  const card = currentCard();
  if (!card) {
    promptEl.textContent = "No cards for this topic.";
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
  topicButton.textContent = card.topic;

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

// Navigation
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

// Topics
function applyTopicFilter(topic) {
  state.currentTopic = topic;
  state.filteredCards = state.cards.filter(c => c.topic === topic);

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
  renderCard(true);
}

// Preferences
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
    } else {
      themeSelect.value = "light";
      document.body.classList.remove("dark");
    }
  } catch (e) {}

  promptLanguageSelect.value = state.promptLanguage;
}

async function loadDeck() {
  loadPreferences();
  try {
    const res = await fetch("deck.json");
    const data = await res.json();
    state.cards = data;
    applyTopicFilter(state.currentTopic);
  } catch (err) {
    console.error("Error loading deck:", err);
    promptEl.textContent = "Error loading deck.json";
  }
}

// Events: reveal
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

// Events: navigation
nextBtn.addEventListener("click", nextCard);
prevBtn.addEventListener("click", prevCard);

// Topic modal
topicButton.addEventListener("click", () => {
  topicModalBackdrop.classList.add("active");
  topicModalBackdrop.setAttribute("aria-hidden", "false");
});

topicClose.addEventListener("click", () => {
  topicModalBackdrop.classList.remove("active");
  topicModalBackdrop.setAttribute("aria-hidden", "true");
});

topicModalBackdrop.addEventListener("click", (e) => {
  if (e.target === topicModalBackdrop) {
    topicModalBackdrop.classList.remove("active");
    topicModalBackdrop.setAttribute("aria-hidden", "true");
    return;
  }
  const btn = e.target.closest("button[data-topic]");
  if (!btn) return;
  const topic = btn.getAttribute("data-topic");
  applyTopicFilter(topic);
  topicModalBackdrop.classList.remove("active");
  topicModalBackdrop.setAttribute("aria-hidden", "true");
});

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
  applyTopicFilter(state.currentTopic);
});

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;
  document.body.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {}
});

// Init
loadDeck();
