// Traffic lights, vehicles and pedestrian NPCs.
import { T, FIRST_NAMES, SKIN, HAIR, SHIRTS, PERSONAS, BIRD_GIVERS, DOGS } from './data.js';

const CYCLE = 24;
const pick = (rng, a) => a[Math.floor(rng() * a.length)];

export function lightState(i, j, axis, t) {
  const ph = (t + ((i * 5 + j * 7) % CYCLE)) % CYCLE;
  if (axis === 'h') return ph < 8.5 ? 'green' : ph < 10 ? 'yellow' : 'red';
  return ph >= 12 && ph < 20.5 ? 'green' : ph >= 20.5 && ph < 22 ? 'yellow' : 'red';
}
// Walking along x crosses a vertical street (needs its traffic red); along y crosses a horizontal street.
export function canWalk(i, j, along, t) {
  const ph = (t + ((i * 5 + j * 7) % CYCLE)) % CYCLE;
  return along === 'x' ? ph < 5 : ph >= 12.5 && ph < 17;
}

export function makeLook(rng, female = rng() < .5) {
  return {
    skin: pick(rng, SKIN), hair: pick(rng, HAIR), shirt: pick(rng, SHIRTS), pants: pick(rng, ['#3a3a4a', '#2f4a7a', '#5a4a3a', '#6b2fa0', '#2a2a2a']),
    hairStyle: female ? pick(rng, ['long', 'bun', 'short']) : pick(rng, ['short', 'short', 'bald']), female,
    hat: rng() < .22 ? pick(rng, ['cap', 'beanie', 'sunhat', 'beret', 'cowboy']) : 'none',
  };
}

// ------------------------------------------------------------------ vehicles
const SPEC = {
  car: { len: 22, w: 11, max: 42, lane: 'motor' },
  bus: { len: 44, w: 13, max: 32, lane: 'motor' },
  bike: { len: 10, w: 4, max: 24, lane: 'cycle' },
  scooter: { len: 10, w: 4, max: 30, lane: 'cycle' },
};
const CAR_COLORS = ['#e04f4f', '#4f8fe0', '#e0c04f', '#d8d8e0', '#2a2a3a', '#4fe0a0', '#ff8a1f', '#a56bd8', '#e8e0d0'];

export class Traffic {
  constructor(world, rng) {
    this.world = world; this.rng = rng; this.list = []; this.spawnT = 0;
    this.counts = new Map();
  }
  segmentOf(v) {
    const w = this.world;
    const s = v.axis === 'h' ? v.x : v.y;
    const p = v.axis === 'h' ? w.pitchX : w.pitchY, n = v.axis === 'h' ? w.cols : w.rows;
    const k = Math.max(0, Math.min(n - 1, Math.floor(s / p)));
    return `${v.axis}${v.idx}-${k}`;
  }
  spawn(seg, dir, type, view) {
    const w = this.world, spec = SPEC[type];
    const s = seg.a + 40 + this.rng() * (seg.b - seg.a - 80);
    const lat = w.laneCoord(seg.axis, seg.idx, dir, spec.lane === 'cycle' ? 'cycle' : 'motor');
    const x = seg.axis === 'h' ? s : lat, y = seg.axis === 'h' ? lat : s;
    if (view && x > view.x - 40 && x < view.x + view.w + 40 && y > view.y - 40 && y < view.y + view.h + 40) return false;
    for (const o of this.list) {
      if (o.axis !== seg.axis || o.idx !== seg.idx || o.dir !== dir || SPEC[o.type].lane !== spec.lane) continue;
      if (Math.abs((seg.axis === 'h' ? o.x : o.y) - s) < 60) return false;
    }
    const v = { type, axis: seg.axis, idx: seg.idx, dir, x, y, speed: spec.max * .6, ...spec, color: type === 'bus' ? (this.rng() < .5 ? '#6b2fa0' : '#ff8a1f') : pick(this.rng, CAR_COLORS) };
    v.max = spec.max * (.85 + this.rng() * .3);
    if (type === 'bike' || type === 'scooter') { v.rider = makeLook(this.rng); v.color = pick(this.rng, ['#e04f4f', '#4f8fe0', '#ff8a1f', '#7dff3a', '#a56bd8']); }
    this.list.push(v);
    return true;
  }
  fill(view, dt, force = false) {
    this.spawnT -= dt;
    if (this.spawnT > 0 && !force) return;
    this.spawnT = 0.7;
    this.counts.clear();
    for (const v of this.list) { const k = this.segmentOf(v) + ':' + v.dir + ':' + v.type; this.counts.set(k, (this.counts.get(k) || 0) + 1); }
    const want = { car: 'cars', bus: 'buses', bike: 'cycles', scooter: 'scooters' };
    for (const seg of this.world.segments) {
      const tr = seg.cfg.traffic || {};
      for (const dir of [1, -1]) for (const type in want) {
        const target = (tr[want[type]] || 0) * (type === 'car' ? 1.3 : 1);
        const have = this.counts.get(`${seg.axis}${seg.idx}-${this.segIndex(seg)}:${dir}:${type}`) || 0;
        if (have < target && this.rng() < Math.min(1, target - have) * .6) this.spawn(seg, dir, type, force ? null : view);
      }
    }
  }
  segIndex(seg) { return seg.id.split('-')[1]; }

