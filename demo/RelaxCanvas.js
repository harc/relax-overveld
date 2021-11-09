import * as Relax from '../dist/relax.js';

export class Line {
  constructor (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  involvesPoint(p) {
    return p === this.p1 || p === this.p2;
  }
}

export class RelaxCanvas {
  constructor (relax, canvas) {
    this.offsetX = 0;
    this.offsetY = 0;

    this.relax = relax;

    this.showConstraints = false;
    this.showEachIteration = false;
    this.iterationsPerFrame = 0;
    this.paused = false;
    this.points = [];
    this.lines = [];

    this.fingers = {};

    this.pointMode = false;
    this.lastPoint = undefined;

    this.deleteMode = false;

    this.isTablet =
      navigator.userAgent.match(/iPad/i) !== null ||
      navigator.userAgent.match(/iPhone/i) !== null ||
      navigator.userAgent.match(/Android/i) !== null;
    this.pointRadius = this.isTablet ? 20 : 8;

    this.initCanvas(canvas);

    const g = Relax.geom;
    this.applyFns = {
      F: (p) => this.addConstraint(new g.CoordinateConstraint(p, g.copy(p))),
      C: (p1, p2) => this.addConstraint(new g.CoincidenceConstraint(p1, p2)),
      Q: (p1, p2, p3, p4) => this.addConstraint(new g.EquivalenceConstraint(p1, p2, p3, p4)),
      E: (p1, p2, p3, p4) => this.addConstraint(new g.EqualDistanceConstraint(p1, p2, p3, p4)),
      L: (p1, p2) => this.addConstraint(
        new g.LengthConstraint(p1, p2, g.magnitude(g.minus(p2, p1)))),
      O: (p1, p2, p3, p4) => this.addConstraint(
        new g.OrientationConstraint(p1, p2, p3, p4, calculateAngle(p1, p2, p3, p4))),
      R: (p1, p2, p3, p4) => this.addConstraint(parallelConstraint(p1, p2, p3, p4)),
      N: (p1, p2, p3, p4) => this.addConstraint(perpendicularConstraint(p1, p2, p3, p4)),
      M: (p1, p2) => this.addConstraint(new g.MotorConstraint(p1, p2, 1)),
    };

    this.applyFn = undefined;
    this.selection = [];

    this.step();
  }

  initCanvas(canvas) {
    this.canvas = canvas;

    canvas.addEventListener('keydown', e => this.keydown(String.fromCharCode(e.keyCode)), false);
    canvas.addEventListener('keyup',   e => this.keyup(String.fromCharCode(e.keyCode)),   false);

    canvas.addEventListener('keyup',       e => this.keyup(e),       false);

    canvas.addEventListener('pointerdown', e => this.pointerdown(e), false);
    canvas.addEventListener('pointermove', e => this.pointermove(e), false);
    canvas.addEventListener('pointerup',   e => this.pointerup(e),   false);

    this.ctxt = canvas.getContext('2d');
    this.ctxt.font = '12px Arial';
    this.ctxt.shadowOffsetX = 1;
    this.ctxt.shadowOffsetY = 1;
    this.ctxt.shadowColor = '#999';
    this.ctxt.shadowBlur = 1;

    // setup the canvas for device-independent pixels
    const dpr = window.devicePixelRatio || 1;
    const bsr = this.ctxt.webkitBackingStorePixelRatio ||
        this.ctxt.mozBackingStorePixelRatio ||
        this.ctxt.msBackingStorePixelRatio ||
        this.ctxt.oBackingStorePixelRatio ||
        this.ctxt.backingStorePixelRatio || 1;
    const ratio = dpr / bsr;

    if (dpr !== bsr) {
      const oldW = this.canvas.width;
      const oldH = this.canvas.height;

      this.canvas.width = oldW * ratio;
      this.canvas.height = oldH * ratio;
      this.canvas.style.width = oldW + 'px';
      this.canvas.style.height = oldH + 'px';
      this.ctxt.scale(ratio, ratio);
    }
  }

