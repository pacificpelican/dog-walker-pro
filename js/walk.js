// Animal walking: offers, the encouragement system, misbehavior, and scoring.
import { DOGS, BIRDS, M_PER_TILE, T, ENCOURAGE, BIRD_ENCOURAGE, SWEARS } from './data.js';

const HIT = 16;            // anxiety removed per encouragement
const LEASH = 38;
const GRACE = 8;           // seconds before neglect starts counting
const COFFEE_FACTOR = .6;  // quota multiplier while buzzed on coffee

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (a, b) => Math.round(a + Math.random() * (b - a));

export class WalkSystem {
  constructor(game) { this.g = game; this.task = null; this.lastHit = 0; }

  // ------------------------------------------------------------ offers
  newOffer(kind) {
    const table = kind === 'dog' ? DOGS : BIRDS;
    const key = pick(Object.keys(table)), sp = table[key];
    const meters = Math.round(rint(sp.dist[0], sp.dist[1]) / 10) * 10;
    return { kind, key, name: pick(sp.names), species: sp.name, meters, quota: sp.quota };
  }
  refreshOffers(dt) {
    const flags = this.g.state.flags;
    for (const b of this.g.world.buildings) {
      if (!b.jobs.length || b.enter) continue;
      if (b.cooldown > 0) { b.cooldown -= dt; if (b.cooldown > 0) continue; }
      if (!b.offers) b.offers = {};
      for (const k of b.jobs) if (!b.offers[k]) b.offers[k] = this.newOffer(k);
      if (this.task && this.task.building === b) { b.marker = null; continue; }
      b.marker = b.offers.dog ? 'dog' : (flags.birdJobs && b.offers.bird ? 'bird' : null);
    }
  }
  availableOffer(b) {
    if (!b.offers || b.cooldown > 0) return null;
    if (b.offers.dog) return b.offers.dog;
    if (this.g.state.flags.birdJobs && b.offers.bird) return b.offers.bird;
    return null;
  }

  // ------------------------------------------------------------ lifecycle
  start(offer, b) {
    const p = this.g.player;
    const table = offer.kind === 'dog' ? DOGS : BIRDS;
    this.task = {
      kind: offer.kind, offer, building: b, spec: table[offer.key], quota: offer.quota,
      targetM: offer.meters, distPx: 0, elapsed: 0, enc: [], anxiety: 18, incidents: 0, state: 'walking', stateT: 0, coax: 0,
      animal: { x: b.door.x, y: b.door.y + 8, dir: 1, frame: 0, ft: 0, z: 0, wag: 0 }, last: { x: p.x, y: p.y }, totalHits: 0,
      attacks: 0, mood: 'happy',
    };
    b.offers[offer.kind] = null; b.marker = null;
    this.g.toast(`${offer.name} the ${offer.species} joined you! Keep + and x going.`);
  }
  get active() { return !!this.task; }
  distM() { return this.task ? Math.round(this.task.distPx / T * M_PER_TILE) : 0; }
  quotaEff() { return this.task.quota * (this.g.player.coffeeT > 0 ? COFFEE_FACTOR : 1); }
  encInWindow() { const t = this.task; const now = t.elapsed; return t.enc.filter(e => now - e <= 60).length; }

  finish(ok, reason) {
    const t = this.task; if (!t) return;
    const st = this.g.state.stats;
    let pts = 0;
    if (ok) {
      pts = Math.max(10, Math.round(this.distM() * .4 + t.quota * 3 + (t.incidents === 0 ? 25 : 0) - t.incidents * 6));
      this.g.addPoints(pts);
      if (t.kind === 'dog') st.dogsWalked++; else st.birdsWalked++;
      st.metersWalked += this.distM();
    } else {
      pts = -Math.min(this.g.state.points, 10);
      this.g.addPoints(pts);
    }
    t.building.cooldown = ok ? 40 : 25;
    t.building.offers = null;
    this.g.showResult({ ok, reason, name: t.offer.name, species: t.offer.species, kind: t.kind, meters: this.distM(), points: pts, incidents: t.incidents, time: Math.round(t.elapsed), hits: t.totalHits });
    this.task = null;
  }
  tryReturn() {
    const t = this.task; if (!t) return false;
    if (t.state === 'fleeing' || t.state === 'flying_home') { this.g.toast('Get your animal back first!'); return true; }
    const need = t.targetM - this.distM();
    if (need > 0) { this.g.toast(`Walk ${need} m farther before returning ${t.offer.name}.`); return true; }
    this.finish(true);
    return true;
  }
  giveUp() { if (this.task) this.finish(false, `You gave ${this.task.offer.name} back early.`); }

