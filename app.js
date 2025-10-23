let fullDeck = [];
let deck = [];
let state = {
  order: [],
  index: 0,
  shuffle: true,
  alwaysPhon: false,
  show: false,
  initLang: "en",
  curLang: null,
  deckSize: "all"
};

function getStats(id) {
  let s = localStorage.getItem("greekFlashStats:" + id);
  return s ? JSON.parse(s) : { attempts: 0, correct: 0, incorrect: 0 };
}

function updateStats(id, result) {
  let s = getStats(id);
  s.attempts++;
  if (result === "correct") s.correct++;
  if (result === "incorrect") s.incorrect++;
  localStorage.setItem("greekFlashStats:" + id, JSON.stringify(s));
}

function resetAllStats() {
  deck.forEach(c => localStorage.removeItem("greekFlashStats:" + c.id));
}

async function loadDeck() {
  const r = await fetch('deck.json');
  fullDeck = await r.json();
  applyDeckFilter();
}

function applyDeckFilter() {
  let size = state.deckSize === "all" ? fullDeck.length : parseInt(state.deckSize);
  deck = fullDeck.slice().sort((a, b) => a.frequency - b.frequency).slice(0, size);
  ensureOrder(deck.length);
  setCardLanguage();
  render();
}

function shuffledIndices(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ensureOrder(n = deck.length) {
  if (!Array.isArray(state.order) || state.order.length !== n) {
    state.order = state.shuffle ? shuffledIndices(n) : Array.from({ length: n }, (_, i) => i);
    state.index = 0;
  }
}

function setCardLanguage() {
  state.curLang = state.initLang === "random" ? (Math.random() < 0.5 ? "en" : "el") : state.initLang;
}

function currentCard() {
  return deck[state.order[state.index]];
}

function resetReveal() {
  state.show = false;
  document.getElementById('reveal').classList.remove('visible');
  document.getElementById('phonetics').hidden = true;
  document.getElementById('phonetics').textContent = "";
  document.getElementById('phoneticsTop').hidden = true;
  document.getElementById('phoneticsTop').textContent = "";
  let phBtn = document.getElementById('phonBtn');
  phBtn.style.display = "none";
  phBtn.disabled = true;
  phBtn.setAttribute('aria-disabled', "true");
  document.getElementById('scoreButtons').hidden = true;
  document.getElementById('translation').innerHTML = "";
}

function render() {
  const card = currentCard();
  if (!card) return;
  const dark = document.body.classList.contains('darkmode');
  const showGreek = (state.curLang === "el");

  // Prompt and toolbar
  const p = document.getElementById('prompt'),
    tTop = document.getElementById('phoneticsTop'),
    tb = document.querySelector('.toolbar');
  p.innerHTML = "";
  tTop.hidden = true;
  tb.innerHTML = "";
  tb.style.flexDirection = "column";
  tb.style.alignItems = "center";

  if (showGreek) {
    p.innerHTML =
      `<div class="greek-lines">${card.el_lower}<br>${card.el_upper}</div>`;
    if (!state.alwaysPhon) {
      const tBtn = document.createElement('button');
      tBtn.className = `btn secondary${dark ? " darkmode secondary" : ""}`;
      tBtn.textContent = "Show Phonetics";
      tBtn.style.display = "block";
      tBtn.style.margin = "0 auto";
      tBtn.onclick = () => showPhonetics(card, true);
      tb.appendChild(tBtn);
    }
    const rBtn = document.createElement('button');
    rBtn.className = `btn primary${dark ? " darkmode primary" : ""}`;
    rBtn.textContent = state.show ? "Hide Translation" : "Show Translation";
    rBtn.style.display = "block";
    rBtn.style.margin = "24px auto 0 auto";
    rBtn.onclick = () => {
      state.show = !state.show;
      render();
    };
    tb.appendChild(rBtn);
  } else {
    p.textContent = card.en;
    const rBtn = document.createElement('button');
    rBtn.className = `btn primary${dark ? " darkmode primary" : ""}`;
    rBtn.textContent = state.show ? "Hide Translation" : "Show Translation";
    rBtn.style.display = "block";
    rBtn.style.margin = "24px auto 0 auto";
    rBtn.onclick = () => {
      state.show = !state.show;
      render();
    };
    tb.appendChild(rBtn);
  }

  const tr = document.getElementById('translation'),
    ph = document.getElementById('phonetics'),
    phBtn = document.getElementById('phonBtn'),
    scBtns = document.getElementById('scoreButtons');

  tr.innerHTML = "";
  ph.hidden = true;
  ph.textContent = "";
  phBtn.style.display = "none";
  phBtn.disabled = true;
  phBtn.setAttribute('aria-disabled', "true");
  scBtns.hidden = true;

  if (state.show) {
    document.getElementById('reveal').classList.add('visible');
    scBtns.hidden = false;
    if (showGreek) {
      tr.innerHTML = `<div class="english-line">${card.en}</div>`;
    } else {
      tr.innerHTML = `<div class="greek-lines">${card.el_lower}<br>${card.el_upper}</div>`;
      phBtn.className = `btn secondary${dark ? " darkmode secondary" : ""}`;
      phBtn.style.display = state.alwaysPhon ? "none" : "block";
      phBtn.style.margin = "0 auto";
      phBtn.disabled = false;
      phBtn.setAttribute('aria-disabled', "false");
      phBtn.textContent = "Show Phonetics";
      if (state.alwaysPhon) {
        ph.textContent = card.rom;
        ph.hidden = false;
      } else {
        phBtn.onclick = () => {
          ph.textContent = card.rom;
          ph.hidden = false;
        };
      }
    }
    scBtns.style.display = "flex";
    scBtns.style.justifyContent = "center";
    document.getElementById('correctBtn').onclick = () => doScore("correct");
    document.getElementById('wrongBtn').onclick = () => doScore("incorrect");
  } else {
    document.getElementById('reveal').classList.remove('visible');
  }
}

function doScore(res) {
  updateStats(currentCard().id, res);
  nextCard();
}

function nextCard() {
  if (state.index < deck.length - 1) state.index++;
  else ensureOrder(deck.length);
  setCardLanguage();
  resetReveal();
  render();
}

function prevCard() {
  if (state.index > 0) state.index--;
  else state.index = deck.length - 1;
  setCardLanguage();
  resetReveal();
  render();
}

function showPhonetics(card, inPrompt) {
  const el = inPrompt ? document.getElementById('phoneticsTop') : document.getElementById('phonetics');
  el.textContent = card.rom;
  el.hidden = false;
  el.style.display = "block";
  el.className = "phonetics" + (document.body.classList.contains('darkmode') ? " darkmode" : "");
}

function showStats() {
  const tbl = document.getElementById('statsTable');
  let cards = deck.map(c => {
    let s = getStats(c.id);
    let acc = s.attempts ? Math.round((s.correct / s.attempts) * 100) : 0;
    return { ...c, stats: s, acc };
  });
  cards.sort((a, b) => a.acc - b.acc);

  let html = `<table><thead><tr><th>Phrase</th><th>Accuracy</th><th>Attempts</th></tr></thead><tbody>`;
  cards.forEach(c => {
    html += `<tr><td>${c.en}</td><td>${c.acc}%</td><td>${c.stats.attempts}</td></tr>`;
  });
  html += "</tbody></table>";
  tbl.innerHTML = html;
  document.getElementById('statsModal').classList.remove('hidden');
  document.getElementById('resetStatsBtn').onclick = () => {
    if (confirm("Are you sure you want to reset all your stats?")) {
      resetAllStats();
      showStats();
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nextBtn').onclick = nextCard;
  document.getElementById('prevBtn').onclick = prevCard;

  const sBtn = document.getElementById('settingsBtn'),
    sMod = document.getElementById('settingsModal'),
    cS = document.getElementById('closeSettings'),
    mSh = document.getElementById('modalShuffle'),
    mPh = document.getElementById('modalPhonetics'),
    mD = document.getElementById('modalDark'),
    mL = document.getElementById('modalInitLang'),
    mDS = document.getElementById('modalDeckSize');

  sBtn.onclick = () => {
    mSh.checked = state.shuffle;
    mPh.checked = state.alwaysPhon;
    mD.checked = document.body.classList.contains('darkmode');
    mL.value = state.initLang;
    mDS.value = state.deckSize;
    sMod.classList.remove('hidden');
    if (document.body.classList.contains('darkmode')) {
      sMod.querySelector('.modal-content').classList.add('darkmode');
    } else {
      sMod.querySelector('.modal-content').classList.remove('darkmode');
    }
  };

  cS.onclick = () => {
    sMod.classList.add('hidden');
    render();
  };

  mSh.onchange = () => {
    state.shuffle = mSh.checked;
    ensureOrder(deck.length);
    render();
  };
  mPh.onchange = () => {
    state.alwaysPhon = mPh.checked;
    render();
  };
  mD.onchange = () => {
    document.body.classList.toggle('darkmode', mD.checked);
    render();
  };
  mL.onchange = () => {
    state.initLang = mL.value;
    setCardLanguage();
    render();
  };

  mDS.onchange = () => {
    state.deckSize = mDS.value;
    applyDeckFilter();
  };

  document.getElementById('statsBtn').onclick = showStats;
  document.getElementById('closeStats').onclick = () => {
    document.getElementById('statsModal').classList.add('hidden');
  };

  window.addEventListener('keydown', e => {
    if (!document.getElementById('settingsModal').classList.contains('hidden')) return;
    const k = e.key;
    if (k === " " || e.code === "Space") {
      e.preventDefault();
      let rBtn = document.querySelector('.btn.primary');
      if (rBtn) rBtn.click();
    }
    if (k === "ArrowRight") nextCard();
    if (k === "ArrowLeft") prevCard();
  });

  loadDeck();
});