  addPoint(x, y, optColor) {
    const p = {x: x, y: y, color: optColor || 'slateBlue', selectionIndices: []};
    this.points.push(p);
    return p;
  }

  addLine(p1, p2) {
    const l = new Line(p1, p2);
    this.lines.push(l);
    return l;
  }

  addConstraint(c) {
    this.relax.add(c);
    return c;
  }

  removePoint(unwanted) {
    this.relax.remove(unwanted);
    this.points = this.points.filter(p => p !== unwanted);
    this.lines = this.lines.filter(l => !l.involvesPoint(unwanted));
  }

  removeLine(unwanted) {
    this.lines = this.lines.filter(l => l !== unwanted);
  }

  removeConstraint(unwanted) {
    this.relax.remove(unwanted);
  }

  clear() {
    this.relax.clear();

    this.points = [];
    this.lines = [];

    this.offsetX = 0;
    this.offsetY = 0;

    this.fingers = {}; // because fingers can refer to points
  }

  //---------------------------------------------------------------------------

  pan(diffX, diffY) {
    diffX = parseInt(diffX);
    diffY = parseInt(diffY);

    if (!isNaN(diffX)) this.offsetX += diffX;
    if (!isNaN(diffY)) this.offsetY += diffY;
  }

  keydown(k) {
    switch (k) {
      case 'P': this.enterPointMode();  break;
      case 'D': this.enterDeleteMode(); break;
      case 'S': this.showConstraints = !this.showConstraints; break;
      default:
        if (this.applyFns[k] && this.applyFn !== this.applyFns[k]) {
          this.clearSelection();
          this.applyFn = this.applyFns[k];
        }
    }
  }

  keyup(k) {
    switch (k) {
      case 'P': this.exitPointMode();  break;
      case 'D': this.exitDeleteMode(); break;
      default:
        if (this.applyFn === this.applyFns[k]) {
          this.clearSelection();
          this.applyFn = undefined;
        }
    }
  }

  enterPointMode() {
    this.pointMode = true;
  }

  exitPointMode() {
    this.pointMode = false;
    this.lastPoint = undefined;
  }

  enterDeleteMode() {
    this.deleteMode = true;
  }

  exitDeleteMode() {
    this.deleteMode = false;
  }

  clearSelection() {
    this.selection = [];
    this.points.forEach(p => p.selectionIndices = []);
  }

  pointContains(p, x, y) {
    return Relax.geom.square(this.pointRadius) >=
      Relax.geom.square(x - p.x - this.offsetX) + Relax.geom.square(y - p.y - this.offsetY);
  }

  pointerdown(e) {
    e.target.setPointerCapture(e.pointerId);

    let point;
    let pointIdx;
    this.points.forEach((p, idx) => {
      if (this.pointContains(p, e.clientX, e.clientY)) {
        point = p;
        pointIdx = idx;
      }
    });

    if (point) {
      if (this.deleteMode) {
        this.removePoint(point);
      } else {
        const constraint = this.addConstraint(new Relax.geom.CoordinateConstraint(point, {
          x: e.clientX,
          y: e.clientY,
        }));
        this.points.splice(pointIdx, 1);
        this.points.push(point);
        this.fingers[e.pointerId] = {
          x: e.clientX - this.offsetX,
          y: e.clientY - this.offsetY,
          point,
          constraint
        };
        point.isSelected = true;
        if (this.pointMode) {
          const oldLastPoint = this.lastPoint;
          this.lastPoint = point;
          if (oldLastPoint && oldLastPoint !== this.lastPoint) {
            this.addLine(oldLastPoint, this.lastPoint);
          }
        }
        if (this.applyFn) {
          const selectionIndex = this.selection.push(point);
          point.selectionIndices.push(selectionIndex);
          if (this.selection.length === this.applyFn.length) {
            this.applyFn(... this.selection);
            this.clearSelection();
          }
        }
      }
    } else if (this.pointMode) {
      const oldLastPoint = this.lastPoint;
      this.lastPoint = this.addPoint(e.clientX - this.offsetX, e.clientY - this.offsetY);
      if (oldLastPoint) {
        this.addLine(oldLastPoint, this.lastPoint);
      }
    } else { // panning
      this.fingers[e.pointerId] = { x: e.clientX, y: e.clientY};
    }
  }

