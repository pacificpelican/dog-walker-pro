// DOM-driven screens: dialogue, offers, hats, library, gallery, settings, printing.
import { api, auth } from './api.js';
import { HATS, SHOP_HATS, GREETINGS, HAMLET_Q1, BIRD_GIVERS } from './data.js';
import { drawPerson } from './sprites.js';

const $ = (s) => document.querySelector(s);
const card = () => $('#modal-card');
const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let onClose = null;
export const isOpen = () => !$('#modal').hidden;
export function open(html, close) {
  card().innerHTML = html; $('#modal').hidden = false; onClose = close || null;
  card().scrollTop = 0;
  return card();
}
export function close() {
  $('#modal').hidden = true; card().innerHTML = '';
  const f = onClose; onClose = null; if (f) f();
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}
$('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') close(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) close(); });

export function fmtTime(sec) {
  sec = Math.floor(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
}
export const playerName = () => auth.username || 'Player 1';

// ---------------------------------------------------------------- pause + screenshot
function makeScreenshot(game) {
  const src = $('#game'), w = src.width, h = src.height, k = Math.max(2, Math.round(960 / w));
  const bar = 18 * k / 2, c = document.createElement('canvas');
  c.width = w * k; c.height = h * k + bar * 2;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#24103f'; x.fillRect(0, 0, c.width, c.height);
  x.drawImage(src, 0, bar, w * k, h * k);
  const stamp = new Date(), ts = stamp.toLocaleString();
  x.textBaseline = 'middle'; const fs = Math.round(bar * .6);
  x.font = `bold ${fs}px ui-monospace, monospace`; x.fillStyle = '#ff8a1f'; x.textAlign = 'left';
  x.fillText('Dog Walker Pro', 12, bar / 2);
  x.fillStyle = '#d9c2ff'; x.textAlign = 'right'; x.fillText(`${playerName()} · ${ts}`, c.width - 12, bar / 2);
  x.textAlign = 'center'; x.fillStyle = '#d9c2ff';
  x.fillText('Dog Walker Pro created by Daniel McKeown · altaredwood.work', c.width / 2, bar * 1.5 + h * k);
  return { canvas: c, stamp };
}

export function showPause(game) {
  if (isOpen()) return;
  const c = open(`
    <div class="logo-row"><img src="assets/logo.svg" alt=""><h2>Paused</h2></div>
    <p>Dog Walker Pro &mdash; created by <a href="https://altaredwood.work" target="_blank" rel="noopener">Daniel McKeown</a></p>
    <div class="row"><button class="btnx primary" id="resume">▶ Resume</button><button class="btnx" id="shot">📷 Screenshot</button><button class="btnx" id="pset">⚙ Settings</button></div>
    <div id="shot-out"></div>`);
  c.querySelector('#resume').onclick = close;
  c.querySelector('#pset').onclick = () => { close(); showSettings(game); };
  c.querySelector('#shot').onclick = () => {
    const { canvas, stamp } = makeScreenshot(game), p = n => String(n).padStart(2, '0');
    const name = `dog-walker-pro-${stamp.getFullYear()}${p(stamp.getMonth() + 1)}${p(stamp.getDate())}-${p(stamp.getHours())}${p(stamp.getMinutes())}${p(stamp.getSeconds())}.png`;
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob), out = c.querySelector('#shot-out');
      out.innerHTML = `<img id="shot-preview" src="${url}" alt="Screenshot"><div class="row"><a class="btnx primary" id="dl" href="${url}" download="${name}">💾 Download PNG</a><button class="btnx" id="shot-print">🖨️ Print / PDF</button></div>`;
      out.querySelector('#shot-print').onclick = () => printSheet('screenshot', `<img class="shot" src="${canvas.toDataURL('image/png')}" alt="Screenshot">`, { bare: true });
    }, 'image/png');
  };
}

// ---------------------------------------------------------------- welcome
export function showWelcome(game) {
  const c = open(`
    <div class="logo-row"><img src="assets/logo.svg" alt=""><h2>Dog Walker Pro</h2></div>
    <p>Wander the neighborhood. Find the <b>dog markers</b> on buildings and walk the pups for points. While walking, keep them happy:
    <b>+</b> pets, <b>×</b> encourages.</p>
    <div class="stat"><span>Arrows / WASD or D-pad</span><b>move</b></div>
    <div class="stat"><span>+ &nbsp;(E)</span><b>interact · buy · pet</b></div>
    <div class="stat"><span>× &nbsp;(X)</span><b>change hat · encourage</b></div>
    <div class="stat"><span>/ &nbsp;(T)</span><b>talk to someone</b></div>
    <div class="stat"><span>− &nbsp;(H)</span><b>cause trouble (don't)</b></div>
    <p>Coffee calms the animals. Mind the traffic lights!</p>
    <div class="row end"><button class="btnx primary" id="go">Let's go!</button></div>
    <div class="credit">Created by <a href="https://altaredwood.work" target="_blank" rel="noopener">Daniel McKeown</a></div>`);
  c.querySelector('#go').onclick = close;
}

