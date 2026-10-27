// Static game data: breeds, species, hats, building kinds, NPC content.
export const T = 16; // tile size in world pixels
export const M_PER_TILE = 2; // displayed meters per tile

export const PAL = {
  purple: '#6b2fa0', purpleDark: '#3d1a63', purpleLight: '#a56bd8',
  orange: '#ff8a1f', orangeDark: '#c85f00', orangeLight: '#ffc27a',
  psyGreen: '#7dff3a', shinyPink: '#ff7a9c',
};

// size 0..1 (bigger dogs are more likely to park); quota = encouragements needed per minute.
export const DOGS = {
  golden_retriever: { name: 'Golden Retriever', size: .8, len: 16, h: 9, body: '#d9a038', shade: '#b97c1d', light: '#f4cf7a', ear: 'drop', tail: 'plume', coat: 'fluffy', quota: 5, speed: 56, dist: [90, 160], names: ['Biscuit', 'Honey', 'Sunny', 'Maple'] },
  white_lab: { name: 'White Lab', size: .8, len: 16, h: 9, body: '#f4f1e8', shade: '#d3ccbb', light: '#fffdf6', ear: 'drop', tail: 'otter', coat: 'smooth', quota: 5, speed: 58, dist: [100, 170], names: ['Snowball', 'Marshmallow', 'Casper', 'Pearl'] },
  goldendoodle: { name: 'Goldendoodle', size: .7, len: 15, h: 10, body: '#c9a063', shade: '#a47a3f', light: '#e6c48e', ear: 'curly', tail: 'curl', coat: 'curly', quota: 6, speed: 56, dist: [90, 150], names: ['Waffles', 'Noodle', 'Mochi', 'Teddy'] },
  standard_poodle: { name: 'Standard Poodle', size: .7, len: 14, h: 12, body: '#3b3350', shade: '#271f38', light: '#5b4d7d', ear: 'curly', tail: 'pompom', coat: 'puff', quota: 5, speed: 60, dist: [100, 160], names: ['Duchess', 'Beau', 'Violet', 'Pierre'] },
  chihuahua: { name: 'Chihuahua', size: .15, len: 9, h: 6, body: '#d7b184', shade: '#b58a58', light: '#ecd2ad', ear: 'perk', tail: 'whip', coat: 'smooth', quota: 9, speed: 66, dist: [50, 90], names: ['Pepito', 'Tiny', 'Chispa', 'Nacho'] },
  terrier: { name: 'Terrier', size: .35, len: 11, h: 8, body: '#f2ede2', shade: '#cfc8b8', light: '#ffffff', patch: '#9a5b2b', ear: 'fold', tail: 'perk', coat: 'smooth', quota: 8, speed: 64, dist: [60, 110], names: ['Scrappy', 'Bandit', 'Pickle', 'Dash'] },
  greyhound: { name: 'Greyhound', size: .7, len: 18, h: 11, body: '#8d93a6', shade: '#6c7289', light: '#b4b9c8', ear: 'rose', tail: 'whip', coat: 'smooth', quota: 4, speed: 80, legs: 5, dist: [120, 200], names: ['Zephyr', 'Bolt', 'Willow', 'Comet'] },
  dachshund: { name: 'Dachshund', size: .25, len: 18, h: 6, body: '#8a4b2a', shade: '#6a3419', light: '#b3703f', ear: 'drop', tail: 'whip', coat: 'smooth', quota: 7, speed: 54, dist: [60, 100], names: ['Frankie', 'Sausage', 'Otto', 'Pretzel'] },
};