  pointermove(e) {
    const finger = this.fingers[e.pointerId];
    if (finger) {
      if (!finger.point) { // panning
        const diffX = e.clientX - finger.x;
        const diffY = e.clientY - finger.y;
        if (diffX !== 0 || diffY != 0) {
          this.pan(diffX, diffY);
        }
        finger.x = e.clientX;
        finger.y = e.clientY;
      } else {
        finger.x = e.clientX - this.offsetX;
        finger.y = e.clientY - this.offsetY;
      }
    }
  }

  pointerup(e) {
    const finger = this.fingers[e.pointerId];
    if (finger) {
      if (finger.point) {
        finger.point.isSelected = false;
        this.removeConstraint(finger.constraint);
      }
      delete this.fingers[e.pointerId];
    }
  }

  forEachFinger(fn) {
    for (const id in this.fingers) {
      fn(this.fingers[id]);
    }
  }

  updateCoordinateConstraints() {
    this.relax.constraints.forEach(constraint => {
      if (constraint instanceof Relax.geom.CoordinateConstraint) {
        this.forEachFinger(finger => {
          if (finger.point === constraint.p) {
            constraint.c.x = finger.x;
            constraint.c.y = finger.y;
          }
        });
      }
    });
  }

  step() {
    this.updateCoordinateConstraints();
    if (!this.paused) {
      if (this.showEachIteration) {
        this.iterationsPerFrame = this.relax.doOneIteration(Date.now()) ? 1 : 0;
      } else {
        this.iterationsPerFrame = this.relax.iterateForUpToMillis(1000 / 65);
      }
    }
    this.redraw();
    requestAnimationFrame(() => this.step());
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.step();
  }

  //---------------------------------------------------------------------------

  drawPoint(p) {
    this.ctxt.fillStyle = p.isSelected ? 'yellow' : p.color;
    this.ctxt.beginPath();
    this.ctxt.arc(p.x + this.offsetX, p.y + this.offsetY, 8, 0, 2 * Math.PI);
    this.ctxt.closePath()
    this.ctxt.fill();
    if (p.selectionIndices.length > 0) {
      this.drawSelectionIndices(p);
    }
  }

  drawSelectionIndices(p) {
    var text = p.selectionIndices.join(', ');
    this.ctxt.textAlign = 'center';
    this.ctxt.textBaseline = 'middle';
    this.ctxt.lineWidth = 1;
    this.ctxt.strokeStyle = 'blue';
    this.ctxt.strokeText(text, p.x + this.offsetX - 1, p.y + this.offsetY - 1);
    this.ctxt.stroke();
    this.ctxt.strokeStyle = 'yellow';
    this.ctxt.strokeText(text, p.x + this.offsetX, p.y + this.offsetY);
    this.ctxt.stroke();
  }

  drawLine(l) {
    this.ctxt.beginPath();
    this.ctxt.moveTo(l.p1.x + this.offsetX, l.p1.y + this.offsetY);
    this.ctxt.lineWidth = 3;
    this.ctxt.strokeStyle = 'rgba(0,0,0,0.15)';
    this.ctxt.lineTo(l.p2.x + this.offsetX, l.p2.y + this.offsetY);
    this.ctxt.closePath();
    this.ctxt.stroke();
  }

