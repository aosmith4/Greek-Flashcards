let deck = [];
let state = {
  order: [],
  index: 0,
  shuffle: true,
  alwaysPhon: false,
  show: false,
  initLang: "en",
  curLang: null // tracks current card prompt language
};

async function loadDeck() {
  const response = await fetch('deck.json');
  deck = await response.json();
  ensureOrder();
  setCardLanguage();
  render();
}
function shuffledIndices(n) {
  const arr = Array.from({length:n}, (_,i)=>i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function ensureOrder() {
  const n = deck.length;
  if (!Array.isArray(state.order) || state.order.length !== n) {
    state.order = state.shuffle ? shuffledIndices(n) : Array.from({length:n}, (_,i)=>i);
    state.index = 0;
  }
}
function setCardLanguage() {
  if (state.initLang === "random") {
    state.curLang = Math.random() < 0.5 ? "en" : "el";
  } else {
    state.curLang = state.initLang;
  }
}
function currentCard() {
  const idx = state.order[state.index] ?? 0;
  return deck[idx];
}
function resetReveal() {
  state.show = false;
  document.getElementById('reveal').classList.remove('visible');
  document.getElementById('reveal').setAttribute('aria-hidden', 'true');
  document.getElementById('revealBtn') && (document.getElementById('revealBtn').textContent = 'Show Translation');
  document.getElementById('phonBtn').setAttribute('aria-disabled', 'true');
  document.getElementById('phonBtn').disabled = true;
  document.getElementById('phonetics').hidden = true;
  document.getElementById('phonetics').textContent = '';
  document.getElementById('phoneticsTop').hidden = true;
  document.getElementById('phoneticsTop').textContent = '';
  document.getElementById('phonBtn').style.display = "none";
}
function render() {
  const card = currentCard();
  // Read per-card initial language only once!
  const showGreekFirst = (state.curLang === "el");
  const promptEl = document.getElementById('prompt');
  const phoneticsTop = document.getElementById('phoneticsTop');
  const toolbar = document.querySelector('.toolbar');
  promptEl.innerHTML = '';
  phoneticsTop.hidden = true;
  phoneticsTop.textContent = '';
  toolbar.innerHTML = '';

  if (showGreekFirst) {
    // Greek first: prompt area
    promptEl.innerHTML = `<div class='greek-lines'><div>${card.el_lower}</div><div>${card.el_upper}</div></div>`;
    if (!state.alwaysPhon) {
      const topBtn = document.createElement('button');
      topBtn.id = 'phonBtnTop';
      topBtn.className = 'btn';
      topBtn.textContent = 'Show Phonetics';
      topBtn.setAttribute('aria-label','Show Phonetics');
      topBtn.style.margin = "0 auto 8px auto";
      toolbar.appendChild(topBtn);
      topBtn.onclick = function() {
        showPhonetics(card, true);
      };
    }
    const revealBtn = document.createElement('button');
    revealBtn.id = 'revealBtn';
    revealBtn.className = 'btn primary';
    revealBtn.textContent = state.show ? 'Hide Translation' : 'Show Translation';
    revealBtn.setAttribute('aria-label', 'Show Translation');
    toolbar.appendChild(revealBtn);
    revealBtn.onclick = function() {
      state.show = !state.show;
      render();
    };
    if(state.alwaysPhon) {
      showPhonetics(card, true);
    }
  } else {
    // English first: prompt area
    promptEl.textContent = card.en;
    const revealBtn = document.createElement('button');
    revealBtn.id = 'revealBtn';
    revealBtn.className = 'btn primary';
    revealBtn.textContent = state.show ? 'Hide Translation' : 'Show Translation';
    revealBtn.setAttribute('aria-label', 'Show Translation');
    toolbar.appendChild(revealBtn);
    revealBtn.onclick = function() {
      state.show = !state.show;
      render();
    };
  }
  // --- REVEAL/TRANSLATION ---
  const translationDiv = document.getElementById('translation');
  const phonBtn = document.getElementById('phonBtn');
  const revealEl = document.getElementById('reveal');
  const phoneticsDiv = document.getElementById('phonetics');
  translationDiv.innerHTML = '';
  phonBtn.style.display = "none";
  phonBtn.disabled = true;
  phonBtn.setAttribute('aria-disabled', 'true');
  phoneticsDiv.hidden = true;
  phoneticsDiv.textContent = '';
  if (state.show) {
    revealEl.classList.add('visible');
    revealEl.setAttribute('aria-hidden', 'false');
    if (showGreekFirst) {
      translationDiv.innerHTML = `<div class="english-line">${card.en}</div>`;
    } else {
      translationDiv.innerHTML = `<div class='greek-lines'><div>${card.el_lower}</div><div>${card.el_upper}</div></div>`;
      translationDiv.after(phoneticsDiv);
      phoneticsDiv.after(phonBtn);
      phoneticsDiv.hidden = true;
      phoneticsDiv.textContent = '';
      phonBtn.style.display = state.alwaysPhon ? "none" : "block";
      phonBtn.disabled = false;
      phonBtn.setAttribute('aria-disabled','false');
      phonBtn.textContent = "Show Phonetics";
      if (state.alwaysPhon) {
        phoneticsDiv.textContent = `(${card.rom})`;
        phoneticsDiv.hidden = false;
        phoneticsDiv.classList.toggle('darkmode', document.body.classList.contains('darkmode'));
      } else {
        phonBtn.onclick = function() {
          phoneticsDiv.textContent = `(${card.rom})`;
          phoneticsDiv.hidden = false;
          phoneticsDiv.classList.toggle('darkmode', document.body.classList.contains('darkmode'));
        };
      }
    }
    document.getElementById('revealBtn').textContent = 'Hide Translation';
  } else {
    revealEl.classList.remove('visible');
    revealEl.setAttribute('aria-hidden', 'true');
    phonBtn.setAttribute('aria-disabled', 'true');
    phonBtn.disabled = true;
    phoneticsDiv.hidden = true;
    phoneticsDiv.textContent = '';
    phonBtn.style.display = "none";
  }
  phoneticsDiv.style.textAlign = "center";
  phoneticsTop.style.textAlign = "center";
  const dark = document.body.classList.contains('darkmode');
  document.getElementById('cardContainer').classList.toggle('darkmode', dark);
  document.querySelectorAll('.btn,.icon-btn,.prompt,.greek-lines,.phonetics,.english-line').forEach(el => {
    if(el) el.classList.toggle('darkmode', dark);
  });
}
function showPhonetics(card, inPrompt) {
  if (inPrompt) {
    const phoneticsTop = document.getElementById('phoneticsTop');
    phoneticsTop.textContent = `(${card.rom})`;
    phoneticsTop.hidden = false;
    phoneticsTop.classList.toggle('darkmode', document.body.classList.contains('darkmode'));
  } else {
    const phoneticsDiv = document.getElementById('phonetics');
    phoneticsDiv.textContent = `(${card.rom})`;
    phoneticsDiv.hidden = false;
    phoneticsDiv.classList.toggle('darkmode', document.body.classList.contains('darkmode'));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prevBtn').onclick = function() {
    if (state.index > 0) state.index--;
    setCardLanguage();
    resetReveal(); render();
  };
  document.getElementById('nextBtn').onclick = function() {
    if (state.index < deck.length - 1) state.index++;
    else { ensureOrder(); state.index = 0; }
    setCardLanguage();
    resetReveal(); render();
  };
  // Settings Modal Logic
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const modalShuffle = document.getElementById('modalShuffle');
  const modalPhonetics = document.getElementById('modalPhonetics');
  const modalDark = document.getElementById('modalDark');
  const modalInitLang = document.getElementById('modalInitLang');
  settingsBtn.onclick = function() {
    modalShuffle.checked = state.shuffle;
    modalPhonetics.checked = state.alwaysPhon;
    modalDark.checked = document.body.classList.contains('darkmode');
    modalInitLang.value = state.initLang || "en";
    settingsModal.hidden = false;
    document.querySelector('.modal-content').classList.toggle('darkmode', modalDark.checked);
    document.body.style.overflow = "hidden";
  };
  closeSettings.onclick = function(e) {
    settingsModal.hidden = true;
    document.body.style.overflow = "";
    render();
    e.stopPropagation();
  };
  settingsModal.onclick = function(e) {
    if (e.target === settingsModal) {
      settingsModal.hidden = true;
      document.body.style.overflow = "";
      render();
    }
  };
  modalShuffle.onchange = function() {
    state.shuffle = modalShuffle.checked;
    ensureOrder();
    setCardLanguage();
    resetReveal(); render();
  };
  modalPhonetics.onchange = function() {
    state.alwaysPhon = modalPhonetics.checked;
    render();
  };
  modalDark.onchange = function() {
    document.body.classList.toggle('darkmode', modalDark.checked);
    document.querySelector('.modal-content').classList.toggle('darkmode', modalDark.checked);
    render();
  };
  modalInitLang.onchange = function() {
    state.initLang = modalInitLang.value;
    setCardLanguage();
    render();
  };
  window.addEventListener("keydown", (e) => {
    if(document.getElementById("settingsModal").hidden === false) return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === " " || e.code === "Space") { e.preventDefault(); document.getElementById('revealBtn') && document.getElementById('revealBtn').click(); }
    if (e.key === "ArrowRight") document.getElementById('nextBtn').click();
    if (e.key === "ArrowLeft") document.getElementById('prevBtn').click();
  });
  ensureOrder();
  setCardLanguage();
  loadDeck();
});