// mischief 0..1 = how likely to curse (vs. flying home) when neglected
export const BIRDS = {
  quaker: { name: 'Quaker Parrot', size: 1, body: '#4fbf4a', belly: '#b9c4c8', wing: '#2f8f3a', head: '#4fbf4a', beak: '#e0a885', cheek: '#b9c4c8', tail: 'long', quota: 5, mischief: .5, dist: [60, 110], names: ['Kiwi', 'Pesto', 'Mango'] },
  sun_conure: { name: 'Sun Conure', size: 1, body: '#ffb400', belly: '#ff8a1f', wing: '#27a844', wingTip: '#2a6ad8', head: '#ffd24a', beak: '#2b2b2b', cheek: '#ff7a1f', tail: 'long', quota: 6, mischief: .6, dist: [60, 110], names: ['Sunny', 'Zest', 'Tango'] },
  macaw: { name: 'Blue & Gold Macaw', size: 1.6, body: '#1f5fd1', belly: '#ffc21a', wing: '#1f5fd1', head: '#2e72e8', beak: '#222', face: '#f4f1ee', cheek: '#f4f1ee', tail: 'xlong', quota: 4, mischief: .7, dist: [80, 140], names: ['Captain', 'Azul', 'Admiral'] },
  budgie: { name: 'Budgie Parakeet', size: .6, body: '#6fd16a', belly: '#8ee37e', wing: '#2b2b2b', head: '#ffe45c', beak: '#f0b020', cheek: '#3b6ee0', tail: 'long', quota: 8, mischief: .4, dist: [40, 80], names: ['Pip', 'Bean', 'Peaches'] },
  crow: { name: 'Crow', size: 1.3, body: '#1c1a24', belly: '#2c2838', wing: '#4b3c7a', head: '#1c1a24', beak: '#0f0e14', cheek: '#1c1a24', tail: 'short', quota: 4, mischief: .9, dist: [70, 120], names: ['Edgar', 'Poe', 'Raven Jr.'] },
  cockatiel: { name: 'Cockatiel', size: .9, body: '#9ea3ad', belly: '#c0c4cc', wing: '#7e838f', head: '#ffe36a', beak: '#a9a9a9', cheek: '#ff8a3d', crest: '#ffe36a', tail: 'long', quota: 6, mischief: .5, dist: [60, 110], names: ['Biscotti', 'Ziggy', 'Moon'] },
};

export const HATS = {
  none: { name: 'No hat', price: 0 },
  cap: { name: 'Purple Ball Cap', price: 15 },
  beanie: { name: 'Orange Beanie', price: 18 },
  sunhat: { name: 'Straw Sun Hat', price: 24 },
  beret: { name: 'Artist Beret', price: 28 },
  cowboy: { name: 'Cowboy Hat', price: 36 },
  party: { name: 'Party Hat', price: 30 },
  pirate: { name: 'Pirate Tricorn', price: 45 },
  tophat: { name: 'Top Hat', price: 60 },
  crown: { name: 'Tiny Crown', price: 120 },
};
export const SHOP_HATS = ['cap', 'beanie', 'sunhat', 'beret', 'cowboy', 'party', 'pirate', 'tophat', 'crown'];

// Building kinds. w/d are footprint tiles, H is wall height in pixels.
export const KINDS = {
  brick_narrow: { cat: 'house', label: 'Narrow brick townhouse', w: 4, d: 3, H: 30 },
  siding_big: { cat: 'house', label: 'Big sided house', w: 6, d: 4, H: 40 },
  ranch: { cat: 'house', label: 'Ranch house', w: 6, d: 3, H: 16 },
  craftsman: { cat: 'house', label: 'Craftsman bungalow', w: 5, d: 3, H: 22 },
  mcmansion: { cat: 'house', label: 'McMansion', w: 7, d: 4, H: 32 },

  coffee_indie: { cat: 'biz', name: 'Grounds & Wonder', blurb: 'indie coffee', w: 5, d: 3, H: 22, color: '#7a4a2a', accent: '#ff8a1f' },
  bar: { cat: 'biz', name: 'The Rusty Tern', blurb: 'local bar', w: 5, d: 3, H: 22, color: '#3a2146', accent: '#ff5a8a' },
  coffee_corp: { cat: 'biz', name: 'Brewmark Coffee', blurb: 'corporate coffee', w: 5, d: 3, H: 22, color: '#1f6b4a', accent: '#f4f1e8' },
  library: { cat: 'biz', name: 'Public Library', blurb: 'library', w: 7, d: 4, H: 30, color: '#d8cdb8', accent: '#6b2fa0', enter: 'library' },
  sandwich: { cat: 'biz', name: 'Viking Sandwiches', blurb: 'sandwich shop', w: 5, d: 3, H: 22, color: '#b3322b', accent: '#ffc21a' },
  hat_store: { cat: 'biz', name: 'Brim & Crown Hats', blurb: 'hat store', w: 4, d: 3, H: 22, color: '#6b2fa0', accent: '#ff8a1f', enter: 'hats' },
  pet_store: { cat: 'biz', name: 'Paws & Claws', blurb: 'pet store', w: 5, d: 3, H: 22, color: '#2f9e8f', accent: '#ffd24a' },
  fast_food: { cat: 'biz', name: 'Burger Barn', blurb: 'fast food', w: 6, d: 3, H: 22, color: '#d8402a', accent: '#ffd400' },
  convenience: { cat: 'biz', name: 'Corner Quickstop', blurb: 'convenience store', w: 5, d: 3, H: 20, color: '#2d6cc0', accent: '#ffffff' },
  bookstore: { cat: 'biz', name: 'Black Belle Books', blurb: 'book store', w: 5, d: 3, H: 24, color: '#1d1a26', accent: '#d9a441' },
  organic: { cat: 'biz', name: 'Green Bushel Organics', blurb: 'organic market', w: 6, d: 3, H: 22, color: '#5aa13a', accent: '#f4f1e8' },
  fancy: { cat: 'biz', name: "L'Absurde", blurb: 'pretentious restaurant', w: 5, d: 3, H: 26, color: '#14101c', accent: '#d9a441' },
  bakery: { cat: 'biz', name: 'Crumb & Co.', blurb: 'bakery', w: 4, d: 3, H: 22, color: '#e8a0b4', accent: '#ffffff' },
  gallery: { cat: 'biz', name: 'Altar Redwood Gallery', blurb: 'art gallery', w: 5, d: 3, H: 24, color: '#f2efe8', accent: '#ff8a1f', enter: 'gallery' },
};

