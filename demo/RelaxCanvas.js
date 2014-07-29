function Line(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
}

Line.prototype.involvesPoint = function(p) {
  return p === this.p1 || p === this.p2;
};

// -----------------------------------------------------

function RelaxCanvas(relax, canvas) {
  this.relax = relax;
  this.initPointRadius();
  this.initCanvas(canvas);
  this.showConstraints = false;
  this.showEachIteration = false;
  this.iterationsPerFrame = 0;
  this.paused = false;
  this.points = [];
  this.lines = [];
  this.stepFn = this.step.bind(this);
  this.step();

  this.fingers = {};

  this.pointMode = false;
  this.lastPoint = undefined;

  this.deleteMode = false;

  var self = this;
  this.applyFns = {
    F: function(p)              { self.addCoordinateConstraint(p, p.x, p.y); },
    C: function(p1, p2)         { self.addCoincidenceConstraint(p1, p2); },
    Q: function(p1, p2, p3, p4) { self.addEquivalenceConstraint(p1, p2, p3, p4); },
    E: function(p1, p2, p3, p4) { self.addEqualDistanceConstraint(p1, p2, p3, p4); },
    L: function(p1, p2)         { self.addLengthConstraint(p1, p2, p2.minus(p1).magnitude()); },
    O: function(p1, p2, p3, p4) { self.addOrientationConstraint(p1, p2, p3, p4); },
    R: function(p1, p2, p3, p4) { self.addParallelConstraint(p1, p2, p3, p4); },
    N: function(p1, p2, p3, p4) { self.addPerpendicularConstraint(p1, p2, p3, p4); },
    M: function(p1, p2)         { self.addMotorConstraint(p1, p2, 1); }
  };
  this.applyFn = undefined;
  this.selection = [];

  this.relax.beforeEachIteration = this.movePointsToFingers.bind(this);
}

RelaxCanvas.prototype.initPointRadius = function() {
  var tablet = navigator.userAgent.match(/iPad/i) !== null ||
               navigator.userAgent.match(/Android/i) !== null;
  this.pointRadius = tablet ? 20 : 8;
};

RelaxCanvas.prototype.initCanvas = function(canvas) {

  this.canvas = canvas;

  var self = this;
  canvas.addEventListener('keydown', function(e) { self.keydown(String.fromCharCode(e.keyCode)); }, false);
  canvas.addEventListener('keyup',   function(e) { self.keyup(String.fromCharCode(e.keyCode)); },   false);

  canvas.addEventListener('keyup',       this.keyup.bind(this),       false);

  canvas.addEventListener('pointerdown', this.pointerdown.bind(this), false);
  canvas.addEventListener('pointermove', this.pointermove.bind(this), false);
  canvas.addEventListener('pointerup',   this.pointerup.bind(this),   false);

  this.ctxt = canvas.getContext('2d');
  this.ctxt.font = '12px Arial';
  this.ctxt.shadowOffsetX = 1;
  this.ctxt.shadowOffsetY = 1;
  this.ctxt.shadowColor = '#999';
  this.ctxt.shadowBlur = 1;
};

// -----------------------------------------------------

RelaxCanvas.prototype.keydown = function(k) {
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
};

RelaxCanvas.prototype.keyup = function(k) {
  switch (k) {
    case 'P': this.exitPointMode();  break;
    case 'D': this.exitDeleteMode(); break;
    default:
      if (this.applyFn === this.applyFns[k]) {
        this.clearSelection();
        this.applyFn = undefined;
      }
  }
};

RelaxCanvas.prototype.enterPointMode = function() {
  this.pointMode = true;
};

RelaxCanvas.prototype.exitPointMode = function() {
  this.pointMode = false;
  this.lastPoint = undefined;
};

RelaxCanvas.prototype.enterDeleteMode = function() {
  this.deleteMode = true;
};

RelaxCanvas.prototype.exitDeleteMode = function() {
  this.deleteMode = false;
};

RelaxCanvas.prototype.clearSelection = function() {
  this.selection = [];
  this.relax.things.forEach(function(p) {
    p.selectionIndices = [];
  });
};

// -----------------------------------------------------

RelaxCanvas.prototype.pointContains = function(p, x, y) {
  function square(x) { return x * x; }
  return square(this.pointRadius) >= square(x - p.x) + square(y - p.y);
};

