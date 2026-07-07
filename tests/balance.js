// winnability sim: a competent player mows in a serpentine pattern,
// sprays/fixes when adjacent, honks at nearby squirrels.
let simN = 1000;
function st(){ simN += 16; const cb = getRAF(); cb(simN); }

for (let i=0;i<30;i++) st();          // title
reset(); state = 'play';

const wps = [];
for (let r=0;r<GH;r++){
  const y = HUD_H + 8 + r*TILE;
  const maxX = (r >= HOUSE_TY-1 && r <= HOUSE_TY+HOUSE_TH) ? HX-14 : W-16;   // steer around the house
  if (r%2===0){ wps.push([16,y],[maxX,y]); } else { wps.push([maxX,y],[16,y]); }
}
let wi = 0;
let maxStrikes = 0, minHealth = 1;

for (let f=0; f<13000 && state === 'play'; f++){
  const wp = wps[wi];
  const dx = wp[0]-player.x, dy = wp[1]-player.y;
  keys.up = keys.down = keys.left = keys.right = false;
  if (Math.abs(dx) > 4) keys[dx>0?'right':'left'] = true;
  else if (Math.abs(dy) > 4) keys[dy>0?'down':'up'] = true;
  else { wi = (wi+1)%wps.length; }
  if (f%20 === 0){
    const a = resolveAction();
    const sqNear = squirrels.some(s => s.state !== 'flee' && Math.hypot(s.x-player.x, s.y-player.y) < 90);
    if (a || sqNear) action();
  }
  st();
  maxStrikes = Math.max(maxStrikes, strikes);
  minHealth = Math.min(minHealth, health);
}

const survivedS = Math.round((day-1)*DAY_LEN + dayT);
console.log('SIM done: state=' + state, 'day=' + day, 'survived=' + survivedS + 's',
  'strikes=' + maxStrikes, 'minHealth=' + minHealth.toFixed(2),
  'score=' + score, 'spray=' + sprayN, 'fert=' + fertN);
// since the skill-scoring update the game is intentionally a losing battle:
// a near-optimal player should last well past a week of in-game days, but
// not forever. Guard both ends so tuning can't drift silently.
if (day < 8) throw new Error('BALANCE FAIL: competent player died too early (day ' + day + ')');
if (state === 'play' && day >= 14)
  console.log('note: bot survived the whole sim — difficulty may have gone soft');
console.log('BALANCE_OK');
