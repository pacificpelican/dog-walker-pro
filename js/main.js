// Dog Walker Pro: game loop, input, rendering, interactions and persistence.
import layout from './layout.js';
import { buildWorld, mulberry32 } from './world.js';
import { Traffic, Peds } from './entities.js';
import { WalkSystem } from './walk.js';
import { drawPerson, drawDog, drawBird, drawVehicle, drawTree, drawMarker, drawBubble, drawHeart, drawSparkle, drawHat } from './sprites.js';
import { DOGS, BIRDS, HATS, SHOUTS, NPC_REACTIONS, T } from './data.js';
import { api, auth } from './api.js';
import * as ui from './ui.js';

const $ = (s) => document.querySelector(s);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const COFFEE_PRICE = 5, COFFEE_SECS = 180, SPEED = 56, REACH = 24;

const newState = () => ({
  points: 20,
  stats: { timeSec: 0, dogsWalked: 0, birdsWalked: 0, coffees: 0, encouragements: 0, metersWalked: 0 },
  hats: { owned: ['none'], equipped: 'none' }, found: [], flags: { birdJobs: false }, pos: null,
});

const world = buildWorld(layout, 20240607);
const rng = mulberry32(777);
const start = layout.playerStart;
const lot = world.lotOrigin(start.block[0], start.block[1]);

const game = {
  world, state: newState(), t: 0, fps: 0, fx: [], autosave: false,
  player: { x: lot.x + start.x * T, y: lot.y + start.y * T, dir: 'd', step: 0, st: 0, coffeeT: 0, hitT: 0, cool: 0 },
  traffic: new Traffic(world, rng), peds: new Peds(world, rng),
  toast(msg, ms = 2600) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(this._tt); this._tt = setTimeout(() => el.classList.remove('on'), ms); },
  addPoints(n) { this.state.points = Math.max(0, this.state.points + n); this.refreshHud(); },
  showResult(r) { ui.showResult(this, r); this.refreshHud(); },
  refreshHud() {
    $('#pts-v').textContent = this.state.points;
    $('#hat-v').textContent = HATS[this.state.hats.equipped].name;
    $('#player-name').textContent = ui.playerName();
  },
  snapshot() { return { ...JSON.parse(JSON.stringify(this.state)), pos: { x: Math.round(this.player.x), y: Math.round(this.player.y) } }; },
  apply(s) {
    const d = newState();
    this.state = { ...d, ...s, stats: { ...d.stats, ...s.stats }, hats: { ...d.hats, ...s.hats }, flags: { ...d.flags, ...s.flags }, found: s.found || [] };
    if (!this.state.hats.owned.includes('none')) this.state.hats.owned.unshift('none');
    for (const it of world.items) it.taken = this.state.found.includes(it.id);
    if (s.pos && !world.blocked(s.pos.x, s.pos.y, 3)) { this.player.x = s.pos.x; this.player.y = s.pos.y; }
    this.refreshHud();
  },
  async save() { const r = await api.save(this.snapshot()); if (r.ok) this.autosave = true; return r; },
  async loadSaved() {
    const r = await api.load();
    if (!r.ok) return r;
    if (!r.state) return { ok: false, error: 'No saved game yet.' };
    this.apply(r.state); this.autosave = true; return { ok: true };
  },
};
game.walk = new WalkSystem(game);
window.dwp = game;

// ------------------------------------------------------------------ canvas
const cv = $('#game'), g = cv.getContext('2d');
let VW = 320, VH = 180, scale = 3;
function resize() {
  const st = $('#stage'), sw = st.clientWidth, sh = st.clientHeight;
  scale = Math.max(2, Math.floor(Math.min(sw / 280, sh / 160)));
  VW = Math.ceil(sw / scale); VH = Math.ceil(sh / scale);
  cv.width = VW; cv.height = VH;
  cv.style.width = VW * scale + 'px'; cv.style.height = VH * scale + 'px';
  g.imageSmoothingEnabled = false;
}
new ResizeObserver(resize).observe($('#stage'));
window.addEventListener('resize', resize);

// ------------------------------------------------------------------ input
const held = { up: false, down: false, left: false, right: false };
const keyMap = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
const actKeys = { KeyE: 'plus', Enter: 'plus', KeyX: 'x', KeyT: 'slash', Slash: 'slash', KeyH: 'minus', Minus: 'minus' };
const btnEls = {};
document.querySelectorAll('[data-b]').forEach(b => { btnEls[b.dataset.b] = b; });
function paintHeld() { for (const k of ['up', 'down', 'left', 'right']) btnEls[k].classList.toggle('on', held[k]); }