RelaxCanvas.prototype.pointerdown = function(e) {
  var self = this;
  var point;
  var pointIdx;
  this.relax.things.forEach(function(p, idx) {
    if (self.pointContains(p, e.clientX, e.clientY)) {
      point = p;
      pointIdx = idx;
    }
  });
  if (point) {
    if (this.deleteMode) {
      this.removePoint(point);
    } else {
      this.relax.things.splice(pointIdx, 1);
      this.relax.things.push(point);
      this.fingers[e.pointerId] = {x: e.clientX, y: e.clientY, point: point};
      point.isSelected = true;
      if (this.pointMode) {
        var oldLastPoint = this.lastPoint;
        this.lastPoint = point;
        if (oldLastPoint && oldLastPoint !== this.lastPoint) {
          this.addLine(oldLastPoint, this.lastPoint);
        }
      }
      if (this.applyFn) {
        var selectionIndex = this.selection.push(point);
        point.selectionIndices.push(selectionIndex);
        if (this.selection.length === this.applyFn.length) {
          this.applyFn.apply(undefined, this.selection);
          this.clearSelection();
        }
      }
    }
  } else if (this.pointMode) {
    var oldLastPoint = this.lastPoint;
    this.lastPoint = this.addPoint(e.clientX, e.clientY);
    if (oldLastPoint) {
      this.addLine(oldLastPoint, this.lastPoint);
    }
  }
};

RelaxCanvas.prototype.pointermove = function(e) {
  var finger = this.fingers[e.pointerId];
  if (finger) {
    finger.x = e.clientX;
    finger.y = e.clientY;
  }
};

RelaxCanvas.prototype.pointerup = function(e) {
  var finger = this.fingers[e.pointerId];
  if (finger) {
    finger.point.isSelected = false;
    delete this.fingers[e.pointerId];
  }
};

// -----------------------------------------------------

RelaxCanvas.prototype.forEachFinger = function(fn) {
  for (var id in this.fingers) {
    fn(this.fingers[id]);
  }
};

RelaxCanvas.prototype.movePointsToFingers = function() {
  this.forEachFinger(function(finger) {
    finger.point.x = finger.x;
    finger.point.y = finger.y;
  });
};

RelaxCanvas.prototype.updateCoordinateConstraints = function() {
  var self = this;
  this.relax.things.forEach(function(constraint) {
    if (constraint instanceof Relax.geom.CoordinateConstraint) {
      self.forEachFinger(function(finger) {
        if (finger.point === constraint.p) {
          constraint.c.x = finger.x;
          constraint.c.y = finger.y;
        }
      });
    }
  });
};

RelaxCanvas.prototype.step = function() {
  this.updateCoordinateConstraints();
  if (!this.paused) {
    if (this.showEachIteration) {
      this.iterationsPerFrame = this.relax.doOneIteration(Date.now()) ? 1 : 0;
    } else {
      this.iterationsPerFrame = this.relax.iterateForUpToMillis(1000 / 65);
    }
  } else {
    this.movePointsToFingers();
  }
  this.redraw();
  requestAnimationFrame(this.stepFn);
}

RelaxCanvas.prototype.pause = function() {
  this.paused = true;
};

RelaxCanvas.prototype.resume = function() {
  this.paused = false;
  this.step();
};

// -----------------------------------------------------

RelaxCanvas.prototype.drawPoint = function(p) {
  this.ctxt.fillStyle = p.isSelected ? 'yellow' : p.color;
  this.ctxt.beginPath();
  this.ctxt.arc(p.x, p.y, this.pointRadius, 0, 2 * Math.PI);
  this.ctxt.closePath()
  this.ctxt.fill();
  if (p.selectionIndices.length > 0) {
    this.drawSelectionIndices(p);
  }
};

RelaxCanvas.prototype.drawSelectionIndices = function(p) {
  var text = p.selectionIndices.join(', ');
  this.ctxt.textAlign = 'center';
  this.ctxt.textBaseline = 'middle';
  this.ctxt.lineWidth = 1;
  this.ctxt.strokeStyle = 'blue';
  this.ctxt.strokeText(text, p.x - 1, p.y - 1);
  this.ctxt.stroke();
  this.ctxt.strokeStyle = 'yellow';
  this.ctxt.strokeText(text, p.x, p.y);
  this.ctxt.stroke();
};

RelaxCanvas.prototype.drawLine = function(l) {
  this.ctxt.beginPath();
  this.ctxt.moveTo(l.p1.x, l.p1.y);
  this.ctxt.lineWidth = 3;
  this.ctxt.strokeStyle = 'gray';
  this.ctxt.lineTo(l.p2.x, l.p2.y);
  this.ctxt.closePath();
  this.ctxt.stroke();
};