// ---------------------------------------------------------------- walk offers / results
export function showOffer(game, offer, b, onAccept) {
  const bird = offer.kind === 'bird';
  const c = open(`<h2>${bird ? '🦜' : '🐕'} ${esc(offer.name)} the ${esc(offer.species)}</h2>
    <p>${esc(b.name)} needs a walk.</p>
    <div class="stat"><span>Distance to cover</span><b>${offer.meters} m</b></div>
    <div class="stat"><span>Encouragement quota</span><b>${offer.quota} per minute</b></div>
    <p>Press <b>+</b> (pet) or <b>×</b> (${bird ? 'praise' : 'encourage'}) when you're near ${esc(offer.name)}. Then bring them back here to collect points. A coffee in advance lowers the quota!</p>
    <div class="row end"><button class="btnx" id="no">Not now</button><button class="btnx primary" id="yes">Start walk</button></div>`);
  c.querySelector('#no').onclick = close;
  c.querySelector('#yes').onclick = () => { close(); onAccept(); };
}
export function showResult(game, r) {
  const c = open(`<h2>${r.ok ? '🎉 Walk complete!' : '😿 Walk failed'}</h2>
    <p>${r.ok ? `${esc(r.name)} the ${esc(r.species)} is home safe.` : esc(r.reason || '')}</p>
    <div class="stat"><span>Distance</span><b>${r.meters} m</b></div>
    <div class="stat"><span>Time</span><b>${fmtTime(r.time)}</b></div>
    <div class="stat"><span>Pets & praise</span><b>${r.hits}</b></div>
    <div class="stat"><span>Incidents</span><b>${r.incidents}</b></div>
    <div class="stat"><span>Points</span><b>${r.points >= 0 ? '+' : ''}${r.points}</b></div>
    <div class="row end"><button class="btnx primary" id="ok">OK</button></div>`);
  c.querySelector('#ok').onclick = close;
}

// ---------------------------------------------------------------- dialogue
export function showDialog(game, p, onUnlockBird) {
  const npc = p.npc;
  const history = p.history;
  const special = p.special;
  const places = [...new Set(game.world.buildings.map(b => b.name))];
  const c = open(`<h2>💬 ${esc(npc.name)}</h2>
    <p style="opacity:.7;font-size:12px">${esc(npc.persona)}</p>
    <div id="log"></div>
    <div class="chips" id="greet">${GREETINGS.map(g => `<button class="btnx">${esc(g)}</button>`).join('')}</div>
    <div class="row"><input type="text" id="say" maxlength="200" placeholder="Say something..." autocomplete="off" style="flex:1"><button class="btnx primary" id="send">Say</button></div>
    <div class="row end"><button class="btnx" id="printchat" title="Print or save as PDF">🖨️ Print / PDF</button><button class="btnx" id="bye">Goodbye</button></div>`, () => { p.state = 'walk'; });
  const log = c.querySelector('#log'), inp = c.querySelector('#say');
  c.querySelector('#printchat').onclick = () => {
    const lines = [...log.children].filter(e => e.textContent !== '…').map(e => e.classList.contains('msg-you')
      ? `<p class="you"><b>${esc(playerName())}:</b> ${esc(e.textContent)}</p>`
      : `<p><b>${esc(npc.name)}:</b> ${esc(e.lastChild.textContent)}</p>`).join('');
    printSheet('conversation', `<h2>Conversation with ${esc(npc.name)}</h2><p class="meta">${esc(npc.persona)} · ${esc(new Date().toLocaleString())}</p><div class="chat">${lines}</div>`);
  };
  const addReply = (name, text, src) => { log.insertAdjacentHTML('beforeend', `<div class="reply"><small>${esc(name)}${src ? ` · ${src}` : ''}</small>${esc(text)}</div>`); card().scrollTop = card().scrollHeight; };
  const addYou = (t) => log.insertAdjacentHTML('beforeend', `<div class="msg-you">${esc(t)}</div>`);
  if (special) { addReply(npc.name, npc.open); if (!game.state.flags.birdJobs) { onUnlockBird(); } }
  else addReply(p.npc.name, pick(npc.lines));
  let busy = false;
  const send = async (text) => {
    text = text.trim(); if (!text || busy) return; busy = true; inp.value = '';
    addYou(text); history.push({ role: 'user', content: text });
    const thinking = document.createElement('div'); thinking.className = 'reply'; thinking.textContent = '…'; log.appendChild(thinking);
    const r = await api.chat({ npc: { name: npc.name, persona: npc.persona, topic: npc.topic }, message: text, history: history.slice(-7, -1), places });
    thinking.remove();
    let reply = r && r.ok ? r.reply : null, src = r && r.source === 'ollama' ? 'AI' : '';
    if (!reply) reply = fallbackReply(npc, text, game);
    addReply(npc.name, reply, src); history.push({ role: 'assistant', content: reply });
    busy = false; if (!matchMedia('(pointer: coarse)').matches) inp.focus();
  };
  c.querySelectorAll('#greet .btnx').forEach(b => b.onclick = () => send(b.textContent));
  c.querySelector('#send').onclick = () => send(inp.value);
  inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') send(inp.value); });
  c.querySelector('#bye').onclick = close;
  if (!matchMedia('(pointer: coarse)').matches) inp.focus();
}