  // ------------------------------------------------------------ encouragement
  encourage(type) {
    const t = this.task; if (!t) return false;
    const a = t.animal, p = this.g.player;
    if (t.elapsed - this.lastHit < .22) return true;
    this.lastHit = t.elapsed;
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    if (t.state === 'fleeing') {
      if (d < 26) { t.state = 'walking'; t.anxiety = 55; t.incidents++; this.g.toast(`Caught ${t.offer.name}! Phew.`); this.checkIncidents(); }
      else this.g.toast('Too far! Run to catch them!');
      return true;
    }
    if (t.state === 'flying_home') return true;
    if (d > 60) { this.g.toast('Too far away to reach.'); return true; }
    const heart = type === 'pet';
    this.g.fx.push(heart ? { kind: 'heart', x: a.x, y: a.y - (t.kind === 'bird' ? a.z + 14 : t.spec.h + 4), t: 0 }
      : { kind: 'bubble', x: p.x, y: p.y - 22, t: 0, text: pick(t.kind === 'dog' ? ENCOURAGE : BIRD_ENCOURAGE) });
    a.wag = .6;
    if (t.state === 'parked' || t.state === 'scuffle') {
      t.coax++;
      if (t.coax >= 3) { t.state = 'walking'; t.anxiety = 40; t.coax = 0; this.g.toast(`${t.offer.name} is back on track.`); }
      return true;
    }
    t.enc.push(t.elapsed); t.totalHits++;
    t.anxiety = Math.max(0, t.anxiety - HIT);
    this.g.state.stats.encouragements++;
    return true;
  }

  checkIncidents() {
    if (this.task && this.task.incidents >= 4) this.g.toast(`${this.task.offer.name} is very upset...`);
    if (this.task && this.task.incidents >= 5) this.finish(false, `${this.task.offer.name} had too many incidents and was taken home.`);
  }

  // ------------------------------------------------------------ misbehavior
  misbehave() {
    const t = this.task, g = this.g, a = t.animal;
    const opts = [];
    const nearPed = g.peds.list.find(q => !q.hidden && Math.hypot(q.x - a.x, q.y - a.y) < 70);
    if (t.kind === 'dog') {
      opts.push(['park', 1 + t.spec.size * 3], ['yank', 1.5]);
      const od = g.peds.dogs.find(d => Math.hypot(d.x - a.x, d.y - a.y) < 100);
      if (od) opts.push(['fight', 2.2, od]);
      if (nearPed) opts.push(['attack', 1.2, nearPed]);
    } else {
      opts.push(['swear', t.spec.mischief * 3], ['escape', (1.15 - t.spec.mischief) * 2]);
    }
    let r = Math.random() * opts.reduce((s, o) => s + o[1], 0), ch = opts[0];
    for (const o of opts) { r -= o[1]; if (r <= 0) { ch = o; break; } }
    const name = t.offer.name;
    t.anxiety = 45;
    switch (ch[0]) {
      case 'park': t.state = 'parked'; t.coax = 0; t.incidents++; g.toast(`${name} sat down and refuses to move! Encourage 3 times.`); break;
      case 'yank': t.state = 'fleeing'; t.stateT = 11; t.incidents++; a.fleeAng = Math.random() * Math.PI * 2; g.toast(`${name} yanked the leash and bolted! Catch up and press +`); break;
      case 'fight': { t.state = 'scuffle'; t.stateT = 5; t.coax = 0; t.incidents++; g.addPoints(-8); a.x = ch[2].x - 8; a.y = ch[2].y; ch[2].fight = 5; g.toast(`${name} is fighting another dog! Calm them (-8)`); break; }
      case 'attack': { t.state = 'scuffle'; t.stateT = 4; t.coax = 0; t.incidents++; t.attacks++; g.addPoints(-12); g.peds.say(ch[2], 'AAH! Dog!', 2.5); g.peds.flee(ch[2], a.x, a.y, 2.5); g.toast(`${name} went after a pedestrian! (-12)`); break; }
      case 'swear': {
        t.incidents++; g.addPoints(-4);
        g.fx.push({ kind: 'bubble', x: a.x, y: a.y - a.z - 18, t: 0, text: pick(SWEARS), life: 2.5 });
        if (nearPed) { g.peds.say(nearPed, 'Well!! Language!', 2.5); }
        g.toast(`${name} is cursing like a sailor! (-4)`); break;
      }
      case 'escape': t.state = 'flying_home'; t.stateT = 8; g.toast(`${name} burst free and flew home!`); break;
    }
    this.checkIncidents();
  }

