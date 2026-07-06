// vertical-yard (phone) mode: dimensions, house placement, play, render paths
if (!NARROW) throw new Error('narrow stub did not trigger NARROW mode');
if (W !== 256 || H !== 520 || GW !== 16 || GH !== 30 || HUD_H !== 40)
  throw new Error('narrow dims wrong: ' + W + 'x' + H + ' grid ' + GW + 'x' + GH);
if (HOUSE_TX !== 11 || HOUSE_TY !== 13)
  throw new Error('house placement wrong: ' + HOUSE_TX + ',' + HOUSE_TY);
if (COOLER.x >= W || HY + HPH > H) throw new Error('house overflows canvas');

let simN = 1000;
function st(){ simN += 16; getRAF()(simN); }

for (let i=0;i<30;i++) st();                    // title renders at narrow logo scale
reset(); state = 'play';

keys.down = true;                               // drive the long axis
for (let i=0;i<250;i++) st();
keys.down = false;
if (player.y < HUD_H + 100) throw new Error('no vertical travel');
player.x = 40; player.y = HY + 30;              // line up with the house, then ram it
keys.right = true;
for (let i=0;i<200;i++) st();
keys.right = false;
if (player.x > HX - 8) throw new Error('house collision failed on narrow grid');

// joystick vector + action + long announce (scale-2 banner path)
touch.active = true; touch.moved = true; touch.dx = 0; touch.dy = -30;
for (let i=0;i<40;i++) st();
touch.active = false; touch.moved = false; touch.dy = 0;
action();
say('THE HOA IS DRAFTING A LETTER', 'GET THE YARD ABOVE 45% NOW');
st();

state = 'over'; st();                           // leaderboard at narrow width
console.log('NARROW_OK ' + W + 'x' + H + ' tiles=' + tiles.length);
