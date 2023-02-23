import * as Relax from '../dist/relax.js';
import { Line, RelaxCanvas } from './RelaxCanvas.js';

import { rodExample } from './example-rod.js';
import { chainExample } from './example-chain.js';
import { lazyTongsExample } from './example-lazy-tongs.js';
import { perspectiveExample } from './example-perspective.js';
import { pythagorasExample } from './example-pythagoras.js';

const examples = {};
examples['clear'] = () => {};
examples['rod'] = rodExample;
examples['chain'] = chainExample;
examples['lazy tongs'] = lazyTongsExample;
examples['perspective'] = perspectiveExample;
examples['pythagoras'] = pythagorasExample;

function setupActions(rc) {
  const actions = document.getElementsByTagName('action');
  for (let idx = 0; idx < actions.length - 1; idx++) {
    const action = actions[idx];
    action.setAttribute('touch-action', 'none');
    action.addEventListener('pointerdown', function (e) {
      rc.keydown(this.getAttribute('key'));
    }, false);
    action.addEventListener('pointerup', function (e) {
      rc.keyup(this.getAttribute('key'));
    }, false);
    action.addEventListener('pointerout', function(e) {
      rc.keyup(this.getAttribute('key'));
    }, false);
  }
}

function setupFlap(flap, childElementName) {
  const container = flap.parentElement;
  flap.addEventListener('click', e => {
    if (container.classList.contains('collapsed')) {
      container.classList.remove('collapsed');
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
  }, false);
  document.querySelector(`${childElementName}:last-of-type`).addEventListener('click', e => {
    if (!container.classList.contains('collapsed')) {
      container.classList.add('collapsed');
    }
  });
}

function setupDemoButtons(rc) {
  const demos = document.getElementById('demos');
  Object.keys(examples).forEach(e => {
    const demo = document.createElement('demo');
    demo.appendChild(document.createTextNode(e));
    demo.onclick = () => {
      rc.clear();
      examples[e](rc);
    };
    demos.insertBefore(demo, demos.querySelector('demo:last-of-type'));
  });
}

function createRelaxCanvas() {
  const canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return new RelaxCanvas(new Relax.Relax(), canvas);
}

function setupFrameRateDisplay(rc) {
  const ipf = document.getElementById('ipf');
  setInterval(() => ipf.innerHTML = rc.iterationsPerFrame, 100);
}

function setupShowEachIterationButton(rc) {
  const sii = document.getElementById('sii');
  function updateSIILabel() {
    sii.innerHTML = (rc.showEachIteration ? '' : 'not ') + ' rendering after each iteration';
  }
  sii.onclick = () => {
    rc.showEachIteration = !rc.showEachIteration;
    updateSIILabel();
  };
  updateSIILabel();
}

window.onload = function() {
  setupFlap(document.querySelector('demos flap'), 'demo');
  setupFlap(document.querySelector('actions flap'), 'action');

  const rc = createRelaxCanvas();
  setupActions(rc);
  setupDemoButtons(rc);
  setupFrameRateDisplay(rc);
  setupShowEachIterationButton(rc);
};