export const HOUSE_COLORS = {
  brick_narrow: ['#a5483a', '#8d3b30', '#b8654c'],
  siding_big: ['#6f8fb5', '#e3c46a', '#8cb08a', '#b79ad8'],
  ranch: ['#d8c39a', '#f1ece0', '#9c7a58'],
  craftsman: ['#5b8a5a', '#8a5cc0', '#d8883a'],
  mcmansion: ['#d9c9a3', '#cdb89a', '#e4dccb'],
};

export const FIRST_NAMES = ['Ada', 'Marcus', 'Priya', 'Tomas', 'June', 'Dev', 'Lena', 'Omar', 'Rosa', 'Kit', 'Nadia', 'Felix', 'Wren', 'Gus', 'Maya', 'Ines', 'Theo', 'Sam', 'Yuki', 'Bram'];
export const SKIN = ['#f1c9a5', '#e0a97c', '#c68642', '#8d5524', '#5c3a1e', '#ffdbb4'];
export const HAIR = ['#2b1d12', '#5a3a1a', '#c98a3a', '#111', '#8a8a96', '#7a2f8c', '#d8502a'];
export const SHIRTS = ['#e04f4f', '#4f8fe0', '#e0c04f', '#4fe0a0', '#d8d8e0', '#e07a2f', '#8a5cc0', '#3a3a4a', '#ff7aa8'];

