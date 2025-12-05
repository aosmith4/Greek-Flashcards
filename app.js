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
const translationDividerEl = document.getElementById("translationDivider");

const showTranslationBtn = document.getElementById("showTranslationBtn");
const showPhoneticsBtn = document.getElementById("showPhoneticsBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressEl = document.getElementById("progress");
const topicButton = document.getElementById("topicButton");

// Topic modal elements
const topicModalBackdrop = document.getElementById("topicModalBackdrop");
const topicClose = document.getElementById("topicClose");

// Settings modal elements
const settingsButton = document.getElementById("settingsButton");
const settingsModalBackdrop = document.getElementById("settingsModalBackdrop");
const settingsClose = document.getElementById("settingsClose");
const promptLanguageSelect = document.getElementById("promptLanguageSelect");
const shuffleCheckbox = document.getElementById("shuffleCheckbox");
const themeSelect = document.getElementById("themeSelect");

// Helper: choose prompt side for this card
function getPromptSide() {
  if (state.promptLanguage === "random") {
    return Math.random() < 0.5 ? "en" : "el";
  }
  return state.promptLanguage; // "en" or "el"
}

// Helper: current card
function currentCard() {
  return state.filteredCards[state.currentIndex] || null;
}

// Helper: fade visibility toggle
function setVisible(el, isVisible) {
  if (!el) return;
  if (isVisible) {
    el.classList.add("visible");
  } else {
    el.classList.remove("visible");
  }
}

// Render current card
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
    translationDividerEl.classList.remove("visible");
    setVisible(showPhoneticsBtn, false);
    progressEl.textContent = "Card 0 of 0";
    return;
  }

  const total = state.filteredCards.length;
  const index = state.currentIndex + 1;
  progressEl.textContent = `Card ${index} of ${total}`;
  topicButton.textContent = card.topic;

  // Reset reveal state and select side only when requested
  if (resetReveal) {
    state.currentSide = getPromptSide(); // "en" or "el"
    state.translationShown = false;
    state.phoneticsShown = false;
  }

  const side = state.currentSide;

  // Clear slot texts
  promptPhonEl.textContent = "";
  translationTextEl.textContent = "";
  translationPhonEl.textContent = "";

  // Hide all reveal slots/buttons by default
  setVisible(promptPhonEl, false);
  setVisible(translationTextEl, false);
  setVisible(translationPhonEl, false);
  translationDividerEl.classList.remove("visible");
  setVisible(showPhoneticsBtn, false);

  if (side === "en") {
    // Prompt: English
    promptEl.textContent = card.en;

    if (state.translationShown) {
      // Divider + Greek translation on two lines
      translationDividerEl.classList.add("visible");
      translationTextEl.textContent = `${card.el_upper}\n${card.el_lower}`;
      setVisible(translationTextEl, true);

      // Show Phonetics button to reveal phonetics for translation Greek
      setVisible(showPhoneticsBtn, true);

      if (state.phoneticsShown) {
        translationPhonEl.textContent = card.rom;
        setVisible(translationPhonEl, true);
      }
    }
  } else {
    // side === "el"
    // Prompt: Greek, uppercase and lowercase on separate lines
    promptEl.textContent = `${card.el_upper}\n${card.el_lower}`;

    // Show Phonetics button is always available when Greek is prompt
    setVisible(showPhoneticsBtn, true);

    // Prompt phonetic slot (for Greek prompt)
    if (state.phoneticsShown) {
      promptPhonEl.textContent = card.rom;
      setVisible(promptPhonEl, true);
    }

    if (state.translationShown) {
      // Divider + English translation
      translationDividerEl.classList.add("visible");
      translationTextEl.textContent = card.en;
      setVisible(translationTextEl, true);
      // No translation phonetic for English translation
    }
  }
}

// Navigation
function goTo(index) {
  const total = state.filteredCards.length;
  if (total === 0) return;
  if (index < 0) index = 0;
  if (index >= total) index = total - 1;
  state.currentIndex = index;
  renderCard(true); // new card -> choose side (random if needed)
}

function nextCard() {
  goTo(state.currentIndex + 1);
}

function prevCard() {
  goTo(state.currentIndex - 1);
}

// Deck filtering by topic
function applyTopicFilter(topic) {
  state.currentTopic = topic;
  state.filteredCards = state.cards.filter(c => c.topic === topic);
  if (shuffleCheckbox.checked) {
    // simple in-place shuffle
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

// Event wiring: reveal buttons (do NOT reset side)
showTranslationBtn.addEventListener("click", () => {
  if (!currentCard()) return;
  state.translationShown = true;
  renderCard(false); // keep same prompt side even if random
});

showPhoneticsBtn.addEventListener("click", () => {
  if (!currentCard()) return;
  state.phoneticsShown = true;
  renderCard(false); // keep same prompt side
});

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

// Settings modal open/close
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

// Settings: prompt language, shuffle, theme
promptLanguageSelect.addEventListener("change", () => {
  state.promptLanguage = promptLanguageSelect.value;
  try {
    localStorage.setItem("promptLanguage", state.promptLanguage);
  } catch (e) {}
  renderCard(true); // user explicitly changed preference -> new side
});

shuffleCheckbox.addEventListener("change", () => {
  try {
    localStorage.setItem("shuffle", shuffleCheckbox.checked ? "1" : "0");
  } catch (e) {}
  applyTopicFilter(state.currentTopic); // reapply with / without shuffle
});

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;
  document.body.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {}
});

// Initialize preferences from localStorage
function loadPreferences() {
  try {
    const savedPromptLang = localStorage.getItem("promptLanguage");
    if (savedPromptLang === "en" || savedPromptLang === "el" || savedPromptLang === "random") {
      state.promptLanguage = savedPromptLang;
    }
    const savedShuffle = localStorage.getItem("shuffle");
    if (savedShuffle === "1") shuffleCheckbox.checked = true;
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      themeSelect.value = "dark";
      document.body.classList.add("dark");
    } else if (savedTheme === "light") {
      themeSelect.value = "light";
      document.body.classList.remove("dark");
    }
  } catch (e) {
    // fall back to defaults if storage fails
  }

  // Reflect into controls
  promptLanguageSelect.value = state.promptLanguage;
}

// Load deck.json and initialize
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

loadDeck();