window.addEventListener('keydown', (e) => {
  if (ui.isOpen() || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
  if (keyMap[e.code]) { held[keyMap[e.code]] = true; paintHeld(); e.preventDefault(); }
  else if (actKeys[e.code] && !e.repeat) { act(actKeys[e.code]); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => { if (keyMap[e.code]) { held[keyMap[e.code]] = false; paintHeld(); } });
window.addEventListener('blur', () => { for (const k in held) held[k] = false; paintHeld(); });

// D-pad: one pointer region so sliding between directions works.
const dpad = $('#dpad');
const dpadPtrs = new Map();
function dpadFromPointer(e) {
  const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const dead = r.width * .12;
  return { left: dx < -dead, right: dx > dead, up: dy < -dead, down: dy > dead };
}
function dpadApply() {
  for (const k of ['up', 'down', 'left', 'right']) held[k] = false;
  for (const v of dpadPtrs.values()) for (const k in v) if (v[k]) held[k] = true;
  paintHeld();
}
dpad.addEventListener('pointerdown', (e) => { dpad.setPointerCapture(e.pointerId); dpadPtrs.set(e.pointerId, dpadFromPointer(e)); dpadApply(); e.preventDefault(); });
dpad.addEventListener('pointermove', (e) => { if (dpadPtrs.has(e.pointerId)) { dpadPtrs.set(e.pointerId, dpadFromPointer(e)); dpadApply(); } });
const dpadEnd = (e) => { dpadPtrs.delete(e.pointerId); dpadApply(); };
dpad.addEventListener('pointerup', dpadEnd); dpad.addEventListener('pointercancel', dpadEnd); dpad.addEventListener('lostpointercapture', dpadEnd);
dpad.addEventListener('contextmenu', e => e.preventDefault());

$('#abtns').querySelectorAll('button').forEach(b => {
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('on'); act(b.dataset.b); });
  const up = () => b.classList.remove('on');
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
$('#btn-settings').onclick = () => ui.showSettings(game);
$('#btn-pause').onclick = () => ui.showPause(game);
window.addEventListener('keydown', (e) => {
  if ((e.code === 'KeyP') && !ui.isOpen() && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) ui.showPause(game);
});
$('#btn-map').onclick = () => { const m = $('#minimap'); m.hidden = !m.hidden; };
$('#task-return').onclick = () => { if (game.walk.task && !ui.isOpen()) tryReturnOrGiveUp(); };

// ------------------------------------------------------------------ interactions
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function nearestPed(r) {
  let best = null, bd = r;
  for (const p of game.peds.list) { if (p.hidden) continue; const d = dist(p, game.player); if (d < bd) { bd = d; best = p; } }
  return best;
}
function nearbyPlace() {
  const p = game.player;
  for (const b of [...world.buildings, ...world.stands]) if (dist(b.stand, p) < REACH) return b;
  return null;
}
function tryReturnOrGiveUp() {
  const t = game.walk.task; if (!t) return;
  if (dist(t.building.stand, game.player) < REACH + 12) game.walk.tryReturn();
  else if (confirm(`Give ${t.offer.name} back early? You'll lose a few points.`)) game.walk.giveUp();
}

function act(b) {
  if (ui.isOpen()) return;
  const p = game.player, W = game.walk, S = game.state;
  if (b === 'plus') {
    const place = nearbyPlace();
    if (place && place.kind === 'coffee') return buyCoffee();
    if (W.active && place && place === W.task.building) { W.tryReturn(); return; }
    if (W.active && W.encourage('pet')) { return; }
    if (place) return enter(place);
    game.toast('Nothing to interact with here.', 1200);
  } else if (b === 'x') {
    if (W.active) { W.encourage('cheer'); return; }
    const owned = S.hats.owned, i = owned.indexOf(S.hats.equipped);
    if (owned.length < 2) { game.toast('You have no other hats yet. Find some or visit the hat store!'); return; }
    S.hats.equipped = owned[(i + 1) % owned.length]; game.refreshHud();
    game.toast(`Wearing: ${HATS[S.hats.equipped].name}`, 1400);
  } else if (b === 'slash') {
    const ped = nearestPed(34);
    if (!ped) { game.toast('Nobody close enough to talk to.', 1400); return; }
    ped.state = 'chat'; ped.timer = 600; ped.met = true;
    const dx = p.x - ped.x, dy = p.y - ped.y;
    ped.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
    ui.showDialog(game, ped, () => { S.flags.birdJobs = true; game.toast('Bird walking jobs are now available around town!', 4000); });
  } else if (b === 'minus') {
    const ped = nearestPed(42);
    const physical = ped && Math.random() < .2;
    game.fx.push({ kind: 'bubble', x: p.x, y: p.y - 22, t: 0, text: physical ? '*SHOVE!*' : pick(SHOUTS), life: 1.8 });
    if (ped) {
      game.peds.say(ped, pick(NPC_REACTIONS), 2.2);
      game.peds.flee(ped, p.x, p.y, physical ? 3 : 1.6);
      if (physical) game.addPoints(-3);
    }
  }
}

function buyCoffee() {
  const S = game.state;
  if (S.points < COFFEE_PRICE) { game.toast(`Coffee costs ${COFFEE_PRICE} points.`); return; }
  game.addPoints(-COFFEE_PRICE); S.stats.coffees++; game.player.coffeeT = COFFEE_SECS;
  game.toast('Mmm, coffee! Animals will need less encouragement for a while.');
  game.fx.push({ kind: 'heart', x: game.player.x, y: game.player.y - 20, t: 0 });
}

function enter(b) {
  const W = game.walk;
  const offer = W.availableOffer(b);
  if (offer && !W.active) return ui.showOffer(game, offer, b, () => W.start(offer, b));
  if (b.enter === 'library') return ui.showLibrary();
  if (b.enter === 'hats') return ui.showHatStore(game);
  if (b.enter === 'gallery') return ui.showGallery();
  if (offer) { game.toast('Finish your current walk first.'); return; }
  game.toast(`${b.name}: ${b.blurb || 'a home'}. Nobody needs you right now.`, 1800);
}

// ------------------------------------------------------------------ update
function movePlayer(dt) {
  const p = game.player;
  let dx = (held.right ? 1 : 0) - (held.left ? 1 : 0), dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  if (p.hitT > 0) { p.hitT -= dt; dx = dy = 0; }
  if (dx || dy) {
    const l = Math.hypot(dx, dy), s = SPEED * dt;
    const nx = p.x + dx / l * s, ny = p.y + dy / l * s;
    if (!game.world.blocked(nx, p.y, 3)) p.x = nx;
    if (!game.world.blocked(p.x, ny, 3)) p.y = ny;
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
    p.st += dt * 8; p.step = Math.floor(p.st) & 1;
  } else p.step = 0;
  game.walk.constrainPlayer(p);
  p.cool -= dt;
  const v = game.traffic.hits(p.x, p.y, 3);
  if (v && p.cool <= 0) {
    p.cool = 3; p.hitT = .8;
    const center = v.axis === 'h' ? world.hStreetY(v.idx) + world.SP / 2 : world.vStreetX(v.idx) + world.SP / 2;
    const sgn = (v.axis === 'h' ? p.y : p.x) >= center ? 1 : -1;
    for (let i = 0; i < 80; i++) {
      if (v.axis === 'h') p.y += sgn * 2; else p.x += sgn * 2;
      if (!world.blocked(p.x, p.y, 3) && !game.traffic.hits(p.x, p.y, 4) && Math.abs((v.axis === 'h' ? p.y : p.x) - center) > world.SP / 2 + 6) break;
    }
    game.addPoints(-5); game.toast('Ouch! A vehicle bumped you. (-5)');
    game.fx.push({ kind: 'bubble', x: p.x, y: p.y - 22, t: 0, text: 'OOF!', life: 1.2 });
  }
}

function pickupItems() {
  const p = game.player;
  for (const it of world.items) {
    if (it.taken || dist(it, p) > 10) continue;
    it.taken = true; game.state.found.push(it.id);
    if (!game.state.hats.owned.includes(it.hat)) game.state.hats.owned.push(it.hat);
    game.state.hats.equipped = it.hat; game.refreshHud();
    game.toast(`You found a hat: ${HATS[it.hat].name}!`, 3000);
    game.fx.push({ kind: 'heart', x: p.x, y: p.y - 22, t: 0 });
  }
}

let camX = 0, camY = 0;
function update(dt) {
  game.t += dt;
  const S = game.state;
  S.stats.timeSec += dt;
  const p = game.player;
  p.coffeeT = Math.max(0, p.coffeeT - dt);
  movePlayer(dt);
  pickupItems();
  const view = { x: camX, y: camY, w: VW, h: VH };
  const people = [p, ...game.peds.list.filter(q => !q.hidden)];
  game.traffic.update(dt, game.t, people);
  game.traffic.fill(view, dt);
  game.peds.update(dt, game.t);
  game.walk.update(dt);
  for (let i = game.fx.length - 1; i >= 0; i--) { const f = game.fx[i]; f.t += dt; if (f.t > (f.life || 1.4)) game.fx.splice(i, 1); }
  camX = Math.max(0, Math.min(world.W - VW, p.x - VW / 2)); camY = Math.max(0, Math.min(world.H - VH, p.y - VH / 2 - 6));
  if (world.W < VW) camX = (world.W - VW) / 2;
  if (world.H < VH) camY = (world.H - VH) / 2;
  camX = Math.round(camX); camY = Math.round(camY);
}

// ------------------------------------------------------------------ render
const playerLook = { skin: '#e0a97c', hair: '#3a2012', hairStyle: 'long', shirt: '#8a3fd0', pants: '#2f4a7a', scarf: '#ff8a1f', female: true };
function render() {
  const p = game.player, T_ = game.t;
  g.fillStyle = '#3b3550'; g.fillRect(0, 0, VW, VH);
  g.save(); g.translate(-camX, -camY);
  g.drawImage(world.groundCanvas, 0, 0);
  const inView = (x, y, m = 40) => x > camX - m && x < camX + VW + m && y > camY - m && y < camY + VH + m + 40;

  for (const it of world.items) if (!it.taken && inView(it.x, it.y)) { drawHat(g, it.hat, it.x, it.y - 6, 'd'); drawSparkle(g, it.x + 6, it.y - 10, T_ + it.x); }

  const list = [];
  for (const b of world.buildings) { const by = b.y + b.d; if (by > camY - 10 && b.y - b.H < camY + VH && b.x < camX + VW && b.x + b.w > camX) list.push({ y: by, f: () => g.drawImage(b.sprite.canvas, b.x + b.sprite.ox, b.y + b.sprite.oy) }); }
  for (const s of world.stands) { const by = s.y + s.d; if (inView(s.x, by)) list.push({ y: by, f: () => g.drawImage(s.sprite.canvas, s.x + s.sprite.ox, s.y + s.sprite.oy) }); }
  for (const t of world.trees) if (inView(t.x, t.y, 20)) list.push({ y: t.y, f: () => drawTree(g, t.x, t.y, t.seed) });
  for (const v of game.traffic.list) if (inView(v.x, v.y, 60)) list.push({ y: v.y + (v.axis === 'v' ? 4 : 2), f: () => drawVehicle(g, v) });
  for (const q of game.peds.list) {
    if (q.hidden || !inView(q.x, q.y)) continue;
    if (q.dog) { const d = q.dog; list.push({ y: d.y, f: () => drawDog(g, d.x, d.y, DOGS[d.key], { dir: d.dir, frame: d.frame }) }); }
    list.push({ y: q.y, f: () => {
      if (q.cyclist) drawVehicle(g, { type: 'bike', axis: q.dir === 'l' || q.dir === 'r' ? 'h' : 'v', dir: q.dir === 'l' || q.dir === 'u' ? -1 : 1, x: q.x, y: q.y, color: '#ff8a1f', rider: q.look });
      else drawPerson(g, q.x, q.y, { ...q.look, dir: q.dir, step: q.step });
    } });
  }
  const t = game.walk.task;
  if (t) {
    const a = t.animal;
    list.push({ y: a.y, f: () => {
      if (t.kind === 'dog') {
        g.strokeStyle = '#ff8a1f'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(p.x) + .5, Math.round(p.y) - 6); g.lineTo(Math.round(a.x) + .5, Math.round(a.y) - t.spec.h * .6); g.stroke();
        drawDog(g, a.x, a.y, t.spec, { dir: a.dir, frame: t.state === 'parked' ? 0 : a.frame, sit: t.state === 'parked', happy: a.wag > 0 });
      } else drawBird(g, a.x, a.y, t.spec, { dir: a.dir, flap: a.flap, z: a.z });
    } });
  }
  const hat = game.state.hats.equipped;
  const drawPlayer = (alpha) => { g.globalAlpha = alpha; drawPerson(g, p.x, p.y, { ...playerLook, dir: p.dir, step: p.step, hat }); g.globalAlpha = 1; };
  list.push({ y: p.y, f: () => drawPlayer(1) });
  list.sort((a, b) => a.y - b.y);
  for (const e of list) e.f();

  // see-through player when behind a roof
  for (const b of world.buildings) {
    if (p.x > b.x - 4 && p.x < b.x + b.w + 4 && p.y < b.y + b.d && p.y > b.y - b.H - 2) { drawPlayer(.5); break; }
  }

  for (const b of world.buildings) if (b.marker && inView(b.door.x, b.y)) drawMarker(g, b.door.x, b.y - b.H - 14, b.marker, T_);
  for (const q of game.peds.list) if (q.bubble && !q.hidden && inView(q.x, q.y)) drawBubble(g, q.x, q.y - 24, q.bubble);
  for (const f of game.fx) {
    if (f.kind === 'heart') drawHeart(g, f.x + Math.sin(f.t * 6) * 2, f.y - f.t * 16);
    else drawBubble(g, f.x, f.y, f.text, '#fff3c4');
  }
  g.restore();
}

// ------------------------------------------------------------------ HUD / minimap
const mini = document.createElement('canvas'); mini.width = world.cols * 28 + 6; mini.height = world.rows * 22 + 6;
(function buildMini() {
  const m = mini.getContext('2d'), k = 1 / T * 1;
  m.fillStyle = '#2a1346'; m.fillRect(0, 0, mini.width, mini.height);
  for (const b of world.buildings) { m.fillStyle = b.color; m.fillRect(Math.floor(b.x * k), Math.floor(b.y * k), Math.ceil(b.w * k), Math.ceil(b.d * k)); }
  for (const s of world.stands) { m.fillStyle = '#7a4a2a'; m.fillRect(Math.floor(s.x * k), Math.floor(s.y * k), 2, 1); }
})();
const mc = $('#minimap'), mg = mc.getContext('2d');
mc.width = mini.width; mc.height = mini.height;
function drawMini() {
  if (mc.hidden) return;
  mg.drawImage(mini, 0, 0);
  for (const b of world.buildings) if (b.marker) { mg.fillStyle = b.marker === 'bird' ? '#7dff3a' : '#ff8a1f'; mg.fillRect(Math.floor(b.door.x / T) - 1, Math.floor(b.y / T) - 1, 3, 3); }
  mg.fillStyle = '#fff'; mg.fillRect(Math.floor(game.player.x / T) - 1, Math.floor(game.player.y / T) - 1, 3, 3);
}

let hintT = 0;
function updateHud() {
  const W = game.walk, t = W.task, p = game.player;
  $('#coffee-chip').hidden = p.coffeeT <= 0; $('#coffee-v').textContent = Math.ceil(p.coffeeT) + 's';
  $('#task').hidden = !t;
  $('#lbl-plus').textContent = t ? 'pet' : 'interact'; $('#lbl-x').textContent = t ? (t.kind === 'bird' ? 'praise' : 'encourage') : 'hat';
  if (t) {
    const d = W.distM();
    $('#task-title').textContent = `${t.kind === 'bird' ? '🦜' : '🐕'} ${t.offer.name} · ${t.state === 'walking' ? 'happy' : t.state}`;
    $('#bar-dist').style.width = Math.min(100, d / t.targetM * 100) + '%';
    $('#task-dist').textContent = `${d} / ${t.targetM} m${d >= t.targetM ? ' — head back!' : ''}`;
    $('#bar-calm').style.width = Math.max(0, 100 - t.anxiety) + '%';
    $('#task-enc').textContent = `Pets/praise last min: ${W.encInWindow()} (goal ${Math.ceil(W.quotaEff())})`;
  }
  // contextual hint
  const place = nearbyPlace(), ped = nearestPed(34);
  let h = '';
  if (place && place.kind === 'coffee') h = `+ buy coffee (${COFFEE_PRICE} pts)`;
  else if (t && place === t.building) h = `+ return ${t.offer.name}`;
  else if (place && W.availableOffer(place) && !t) h = `+ walk ${W.availableOffer(place).name} the ${W.availableOffer(place).species}`;
  else if (place && place.enter) h = `+ enter ${place.name}`;
  else if (ped) h = `/ talk to ${ped.npc.name}`;
  $('#hint').textContent = h; $('#hint').classList.toggle('on', !!h);
}

// ------------------------------------------------------------------ main loop
let last = performance.now(), frames = 0, fpsT = 0, saveT = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  frames++; fpsT += dt; if (fpsT >= 1) { game.fps = frames; frames = 0; fpsT = 0; }
  if (!ui.isOpen()) {
    update(dt);
    saveT += dt;
    if (saveT > 60) { saveT = 0; if (auth.username && game.autosave) game.save(); }
  }
  render();
  hintT += dt; if (hintT > .1) { hintT = 0; updateHud(); drawMini(); }
  requestAnimationFrame(frame);
}

(async function init() {
  resize();
  for (let i = 0; i < 8; i++) game.traffic.fill(null, 0, true);
  for (let i = 0; i < 20; i++) game.traffic.update(.5, 0, []);
  game.refreshHud();
  ui.showWelcome(game);
  requestAnimationFrame(frame);
  const u = await api.me();
  if (u) { game.refreshHud(); const r = await game.loadSaved(); if (r.ok) game.toast(`Welcome back, ${u}! Game loaded.`); else game.autosave = true; }
})();
