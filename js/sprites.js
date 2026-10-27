// Procedural pixel-art drawing: people, hats, dogs, birds, vehicles, buildings, props, icons.
import { PAL } from './data.js';

export const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const blob = (g, x, y, w, h, c) => { R(g, x + 1, y, w - 2, h, c); R(g, x, y + 1, w, h - 2, c); };
const shade = (col, f) => {
  let r, gr, b;
  const m = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(col);
  if (m) { r = +m[1]; gr = +m[2]; b = +m[3]; }
  else { const n = parseInt(col.slice(1), 16); r = n >> 16; gr = (n >> 8) & 255; b = n & 255; }
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(r)},${c(gr)},${c(b)})`;
};
const shadow = (g, x, y, w, h = 2) => R(g, x - w / 2, y - 1, w, h, 'rgba(30,10,50,.3)');

// ---------------------------------------------------------------- hats
export function drawHat(g, id, cx, top, dir = 'd') {
  switch (id) {
    case 'cap':
      R(g, cx - 3, top - 1, 6, 3, '#7a35b8'); R(g, cx, top - 2, 1, 1, PAL.orange);
      if (dir === 'd') R(g, cx - 3, top + 2, 6, 1, '#4d1f7a');
      else if (dir === 'l') R(g, cx - 6, top + 1, 3, 1, '#4d1f7a');
      else if (dir === 'r') R(g, cx + 3, top + 1, 3, 1, '#4d1f7a');
      break;
    case 'beanie':
      R(g, cx - 3, top - 2, 6, 4, PAL.orange); R(g, cx - 3, top + 1, 6, 1, PAL.orangeDark); R(g, cx - 1, top - 4, 2, 2, '#ffe0b0'); break;
    case 'sunhat':
      R(g, cx - 6, top, 12, 2, '#e9cf8b'); R(g, cx - 3, top - 3, 6, 3, '#e9cf8b'); R(g, cx - 3, top - 1, 6, 1, '#7a35b8'); break;
    case 'tophat':
      R(g, cx - 4, top, 8, 1, '#1b1030'); R(g, cx - 3, top - 6, 6, 6, '#1b1030'); R(g, cx - 3, top - 2, 6, 1, PAL.orange); break;
    case 'cowboy':
      R(g, cx - 6, top, 12, 2, '#9a6a3a'); R(g, cx - 3, top - 3, 6, 3, '#b57b45'); R(g, cx - 7, top - 1, 2, 1, '#9a6a3a'); R(g, cx + 5, top - 1, 2, 1, '#9a6a3a'); R(g, cx - 3, top - 1, 6, 1, '#6b2fa0'); break;
    case 'party':
      R(g, cx - 1, top - 8, 2, 1, '#ffd400'); R(g, cx - 1, top - 7, 2, 2, '#ff4fa0'); R(g, cx - 2, top - 5, 4, 2, '#2ec4ff'); R(g, cx - 3, top - 3, 6, 3, '#ff4fa0'); R(g, cx - 2, top - 2, 1, 1, '#ffd400'); R(g, cx + 1, top - 4, 1, 1, '#ffd400'); break;
    case 'beret':
      R(g, cx - 4, top - 1, 8, 3, '#b0183c'); R(g, cx - 3, top - 2, 6, 1, '#b0183c'); R(g, cx, top - 3, 1, 1, '#7a0f28'); break;
    case 'pirate':
      R(g, cx - 5, top - 1, 10, 3, '#16121c'); R(g, cx - 3, top - 3, 6, 2, '#16121c'); R(g, cx, top - 1, 1, 1, '#fff'); R(g, cx - 5, top + 1, 1, 1, '#d9a441'); break;
    case 'crown':
      R(g, cx - 3, top - 1, 6, 2, '#ffc400'); R(g, cx - 3, top - 3, 1, 2, '#ffc400'); R(g, cx - 1, top - 3, 2, 2, '#ffc400'); R(g, cx + 2, top - 3, 1, 2, '#ffc400'); R(g, cx, top - 1, 1, 1, '#ff3a6a'); break;
  }
}

// ---------------------------------------------------------------- people
// o: dir 'd'|'u'|'l'|'r', step (0|1), skin, hair, hairStyle, shirt, pants, hat, sit, female, scarf
export function drawPerson(g, x, y, o) {
  x = Math.round(x); y = Math.round(y);
  const { dir = 'd', step = 0, skin = '#f1c9a5', hair = '#2b1d12', shirt = '#4f8fe0', pants = '#3a3a4a' } = o;
  shadow(g, x, y, 9);
  if (!o.sit) {
    const a = step ? 1 : 0;
    if (dir === 'l' || dir === 'r') { R(g, x - 2, y - 5 + a, 2, 5 - a, pants); R(g, x, y - 5 + (1 - a), 2, 5 - (1 - a), shade(pants, .8)); }
    else { R(g, x - 3, y - 5 + a, 3, 5 - a, pants); R(g, x, y - 5 + (1 - a), 3, 5 - (1 - a), pants); }
  } else { R(g, x - 3, y - 4, 6, 3, pants); }
  const ty = o.sit ? y - 9 : y - 10;
  R(g, x - 3, ty, 6, 5, shirt);
  if (o.scarf) R(g, x - 3, ty, 6, 1, o.scarf);
  if (dir === 'l' || dir === 'r') R(g, x - 1, ty + 1, 2, 4, shade(shirt, .8));
  else { R(g, x - 4, ty + 1, 1, 4, shade(shirt, .85)); R(g, x + 3, ty + 1, 1, 4, shade(shirt, .85)); }
  const hy = ty - 5;
  R(g, x - 3, hy, 6, 5, skin);
  const hs = o.hairStyle || 'short';
  if (hs !== 'bald') {
    R(g, x - 3, hy - 1, 6, 2, hair);
    if (dir === 'u') R(g, x - 3, hy - 1, 6, 5, hair);
    if (hs === 'long') {
      R(g, x - 4, hy, 1, 7, hair); R(g, x + 3, hy, 1, 7, hair);
      if (dir === 'u') R(g, x - 3, hy + 4, 6, 4, hair);
      if (dir === 'l') R(g, x + 1, hy, 3, 6, hair);
      if (dir === 'r') R(g, x - 4, hy, 3, 6, hair);
    } else if (hs === 'bun') { R(g, x - 1, hy - 3, 3, 2, hair); }
    else if (dir === 'l') R(g, x + 1, hy, 2, 3, hair);
    else if (dir === 'r') R(g, x - 3, hy, 2, 3, hair);
  }
  if (dir === 'd') { R(g, x - 2, hy + 2, 1, 1, '#1a1020'); R(g, x + 1, hy + 2, 1, 1, '#1a1020'); if (o.female) R(g, x - 1, hy + 4, 2, 1, '#d8506a'); }
  else if (dir === 'l') R(g, x - 2, hy + 2, 1, 1, '#1a1020');
  else if (dir === 'r') R(g, x + 1, hy + 2, 1, 1, '#1a1020');
  if (o.hat && o.hat !== 'none') drawHat(g, o.hat, x, hy, dir);
}

// ---------------------------------------------------------------- dogs
export function drawDog(g, x, y, br, o = {}) {
  const { dir = 1, frame = 0, sit = false, happy = false, scale = 1 } = o;
  g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(dir * scale, scale);
  const L = br.len, h = br.h;
  const lh = Math.max(2, Math.round(h * .45)), bh = h - lh;
  const b = br.body, s = br.shade, l = br.light;
  R(g, -L / 2 - 1, -1, L + 3, 2, 'rgba(30,10,50,.3)');
  const poodle = br.coat === 'puff';
  const legCol = poodle ? l : b;
  const f = sit ? 0 : (frame ? 1 : -1);
  // far legs
  if (!sit) { R(g, -L / 2 + 1 - f, -lh, 2, lh, shade(legCol, .8)); R(g, L / 2 - 4 + f, -lh, 2, lh, shade(legCol, .8)); }
  // tail
  const ty = -h + 1;
  switch (br.tail) {
    case 'plume': R(g, -L / 2 - 4, ty - 2, 4, 3, b); R(g, -L / 2 - 5, ty - 1, 2, 3, l); R(g, -L / 2 - 3, ty - 3, 2, 1, l); break;
    case 'otter': R(g, -L / 2 - 4, ty, 4, 3, s); break;
    case 'curl': R(g, -L / 2 - 3, ty - 3, 3, 4, b); R(g, -L / 2 - 2, ty - 4, 2, 1, s); break;
    case 'pompom': R(g, -L / 2 - 2, ty - 1, 2, 1, b); blob(g, -L / 2 - 5, ty - 4, 4, 4, l); break;
    case 'perk': R(g, -L / 2 - 2, ty - 3, 2, 4, br.patch || b); break;
    default: R(g, -L / 2 - 5, ty - (br.size > .5 ? 2 : 3), 5, 1, s); R(g, -L / 2 - 6, ty - (br.size > .5 ? 3 : 4), 1, 1, s);
  }
  // body
  blob(g, -L / 2, -h, L, bh, b);
  R(g, -L / 2 + 2, -lh - 1, L - 4, 1, l);
  if (br.size > .6 && br.name !== 'Greyhound') R(g, L / 2 - 5, -h - 1, 6, bh + 1, b);
  if (br.name === 'Greyhound') { R(g, L / 2 - 6, -h - 1, 6, bh + 1, b); R(g, -L / 2 + 5, -h + 1, 3, 1, s); R(g, -L / 2 + 9, -h + 2, 3, 1, s); }
  if (br.coat === 'curly' || poodle) { for (let i = 0; i < L - 3; i += 3) { R(g, -L / 2 + 2 + i, -h + 1 + ((i / 3) & 1) * 2, 2, 1, s); } }
  if (br.coat === 'fluffy') { R(g, -L / 2 + 1, -lh - 1, L - 2, 1, l); R(g, -L / 2 - 1, -h + 1, 2, 3, b); }
  if (br.patch) { R(g, -L / 2 + 2, -h, 4, 3, br.patch); R(g, L / 2 - 4, -h + 2, 3, 2, br.patch); }
  // near legs
  if (sit) { blob(g, -L / 2, -lh - 2, 5, lh + 2, s); R(g, L / 2 - 3, -lh, 2, lh, legCol); }
  else { R(g, -L / 2 + 2 + f, -lh, 2, lh, legCol); R(g, L / 2 - 2 - f, -lh, 2, lh, legCol); if (poodle) { R(g, -L / 2 + 2 + f, -2, 2, 2, b); R(g, L / 2 - 2 - f, -2, 2, 2, b); } }
  // head
  const hx = L / 2 - 2, hy = -h - (sit ? 5 : 4);
  const sn = br.name === 'Greyhound' ? 4 : br.size > .5 ? 3 : 2;
  if (poodle) { blob(g, hx - 1, hy - 2, 8, 8, b); blob(g, hx + 1, hy - 4, 5, 3, l); }
  else blob(g, hx, hy, 6, 5, b);
  if (br.coat === 'curly') { R(g, hx, hy - 1, 6, 2, s); R(g, hx + 1, hy - 2, 2, 1, b); R(g, hx + 4, hy - 2, 2, 1, b); }
  R(g, hx + 5, hy + 1, sn + 1, 3, l);       // muzzle
  R(g, hx + 5 + sn, hy + 1, 2, 2, '#1a1020'); // nose
  R(g, hx + 3, hy + 1, 1, 1, '#1a1020'); R(g, hx + 3, hy + 1, 1, 1, '#1a1020'); // eye
  R(g, hx + 4, hy, 1, 1, '#fff');
  if (happy) { R(g, hx + 5, hy + 4, 2, 2, PAL.shinyPink); }
  // ears
  switch (br.ear) {
    case 'drop': R(g, hx - 1, hy, 3, br.name === 'Dachshund' ? 5 : 4, s); break;
    case 'curly': blob(g, hx - 2, hy, 4, 6, s); R(g, hx - 1, hy + 1, 2, 1, b); break;
    case 'perk': R(g, hx, hy - 4, 2, 4, b); R(g, hx + 3, hy - 4, 2, 4, b); R(g, hx + 1, hy - 3, 1, 2, PAL.shinyPink); break;
    case 'fold': R(g, hx, hy - 1, 3, 3, br.patch || s); break;
    case 'rose': R(g, hx, hy - 2, 3, 2, s); R(g, hx - 1, hy - 1, 1, 2, s); break;
  }
  // collar
  R(g, hx - 1, hy + 4, 3, 1, PAL.purple);
  g.restore();
}

// ---------------------------------------------------------------- birds
export function drawBird(g, x, y, sp, o = {}) {
  const { dir = 1, flap = 0, z = 0, perch = false } = o;
  const bs = sp.size;
  g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(dir, 1);
  R(g, -3, -1, 6, 1, 'rgba(30,10,50,.3)');
  g.translate(0, -Math.round(z));
  const w = Math.round(8 * bs), hh = Math.round(6 * bs);
  const tl = { short: 3, long: 7, xlong: 11 }[sp.tail] * Math.max(.8, bs * .8);
  // tail
  R(g, -w / 2 - tl + 1, -hh / 2 - 1, tl, Math.max(2, 2 * bs), sp.wingTip && !perch ? sp.wing : sp.wing);
  if (sp.tail === 'xlong') R(g, -w / 2 - tl + 1, -hh / 2 + 1, tl - 3, 1, '#ffc21a');
  // legs
  R(g, -1, -1, 1, 1, '#c8a070'); R(g, 1, -1, 1, 1, '#c8a070');
  blob(g, -w / 2, -hh - 1, w, hh, sp.body);
  blob(g, -w / 2 + 2, -hh + 1, w - 3, Math.max(2, hh - 2), sp.belly);
  // wing
  const wy = flap ? -hh - 3 : -hh - 1;
  blob(g, -w / 2 - 1, wy, w - 1, Math.max(3, hh - 2), sp.wing);
  if (sp.wingTip) R(g, -w / 2 - 1, wy + 1, 2, 2, sp.wingTip);
  if (flap) R(g, -w / 2 - 3, wy - 2, 5, 2, shade(sp.wing, 1.2));
  // head
  const hs = Math.max(4, Math.round(5 * Math.min(bs, 1.4)));
  const hx = w / 2 - 2, hy = -hh - hs + 1;
  blob(g, hx, hy, hs, hs, sp.head);
  if (sp.face) R(g, hx + 1, hy + 2, hs - 2, 2, sp.face);
  if (sp.cheek && !sp.face) R(g, hx + 1, hy + hs - 2, 2, 2, sp.cheek);
  if (sp.crest) { R(g, hx - 1, hy - 3, 1, 3, sp.crest); R(g, hx, hy - 4, 1, 4, sp.crest); R(g, hx + 1, hy - 2, 1, 2, sp.crest); }
  R(g, hx + hs - 2, hy + 1, 1, 1, '#111'); R(g, hx + hs - 2, hy + 1, 1, 1, '#111');
  // beak
  const bk = Math.max(2, Math.round(2 * bs));
  R(g, hx + hs, hy + 1, bk, 2 + (bs > 1.2 ? 1 : 0), sp.beak); R(g, hx + hs + bk - 1, hy + 3, 1, 1, sp.beak);
  if (sp.name === 'Budgie Parakeet') { R(g, -w / 2 + 1, wy + 1, 1, 1, '#111'); R(g, -w / 2 + 3, wy + 2, 1, 1, '#111'); }
  g.restore();
}

// ---------------------------------------------------------------- vehicles
export function drawVehicle(g, v) {
  const x = Math.round(v.x), y = Math.round(v.y), d = v.dir, h = v.axis === 'h';
  const c = v.color;
  if (v.type === 'car') {
    if (h) {
      R(g, x - 11, y + 3, 22, 3, 'rgba(30,10,50,.3)');
      R(g, x - 8, y + 3, 4, 3, '#111'); R(g, x + 4, y + 3, 4, 3, '#111');
      R(g, x - 11, y - 4, 22, 8, c); R(g, x - 11, y + 2, 22, 2, shade(c, .7));
      R(g, x - 6, y - 9, 12, 5, shade(c, 1.12)); R(g, x - 5, y - 8, 10, 3, '#a8d8ff'); R(g, x, y - 8, 1, 3, shade(c, 1.12));
      R(g, d > 0 ? x + 10 : x - 11, y - 2, 1, 2, '#fff6b0'); R(g, d > 0 ? x - 11 : x + 10, y - 2, 1, 2, '#e02828');
    } else {
      R(g, x - 5, y - 9, 12, 21, 'rgba(30,10,50,.3)');
      R(g, x - 6, y - 8, 1, 4, '#111'); R(g, x + 6, y - 8, 1, 4, '#111'); R(g, x - 6, y + 4, 1, 4, '#111'); R(g, x + 6, y + 4, 1, 4, '#111');
      R(g, x - 5, y - 11, 11, 22, c); R(g, x - 4, y - 7, 9, 10, shade(c, 1.12));
      R(g, x - 3, d > 0 ? y + 3 : y - 8, 7, 3, '#a8d8ff'); R(g, x - 3, d > 0 ? y - 7 : y + 2, 7, 2, '#7fb4e0');
      R(g, x - 4, d > 0 ? y + 9 : y - 11, 2, 2, '#fff6b0'); R(g, x + 3, d > 0 ? y + 9 : y - 11, 2, 2, '#fff6b0');
      R(g, x - 4, d > 0 ? y - 11 : y + 9, 2, 1, '#e02828'); R(g, x + 3, d > 0 ? y - 11 : y + 9, 2, 1, '#e02828');
    }
  } else if (v.type === 'bus') {
    if (h) {
      R(g, x - 22, y + 4, 44, 3, 'rgba(30,10,50,.3)');
      R(g, x - 17, y + 3, 5, 3, '#111'); R(g, x + 11, y + 3, 5, 3, '#111');
      R(g, x - 22, y - 7, 44, 11, c); R(g, x - 22, y + 2, 44, 2, PAL.orange);
      R(g, x - 20, y - 5, 40, 4, '#bfe6ff');
      for (let i = -14; i < 20; i += 8) R(g, x + i, y - 5, 1, 4, c);
      R(g, d > 0 ? x + 18 : x - 22, y - 5, 4, 4, '#8fc0e0'); R(g, d > 0 ? x + 21 : x - 22, y, 1, 2, '#fff6b0');
      R(g, x - 22, y - 8, 44, 1, shade(c, 1.3));
    } else {
      R(g, x - 6, y - 21, 14, 44, 'rgba(30,10,50,.3)');
      R(g, x - 7, y - 16, 1, 5, '#111'); R(g, x + 7, y - 16, 1, 5, '#111'); R(g, x - 7, y + 10, 1, 5, '#111'); R(g, x + 7, y + 10, 1, 5, '#111');
      R(g, x - 6, y - 22, 13, 44, c); R(g, x - 5, y - 20, 11, 36, shade(c, 1.18));
      for (let i = -16; i < 14; i += 8) R(g, x - 3, y + i, 7, 5, shade(c, 1.4));
      R(g, x - 5, d > 0 ? y + 16 : y - 22, 11, 5, '#8fc0e0');
      R(g, x - 5, d > 0 ? y + 20 : y - 22, 2, 2, '#fff6b0'); R(g, x + 3, d > 0 ? y + 20 : y - 22, 2, 2, '#fff6b0');
    }
  } else { // bike / scooter
    const sc = v.type === 'scooter';
    g.strokeStyle = '#1b1030'; g.lineWidth = 1;
    if (h) {
      const wr = sc ? 3 : 4;
      g.strokeRect(x - 6.5, y + 1.5, wr, wr); g.strokeRect(x + 3.5, y + 1.5, wr, wr);
      R(g, x - 5, y + 2, 11, 1, sc ? '#c4c4d0' : v.color);
      if (sc) R(g, d > 0 ? x + 5 : x - 5, y - 5, 1, 8, '#c4c4d0');
      drawPerson(g, x, y + (sc ? 1 : 2), { ...v.rider, dir: d > 0 ? 'r' : 'l', sit: !sc, step: 0 });
    } else {
      g.strokeRect(x - 0.5, y - 8.5, 2, 4); g.strokeRect(x - 0.5, y + 3.5, 2, 4);
      R(g, x, y - 4, 1, 9, sc ? '#c4c4d0' : v.color);
      drawPerson(g, x, y + 3, { ...v.rider, dir: d > 0 ? 'd' : 'u', sit: !sc, step: 0 });
    }
  }
}

// ---------------------------------------------------------------- buildings
function windowRect(g, x, y, w, h, frame = '#f4f0e8') {
  R(g, x - 1, y - 1, w + 2, h + 2, frame); R(g, x, y, w, h, '#8fc8f0'); R(g, x, y, w, 2, '#c8e6fa');
  if (w > 5) R(g, x + Math.floor(w / 2), y, 1, h, frame);
}
function doorRect(g, x, y, w, h, c) { R(g, x, y, w, h, c); R(g, x + 1, y + 1, w - 2, 3, shade(c, 1.3)); R(g, x + w - 3, y + h / 2, 1, 1, '#ffd24a'); }

function drawHouse(g, b) {
  const { w, d, H } = b, c = b.color;
  const wall = (col, lines) => {
    R(g, 0, d, w, H, col);
    if (lines === 'brick') {
      for (let yy = 0, r = 0; yy < H; yy += 3, r++) { R(g, 0, d + yy, w, 1, shade(col, .82)); for (let xx = (r & 1) * 3; xx < w; xx += 6) R(g, xx, d + yy + 1, 1, 2, shade(col, .82)); }
    } else if (lines === 'siding') for (let yy = 2; yy < H; yy += 3) R(g, 0, d + yy, w, 1, shade(col, .85));
    R(g, w - 2, d, 2, H, shade(col, .8));
  };
  switch (b.kind) {
    case 'brick_narrow': {
      wall(c, 'brick');
      R(g, 0, 0, w, d, '#4a4458'); R(g, 2, 2, w - 4, d - 4, '#5a5470'); R(g, w / 2 - 4, d / 2 - 3, 8, 5, '#8fc8f0'); R(g, 0, d - 1, w, 2, '#efe6d6');
      R(g, -1, d - 1, w + 2, 2, '#efe6d6');
      windowRect(g, 8, d + 5, 8, 9); windowRect(g, w - 16, d + 5, 8, 9);
      windowRect(g, 8, d + H - 17, 8, 9); doorRect(g, w - 18, d + H - 15, 10, 15, PAL.purpleDark); R(g, w - 20, d + H - 2, 14, 2, '#d9d2c6');
      break;
    }
    case 'siding_big': {
      wall(c, 'siding');
      R(g, 0, 0, w, d, '#5b4a6a'); for (let yy = 2; yy < d; yy += 3) R(g, 0, yy, w, 1, '#4a3b58');
      R(g, 0, d / 2 - 1, w, 2, '#3e3250'); R(g, w / 2 - 9, d - 14, 18, 12, '#6e5c80'); R(g, w / 2 - 6, d - 12, 12, 7, '#8fc8f0');
      R(g, -1, d - 1, w + 2, 2, '#f4f0e8');
      for (let i = 0; i < 3; i++) { windowRect(g, 8 + i * (w - 24) / 2 + 0, d + 5, 8, 9); windowRect(g, 8 + i * (w - 24) / 2, d + 17, 8, 9); }
      windowRect(g, 8, d + H - 14, 8, 9); windowRect(g, w - 16, d + H - 14, 8, 9);
      doorRect(g, w / 2 - 5, d + H - 15, 10, 15, '#b3322b'); R(g, w / 2 - 12, d + H - 3, 24, 3, '#e0dccb'); R(g, w / 2 - 12, d + H - 7, 24, 1, '#f4f0e8');
      break;
    }
    case 'ranch': {
      wall(c, 'siding');
      R(g, 0, 0, w, d, '#7a6a58'); R(g, 5, 4, w - 10, d - 8, '#8c7b66'); R(g, 6, d / 2 - 1, w - 12, 2, '#5e4f40');
      R(g, -2, d - 2, w + 4, 3, '#6a5a4a');
      windowRect(g, 8, d + 4, 9, 7); windowRect(g, 26, d + 4, 9, 7);
      R(g, w - 30, d + 2, 24, 14, '#ebe7de'); for (let i = 0; i < 14; i += 3) R(g, w - 30, d + 2 + i, 24, 1, '#c8c2b4');
      doorRect(g, w / 2 - 4 - 6, d + H - 12, 8, 12, '#7a3b12');
      break;
    }
    case 'craftsman': {
      wall(c, 'siding');
      R(g, 0, 0, w, d, '#4b3a5e'); R(g, 0, d / 2, w, d / 2, '#5a476e'); R(g, 0, d / 2 - 1, w, 1, '#2f2440');
      for (let i = 0; i < 8; i++) R(g, w / 2 - 12 + i * 3, d - 9 - (i < 4 ? i : 7 - i) * 0, 2, 7, '#6a5680');
      R(g, -2, d - 1, w + 4, 2, '#f4f0e8');
      R(g, 6, d + 3, w - 12, 3, '#f4f0e8'); // porch beam
      windowRect(g, 8, d + 9, 8, 8, '#f4f0e8'); windowRect(g, w - 16, d + 9, 8, 8, '#f4f0e8');
      R(g, 9, d + 6, 3, H - 6, '#6b4a2a'); R(g, w - 12, d + 6, 3, H - 6, '#6b4a2a'); R(g, 8, d + H - 3, 5, 3, '#8a6a4a'); R(g, w - 13, d + H - 3, 5, 3, '#8a6a4a');
      doorRect(g, w / 2 - 4, d + H - 14, 8, 14, '#7a3b12');
      break;
    }
    case 'mcmansion': {
      wall(c, '');
      R(g, 0, 0, w, d, '#8a6a52'); R(g, 4, 3, w - 8, d - 6, '#9a7a62'); R(g, 0, d / 2, w, 2, '#6e5240');
      R(g, w - 22, 2, 18, d - 6, '#7a5a46'); blob(g, w - 18, 6, 10, 10, '#a8866c');
      R(g, -1, d - 1, w + 2, 2, '#f1ece0');
      R(g, 5, d + H - 17, 18, 16, '#f1ece0'); R(g, 6, d + H - 16, 7, 14, '#d8d2c4'); R(g, 15, d + H - 16, 7, 14, '#d8d2c4'); R(g, 5, d + H - 18, 18, 2, '#c8c2b4');
      windowRect(g, 30, d + 5, 8, 10); windowRect(g, w - 20, d + 5, 8, 10);
      R(g, w / 2 + 2, d + 2, 10, H - 2, '#f1ece0'); doorRect(g, w / 2 + 4, d + H - 15, 6, 15, '#5a3a22');
      R(g, w / 2 + 1, d + 2, 2, H - 2, '#fff'); R(g, w / 2 + 11, d + 2, 2, H - 2, '#fff');
      windowRect(g, 30, d + H - 17, 8, 10); windowRect(g, w - 20, d + H - 17, 8, 10);
      break;
    }
  }
}

function iconFor(g, kind, cx, cy, accent) {
  switch (kind) {
    case 'sandwich': R(g, cx - 8, cy, 16, 3, '#d9a441'); R(g, cx - 8, cy + 3, 16, 2, '#5ea03a'); R(g, cx - 7, cy + 5, 14, 2, '#b3322b'); R(g, cx - 8, cy + 7, 16, 3, '#d9a441'); R(g, cx - 4, cy + 1, 1, 1, '#fff'); R(g, cx + 2, cy + 1, 1, 1, '#fff'); break;
    case 'hat_store': R(g, cx - 8, cy + 8, 16, 2, '#1b1030'); R(g, cx - 5, cy, 10, 8, '#1b1030'); R(g, cx - 5, cy + 5, 10, 2, PAL.orange); break;
    case 'pet_store': blob(g, cx - 4, cy + 4, 8, 6, '#fff'); [[-7, 1], [-3, -2], [2, -2], [6, 1]].forEach(([dx, dy]) => blob(g, cx + dx - 1, cy + 3 + dy, 3, 3, '#fff')); break;
    case 'coffee_indie': case 'coffee_corp': R(g, cx - 5, cy + 3, 10, 7, '#f4f1e8'); R(g, cx + 5, cy + 4, 3, 4, '#f4f1e8'); R(g, cx - 4, cy + 4, 8, 2, '#6b3a1a'); R(g, cx - 3, cy - 1, 1, 3, '#fff'); R(g, cx + 1, cy - 2, 1, 4, '#fff'); break;
    case 'bakery': R(g, cx - 5, cy + 6, 10, 4, '#f0c080'); blob(g, cx - 6, cy + 1, 12, 6, '#ff9ab8'); R(g, cx, cy - 2, 1, 3, '#d02a4a'); break;
    case 'bar': R(g, cx - 5, cy, 10, 3, '#ffd24a'); R(g, cx - 5, cy + 3, 10, 5, '#e8a020'); R(g, cx - 4, cy, 8, 1, '#fff'); R(g, cx + 5, cy + 2, 2, 4, '#e8a020'); break;
    case 'bookstore': R(g, cx - 8, cy + 2, 4, 8, '#b3322b'); R(g, cx - 4, cy, 4, 10, '#d9a441'); R(g, cx, cy + 3, 4, 7, '#2d6cc0'); R(g, cx + 4, cy + 1, 4, 9, '#6b2fa0'); break;
    case 'organic': blob(g, cx - 6, cy + 2, 12, 8, '#5aa13a'); R(g, cx - 1, cy, 2, 10, '#2f6b1a'); R(g, cx - 5, cy + 4, 4, 1, '#2f6b1a'); break;
    case 'fast_food': blob(g, cx - 8, cy, 16, 6, '#d9a441'); R(g, cx - 8, cy + 6, 16, 2, '#5ea03a'); R(g, cx - 8, cy + 8, 16, 3, '#6b3a1a'); break;
    case 'fancy': R(g, cx - 1, cy + 5, 2, 5, accent); blob(g, cx - 4, cy + 2, 8, 3, accent); break;
    case 'gallery': R(g, cx - 9, cy, 8, 10, '#6b2fa0'); R(g, cx + 1, cy + 2, 8, 8, '#ff8a1f'); R(g, cx - 7, cy + 2, 4, 4, '#ff8a1f'); R(g, cx + 3, cy + 4, 4, 4, '#6b2fa0'); break;
    case 'convenience': R(g, cx - 8, cy + 2, 16, 8, '#fff'); R(g, cx - 8, cy + 4, 16, 2, '#2d6cc0'); R(g, cx - 8, cy + 7, 16, 1, '#e02828'); break;
    case 'library': R(g, cx - 8, cy + 4, 16, 6, '#f4f0e8'); R(g, cx - 6, cy + 2, 12, 2, '#d8cdb8'); R(g, cx - 3, cy, 6, 2, '#c8bda8'); break;
  }
}

function drawBiz(g, b) {
  const { w, d, H, kind } = b, c = b.color, ac = b.accent;
  R(g, 0, d, w, H, c); R(g, w - 2, d, 2, H, shade(c, .8));
  R(g, 0, d, w, 2, shade(c, 1.25));
  // roof
  const roofCol = kind === 'fast_food' ? '#d8402a' : shade(c, kind === 'bakery' || kind === 'library' || kind === 'gallery' ? .85 : .75);
  R(g, 0, 0, w, d, roofCol); R(g, 2, 2, w - 4, d - 4, shade(roofCol, 1.12));
  if (kind === 'fast_food') for (let i = 0; i < w; i += 8) R(g, i, 0, 4, d, '#f4f1e8');
  R(g, 5, 4, 5, 4, shade(roofCol, .7)); R(g, w - 12, d - 9, 6, 4, shade(roofCol, .7));
  iconFor(g, kind, w / 2, Math.max(1, d / 2 - 5), ac);
  R(g, -1, d - 1, w + 2, 2, shade(c, 1.4));
  // sign
  const name = b.name;
  g.font = 'bold 6px monospace'; g.textBaseline = 'top';
  let size = 6;
  while (size > 4 && g.measureText(name).width > w - 8) { size--; g.font = `bold ${size}px monospace`; }
  const tw = Math.ceil(g.measureText(name).width) + 6;
  const sx = Math.round(w / 2 - tw / 2);
  R(g, sx - 1, d + 2, tw + 2, 9, '#120a1c'); R(g, sx, d + 3, tw, 7, kind === 'library' || kind === 'gallery' ? '#2a1a3c' : shade(c, .6));
  g.fillStyle = ac; g.fillText(name, sx + 3, d + 4);
  // storefront
  const gy = d + 14;
  const gh = H - 14 - 1;
  R(g, 4, gy, w / 2 - 12, gh, '#8fc8f0'); R(g, 4, gy, w / 2 - 12, 2, '#c8e6fa'); R(g, w / 2 + 8, gy, w / 2 - 12, gh, '#8fc8f0'); R(g, w / 2 + 8, gy, w / 2 - 12, 2, '#c8e6fa');
  if (kind === 'gallery') { R(g, 7, gy + 3, 7, 7, '#6b2fa0'); R(g, 9, gy + 5, 3, 3, '#ff8a1f'); R(g, w / 2 + 12, gy + 3, 7, 7, '#ff8a1f'); R(g, w / 2 + 14, gy + 5, 3, 3, '#6b2fa0'); }
  if (kind === 'bar') { R(g, 4, gy, w / 2 - 12, gh, '#3a2a60'); R(g, 7, gy + 3, 14, 4, '#ff5a8a'); }
  if (kind === 'bookstore') { for (let i = 0; i < 5; i++) R(g, 7 + i * 4, gy + 6, 3, 5, ['#b3322b', '#d9a441', '#2d6cc0', '#6b2fa0', '#5ea03a'][i]); }
  if (kind === 'library') { for (let i = 0; i < 5; i++) R(g, 6 + i * (w - 16) / 4, d + 12, 3, H - 12, '#f4f0e8'); }
  doorRect(g, w / 2 - 5, d + H - 13, 10, 13, kind === 'fancy' ? '#d9a441' : shade(c, .55));
  if (kind === 'organic') { R(g, 6, d + H - 5, 12, 5, '#8a5a2a'); R(g, 7, d + H - 7, 3, 2, '#e04f4f'); R(g, 11, d + H - 7, 3, 2, '#ff8a1f'); R(g, 15, d + H - 7, 2, 2, '#5ea03a'); }
  // awning
  const ay = d + 12;
  if (!['library', 'fancy'].includes(kind)) {
    for (let i = 0; i < w - 8; i += 6) { R(g, 4 + i, ay, 3, 4, ac); R(g, 7 + i, ay, 3, 4, '#f4f1e8'); }
    for (let i = 0; i < w - 8; i += 6) { R(g, 4 + i, ay + 4, 3, 1, ac); R(g, 7 + i, ay + 4, 3, 1, '#f4f1e8'); }
  }
}

function drawKiosk(g, b) {
  const { w, d, H } = b;
  R(g, 0, d, w, H, '#f4efe4'); R(g, w - 2, d, 2, H, '#d8d0c0');
  R(g, -1, 0, w + 2, d, PAL.purple); for (let i = 0; i < w; i += 8) R(g, i, 0, 4, d, PAL.orange);
  R(g, 3, d + 2, w - 6, 6, '#3a2146'); g.font = 'bold 5px monospace'; g.textBaseline = 'top'; g.fillStyle = PAL.orangeLight; g.fillText('COFFEE', 6, d + 3);
  R(g, 4, d + 9, w - 8, 6, '#8fc8f0'); R(g, 4, d + 15, w - 8, 3, '#8a5a2a');
  R(g, w / 2 - 2, d + 12, 4, 3, '#fff'); R(g, w / 2 + 2, d + 12, 1, 2, '#fff');
  R(g, 0, d + H - 3, w, 3, '#d8d0c0');
}

export function renderBuilding(b) {
  const pad = 6, cw = b.w + pad * 2, ch = b.d + b.H + 4;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  g.translate(pad, 0);
  R(g, b.w, b.d + 4, 4, b.H - 3, 'rgba(30,10,50,.25)');
  if (b.cat === 'kiosk') drawKiosk(g, b); else if (b.cat === 'house') drawHouse(g, b); else drawBiz(g, b);
  g.strokeStyle = 'rgba(20,8,36,.55)'; g.lineWidth = 1; g.strokeRect(.5, .5, b.w - 1, b.d + b.H - 1);
  return { canvas: cv, ox: -pad, oy: -b.H };
}

// ---------------------------------------------------------------- nature / props / icons
export function drawTree(g, x, y, seed = 0) {
  x = Math.round(x); y = Math.round(y);
  const gr = ['#3f9a4a', '#58b24a', '#2f8a5a'][seed % 3];
  R(g, x - 6, y - 1, 13, 3, 'rgba(30,10,50,.25)');
  R(g, x - 1, y - 6, 3, 6, '#5a3a22');
  blob(g, x - 7, y - 16, 14, 11, shade(gr, .85)); blob(g, x - 5, y - 20, 10, 8, gr); blob(g, x - 3, y - 18, 5, 4, shade(gr, 1.25));
  if (seed % 2) { R(g, x - 4, y - 12, 1, 1, PAL.shinyPink); R(g, x + 3, y - 15, 1, 1, PAL.orange); }
}

export function drawMarker(g, x, y, kind, t) {
  const bob = Math.round(Math.sin(t * 3) * 2);
  x = Math.round(x); y = Math.round(y) + bob;
  blob(g, x - 8, y - 8, 16, 16, PAL.orange); blob(g, x - 7, y - 7, 14, 14, PAL.purple);
  R(g, x - 2, y + 8, 4, 3, PAL.orange); R(g, x - 1, y + 8, 2, 4, PAL.orange);
  if (kind === 'bird') {
    blob(g, x - 4, y - 4, 8, 8, '#4fbf4a'); R(g, x + 2, y - 1, 4, 2, '#ffb400'); R(g, x + 1, y - 2, 1, 1, '#111'); R(g, x - 5, y + 1, 3, 2, '#2f8f3a');
  } else {
    blob(g, x - 4, y - 3, 8, 8, '#a08a6a'); R(g, x - 6, y - 4, 3, 6, '#7a5a40'); R(g, x + 3, y - 4, 3, 6, '#7a5a40');
    R(g, x - 3, y - 2, 2, 2, '#fff'); R(g, x + 1, y - 2, 2, 2, '#fff'); R(g, x - 2, y - 1, 1, 1, '#111'); R(g, x + 2, y - 1, 1, 1, '#111');
    R(g, x - 1, y + 1, 2, 2, '#111'); R(g, x - 4, y - 4, 2, 2, PAL.psyGreen); R(g, x + 2, y + 3, 2, 2, PAL.shinyPink);
  }
}

export function drawBubble(g, x, y, text, col = '#fff') {
  g.font = 'bold 7px monospace'; g.textBaseline = 'top';
  const w = Math.ceil(g.measureText(text).width) + 6;
  const bx = Math.round(x - w / 2), by = Math.round(y - 11);
  R(g, bx, by, w, 10, '#1b1030'); R(g, bx + 1, by + 1, w - 2, 8, col); R(g, Math.round(x) - 1, by + 10, 3, 2, '#1b1030'); R(g, Math.round(x), by + 9, 1, 2, col);
  g.fillStyle = '#1b1030'; g.fillText(text, bx + 3, by + 2);
}

export function drawHeart(g, x, y, c = '#ff4f7a') { R(g, x - 2, y - 1, 2, 2, c); R(g, x + 1, y - 1, 2, 2, c); R(g, x - 1, y, 3, 2, c); R(g, x, y + 2, 1, 1, c); }

export function drawSparkle(g, x, y, t) {
  const s = Math.floor(t * 6) % 2;
  R(g, x, y - 2 - s, 1, 5 + 2 * s, '#fff6b0'); R(g, x - 2 - s, y, 5 + 2 * s, 1, '#fff6b0');
}
