// Builds a playable world from a layout description (see layout.js).
import { T, KINDS, HOUSE_COLORS } from './data.js';
import { renderBuilding, drawTree, R } from './sprites.js';

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HALF_CAR = 30;      // car lane center, distance from the curb
const HALF_CYC = 8;       // bike lane center, distance from the curb

export function buildWorld(layout, seed = 1234) {
  const rng = mulberry32(seed);
  const { cols, rows, streetW, walk, lotW, lotH } = layout;
  const SP = streetW * T;
  const pitchX = (streetW + 2 * walk + lotW) * T;
  const pitchY = (streetW + 2 * walk + lotH) * T;
  const W = cols * pitchX + SP, H = rows * pitchY + SP;
  const world = {
    layout, W, H, T, cols, rows, SP, pitchX, pitchY, walkPx: walk * T,
    buildings: [], stands: [], colliders: [], trees: [], items: [], blocks: [], nodes: new Map(), segments: [],
    rng,
  };
  const dflt = layout.defaults || {};

  const lotOrigin = (c, r) => ({
    x: (streetW + walk) * T + c * pitchX,
    y: (streetW + walk) * T + r * pitchY,
  });
  world.lotOrigin = lotOrigin;
  world.vStreetX = (i) => i * pitchX;
  world.hStreetY = (j) => j * pitchY;

  // lanes -----------------------------------------------------------
  // axis 'h': traffic runs along x on street j. dir +1 = east. axis 'v': along y on street i, dir +1 = south.
  world.laneCoord = (axis, idx, dir, kind) => {
    const off = kind === 'cycle' ? HALF_CYC : HALF_CAR;
    if (axis === 'h') { const y0 = idx * pitchY; return dir > 0 ? y0 + SP - off : y0 + off; }
    const x0 = idx * pitchX; return dir > 0 ? x0 + off : x0 + SP - off;
  };
  // Stop line (front-of-vehicle coordinate) before the crosswalk of intersection index k along an axis.
  world.crossStart = (axis, k, dir) => {
    const p = axis === 'h' ? pitchX : pitchY;
    return dir > 0 ? k * p - T * walk - 3 : k * p + SP + T * walk + 3;
  };

  // blocks ----------------------------------------------------------
  for (let c = 0; c < cols; c++) { world.blocks[c] = []; }
  const cfgFor = (c, r) => {
    const found = layout.blocks.find(b => b.at[0] === c && b.at[1] === r) || {};
    return { traffic: dflt.traffic, peds: dflt.peds ?? 3, cyclists: dflt.cyclists ?? 1, paved: dflt.paved || [5, 8], buildings: [], props: [], items: [], ...found };
  };
  let bid = 0;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const cfg = cfgFor(c, r);
    const o = lotOrigin(c, r);
    const blk = { c, r, cfg, x: o.x, y: o.y, w: lotW * T, h: lotH * T };
    world.blocks[c][r] = blk;
    const placed = [];
    for (const def of cfg.buildings) {
      const k = KINDS[def.k];
      if (!k) { console.warn('Unknown building kind', def.k); continue; }
      const w = (def.w ?? k.w) * T, d = (def.d ?? k.d) * T;
      if (def.x * T + w > lotW * T + 1) console.warn(`Building ${def.k} overflows block ${c},${r}`);
      const bx = o.x + def.x * T, by = o.y + def.y * T;
      let color = k.color;
      if (k.cat === 'house') {
        const pal = HOUSE_COLORS[def.k];
        color = typeof def.c === 'string' ? def.c : pal[(def.c ?? Math.floor(rng() * pal.length)) % pal.length];
      }
      const b = {
        id: 'b' + bid++, kind: def.k, cat: k.cat, name: def.name || k.name || k.label, blurb: k.blurb, enter: k.enter,
        x: bx, y: by, w, d, H: k.H, color, accent: k.accent, block: [c, r],
        jobs: def.jobs || [], marker: null, cooldown: 0,
      };
      b.door = { x: bx + w / 2, y: by + d };
      b.stand = { x: bx + w / 2, y: by + d + 7 };
      b.sprite = renderBuilding(b);
      world.buildings.push(b);
      world.colliders.push({ x: bx, y: by, w, h: d });
      placed.push(b);
    }
    for (const p of cfg.props) {
      if (p.k !== 'coffee') continue;
      const s = { id: 's' + bid++, cat: 'kiosk', kind: 'coffee', name: 'Coffee Stand', x: o.x + p.x * T, y: o.y + p.y * T, w: 32, d: 16, H: 18 };
      s.stand = { x: s.x + s.w / 2, y: s.y + s.d + 7 };
      s.sprite = renderBuilding(s);
      world.stands.push(s);
      world.colliders.push({ x: s.x, y: s.y, w: s.w, h: s.d });
      placed.push(s);
    }
    cfg.items.forEach((it, n) => world.items.push({ id: `h${c}${r}${n}`, hat: it.hat, x: o.x + it.x * T, y: o.y + it.y * T, taken: false }));
    // greenery in free lot cells
    const [py0, py1] = cfg.paved;
    const free = (x, y) => {
      if (y > (py0 - 1) * T && y < (py1 + 0.5) * T) return false;
      return !placed.some(b => x > b.x - 10 && x < b.x + b.w + 10 && y > b.y - 6 && y < b.y + b.d + 22);
    };
    for (let n = 0, tries = 0; n < (cfg.trees ?? 7) && tries < 60; tries++) {
      const x = o.x + 8 + rng() * (lotW * T - 16), y = o.y + 12 + rng() * (lotH * T - 16);
      if (!free(x, y)) continue;
      world.trees.push({ x, y, seed: Math.floor(rng() * 6) }); world.colliders.push({ x: x - 3, y: y - 3, w: 6, h: 3 }); n++;
    }
  }

  // pedestrian graph ------------------------------------------------
  const nid = (c, r, k) => `${c},${r},${k}`;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const b = world.blocks[c][r];
    const xl = b.x - T, xr = b.x + b.w + T, yt = b.y - T, yb = b.y + b.h + T;
    const pts = { TL: [xl, yt], TR: [xr, yt], BL: [xl, yb], BR: [xr, yb] };
    for (const k in pts) world.nodes.set(nid(c, r, k), { id: nid(c, r, k), x: pts[k][0], y: pts[k][1], edges: [], block: [c, r] });
  }
  const link = (a, b, cross) => {
    const A = world.nodes.get(a), B = world.nodes.get(b);
    if (!A || !B) return;
    const len = Math.hypot(A.x - B.x, A.y - B.y);
    A.edges.push({ from: A, to: B, len, cross }); B.edges.push({ from: B, to: A, len, cross });
  };
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    link(nid(c, r, 'TL'), nid(c, r, 'TR')); link(nid(c, r, 'TR'), nid(c, r, 'BR'));
    link(nid(c, r, 'BR'), nid(c, r, 'BL')); link(nid(c, r, 'BL'), nid(c, r, 'TL'));
    link(nid(c, r, 'TR'), nid(c + 1, r, 'TL'), { i: c + 1, j: r, along: 'x' });
    link(nid(c, r, 'BR'), nid(c + 1, r, 'BL'), { i: c + 1, j: r + 1, along: 'x' });
    link(nid(c, r, 'BL'), nid(c, r + 1, 'TL'), { i: c, j: r + 1, along: 'y' });
    link(nid(c, r, 'BR'), nid(c, r + 1, 'TR'), { i: c + 1, j: r + 1, along: 'y' });
  }

  // traffic segments ------------------------------------------------
  for (let j = 0; j <= rows; j++) for (let c = 0; c < cols; c++)
    world.segments.push({ id: `h${j}-${c}`, axis: 'h', idx: j, a: c * pitchX + SP, b: (c + 1) * pitchX, cfg: world.blocks[c][Math.min(j, rows - 1)].cfg });
  for (let i = 0; i <= cols; i++) for (let r = 0; r < rows; r++)
    world.segments.push({ id: `v${i}-${r}`, axis: 'v', idx: i, a: r * pitchY + SP, b: (r + 1) * pitchY, cfg: world.blocks[Math.min(i, cols - 1)][r].cfg });

  // collision helpers -----------------------------------------------
  world.blocked = (x, y, rad = 3) => {
    if (x < rad || y < rad || x > W - rad || y > H - rad) return true;
    for (const r of world.colliders) if (x + rad > r.x && x - rad < r.x + r.w && y + rad > r.y && y - rad < r.y + r.h) return true;
    return false;
  };
  world.groundCanvas = renderGround(world);
  return world;
}

