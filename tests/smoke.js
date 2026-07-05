// smoke test driver — shares top-level scope with game code via cat
let simNow = 1000;
function step(ms){ simNow += ms; const cb = getRAF(); if (!cb) throw new Error('no RAF cb'); cb(simNow); }

// title screen for ~1s
for (let i=0;i<60;i++) step(16);
if (state !== 'title') throw new Error('expected title state');

// start game
reset(); state = 'play';

// drive around: right, down, left, up, diagonals — ~90s of play to cross days
const dirSeq = [
  {right:1}, {down:1}, {left:1}, {up:1},
  {right:1,down:1}, {left:1,up:1}, {right:1}, {down:1}
];
let frames = 0;
for (let leg=0; leg<40; leg++){
  keys.up = keys.down = keys.left = keys.right = false;
  const d = dirSeq[leg % dirSeq.length];
  for (const k in d) keys[k] = true;
  for (let i=0;i<140;i++){ step(16); frames++; }
  action();                     // exercise spray/fix/honk paths
}
keys.up = keys.down = keys.left = keys.right = false;

console.log('after drive: state=' + state + ' strikes=' + strikes + ' day=' + day + ' health=' + health.toFixed(2));

// fresh game for targeted action tests
reset(); state = 'play'; step(16);

// force-fill resources and exercise fix on a hole
for (const t of tiles){ t.weed = null; t.ground = 0; }
tiles[0].ground = 2; player.x = 8; player.y = HUD_H + 8; fertN = 5;
action();
if (tiles[0].ground !== 0) throw new Error('hole fix failed');

// force a weed spray
tiles[1].weed = {age: 3}; player.x = TILE + 8; sprayN = 5;
action();
if (tiles[1].weed) throw new Error('weed spray failed');

// beer: grab at the cooler, then get told to pace yourself
player.x = COOLER.x; player.y = COOLER.y + 18; beerCD = 0;
action();
if (!(buzzT > 0)) throw new Error('beer grab failed');
const buzzBefore = buzzT;
action();                                     // on cooldown now
if (buzzT > buzzBefore) throw new Error('beer cooldown not enforced');
// buzzed movement still works and house blocks driving through
keys.left = true;
for (let i=0;i<30;i++) step(16);
keys.left = false;
player.x = HX + 40; player.y = HY + 30;       // teleport inside footprint
keys.up = true; step(16); keys.up = false;    // one movement frame triggers pushback
if (inHouse(player.x, player.y, 8)) throw new Error('house collision failed');

// dog: spawns, poops on squat finish, poop bagged with a bag, blocked without
dogs = []; dogTimer = 0.001;
step(16);
if (dogs.length === 0) throw new Error('dog did not spawn');
for (const t of tiles) t.weed = null;
dogs[0].x = 200; dogs[0].y = 200; dogs[0].state = 'squat'; dogs[0].t = 0.01; dogs[0].poos = 0;
step(16); step(16);
const dtx = Math.floor(200/TILE), dty = Math.floor((200-HUD_H)/TILE);
if (!tileAt(dtx, dty).poo) throw new Error('dog did not poop');
player.x = 200; player.y = 200; bagN = 1;
action();
if (tileAt(dtx, dty).poo) throw new Error('bagging failed');
if (bagN !== 0) throw new Error('bag not consumed');
tileAt(dtx, dty).poo = { t: 0 };
action();
if (!tileAt(dtx, dty).poo) throw new Error('poop removed without bags');
tileAt(dtx, dty).poo = null;
dogs = [];

// big dog: relocates twice, leaves on the third scare
const bd = { x: 200, y: 200, state: 'sniff', t: 5, poos: 0, stops: 3,
             tx: 200, ty: 200, anim: 0, big: true, scares: 0, scareCD: 0 };
dogs = [bd];
scareDog(bd);
if (bd.state !== 'relocate') throw new Error('big dog scare 1 should relocate');
bd.scareCD = 0; scareDog(bd);
if (bd.state !== 'relocate') throw new Error('big dog scare 2 should relocate');
bd.scareCD = 0; scareDog(bd);
if (bd.state !== 'flee') throw new Error('big dog scare 3 should flee');
if (bd.scareCD === 0) throw new Error('scare cooldown not set');
dogs = [];

// events: stampede, dog park, drought
squirrels.length = 0;
triggerEvent('stampede');
if (squirrels.length < 5) throw new Error('stampede too small');
squirrels.length = 0;
triggerEvent('dogpark');
if (dogs.length < 3) throw new Error('dog park takeover too small');
dogs = [];
curSeason = SEASONS[0];
triggerEvent('drought');
if (activeEvent !== 'drought') throw new Error('drought did not start');
const dirtBefore = tiles.filter(t => t.ground === 1).length;
for (let i=0;i<250;i++) step(16);
const dirtAfter = tiles.filter(t => t.ground === 1).length;
if (dirtAfter <= dirtBefore) throw new Error('drought made no dry patches');
activeEvent = null;
for (const t of tiles) if (t.ground === 1) t.ground = 0;

// gnome party: 6 gnomes, collectible by driving over
gnomes = [];
triggerEvent('gnomeparty');
if (gnomes.length < 6) throw new Error('gnome party too small');
gnomes = [{ x: 60, y: HUD_H + 60, t: 5, ph: 0 }];
player.x = 55; player.y = HUD_H + 60; sprayN = 0; buzzT = 0;
keys.right = true; step(16); keys.right = false;
if (gnomes.length !== 0) throw new Error('gnome not collected');
if (sprayN < 1) throw new Error('gnome reward missing');   // >=1: same frame may also earn a mow reward

// high scores: ordering + rank
const hr1 = saveScore(100, 2);
const hr2 = saveScore(250, 4);
if (hr2 !== 0) throw new Error('better score should rank first');
if (scoresCache[0].s !== 250) throw new Error('score cache not sorted');

// winter: snowblower clears snow and earns supplies
curSeason = SEASONS[3];
for (const t of tiles) if (t.ground === 0) t.snow = 2;
player.x = 40; player.y = HUD_H + 40;
sprayN = 0; fertN = 0; sprayProg = 0; fertProg = 0; buzzT = 0;
keys.right = true;
for (let i=0;i<80;i++) step(16);
keys.right = false;
let clearedTiles = 0;
for (const t of tiles) if (t.ground === 0 && t.snow === 0) clearedTiles++;
if (clearedTiles < 3) throw new Error('snowblower cleared nothing');
if (sprayProg === 0 && sprayN === 0) throw new Error('no supplies from snow clearing');
curSeason = SEASONS[0];
for (const t of tiles) t.snow = 0;

// pause / resume
paused = true; step(16); paused = false; step(16);

// run until HOA game over by trashing the lawn
for (const t of tiles){ t.g = 3; t.weed = {age: 20}; }
let guard = 30000;
while (state === 'play' && guard-- > 0) step(16);
if (state !== 'over') throw new Error('expected game over, still ' + state);

// restart path
reset(); state = 'play'; step(16);

console.log('SMOKE_OK frames=' + frames, 'day=' + day, 'score=' + score,
  'squirrels=' + squirrels.length, 'health=' + health.toFixed(2), 'state=' + state);