// Scripted replies used when the AI server is disabled or unreachable.
function fallbackReply(npc, text, game) {
  const t = text.toLowerCase();
  const find = (re) => game.world.buildings.filter(b => re.test(b.name.toLowerCase() + ' ' + (b.blurb || '')));
  const where = (b) => b ? `${b.name}, over in block ${b.block[0] + 1}-${b.block[1] + 1}` : null;
  if (/\bhat/.test(t)) { const b = find(/hat/)[0]; return `Hats? Try ${where(b) || 'Brim & Crown'}. Or keep your eyes peeled for ones lying on the sidewalk.`; }
  if (/coffee|caffeine|latte/.test(t)) return 'Coffee stands are tucked into parking lots here and there. A cup is a few points and keeps animals calmer.';
  if (/dog|pup/.test(t)) return pick(['Look for the dog logo markers on buildings. They need walkers!', 'Little dogs need lots of praise. Big ones just sit down on you.']);
  if (/bird|parrot|macaw|crow/.test(t)) return special(npc) ? npc.open : 'I hear Parrot Pete and Aunt Cleo are looking for bird walkers.';
  if (/eat|food|lunch|hungry|sandwich/.test(t)) return `Viking Sandwiches is my pick. Or ${where(find(/burger|bakery|market/)[0]) || 'Burger Barn'} if you want fast.`;
  if (/book|read|library|hamlet/.test(t)) return 'Black Belle Books is lovely, and the library has a Hamlet first quarto you can read.';
  return pick([...npc.lines || [], 'Hm, interesting. Say more?', 'Ha! Fair enough.', 'Nice neighborhood, isn\'t it?']);
}
const special = (npc) => BIRD_GIVERS.some(b => b.name === npc.name);

// ---------------------------------------------------------------- hats
function hatCanvas(id) {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 24;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  drawPerson(g, 16, 23, { dir: 'd', skin: '#f1c9a5', hair: '#5a3a1a', hairStyle: 'long', shirt: '#6b2fa0', female: true, hat: id });
  return cv;
}
export function showHatStore(game) {
  const s = game.state;
  const render = () => {
    const c = open(`<h2>🎩 Brim & Crown Hats</h2><p>You have <b>${s.points}</b> points.</p><div class="hatgrid"></div>
      <div class="row end"><button class="btnx" id="x">Close</button></div>`);
    const grid = c.querySelector('.hatgrid');
    for (const id of ['none', ...SHOP_HATS]) {
      const h = HATS[id], owned = s.hats.owned.includes(id), eq = s.hats.equipped === id;
      const el = document.createElement('div'); el.className = 'hatcard' + (eq ? ' sel' : '');
      el.appendChild(hatCanvas(id));
      el.insertAdjacentHTML('beforeend', `${esc(h.name)}<br>`);
      const b = document.createElement('button'); b.className = 'btnx'; b.style.cssText = 'font-size:11px;padding:4px 8px;margin-top:4px';
      b.textContent = eq ? 'Wearing' : owned ? 'Wear' : `Buy ${h.price}`; b.disabled = eq || (!owned && s.points < h.price);
      b.onclick = () => {
        if (!owned) { game.addPoints(-h.price); s.hats.owned.push(id); }
        s.hats.equipped = id; game.refreshHud(); render();
      };
      el.appendChild(b); grid.appendChild(el);
    }
    c.querySelector('#x').onclick = close;
  };
  render();
}