function renderGround(world) {
  const { W, H, SP, pitchX, pitchY, cols, rows, layout } = world;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const rnd = mulberry32(99);
  R(g, 0, 0, W, H, '#3b3550');
  for (let n = 0; n < W * H / 220; n++) R(g, rnd() * W, rnd() * H, 1, 1, rnd() < .5 ? '#443d5c' : '#332e48');
  const T_ = T, walk = world.walkPx;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const b = world.blocks[c][r];
    // sidewalk ring
    R(g, b.x - walk, b.y - walk, b.w + 2 * walk, b.h + 2 * walk, '#cfc8dc');
    for (let x = b.x - walk; x < b.x + b.w + walk; x += T_) R(g, x, b.y - walk, 1, b.h + 2 * walk, '#bdb5ce');
    for (let y = b.y - walk; y < b.y + b.h + walk; y += T_) R(g, b.x - walk, y, b.w + 2 * walk, 1, '#bdb5ce');
    R(g, b.x - walk, b.y - walk, b.w + 2 * walk, 1, '#9a93ab'); R(g, b.x - walk, b.y + b.h + walk - 1, b.w + 2 * walk, 1, '#9a93ab');
    R(g, b.x - walk, b.y - walk, 1, b.h + 2 * walk, '#9a93ab'); R(g, b.x + b.w + walk - 1, b.y - walk, 1, b.h + 2 * walk, '#9a93ab');
    // lot grass
    R(g, b.x, b.y, b.w, b.h, '#5fae5a');
    for (let n = 0; n < 260; n++) R(g, b.x + rnd() * b.w, b.y + rnd() * b.h, 1, 1, rnd() < .5 ? '#74c36a' : '#4c9a4a');
    // paved band (parking / back lane)
    const [p0, p1] = b.cfg.paved;
    R(g, b.x, b.y + p0 * T_, b.w, (p1 - p0) * T_, '#7d7892');
    for (let x = b.x + 8; x < b.x + b.w - 4; x += 16) R(g, x, b.y + (p0 + 0.3) * T_, 1, 8, '#d8d3e6');
    for (let x = b.x + 8; x < b.x + b.w - 4; x += 16) R(g, x, b.y + (p1 - 0.8) * T_, 1, 8, '#d8d3e6');
    R(g, b.x, b.y + p0 * T_, b.w, 1, '#6a6580'); R(g, b.x, b.y + p1 * T_ - 1, b.w, 1, '#6a6580');
    // front paths from doors to the paved lane / sidewalk
    for (const bl of world.buildings) {
      if (bl.block[0] !== c || bl.block[1] !== r) continue;
      const base = bl.y + bl.d, lotBottom = b.y + b.h;
      if (base < lotBottom - 2 && base > b.y + p1 * T_ - 1) R(g, bl.door.x - 8, base, 16, lotBottom - base, '#d8d0e4');
    }
  }
  // street markings
  const dash = (x, y, w, h, col, horizontal) => {
    for (let k = 0; k < (horizontal ? w : h); k += 12) horizontal ? R(g, x + k, y, Math.min(6, w - k), h, col) : R(g, x, y + k, w, Math.min(6, h - k), col);
  };
  const lane = '#4a4268';
  for (let i = 0; i <= cols; i++) {
    const X0 = world.vStreetX(i);
    for (let r = 0; r < rows; r++) {
      const ya = r * pitchY + SP + walk, yb = (r + 1) * pitchY - walk;
      R(g, X0, ya - walk, 16, yb - ya + 2 * walk, lane); R(g, X0 + SP - 16, ya - walk, 16, yb - ya + 2 * walk, lane);
      dash(X0 + 16, ya, 1, yb - ya, '#e8e4f4', false); dash(X0 + SP - 17, ya, 1, yb - ya, '#e8e4f4', false);
      R(g, X0 + SP / 2 - 2, ya, 1, yb - ya, '#ffc21a'); R(g, X0 + SP / 2 + 1, ya, 1, yb - ya, '#ffc21a');
    }
  }
  for (let j = 0; j <= rows; j++) {
    const Y0 = world.hStreetY(j);
    for (let c = 0; c < cols; c++) {
      const xa = c * pitchX + SP + walk, xb = (c + 1) * pitchX - walk;
      R(g, xa - walk, Y0, xb - xa + 2 * walk, 16, lane); R(g, xa - walk, Y0 + SP - 16, xb - xa + 2 * walk, 16, lane);
      dash(xa, Y0 + 16, xb - xa, 1, '#e8e4f4', true); dash(xa, Y0 + SP - 17, xb - xa, 1, '#e8e4f4', true);
      R(g, xa, Y0 + SP / 2 - 2, xb - xa, 1, '#ffc21a'); R(g, xa, Y0 + SP / 2 + 1, xb - xa, 1, '#ffc21a');
    }
  }
  // crosswalks
  const has = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows;
  const zebraV = (x, y) => { for (let k = 4; k < SP - 2; k += 8) R(g, x + k, y + 2, 4, walk - 4, '#f4f1e8'); };       // across a vertical street
  const zebraH = (x, y) => { for (let k = 4; k < SP - 2; k += 8) R(g, x + 2, y + k, walk - 4, 4, '#f4f1e8'); };       // across a horizontal street
  for (let i = 0; i <= cols; i++) for (let j = 0; j <= rows; j++) {
    const X0 = world.vStreetX(i), Y0 = world.hStreetY(j);
    if (has(i - 1, j - 1) && has(i, j - 1)) zebraV(X0, Y0 - walk);
    if (has(i - 1, j) && has(i, j)) zebraV(X0, Y0 + SP);
    if (has(i - 1, j - 1) && has(i - 1, j)) zebraH(X0 - walk, Y0);
    if (has(i, j - 1) && has(i, j)) zebraH(X0 + SP, Y0);
  }
  return cv;
}