  redraw() {
    this.ctxt.fillStyle = 'white';
    this.ctxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.lines.forEach(l => this.drawLine(l));
    this.points.forEach(p => this.drawPoint(p));
    this.relax.constraints.forEach(c => {
      if (c.draw) {
        c.draw(this, this);
      }
    });
  }
}

function calculateAngle(p1, p2, p3, p4) {
  const v12 = Relax.geom.minus(p2, p1);
  const a12 = Math.atan2(v12.y, v12.x);
  const v34 = Relax.geom.minus(p4, p3);
  const a34 = Math.atan2(v34.y, v34.x);
  return (a12 - a34 + 2 * Math.PI) % (2 * Math.PI);
}

export function parallelConstraint(p1, p2, p3, p4) {
  var angle = calculateAngle(p1, p2, p3, p4);
  if (Math.PI / 2 < angle && angle < 3 * Math.PI / 2) {
    var temp = p3;
    p3 = p4;
    p4 = temp;
  }
  return new Relax.geom.OrientationConstraint(p1, p2, p3, p4, 0);
}

export function perpendicularConstraint(p1, p2, p3, p4) {
  if (calculateAngle(p1, p2, p3, p4) > Math.PI) {
    var temp = p3;
    p3 = p4;
    p4 = temp;
  }
  return new Relax.geom.OrientationConstraint(p1, p2, p3, p4, Math.PI / 2);
}

Relax.geom.CoordinateConstraint.prototype.draw = function(canvas, rc) {
  var ctxt = canvas.ctxt;
  if (this.p.isSelected) return; // don't draw over the selection highlight
  ctxt.fillStyle = 'black';
  ctxt.beginPath();
  ctxt.arc(this.c.x + canvas.offsetX, this.c.y + canvas.offsetY, 8 * 0.666, 0, 2 * Math.PI);
  ctxt.closePath();
  ctxt.fill();
};

Relax.geom.LengthConstraint.prototype.draw = function(canvas, rc) {
  var ctxt = canvas.ctxt;
  if (!rc.showConstraints) return;

  ctxt.lineWidth = 1;
  ctxt.strokeStyle = 'yellow';
  ctxt.beginPath();

  var angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
  var dist = 25;
  var p1x = this.p1.x + canvas.offsetX - dist * Math.cos(angle + Math.PI / 2);
  var p1y = this.p1.y + canvas.offsetY - dist * Math.sin(angle + Math.PI / 2);
  var p2x = this.p2.x + canvas.offsetX - dist * Math.cos(angle + Math.PI / 2);
  var p2y = this.p2.y + canvas.offsetY - dist * Math.sin(angle + Math.PI / 2);

  var textCenterX = (p1x + p2x) / 2 - dist / 2 * Math.cos(angle + Math.PI / 2);
  var textCenterY = (p1y + p2y) / 2 - dist / 2 * Math.sin(angle + Math.PI / 2);

  ctxt.moveTo(
    p1x + 5 * Math.cos(angle + Math.PI / 2),
    p1y + 5 * Math.sin(angle + Math.PI / 2)
  );
  ctxt.lineTo(
    p1x - 5 * Math.cos(angle + Math.PI / 2),
    p1y - 5 * Math.sin(angle + Math.PI / 2)
  );

  ctxt.moveTo(p1x, p1y);
  ctxt.lineTo(p2x, p2y);

  ctxt.moveTo(
    p2x + 5 * Math.cos(angle + Math.PI / 2),
    p2y + 5 * Math.sin(angle + Math.PI / 2)
  );
  ctxt.lineTo(
    p2x - 5 * Math.cos(angle + Math.PI / 2),
    p2y - 5 * Math.sin(angle + Math.PI / 2)
  );
  ctxt.closePath();
  ctxt.stroke();

  ctxt.textAlign = 'center';
  ctxt.textBaseline = 'middle';
  ctxt.strokeText(Math.round(this.l), textCenterX, textCenterY);
  ctxt.stroke();
};
