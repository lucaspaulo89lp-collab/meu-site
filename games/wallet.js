/* games/wallet.js
   Tiger Coins & Store System (FICTÍCIO / SEM VALOR REAL)
*/
(function(){
  const COIN_KEY = "pt_coins";
  const INV_KEY  = "pt_inventory";
  const SET_KEY  = "pt_settings";

  const DEFAULTS = {
    coins: 20, // saldo inicial
    inventory: {
      themes: { aurora: true },  // tema grátis
      skins:  { classic: true }, // skin grátis
      levels: { starter: true }  // pack grátis
    },
    settings: {
      theme: "aurora",
      skin: "classic",
      levelPack: "starter"
    }
  };

  function loadJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function saveJSON(key, obj){
    localStorage.setItem(key, JSON.stringify(obj));
  }

  function getCoins(){
    const v = localStorage.getItem(COIN_KEY);
    if(v === null){
      localStorage.setItem(COIN_KEY, String(DEFAULTS.coins));
      return DEFAULTS.coins;
    }
    return Number(v || 0);
  }
  function setCoins(v){
    localStorage.setItem(COIN_KEY, String(Math.max(0, Math.floor(v))));
    updateHUD();
  }
  function addCoins(n){
    setCoins(getCoins() + Number(n || 0));
  }
  function spendCoins(n){
    const cost = Number(n || 0);
    const c = getCoins();
    if(c < cost) return false;
    setCoins(c - cost);
    return true;
  }

  function getInventory(){
    const inv = loadJSON(INV_KEY, null);
    if(!inv){
      saveJSON(INV_KEY, DEFAULTS.inventory);
      return DEFAULTS.inventory;
    }
    // garantia de chaves
    inv.themes = inv.themes || { aurora:true };
    inv.skins  = inv.skins  || { classic:true };
    inv.levels = inv.levels || { starter:true };
    saveJSON(INV_KEY, inv);
    return inv;
  }
  function setInventory(inv){
    saveJSON(INV_KEY, inv);
    updateHUD();
  }

  function getSettings(){
    const s = loadJSON(SET_KEY, null);
    if(!s){
      saveJSON(SET_KEY, DEFAULTS.settings);
      return DEFAULTS.settings;
    }
    s.theme = s.theme || "aurora";
    s.skin  = s.skin  || "classic";
    s.levelPack = s.levelPack || "starter";
    saveJSON(SET_KEY, s);
    return s;
  }
  function setSettings(s){
    saveJSON(SET_KEY, s);
    applyCosmetics();
  }

  // Catálogo da loja
  const STORE = {
    themes: [
      { id:"aurora", name:"Aurora (Grátis)", price:0, desc:"Tema padrão premium." },
      { id:"midnight", name:"Midnight", price:30, desc:"Visual mais escuro e elegante." },
      { id:"sunset", name:"Sunset", price:30, desc:"Tons quentes e vibrantes." }
    ],
    skins: [
      { id:"classic", name:"Classic (Grátis)", price:0, desc:"Skin padrão." },
      { id:"neon", name:"Neon Tiger", price:25, desc:"Brilho neon e destaque no personagem." },
      { id:"gold", name:"Golden Tiger", price:40, desc:"Skin dourada premium." }
    ],
    levels: [
      { id:"starter", name:"Starter Pack (Grátis)", price:0, desc:"Dificuldade padrão." },
      { id:"easy", name:"Easy Pack", price:20, desc:"Mais fácil, mais relax." },
      { id:"pro", name:"Pro Pack", price:35, desc:"Mais rápido e desafiador." }
    ]
  };

  function owns(type, id){
    const inv = getInventory();
    return !!(inv[type] && inv[type][id]);
  }
  function buy(type, id){
    const item = (STORE[type] || []).find(x => x.id === id);
    if(!item) return { ok:false, msg:"Item não encontrado." };
    if(owns(type, id)) return { ok:false, msg:"Você já possui este item." };

    if(item.price > 0 && !spendCoins(item.price)){
      return { ok:false, msg:"Tiger Coins insuficientes." };
    }
    const inv = getInventory();
    inv[type] = inv[type] || {};
    inv[type][id] = true;
    setInventory(inv);
    return { ok:true, msg:"Compra realizada!" };
  }

  // Aplica tema/skin/pack no site/jogos (CSS vars + classes)
  function applyCosmetics(){
    const s = getSettings();
    const root = document.documentElement;

    // THEMES (variáveis CSS)
    const themes = {
      aurora:  { bg1:"#070b16", bg2:"#0a1531", brand:"#56d0ff", brand2:"#36d399", text:"#e8eefc", muted:"#a8b5d6" },
      midnight:{ bg1:"#050814", bg2:"#0b0f24", brand:"#9b87ff", brand2:"#56d0ff", text:"#eef2ff", muted:"#b7c0e6" },
      sunset:  { bg1:"#12060b", bg2:"#2b0f1a", brand:"#ff8a5c", brand2:"#ffd166", text:"#fff3ea", muted:"#f2c7b7" }
    };
    const t = themes[s.theme] || themes.aurora;

    root.style.setProperty("--pt-bg1", t.bg1);
    root.style.setProperty("--pt-bg2", t.bg2);
    root.style.setProperty("--pt-brand", t.brand);
    root.style.setProperty("--pt-brand2", t.brand2);
    root.style.setProperty("--pt-text", t.text);
    root.style.setProperty("--pt-muted", t.muted);

    // SKINS (classe no body)
    document.body.dataset.skin = s.skin;

    // LEVEL PACK (classe)
    document.body.dataset.levelpack = s.levelPack;

    updateHUD();
  }

  // HUD fixo (saldo + botões)
  function ensureHUD(){
    if(document.getElementById("pt-hud")) return;

    const hud = document.createElement("div");
    hud.id = "pt-hud";
    hud.innerHTML = `
      <div class="pt-hud-inner">
        <div class="pt-coins">🐅 Tiger Coins: <b id="pt-coin-val">0</b></div>
        <a class="pt-hud-btn" href="/meu-site/games/store/" title="Abrir Loja">🛍️ Loja</a>
        <a class="pt-hud-btn" href="/meu-site/games/" title="Ver Jogos">🎮 Jogos</a>
      </div>
    `;
    document.body.appendChild(hud);

    // estilos HUD
    const style = document.createElement("style");
    style.textContent = `
      :root{
        --pt-bg1: var(--pt-bg1, #070b16);
        --pt-bg2: var(--pt-bg2, #0a1531);
        --pt-brand: var(--pt-brand, #56d0ff);
        --pt-brand2: var(--pt-brand2, #36d399);
        --pt-text: var(--pt-text, #e8eefc);
        --pt-muted: var(--pt-muted, #a8b5d6);
      }
      body{
        background: radial-gradient(1200px 700px at 20% 10%, color-mix(in srgb, var(--pt-brand) 18%, transparent), transparent 60%),
                    radial-gradient(900px 600px at 80% 20%, color-mix(in srgb, var(--pt-brand2) 12%, transparent), transparent 55%),
                    linear-gradient(160deg, var(--pt-bg1), var(--pt-bg2));
        color: var(--pt-text);
      }
      #pt-hud{
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 99999;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
      }
      .pt-hud-inner{
        display:flex; gap:8px; align-items:center; flex-wrap:wrap;
        padding: 10px 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(0,0,0,.28);
        backdrop-filter: blur(10px);
        box-shadow: 0 18px 35px rgba(0,0,0,.35);
      }
      .pt-coins{
        font-weight: 900;
        color: rgba(255,255,255,.92);
        padding: 0 6px;
      }
      .pt-hud-btn{
        display:inline-flex; align-items:center; gap:8px;
        padding: 8px 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.06);
        color: rgba(255,255,255,.92);
        font-weight: 900;
        text-decoration:none;
        transition: transform .12s ease, background .12s ease;
      }
      .pt-hud-btn:hover{ transform: translateY(-1px); background: rgba(255,255,255,.09); }

      /* SKINS (exemplo aplicado nos jogos via data-skin) */
      body[data-skin="neon"] .skin-accent{ filter: drop-shadow(0 0 10px color-mix(in srgb, var(--pt-brand) 55%, transparent)); }
      body[data-skin="gold"] .skin-accent{ filter: drop-shadow(0 0 10px rgba(255,210,90,.45)); }

      /* LEVEL PACK (altera dificuldade por leitura do dataset no jogo) */
    `;
    document.head.appendChild(style);
  }

  function updateHUD(){
    const el = document.getElementById("pt-coin-val");
    if(el) el.textContent = String(getCoins());
  }

  // API global
  window.PT = {
    STORE,
    getCoins, setCoins, addCoins, spendCoins,
    getInventory, setInventory,
    getSettings, setSettings,
    owns, buy,
    applyCosmetics, ensureHUD, updateHUD
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureHUD();
    applyCosmetics();
  });
})();
