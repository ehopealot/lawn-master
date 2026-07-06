// loss-condition repro: player never moves; the lawn decays naturally.
// the HOA must eventually cite. Logs snapshots so we can see complaint accrual.
let simN = 1000;
function st(){ simN += 16; getRAF()(simN); }
for (let i=0;i<10;i++) st();
reset(); state = 'play';
for (let i=0;i<40000 && state === 'play'; i++){
  st();
  if (i % 2500 === 0)
    console.log('t=' + Math.round(tSinceStart) + 's day=' + day,
      'health=' + health.toFixed(2), 'complaint=' + complaint.toFixed(2),
      'hoaActive=' + hoaActive, 'state=' + state);
}
console.log('FINAL: state=' + state, 'day=' + day, 'health=' + health.toFixed(2),
  'complaint=' + complaint.toFixed(2), 'tSinceStart=' + Math.round(tSinceStart));
if (state !== 'over') throw new Error('loss condition never fired for an idle player');
if (tSinceStart > 60) throw new Error('citation too slow: ' + Math.round(tSinceStart) + 's');
console.log('IDLE_CITED_OK at t=' + Math.round(tSinceStart) + 's');
