// headless stub reporting a coarse pointer: the game boots the vertical yard
const noop = () => {};
const ctxStub = new Proxy({}, {
  get: (t, p) => (p === 'canvas' ? {} : noop),
  set: () => true
});
const elStub = { getContext: () => ctxStub, addEventListener: noop, dataset: {}, style: {} };
global.document = {
  getElementById: () => elStub,
  querySelectorAll: () => [],
  addEventListener: noop,
  createElement: () => ({ width: 0, height: 0, getContext: () => ctxStub }),
};
global.window = {
  addEventListener: noop,
  matchMedia: (q) => ({ matches: q.indexOf('coarse') >= 0 }),
};
let rafCb = null;
global.requestAnimationFrame = (cb) => { rafCb = cb; };
global.getRAF = () => rafCb;