  update(dt, t, people) {
    const w = this.world;
    for (let n = this.list.length - 1; n >= 0; n--) {
      const v = this.list[n];
      const along = v.axis === 'h' ? v.x : v.y;
      const lat = v.axis === 'h' ? v.y : v.x;
      const front = along + v.dir * v.len / 2;
      let target = v.max;
      // car ahead in the same lane
      for (const o of this.list) {
        if (o === v || o.axis !== v.axis || o.idx !== v.idx || o.dir !== v.dir || o.lane !== v.lane) continue;
        const os = v.axis === 'h' ? o.x : o.y;
        const gap = (os - along) * v.dir - (o.len + v.len) / 2;
        if (gap < -2 || gap > 80) continue;
        target = Math.min(target, gap < 4 ? 0 : Math.min(o.speed + (gap - 4) * 1.5, v.max));
      }
      // traffic lights
      const p = v.axis === 'h' ? w.pitchX : w.pitchY, nk = v.axis === 'h' ? w.cols : w.rows;
      const kc = Math.round(front / p);
      for (let k = Math.max(0, kc - 1); k <= Math.min(nk, kc + 1); k++) {
        const line = w.crossStart(v.axis, k, v.dir);
        const dist = (line - front) * v.dir;
        if (dist < -0.5 || dist > 110) continue;
        const st = v.axis === 'h' ? lightState(k, v.idx, 'h', t) : lightState(v.idx, k, 'v', t);
        if (st === 'green') continue;
        if (st === 'yellow' && dist < v.speed * 0.8) continue;
        target = Math.min(target, Math.sqrt(2 * 55 * Math.max(0, dist - 1)));
      }
      // people in the way
      for (const q of people) {
        const qa = v.axis === 'h' ? q.x : q.y, ql = v.axis === 'h' ? q.y : q.x;
        const ahead = (qa - front) * v.dir;
        if (ahead < -2 || ahead > 46 + v.speed) continue;
        if (Math.abs(ql - lat) > v.w / 2 + 7) continue;
        target = Math.min(target, ahead < 12 + v.speed * .4 ? 0 : v.speed * .5);
        v.honk = ahead < 22;
      }
      v.speed = v.speed > target ? Math.max(target, v.speed - 90 * dt) : Math.min(target, v.speed + 28 * dt);
      if (v.axis === 'h') v.x += v.dir * v.speed * dt; else v.y += v.dir * v.speed * dt;
      if (v.x < -90 || v.y < -90 || v.x > w.W + 90 || v.y > w.H + 90) this.list.splice(n, 1);
    }
  }
  // Rectangle test used for player collisions.
  hits(x, y, r) {
    for (const v of this.list) {
      const hw = v.axis === 'h' ? v.len / 2 : v.w / 2, hh = v.axis === 'h' ? v.w / 2 : v.len / 2;
      if (v.lane === 'cycle') continue;
      if (x + r > v.x - hw && x - r < v.x + hw && y + r > v.y - hh && y - r < v.y + hh) return v;
    }
    return null;
  }
}