// Persona text feeds both the AI prompt and scripted fallback.
export const PERSONAS = [
  { persona: 'a sandwich enthusiast who eats lunch at Viking Sandwiches every day', topic: 'Viking Sandwiches makes the Longship (meatball and pickled onion) and the Ragnarok (very spicy)', hint: 'sandwich', lines: ["Viking Sandwiches! The Longship is life-changing. Get extra pickled onions.", "I would walk through a snowstorm for a Viking Sandwiches Ragnarok. Spicy!"] },
  { persona: 'a bookworm who volunteers at Black Belle Books', topic: 'Black Belle Books is a moody, cozy shop with a cat named Quarto and a great poetry shelf', hint: 'book', lines: ["Black Belle Books has a shop cat named Quarto. Go say hi. Buy a poem.", "Black Belle Books got a rare Hamlet in. The library has a copy too, you know."] },
  { persona: 'a very tired nurse heading home', topic: 'sleep, coffee, and the Brewmark Coffee vs Grounds & Wonder debate', hint: 'coffee', lines: ["Coffee first, please. Grounds & Wonder if I have time, Brewmark if I'm desperate.", "Coffee makes dogs easier to walk? No, makes YOU easier to walk with dogs."] },
  { persona: 'a retired bus driver who knows every route', topic: 'the city buses, traffic lights, and where the crosswalks are best', hint: 'bus', lines: ["Watch the lights at the crosswalks. Buses can't stop on a dime.", "Thirty years driving the number nine bus. Never hit a pigeon. Not once."] },
  { persona: 'a teenager with a skateboard and strong opinions about hats', topic: 'Brim & Crown Hats, and free hats lying around the neighborhood', hint: 'hat', lines: ["Brim & Crown Hats has a top hat that is honestly too good for this town.", "I found a hat on the sidewalk once. Keep your eyes open, hats are everywhere."] },
  { persona: 'a gardener who loves Green Bushel Organics', topic: 'organic vegetables, tomatoes, and neighborhood trees', hint: 'organic', lines: ["Green Bushel Organics has the best tomatoes. Ask about the purple carrots.", "Trees on this block are older than the buildings. Be nice to them."] },
  { persona: 'a pretentious food critic', topic: "L'Absurde, the pretentious restaurant, which serves one pea on a very large plate", hint: 'fancy', lines: ["L'Absurde is deconstructing dinner. I had a single pea. It was sublime.", "I find Burger Barn hideously honest. I love it."] },
  { persona: 'a dog lover who wants to pet every dog', topic: 'dogs of every breed, and who is a good boy', hint: 'dog', lines: ["Is that a dog? Is it a good dog? Of course it is.", "Poodles are just doodles with better PR."] },
  { persona: 'a musician at the Rusty Tern bar', topic: 'The Rusty Tern has open mic night every Thursday', hint: 'bar', lines: ["The Rusty Tern has open mic Thursday. I play a very sad kazoo.", "Don't tell anyone, but the Tern's pretzels are secretly from Crumb & Co."] },
  { persona: 'an art student fond of the Altar Redwood Gallery', topic: 'Altar Redwood Gallery shows bold purple and orange ink and marker artwork of dogs and birds', hint: 'art', lines: ["Altar Redwood Gallery has dogs and birds painted in purple and orange. Go look!", "Art is just paying attention, with markers."] },
];

// Special NPCs that offer the bird-walking job.
export const BIRD_GIVERS = [
  { name: 'Parrot Pete', persona: 'a retired ship cook with a parrot-walking side business', topic: 'bird walking jobs: birds need a walk and lots of praise, pets on the head, and a bit of coffee for the walker helps',
    open: "Ahoy! I'm Parrot Pete. Folks around here also need their birds walked — parrots, macaws, even a crow. Same deal as the dogs: pet the head, praise them lots. Check the businesses around town, they've got bird jobs for you now!" },
  { name: 'Aunt Cleo', persona: 'an eccentric aunt with a flock of birds who needs help exercising them', topic: 'bird walking jobs for her flock and friends; birds that feel ignored curse like sailors or fly home',
    open: "Darling, my flock needs air! Walk a bird for me — pet its head, tell it it's pretty, or it'll start swearing at the neighbors. There are bird jobs at some of the shops now. Go on!" },
];

export const GREETINGS = ['Hi there!', 'Nice day for a walk.', 'Where should I eat around here?', 'Seen any good hats?', 'Do you like dogs?', 'Tell me about the neighborhood.'];

export const SHOUTS = ["Hey! Watch it!", "Move it, pal!", "Outta my way!", "What are you looking at?!", "Get a life!", "Pfft. Nice hat. NOT.", "Hey you! Yes YOU!"];
export const NPC_REACTIONS = ["Rude!", "Wow, okay.", "Excuse me?!", "Seriously?!", "Ugh."];
export const ENCOURAGE = ['Good dog!', 'Who is a good one?', "You're doing great!", 'Atta pup!', 'Yes! Keep going!', 'Such a good walker!'];
export const BIRD_ENCOURAGE = ['Pretty bird!', 'Good birdie!', "Who's a smart one?", 'Beautiful feathers!', 'Wonderful flying!'];
export const SWEARS = ['#@%&!', '*$#@!!', '@#%$&*!', '%&@!!#'];

export const HAMLET_Q1 = [
  'To be, or not to be, I there\'s the point,',
  'To Die, to sleepe, is that all? Aye all:',
  'No, to sleepe, to dreame, I mary there it goes,',
  'For in that dreame of death, when wee awake,',
  'And borne before an euerlasting Judge,',
  'From whence no passenger euer retur\'nd.',
];