// ---------------------------------------------------------------- library / gallery
export function showLibrary() {
  const c = open(`<h2>📚 Public Library</h2><p>Your one book: <b>The Tragicall Historie of Hamlet</b> (First Quarto, 1603, public domain).</p>
    <div class="hamlet">${esc(HAMLET_Q1.join('\n\n'))}</div><div class="row end"><button class="btnx" id="x">Close</button></div>`);
  c.querySelector('#x').onclick = close;
}
export function showGallery() {
  const art = (window.DWP && window.DWP.art) || [];
  const c = open(`<h2>🖼 Altar Redwood Gallery</h2><p>Artwork by Daniel McKeown that inspired this town.</p>
    <div class="gallery">${art.map(a => `<a href="art/${encodeURIComponent(a)}" target="_blank" rel="noopener"><img loading="lazy" src="art/${encodeURIComponent(a)}" alt="Artwork"></a>`).join('') || '<p>No artwork found in /art.</p>'}</div>
    <div class="row end"><button class="btnx" id="x">Close</button></div>`);
  c.querySelector('#x').onclick = close;
}

// ---------------------------------------------------------------- settings
export function showSettings(game, tab = 'info') {
  const tabs = [['info', 'Info'], ['account', 'Account'], ['save', 'Save'], ['debug', 'Debug'], ['about', 'Credits']];
  const c = open(`<h2>⚙ Settings</h2><div class="tabs">${tabs.map(([k, n]) => `<button class="btnx ${k === tab ? 'cur' : ''}" data-t="${k}">${n}</button>`).join('')}</div><div id="tabbody"></div>
    <div class="row end"><button class="btnx" id="x">Close</button></div>`);
  c.querySelectorAll('[data-t]').forEach(b => b.onclick = () => showSettings(game, b.dataset.t));
  c.querySelector('#x').onclick = close;
  const body = c.querySelector('#tabbody');
  ({ info: infoTab, account: accountTab, save: saveTab, debug: debugTab, about: aboutTab })[tab](game, body);
}

function statsRows(game) {
  const s = game.state.stats;
  return [['Time played', fmtTime(s.timeSec)], ['Current points', game.state.points], ['Dogs walked', s.dogsWalked], ['Birds walked', s.birdsWalked], ['Coffees consumed', s.coffees], ['Distance walked', `${Math.round(s.metersWalked)} m`]];
}
function infoTab(game, body) {
  body.innerHTML = `<h3>Game info — ${esc(playerName())}</h3>${statsRows(game).map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('')}
    <div class="row"><button class="btnx" id="print" title="Print or save as PDF">🖨️ Print / PDF stats</button></div>`;
  body.querySelector('#print').onclick = () => printStats(game);
}
export function printStats(game) {
  printSheet('stats', `<h2>${esc(playerName())}</h2><table>${statsRows(game).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`);
}

const stampName = (d) => { const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };

// Browsers can't force "Save as PDF", but they use document.title as the default file name, so set it while printing.
function printSheet(kind, bodyHtml, { bare = false } = {}) {
  let sheet = $('#print-sheet');
  if (!sheet) { sheet = document.createElement('div'); sheet.id = 'print-sheet'; document.body.appendChild(sheet); }
  sheet.innerHTML = `${bare ? '' : '<header><img src="assets/logo.svg" alt=""><h1>Dog Walker Pro</h1></header>'}${bodyHtml}
    <footer>Dog Walker Pro created by Daniel McKeown https://altaredwood.work</footer>`;
  const oldTitle = document.title;
  document.title = `dog-walker-pro--${kind}_${stampName(new Date())}`;
  const restore = () => { document.title = oldTitle; window.removeEventListener('afterprint', restore); };
  window.addEventListener('afterprint', restore);
  setTimeout(() => { window.print(); setTimeout(restore, 1000); }, 80);
}

