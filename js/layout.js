// Default world layout for Dog Walker Pro.
// This file is pure data so a future world-builder tool can emit the same shape.
//
// Coordinates are in tiles. A block is a lot of lotW x lotH tiles surrounded by a 2-tile sidewalk ring,
// with streets (streetW tiles wide) on the grid lines between blocks.
//   block.traffic  per-street-segment densities (expected vehicles per direction) for the streets along
//                  the block's top and left edges: cars, buses, cycles, scooters (0..~1.5)
//   block.peds / block.cyclists   sidewalk walkers and sidewalk cyclists
//   block.buildings  { k: kind, x, y, w?, d?, c?: color index/hex, name?, jobs?: ['dog','bird'] }
//                    x,y = top-left of footprint (tiles, relative to lot). Use row() to lay a row out.
//   block.props    { k: 'coffee', x, y }
//   block.items    { hat: id, x, y }  hats lying around (may be on the sidewalk, e.g. y = -1)
//   block.paved    [y0, y1] paved band inside the lot (parking / back lanes)
import { KINDS } from './data.js';

const GAP = 1;
// Lay buildings left-to-right along a row whose bottom edge ("base") is at baseY. Rows are centered.
function row(baseY, items, lotW = 18) {
  const list = items.map(i => (typeof i === 'string' ? { k: i } : i));
  const widths = list.map(i => i.w ?? KINDS[i.k].w);
  const total = widths.reduce((a, b) => a + b, 0) + GAP * (list.length - 1);
  let x = Math.max(0, Math.floor((lotW - total) / 2));
  return list.map((i, n) => {
    const d = i.d ?? KINDS[i.k].d;
    const b = { ...i, w: widths[n], d, x, y: (i.base ?? baseY) - d };
    delete b.base;
    x += widths[n] + GAP;
    return b;
  });
}
const A = (items) => row(5, items);   // back row: doors face the paved lane
const B = (items) => row(12, items);  // front row: doors face the south sidewalk
const dog = (k, o = {}) => ({ k, jobs: ['dog'], ...o });

const calm = { cars: .5, buses: .08, cycles: .5, scooters: .3 };
const busy = { cars: .9, buses: .25, cycles: .7, scooters: .5 };
const quiet = { cars: .25, buses: 0, cycles: .35, scooters: .2 };

export default {
  name: 'Maple & Fifth',
  cols: 4, rows: 3,
  streetW: 6, walk: 2, lotW: 18, lotH: 12,
  playerStart: { block: [1, 0], x: 9, y: 13 }, // tile on the south sidewalk of the block (y>=12 is walk)
  defaults: { traffic: calm, peds: 3, cyclists: 1, paved: [5, 8] },
  blocks: [
    { at: [0, 0], traffic: calm, peds: 4,
      buildings: [...A([dog('craftsman', { c: 1 }), dog('brick_narrow'), 'siding_big']), ...B([dog('sandwich'), 'coffee_indie', { k: 'hat_store', jobs: ['bird'] }])],
      props: [{ k: 'coffee', x: 15, y: 6 }], items: [{ hat: 'cap', x: 8, y: 6.5 }] },
    { at: [1, 0], traffic: busy, peds: 5,
      buildings: [...A(['mcmansion', dog('ranch')]), ...B([{ k: 'library', jobs: ['bird'] }, 'bookstore', dog('bakery')])],
      props: [{ k: 'coffee', x: 2, y: 6.5 }], items: [{ hat: 'beret', x: 17.5, y: -1 }] },
    { at: [2, 0], traffic: calm, peds: 3,
      buildings: [...A([dog('brick_narrow', { c: 1 }), dog('brick_narrow'), 'craftsman']), ...B([{ k: 'organic', jobs: ['bird'] }, 'fancy', 'bar'])],
      props: [], items: [{ hat: 'sunhat', x: 3, y: 6.5 }] },
    { at: [3, 0], traffic: quiet, peds: 3,
      buildings: [...A([dog('ranch', { c: 2 }), 'mcmansion']), ...B(['convenience', { k: 'pet_store', jobs: ['bird', 'dog'] }, 'fast_food'])],
      props: [{ k: 'coffee', x: 9, y: 6.5 }], items: [{ hat: 'party', x: 1, y: 6.5 }] },

    { at: [0, 1], traffic: busy, peds: 5,
      buildings: [...A([dog('siding_big'), dog('craftsman', { c: 2 }), 'craftsman']), ...B(['coffee_corp', { k: 'gallery', jobs: ['bird'] }, 'convenience'])],
      props: [{ k: 'coffee', x: 14, y: 6.5 }], items: [] },
    { at: [1, 1], traffic: calm, peds: 3,
      buildings: [...A([dog('brick_narrow'), dog('brick_narrow', { c: 2 }), 'brick_narrow']), ...B([{ k: 'bar', name: 'The Dive' }, 'pet_store', { k: 'bakery', name: 'Rise & Shine Bakery' }])],
      props: [], items: [{ hat: 'cowboy', x: 8, y: 6.5 }] },
    { at: [2, 1], traffic: busy, peds: 4, cyclists: 2,
      buildings: [...A([dog('craftsman', { c: 0 }), 'craftsman', dog('ranch')]), ...B([{ k: 'fast_food', name: 'Taco Tower' }, { k: 'coffee_indie', name: 'Bean There' }, 'fancy'])],
      props: [{ k: 'coffee', x: 1, y: 6.5 }], items: [] },
    { at: [3, 1], traffic: calm, peds: 3,
      buildings: [...A(['mcmansion', dog('mcmansion', { c: 1 })]), ...B([{ k: 'sandwich', name: 'Subterranean Subs' }, 'bakery', { k: 'bar', name: 'Pint & Pretzel' }])],
      props: [], items: [{ hat: 'pirate', x: 16.5, y: 6.5 }] },

    { at: [0, 2], traffic: quiet, peds: 3,
      buildings: [...A(['ranch', dog('craftsman', { c: 1 }), 'brick_narrow']), ...B([dog('siding_big'), dog('craftsman', { c: 1 }), 'brick_narrow'])],
      props: [{ k: 'coffee', x: 8, y: 6.5 }], items: [{ hat: 'tophat', x: 9, y: 13 }] },
    { at: [1, 2], traffic: calm, peds: 4,
      buildings: [...A([dog('siding_big', { c: 2 }), dog('siding_big', { c: 3 })]), ...B([{ k: 'convenience', name: 'Late Night Mart' }, { k: 'organic', name: 'Root & Sprout' }, 'hat_store'])],
      props: [], items: [] },
    { at: [2, 2], traffic: quiet, peds: 3,
      buildings: [...A([dog('craftsman', { c: 2 }), 'brick_narrow', dog('brick_narrow', { c: 1 })]), ...B([dog('mcmansion'), dog('ranch', { c: 2 })])],
      props: [{ k: 'coffee', x: 14, y: 6.5 }], items: [{ hat: 'crown', x: 0.5, y: 6.5 }] },
    { at: [3, 2], traffic: calm, peds: 3,
      buildings: [...A([dog('brick_narrow'), 'siding_big', dog('craftsman', { c: 0 })]), ...B(['coffee_indie', { k: 'bookstore', name: 'Second Chapter Books' }, 'fast_food'])],
      props: [], items: [{ hat: 'beanie', x: 17.5, y: 13 }] },
  ],
  // Quest NPCs who start the bird-walking jobs (placed as wanderers in these blocks).
  specialNpcs: [{ id: 'bird_pete', block: [0, 0] }, { id: 'aunt_cleo', block: [2, 1] }],
};