  // ------------------------------------------------------------ per-frame
  update(dt) {
    this.refreshOffers(dt);
    const t = this.task; if (!t) return;
    const g = this.g, p = g.player, a = t.animal, w = g.world;
    t.elapsed += dt;
    a.wag = Math.max(0, a.wag - dt);
    // distance accounting
    const moved = Math.hypot(p.x - t.last.x, p.y - t.last.y);
    t.last.x = p.x; t.last.y = p.y;
    if (t.state === 'walking' && moved < 20) t.distPx += moved;
    // anxiety
    if (t.state === 'walking' && t.elapsed > GRACE) {
      t.anxiety = Math.min(100, t.anxiety + (this.quotaEff() / 60) * HIT * dt);
      if (t.anxiety >= 100) this.misbehave();
    }
    const dirv = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[p.dir];
    const move = (tx, ty, speed) => {
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
      if (d < 1.5) return false;
      const s = Math.min(d, speed * dt);
      const nx = a.x + dx / d * s, ny = a.y + dy / d * s;
      if (t.kind === 'bird' || !w.blocked(nx, a.y, 2)) a.x = nx;
      if (t.kind === 'bird' || !w.blocked(a.x, ny, 2)) a.y = ny;
      if (Math.abs(dx) > 1) a.dir = dx > 0 ? 1 : -1;
      a.ft += dt * (s / dt > 30 ? 10 : 6); a.frame = Math.floor(a.ft) & 1;
      return true;
    };
    if (t.kind === 'dog') {
      switch (t.state) {
        case 'walking': {
          const tx = p.x - dirv[0] * 16, ty = p.y - dirv[1] * 12 + 2;
          const d = Math.hypot(tx - a.x, ty - a.y);
          move(tx, ty, d > 10 ? Math.min(t.spec.speed * 1.2, 20 + d * 4) : 0);
          if (Math.hypot(a.x - p.x, a.y - p.y) > 70) { a.x = p.x - dirv[0] * 14; a.y = p.y - dirv[1] * 10; }
          break;
        }
        case 'parked': break;
        case 'scuffle': t.stateT -= dt; a.ft += dt * 14; a.frame = Math.floor(a.ft) & 1; if (t.stateT <= 0) { t.state = 'walking'; t.anxiety = 45; } break;
        case 'fleeing': {
          t.stateT -= dt;
          a.fleeAng += (Math.random() - .5) * 2 * dt;
          move(a.x + Math.cos(a.fleeAng) * 50, a.y + Math.sin(a.fleeAng) * 50, t.spec.speed * 1.5);
          if (w.blocked(a.x + Math.cos(a.fleeAng) * 6, a.y + Math.sin(a.fleeAng) * 6, 2)) a.fleeAng += Math.PI / 2;
          if (t.stateT <= 0) this.finish(false, `${t.offer.name} got away and ran home.`);
          break;
        }
      }
    } else { // bird
      a.z = (t.state === 'flying_home' ? 20 : 13) + Math.sin(t.elapsed * 5) * 2;
      a.flap = Math.floor(t.elapsed * 10) & 1;
      if (t.state === 'walking') {
        move(p.x + (p.dir === 'l' ? -9 : 9), p.y + 1, 80);
        if (Math.hypot(a.x - p.x, a.y - p.y) > 80) { a.x = p.x; a.y = p.y; }
      } else if (t.state === 'flying_home') {
        t.stateT -= dt;
        move(t.building.door.x, t.building.door.y + 8, 95);
        a.z += 4;
        if (t.stateT <= 0 || Math.hypot(a.x - t.building.door.x, a.y - t.building.door.y) < 10) this.finish(false, `${t.offer.name} flew back home.`);
      }
    }
  }

  // Keep the player tethered while a dog refuses to move.
  constrainPlayer(p) {
    const t = this.task; if (!t || t.kind !== 'dog' || t.state !== 'parked') return;
    const a = t.animal, dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
    if (d > LEASH) { p.x = a.x + dx / d * LEASH; p.y = a.y + dy / d * LEASH; }
  }
}