function accountTab(game, body) {
  if (auth.username) {
    body.innerHTML = `<h3>Account</h3><p>Logged in as <b>${esc(auth.username)}</b>.</p>
      <div class="row"><button class="btnx" id="out">Log out</button></div>
      <h3>Delete account</h3><p>⚠ This permanently deletes your account and saved game. It cannot be undone.</p>
      <input type="password" id="pw" placeholder="Confirm password" autocomplete="current-password"><div class="err" id="err"></div>
      <div class="row"><button class="btnx danger" id="del">Delete my account & data</button></div>`;
    body.querySelector('#out').onclick = async () => { await api.logout(); game.refreshHud(); showSettings(game, 'account'); };
    body.querySelector('#del').onclick = async () => {
      const pw = body.querySelector('#pw').value;
      if (!pw) { body.querySelector('#err').textContent = 'Enter your password to confirm.'; return; }
      if (!confirm('Really delete your account and all saved data? This cannot be undone.')) return;
      const r = await api.deleteAccount(pw);
      if (r.ok) { game.refreshHud(); showSettings(game, 'account'); } else body.querySelector('#err').textContent = r.error;
    };
  } else {
    body.innerHTML = `<h3>Log in or create an account</h3><p>An account lets you save and load your game. Playing without one works fine too.</p>
      <input type="text" id="un" placeholder="Screen name" maxlength="20" autocomplete="username">
      <input type="password" id="pw" placeholder="Password (6+ characters)" autocomplete="current-password"><div class="err" id="err"></div>
      <div class="row"><button class="btnx primary" id="login">Log in</button><button class="btnx" id="reg">Create account</button></div>`;
    const go = (fn) => async () => {
      const r = await fn(body.querySelector('#un').value.trim(), body.querySelector('#pw').value);
      if (r.ok) { game.refreshHud(); game.toast(`Welcome, ${auth.username}!`); showSettings(game, 'save'); } else body.querySelector('#err').textContent = r.error;
    };
    body.querySelector('#login').onclick = go(api.login); body.querySelector('#reg').onclick = go(api.register);
    body.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') body.querySelector('#login').click(); }));
  }
}

function saveTab(game, body) {
  if (!auth.username) { body.innerHTML = `<h3>Save game</h3><p>You need to be logged in to save. <button class="btnx" id="go">Log in / register</button></p>`; body.querySelector('#go').onclick = () => showSettings(game, 'account'); return; }
  body.innerHTML = `<h3>Save game</h3><p>Playing as <b>${esc(auth.username)}</b>. Your progress is also saved automatically every minute while logged in.</p>
    <div class="err" id="msg"></div><div class="row"><button class="btnx primary" id="save">💾 Save now</button><button class="btnx" id="load">Load saved game</button></div>`;
  const msg = body.querySelector('#msg');
  body.querySelector('#save').onclick = async () => { const r = await game.save(); msg.className = r.ok ? 'ok' : 'err'; msg.textContent = r.ok ? 'Saved!' : r.error; };
  body.querySelector('#load').onclick = async () => { const r = await game.loadSaved(); msg.className = r.ok ? 'ok' : 'err'; msg.textContent = r.ok ? 'Loaded!' : r.error; };
}

async function debugTab(game, body) {
  body.innerHTML = '<h3>Debug</h3><p>Loading…</p>';
  const r = await api.status();
  if (!r.ok) { body.innerHTML = `<h3>Debug</h3><p class="err">${esc(r.error)}</p>`; return; }
  const s = r.storage, mode = s.mode === 'mysql' ? 'MySQL' : 'Local (file store)';
  body.innerHTML = `<h3>Debug</h3>
    <div class="stat"><span>Storage</span><b>${mode}</b></div>
    <div class="stat"><span>MySQL configured</span><b>${s.mysqlConfigured ? 'yes' : 'no'}</b></div>
    ${s.mysqlError ? `<p class="err">MySQL error: ${esc(s.mysqlError)} (using local store)</p>` : ''}
    <div class="stat"><span>AI chat</span><b>${r.ai.enabled ? `${esc(r.ai.model)} @ ${esc(r.ai.url)}` : 'disabled'}</b></div>
    <div class="stat"><span>Logged in</span><b>${auth.username ? esc(auth.username) : 'no'}</b></div>
    <div class="stat"><span>World</span><b>${game.world.cols}×${game.world.rows} blocks, ${game.world.buildings.length} buildings</b></div>
    <div class="stat"><span>Vehicles / NPCs</span><b>${game.traffic.list.length} / ${game.peds.list.length}</b></div>
    <div class="stat"><span>FPS</span><b>${game.fps}</b></div>`;
}

function aboutTab(game, body) {
  body.innerHTML = `<div class="logo-row"><img src="assets/logo.svg" alt=""><div><b>Dog Walker Pro</b><br>Walk dogs. Walk birds. Drink coffee.</div></div>
    <p>Edit <code>js/layout.js</code> to redesign the town and <code>config.php</code> for storage and AI settings.</p>
    <div class="credit">Created by <a href="https://altaredwood.work" target="_blank" rel="noopener">Daniel McKeown</a></div>`;
}