Relax.geom.LengthConstraint.prototype.draw = function(ctxt) {
  ctxt.lineWidth = 1;
  ctxt.strokeStyle = 'yellow';
  ctxt.beginPath();

  var angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
  var dist = 25;
  var p1x = this.p1.x - dist * Math.cos(angle + Math.PI / 2);
  var p1y = this.p1.y - dist * Math.sin(angle + Math.PI / 2);
  var p2x = this.p2.x - dist * Math.cos(angle + Math.PI / 2);
  var p2y = this.p2.y - dist * Math.sin(angle + Math.PI / 2);

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

RelaxCanvas.prototype.redraw = function() {
  var self = this;
  this.ctxt.fillStyle = 'white';
  this.ctxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.lines.forEach(function(l) { self.drawLine(l); });
  this.relax.things.forEach(function(p) { self.drawPoint(p); });
  if (this.showConstraints) {
    this.relax.things.forEach(function(c) { if (c.draw) { c.draw(self.ctxt); } });
  }
};

// -----------------------------------------------------

RelaxCanvas.prototype.addPoint = function(x, y, optColor) {
  var p = {x: x, y: y, color: optColor || 'slateBlue', selectionIndices: []};
  this.points.push(p);
  this.relax.add(p);
  return p;
};

RelaxCanvas.prototype.addLine = function(p1, p2) {
  var l = new Line(p1, p2);
  this.lines.push(l);
  return l;
};

RelaxCanvas.prototype.addCoordinateConstraint = function(p, x, y) {
  p.color = 'black';
  return this.relax.add(new Relax.geom.CoordinateConstraint(p, x, y));
};

RelaxCanvas.prototype.addCoincidenceConstraint = function(p1, p2) {
  return this.relax.add(new Relax.geom.CoincidenceConstraint(p1, p2));
};

RelaxCanvas.prototype.addEquivalenceConstraint = function(p1, p2, p3, p4) {
  return this.relax.add(new Relax.geom.EquivalenceConstraint(p1, p2, p3, p4));
};

RelaxCanvas.prototype.addEqualDistanceConstraint = function(p1, p2, p3, p4) {
  return this.relax.addConstraint('eqdist', p1, p2, p3, p4);
};

RelaxCanvas.prototype.addLengthConstraint = function(p1, p2, l) {
  return this.relax.addConstraint('length', p1, p2, l);
};

RelaxCanvas.prototype.calculateAngle = function(p1, p2, p3, p4) {
  var v12 = {x: p2.x - p1.x, y: p2.y - p1.y};
  var a12 = Math.atan2(v12.y, v12.x);
  var v34 = {x: p4.x - p3.x, y: p4.y - p3.y};
  var a34 = Math.atan2(v34.y, v34.x);
  return (a12 - a34 + 2 * Math.PI) % (2 * Math.PI);
};

RelaxCanvas.prototype.addOrientationConstraint = function(p1, p2, p3, p4) {
  return this.relax.addConstraint('orientation', p1, p2, p3, p4, this.calculateAngle(p1, p2, p3, p4));
};

RelaxCanvas.prototype.addParallelConstraint = function(p1, p2, p3, p4) {
  var angle = this.calculateAngle(p1, p2, p3, p4);
  if (Math.PI / 2 < angle && angle < 3 * Math.PI / 2) {
    var temp = p3;
    p3 = p4;
    p4 = temp;
  }
  return this.relax.addConstraint('orientation', p1, p2, p3, p4, 0);
};

RelaxCanvas.prototype.addPerpendicularConstraint = function(p1, p2, p3, p4) {
  if (this.calculateAngle(p1, p2, p3, p4) > Math.PI) {
    var temp = p3;
    p3 = p4;
    p4 = temp;
  }
  return this.relax.addConstraint('orientation', p1, p2, p3, p4, Math.PI / 2);
};

RelaxCanvas.prototype.addMotorConstraint = function(p1, p2, w) {
  return this.relax.addConstraint('motor', p1, p2, w);
};

// -----------------------------------------------------

RelaxCanvas.prototype.removePoint = function(unwanted) {
  this.relax.remove(unwanted);
  this.points = this.points.filter(function(p) { return p !== unwanted; });
  this.lines = this.lines.filter(function(l) { return !l.involvesPoint(unwanted); });
};

RelaxCanvas.prototype.removeLine = function(unwanted) {
  this.lines = this.lines.filter(function(l) { return l !== unwanted; });
};

RelaxCanvas.prototype.removeConstraint = function(unwanted) {
  this.relax.removeConstraint(unwanted);
};

RelaxCanvas.prototype.clear = function() {
  var self = this;
  this.points.forEach(function(p) { self.removePoint(p); });
};

