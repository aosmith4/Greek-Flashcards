let deck = [];
let state = {order:[],index:0,shuffle:true,alwaysPhon:false,show:false,initLang:"en",curLang:null};

// ---- Local stats management ----
function getStats(id){
  let s=localStorage.getItem("greekFlashStats:"+id);
  return s?JSON.parse(s):{attempts:0,correct:0,incorrect:0};
}
function updateStats(id,result){
  let s=getStats(id);
  s.attempts++;
  if(result==="correct")s.correct++; if(result==="incorrect")s.incorrect++;
  localStorage.setItem("greekFlashStats:"+id,JSON.stringify(s));
}

// ---- Core Deck + Rendering ----
async function loadDeck(){
  const r=await fetch('deck.json'); deck=await r.json();
  ensureOrder(); setCardLanguage(); render();
}
function shuffledIndices(n){const a=Array.from({length:n},(_,i)=>i); for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;}
function ensureOrder(){const n=deck.length;if(!Array.isArray(state.order)||state.order.length!==n){state.order=state.shuffle?shuffledIndices(n):Array.from({length:n},(_,i)=>i);state.index=0;}}
function setCardLanguage(){state.curLang=state.initLang==="random"?(Math.random()<0.5?"en":"el"):state.initLang;}
function currentCard(){return deck[state.order[state.index]];}
function resetReveal(){
  state.show=false;
  document.getElementById('reveal').classList.remove('visible');
  document.getElementById('phonetics').hidden=true;
  document.getElementById('phoneticsTop').hidden=true;
  document.getElementById('phonBtn').style.display="none";
  document.getElementById('scoreButtons').hidden=true;
}
function render(){
  const card=currentCard(); if(!card)return; const dark=document.body.classList.contains('darkmode');
  const showGreek=(state.curLang==="el");
  const p=document.getElementById('prompt'), tTop=document.getElementById('phoneticsTop'), tb=document.querySelector('.toolbar');
  p.innerHTML="";tTop.hidden=true;tb.innerHTML="";
  if(showGreek){
    p.innerHTML=`<div class='greek-lines'><div>${card.el_lower}</div><div>${card.el_upper}</div></div>`;
    const tBtn=document.createElement("button"); 
    tBtn.className="btn secondary"+(dark?" darkmode secondary":"");
    tBtn.textContent="Show Phonetics"; tBtn.onclick=()=>showPhonetics(card,true);
    if(!state.alwaysPhon)tb.appendChild(tBtn); if(state.alwaysPhon)showPhonetics(card,true);
    const rBtn=document.createElement("button");
    rBtn.className="btn primary"+(dark?" darkmode primary":"");
    rBtn.textContent=state.show?"Hide Translation":"Show Translation";
    rBtn.onclick=()=>{state.show=!state.show;render();};
    tb.appendChild(rBtn);
  } else {
    p.textContent=card.en;
    const rBtn=document.createElement("button");
    rBtn.className="btn primary"+(dark?" darkmode primary":"");
    rBtn.textContent=state.show?"Hide Translation":"Show Translation";
    rBtn.onclick=()=>{state.show=!state.show;render();};
    tb.appendChild(rBtn);
  }
  const tr=document.getElementById('translation'), ph=document.getElementById('phonetics'), phBtn=document.getElementById('phonBtn');
  const scBtns=document.getElementById('scoreButtons'); ph.hidden=true; ph.textContent="";
  if(state.show){
    document.getElementById('reveal').classList.add('visible');
    tr.innerHTML=showGreek?`<div class='english-line'>${card.en}</div>`:`<div class='greek-lines'><div>${card.el_lower}</div><div>${card.el_upper}</div></div>`;
    if(!showGreek){
      phBtn.textContent="Show Phonetics"; phBtn.className="btn secondary"+(dark?" darkmode secondary":"");
      phBtn.style.display=state.alwaysPhon?"none":"block";
      if(state.alwaysPhon){ph.textContent=`(${card.rom})`;ph.hidden=false;}
      else phBtn.onclick=()=>{ph.textContent=`(${card.rom})`;ph.hidden=false;};
    }
    scBtns.hidden=false;
    document.getElementById('correctBtn').onclick=()=>{updateStats(card.id,"correct");nextCard();};
    document.getElementById('wrongBtn').onclick=()=>{updateStats(card.id,"incorrect");nextCard();};
  }
  else{scBtns.hidden=true;}
  document.querySelectorAll('.btn,.prompt,.greek-lines,.phonetics,.english-line').forEach(x=>x.classList.toggle('darkmode',dark));
}
function nextCard(){if(state.index<deck.length-1)state.index++;else{ensureOrder();state.index=0;}setCardLanguage();resetReveal();render();}
function prevCard(){if(state.index>0)state.index--;else state.index=deck.length-1;setCardLanguage();resetReveal();render();}
function showPhonetics(card,inPrompt){const el=inPrompt?document.getElementById('phoneticsTop'):document.getElementById('phonetics');
  el.textContent=`(${card.rom})`;el.hidden=false;}

// ---- Stats Modal ----
function showStats(){
  const tbl=document.getElementById("statsTable");
  let cards=deck.map(c=>{let s=getStats(c.id);let acc=s.attempts?(s.correct/s.attempts*100).toFixed(0):"--";return {...c,stats:s,acc:acc};});
  cards.sort((a,b)=>b.acc-a.acc);
  let html=`<table><thead><tr><th>Phrase</th><th>Accuracy</th><th>Attempts</th></tr></thead><tbody>`;
  cards.forEach(c=>{html+=`<tr><td>${c.en}</td><td>${c.acc}%</td><td>${c.stats.attempts}</td></tr>`;});
  html+=`</tbody></table>`; tbl.innerHTML=html;
  document.getElementById('statsModal').hidden=false;
}

// ---- Controls ----
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('nextBtn').onclick=nextCard;
  document.getElementById('prevBtn').onclick=prevCard;
  const sBtn=document.getElementById('settingsBtn'),sMod=document.getElementById('settingsModal'),
        cS=document.getElementById('closeSettings'),mSh=document.getElementById('modalShuffle'),
        mPh=document.getElementById('modalPhonetics'),mD=document.getElementById('modalDark'),
        mL=document.getElementById('modalInitLang');
  sBtn.onclick=()=>{mSh.checked=state.shuffle;mPh.checked=state.alwaysPhon;mD.checked=document.body.classList.contains('darkmode');
    mL.value=state.initLang;sMod.hidden=false;};
  cS.onclick=()=>{sMod.hidden=true;render();};
  mSh.onchange=()=>{state.shuffle=mSh.checked;ensureOrder();setCardLanguage();resetReveal();render();};
  mPh.onchange=()=>{state.alwaysPhon=mPh.checked;render();};
  mD.onchange=()=>{document.body.classList.toggle('darkmode',mD.checked);render();};
  mL.onchange=()=>{state.initLang=mL.value;setCardLanguage();render();};
  // Stats modal
  document.getElementById('statsBtn').onclick=showStats;
  document.getElementById('closeStats').onclick=()=>{document.getElementById('statsModal').hidden=true};
  window.addEventListener("keydown",e=>{if(document.getElementById("settingsModal").hidden===false)return;
    const k=e.key;if(k===" "||e.code==="Space"){e.preventDefault();document.getElementById('reveal').classList.contains('visible')?resetReveal():document.querySelector('.btn.primary')?.click();}
    if(k==="ArrowRight")nextCard();if(k==="ArrowLeft")prevCard();});
  loadDeck();
});
