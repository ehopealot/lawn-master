// sprite map validator: consistent row widths, all chars in palette
const maps = { MOWER_R, MOWER_D, MOWER_U, SQ1, SQ2, HOLE, GNOME,
  DOG1, DOG2, DOGSQUAT, BIGDOG1, BIGDOG2, BIGSQUAT, POOP,
  ICON_SPRAY, ICON_BAG, ICON_DOGBAG, ICON_MAIL };
for (const name in maps){
  const m = maps[name], w = m[0].length;
  m.forEach((row, i) => {
    if (row.length !== w) throw new Error(name + ' row ' + i + ': len ' + row.length + ' != ' + w);
    for (const ch of row)
      if (ch !== '.' && !SPAL[ch]) throw new Error(name + ' row ' + i + ': unknown char "' + ch + '"');
  });
}
console.log('MAPS_OK');

// render every draw path once with real-ish state (stub ctx catches undefined refs)
let simN = 1000;
function st(){ simN += 16; getRAF()(simN); }
for (let i=0;i<10;i++) st();                    // title
reset(); state = 'play';
keys.right = true;
for (let i=0;i<200;i++) st();                   // play w/ movement, particles, butterflies
keys.right = false;
tiles[40].ground = 2; tiles[41].ground = 1;     // hole + dirt render paths
tiles[42].weed = {age: 2}; tiles[43].weed = {age: 8}; tiles[44].weed = {age: 20};
tiles[45].g = 3; tiles[46].g = 2; tiles[47].g = 1; tiles[48].g = 0;
gnomes = [{x: 100, y: 100, t: 5, ph: 0}, {x: 140, y: 100, t: 2, ph: 1}];
tiles[49].poo = { t: 0 };                       // poop render path
dogs = [
  { x: 260, y: 120, state:'squat', t: 9, poos: 0, stops: 1, tx: 260, ty: 120, anim: 0, big: false, scares: 0, scareCD: 0 },
  { x: 120, y: 220, state:'walk',  t: 0, poos: 0, stops: 1, tx: 140, ty: 220, anim: 0, big: true,  scares: 0, scareCD: 0 },
];
squirrels.push({x:200, y:150, state:'dig', digT:9, digs:0, tx:0, ty:0, anim:0});
dayT = DAY_LEN*0.05;  st();                     // dawn tint
dayT = DAY_LEN*0.9;   st();                     // dusk tint
paused = true; st(); paused = false;
scoresCache = [{s: 900, d: 5}, {s: 400, d: 3}]; lastRank = 0;
state = 'over'; st();                           // game-over screen w/ leaderboard
console.log('RENDER_OK');

// seasons: mapping, cache rebuild, autumn render paths
if (seasonFor(1).name !== 'SUMMER' || seasonFor(4).name !== 'SUMMER' ||
    seasonFor(5).name !== 'LATE SUMMER' || seasonFor(8).name !== 'LATE SUMMER' ||
    seasonFor(9).name !== 'AUTUMN' || seasonFor(13).name !== 'WINTER' ||
    seasonFor(16).name !== 'WINTER' || seasonFor(17).name !== 'SUMMER')
  throw new Error('seasonFor mapping wrong');
for (const bm of [BLOWER_R, BLOWER_D, BLOWER_U])
  bm.forEach((row, i) => {
    if (row.length !== bm[0].length) throw new Error('blower map row ' + i + ' bad length');
    for (const ch of row) if (ch !== '.' && !SPAL[ch]) throw new Error('blower bad char ' + ch);
  });
if (SONGS.length !== SEASONS.length) throw new Error('song per season mismatch');
for (const s of SONGS){
  if (s.mel.length !== 64) throw new Error('melody must be 64 steps');
  if (s.bass.length !== 8) throw new Error('bass must be 8 bars');
  for (const n of s.mel) if (n !== 0 && (n < 36 || n > 96)) throw new Error('melody note out of range: ' + n);
}
state = 'play';
curSeason = SEASONS[2]; buildGrassTiles(curSeason);
dayT = DAY_LEN*0.02;                            // dawn: dew + autumn leaves together
for (let i=0;i<300;i++) st();                   // ~5s: leaf spawn is ~1.3/s poisson
if (!parts.some(p => p.leaf)) throw new Error('no autumn leaves spawned');
// winter render paths: snow depths, glints, blower sprite, snowfall
curSeason = SEASONS[3]; buildGrassTiles(curSeason);
tiles[60].snow = 1; tiles[61].snow = 1; tiles[63].snow = 1;   // banks + lips render
for (let i=0;i<300;i++) st();
if (!parts.some(p => p.leaf)) throw new Error('no snowfall spawned');
reset();                                        // must snap back to summer
if (curSeason !== SEASONS[0]) throw new Error('reset did not restore summer');

// secret winter start (cmd/ctrl-enter sets seasonShift=3)
seasonShift = 3; reset(); state = 'play';
if (!curSeason.winter) throw new Error('winter start: wrong season');
if (!tiles.some(t2 => t2.ground === 0 && t2.snow > 0)) throw new Error('winter start: no snow');
if (seasonFor(5).name !== 'SUMMER') throw new Error('winter start: spring should follow on day 5');
for (let i=0;i<30;i++) st();
seasonShift = 0; reset();
if (curSeason.winter) throw new Error('normal start polluted by winter shift');
console.log('SEASONS_OK');
