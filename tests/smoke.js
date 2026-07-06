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
if (squirrels.length < 10) throw new Error('stampede too small');
squirrels.length = 0;
day = 3;
triggerEvent('dogpark');
if (dogs.length < 5) throw new Error('dog park takeover too small');
if (dogs.filter(d => d.big).length < 2) throw new Error('takeover needs big dogs');
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

// touch joystick: analog vector drives the mower
player.x = 100; player.y = HUD_H + 100; buzzT = 0;
touch.active = true; touch.moved = true; touch.dx = 30; touch.dy = 0;
const px0 = player.x;
for (let i=0;i<20;i++) step(16);
if (player.x <= px0) throw new Error('joystick did not move player');
if (player.fx !== 1) throw new Error('joystick facing wrong');
touch.active = false; touch.moved = false; touch.dx = 0; touch.dy = 0;

// gnome party: 6 gnomes, collectible by driving over
gnomes = [];
triggerEvent('gnomeparty');
if (gnomes.length < 6) throw new Error('gnome party too small');
gnomes = [{ x: 60, y: HUD_H + 60, t: 5, ph: 0 }];
player.x = 55; player.y = HUD_H + 60; sprayN = 0; buzzT = 0;
keys.right = true; step(16); keys.right = false;
if (gnomes.length !== 0) throw new Error('gnome not collected');
if (sprayN < 1) throw new Error('gnome reward missing');   // >=1: same frame may also earn a mow reward

// rain: repairs dirt, then blows over
curSeason = SEASONS[0];
let wetted = 0;
for (const t of tiles) if (t.ground === 0 && wetted < 8){ t.ground = 1; wetted++; }
const dirtB4 = tiles.filter(t => t.ground === 1).length;
triggerEvent('rain');
if (activeEvent !== 'rain') throw new Error('rain did not start');
for (let i=0;i<300;i++) step(16);
if (tiles.filter(t => t.ground === 1).length >= dirtB4) throw new Error('rain repaired nothing');
for (let i=0;i<400 && activeEvent;i++) step(16);
if (activeEvent === 'rain') throw new Error('rain never ended');

// inspector: appears at complaint 0.5, gives up when the yard recovers
for (const t of tiles){ t.ground = 0; t.g = 3; t.weed = null; t.poo = null; }
hoaActive = true; complaint = 0.52; complaintWarned = false;
for (let i=0;i<6;i++) step(16);
if (!inspector) throw new Error('inspector never showed');
for (const t of tiles){ t.g = 0; }              // heroic emergency mow
let guard2 = 1200;
while (inspector && guard2-- > 0) step(16);
if (inspector) throw new Error('inspector never gave up');
if (complaint >= 0.45) throw new Error('complaint did not decay');

// onboarding: tips fired once each across everything above
if (!tipsSeen.move) throw new Error('move tip never fired');
if (!tipsSeen.weed || !tipsSeen.squirrel || !tipsSeen.dog || !tipsSeen.poop)
  throw new Error('hazard tips missing: ' + Object.keys(tipsSeen).join());
const tipCount = Object.keys(tipsSeen).length;
tipsSeen.move = 0; tip('move', 'X'); tipsSeen.move = 1;   // re-arm guard sanity
if (tipQueue[tipQueue.length-1] !== 'X') throw new Error('tip queue broken');
tipQueue.length = 0; tipCur = null;

// skill: streak builds along a clean line, dies after a gap
reset(); state = 'play';
for (const t of tiles){ t.weed = null; t.poo = null; if (t.ground !== 3){ t.ground = 0; t.g = 2; } }
player.x = 20; player.y = HUD_H + 20; buzzT = 0;
keys.right = true;
for (let i=0;i<160;i++) step(16);
keys.right = false;
if (streak < 10) throw new Error('streak did not build: ' + streak);
if (multOf(streak) < 2) throw new Error('multiplier did not rise');
for (let i=0;i<200;i++) step(16);
if (streak !== 0) throw new Error('streak did not break after idle');

// skill: squat denial pays +30
dogs = [{ x: 300, y: 200, state: 'squat', t: 5, poos: 0, stops: 1,
          tx: 300, ty: 200, anim: 0, big: false, scares: 0, scareCD: 0 }];
const sD = score;
scareDog(dogs[0]);
if (score - sD < 30) throw new Error('squat denial bonus missing');
dogs = [];

// skill: one honk, three squirrels = escalating bonus
for (const t of tiles){ t.weed = null; t.poo = null; if (t.ground === 1 || t.ground === 2) t.ground = 0; }
squirrels.length = 0;
player.x = 60; player.y = HUD_H + 120;
for (let i=0;i<3;i++)
  squirrels.push({ x: player.x+20+i*10, y: player.y, state:'walk', digT:0, digs:0, tx:0, ty:0, anim:0 });
const sM = score;
action();
if (score - sM !== 60) throw new Error('multi-scram bonus wrong: ' + (score - sM));
squirrels.length = 0;

// skill: young weed pays more than a mature one
tiles[1].weed = { age: 2 }; player.x = TILE+8; player.y = HUD_H+8; sprayN = 1;
const sW = score; action();
if (score - sW !== 25) throw new Error('young weed bonus wrong: ' + (score - sW));

// skill: collecting all six party gnomes pays the full set bonus
gnomes = []; triggerEvent('gnomeparty');
const sG = score;
let guard3 = 20;                      // one step can collect two clustered gnomes
while (gnomes.length && guard3-- > 0){
  const g = gnomes[0];
  player.x = g.x - 4; player.y = g.y;
  keys.right = true; step(16); keys.right = false;
}
if (partyGot !== 6) throw new Error('party pickups not counted: ' + partyGot);
if (score - sG < 150 + 300) throw new Error('full set bonus missing: ' + (score - sG));

// promotions: score milestones grant rank and speed
score = 6999; promo = 0;
step(16);
if (promo !== 0) throw new Error('promoted too early');
score = 18500;
step(16);
if (promo !== 2) throw new Error('promotions did not catch up: ' + promo);

// high scores: ordering + rank
const hr1 = saveScore(100, 2);
const hr2 = saveScore(250, 4);
if (hr2 !== 0) throw new Error('better score should rank first');
if (scoresCache[0].s !== 250) throw new Error('score cache not sorted');

// winter: snowblower clears snow and earns supplies
curSeason = SEASONS[3];
for (const t of tiles) if (t.ground === 0) t.snow = 1;
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