// ------------------------------------------------------------------ pedestrians
export class Peds {
  constructor(world, rng) {
    this.world = world; this.rng = rng; this.list = []; this.dogs = [];
    const nodes = [...world.nodes.values()];
    const birdSpots = new Map((world.layout.specialNpcs || []).map((s, n) => [s.block.join(','), BIRD_GIVERS[n % BIRD_GIVERS.length]]));
    let nid = 0;
    for (let c = 0; c < world.cols; c++) for (let r = 0; r < world.rows; r++) {
      const cfg = world.blocks[c][r].cfg;
      const local = nodes.filter(n => n.block[0] === c && n.block[1] === r);
      const special = birdSpots.get(`${c},${r}`);
      const total = (cfg.peds ?? 3) + (cfg.cyclists ?? 1);
      for (let n = 0; n < total + (special ? 1 : 0); n++) {
        const node = pick(rng, local);
        const isSpecial = special && n === 0;
        const cyclist = !isSpecial && n >= (cfg.peds ?? 3);
        const p = this.make(node, cyclist, isSpecial ? special : null, nid++);
        this.list.push(p);
      }
    }
    // a few NPC dog walkers
    const owners = this.list.filter(p => !p.cyclist && !p.special);
    for (let n = 0; n < 6 && owners.length; n++) {
      const o = owners.splice(Math.floor(rng() * owners.length), 1)[0];
      const key = pick(rng, Object.keys(DOGS));
      o.dog = { x: o.x - 8, y: o.y, key, dir: 1, frame: 0, ft: 0, fight: 0 };
      this.dogs.push(o.dog);
    }
  }
  make(node, cyclist, special, nid) {
    const rng = this.rng;
    const look = makeLook(rng);
    const persona = special ? special : { name: pick(rng, FIRST_NAMES), ...pick(rng, PERSONAS) };
    if (special) { look.shirt = '#8a5cc0'; look.hat = 'tophat'; look.hairStyle = 'bun'; }
    const edge = pick(rng, node.edges);
    const f = rng();
    const x = node.x + (edge.to.x - node.x) * f + (rng() - .5) * 8, y = node.y + (edge.to.y - node.y) * f + (rng() - .5) * 8;
    return {
      id: nid, x, y, look, cyclist, special: !!special, npc: persona, node, prev: null, targets: [], speed: cyclist ? 34 + rng() * 8 : 16 + rng() * 10,
      dir: 'd', step: 0, st: 0, state: 'walk', timer: 0, hidden: false, said: 0, bubble: null, bubbleT: 0, met: false, history: [],
    };
  }
  plan(p, t) {
    const w = this.world, rng = this.rng;
    const opts = p.node.edges.filter(e => !(p.prev && e.to === p.prev && p.node.edges.length > 1));
    const e = pick(rng, opts.length ? opts : p.node.edges);
    if (e.cross && !canWalk(e.cross.i, e.cross.j, e.cross.along, t)) { p.state = 'wait'; p.timer = .5 + rng() * .5; p.targets = []; return; }
    p.state = 'walk';
    const dx = e.to.x - e.from.x, dy = e.to.y - e.from.y, L = Math.hypot(dx, dy) || 1;
    const off = (rng() - .5) * (e.cross ? 8 : 14);
    const tx = e.to.x + (-dy / L) * off, ty = e.to.y + (dx / L) * off;
    p.targets = [];
    // sometimes step into a shop that fronts this sidewalk
    if (!e.cross && !p.cyclist && dy === 0 && rng() < .3) {
      const [c, r] = p.node.block, blk = w.blocks[c][r];
      const bottom = e.from.y > blk.y + blk.h;
      if (bottom) {
        const cands = w.buildings.filter(b => b.block[0] === c && b.block[1] === r && b.y + b.d >= blk.y + blk.h - 2 && b.cat === 'biz');
        if (cands.length) {
          const b = pick(rng, cands);
          p.targets.push({ x: b.door.x, y: e.from.y }, { x: b.door.x, y: b.y + b.d + 2, act: 'enter', b }, { x: b.door.x, y: e.from.y });
        }
      }
    }
    p.targets.push({ x: tx, y: ty, node: e.to });
    p.prev = p.node;
  }
  update(dt, t, mover) {
    for (const p of this.list) {
      if (p.bubbleT > 0) { p.bubbleT -= dt; if (p.bubbleT <= 0) p.bubble = null; }
      if (p.state === 'inside') { p.timer -= dt; if (p.timer <= 0) { p.hidden = false; p.state = 'walk'; } continue; }
      if (p.state === 'wait') { p.timer -= dt; if (p.timer <= 0) { p.state = 'walk'; this.plan(p, t); } continue; }
      if (p.state === 'chat') { p.timer -= dt; if (p.timer <= 0) p.state = 'walk'; continue; }
      if (p.state === 'flee') {
        p.timer -= dt;
        p.x += p.fx * 55 * dt; p.y += p.fy * 55 * dt; p.step = (Math.floor(t * 8) & 1); p.dir = Math.abs(p.fx) > Math.abs(p.fy) ? (p.fx > 0 ? 'r' : 'l') : (p.fy > 0 ? 'd' : 'u');
        if (p.timer <= 0) { p.state = 'walk'; this.snapToGraph(p); }
        continue;
      }
      if (!p.targets.length) this.plan(p, t);
      const tg = p.targets[0];
      if (!tg) continue;
      const dx = tg.x - p.x, dy = tg.y - p.y, dist = Math.hypot(dx, dy);
      if (dist < 2) {
        p.targets.shift();
        if (tg.node) p.node = tg.node;
        if (tg.act === 'enter') { p.hidden = true; p.state = 'inside'; p.timer = 4 + this.rng() * 8; }
        continue;
      }
      const sp = p.speed * dt;
      const nx = p.x + dx / dist * Math.min(sp, dist), ny = p.y + dy / dist * Math.min(sp, dist);
      p.x = nx; p.y = ny;
      p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
      p.st += dt * (p.cyclist ? 6 : 8); p.step = Math.floor(p.st) & 1;
      if (p.dog) this.followDog(p.dog, p, dt);
    }
    for (const d of this.dogs) if (!this.list.some(p => p.dog === d)) continue;
  }
  followDog(d, p, dt) {
    const tx = p.x - (p.dir === 'r' ? 12 : p.dir === 'l' ? -12 : 0), ty = p.y - (p.dir === 'd' ? 8 : p.dir === 'u' ? -8 : 0) + 1;
    const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
    if (dist > 1) { const s = Math.min(dist, 36 * dt); d.x += dx / dist * s; d.y += dy / dist * s; d.ft += dt * 8; d.frame = Math.floor(d.ft) & 1; }
    if (Math.abs(dx) > 1.5) d.dir = dx > 0 ? 1 : -1;
  }
  snapToGraph(p) {
    let best = null, bd = 1e9;
    for (const n of this.world.nodes.values()) { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n; } }
    p.node = best; p.prev = null; p.targets = [];
  }
  say(p, text, secs = 2.2) { p.bubble = text; p.bubbleT = secs; }
  flee(p, fromX, fromY, secs = 2) {
    const dx = p.x - fromX, dy = p.y - fromY, L = Math.hypot(dx, dy) || 1;
    p.state = 'flee'; p.timer = secs; p.fx = dx / L; p.fy = dy / L; p.hidden = false;
  }
}
