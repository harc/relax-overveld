var ID = 0;
var getID = () => ID++;

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

  this.showConstraints = false;
  this.showEachIteration = false;
  this.iterationsPerFrame = 0;
  this.paused = false;
  this.points = [];
  this.lines = [];
  this.constraints = [];

  this.constraintConstructors = {
    "Relax.geom.CoordinateConstraint": Relax.geom.CoordinateConstraint,
    "Relax.geom.EquivalenceConstraint": Relax.geom.EquivalenceConstraint,
    "Relax.geom.LengthConstraint": Relax.geom.LengthConstraint,
  };

  this.fingers = {};

  this.pointMode = false;
  this.lastPoint = undefined;

  this.deleteMode = false;

  this.initPointRadius();
  this.initCanvas(canvas);

  var self = this;
  this.applyFns = {
    F: function(p)              { self.addCoordinateConstraint(p, p.x, p.y); },
    Q: function(p1, p2, p3, p4) { self.addEquivalenceConstraint(p1, p2, p3, p4); },
    L: function(p1, p2)         { var l = Relax.geom.magnitude(Relax.geom.minus(p2, p1));
      self.addLengthConstraint(p1, p2, l); },
  };
  this.applyFn = undefined;
  this.selection = [];

  this.stepFn = this.step.bind(this);
  this.step();
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
    case 'L': this.logSerialization();  break;
    case 'P': this.enterPointMode();  break;
    case 'D': this.enterDeleteMode(); break;
    case 'S': console.log("step"); break;
    default:
      if (this.applyFns[k] && this.applyFn !== this.applyFns[k]) {
        this.clearSelection();
        this.applyFn = this.applyFns[k];
      }
  }
};

RelaxCanvas.prototype.serializePoint = function (point) {
  return point.name + ' ' + point.x + ' ' + point.y;
}

RelaxCanvas.prototype.serializeLine = function (line) {
  return line.p1.name + ' ' + line.p2.name;
}

RelaxCanvas.prototype.serializeTopology = function () {
  return '#Name X Y\n' +
      this.points.map(this.serializePoint).join('\n') +
      '\n#Src Dst\n' +
      this.lines.map(this.serializeLine).join('\n');
}

RelaxCanvas.prototype.logSerialization = function () {
  console.log(this.serializeTopology());
}

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
  this.points.forEach(function(p) {
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
  this.points.forEach(function(p, idx) {
    if (self.pointContains(p, e.clientX, e.clientY)) {
      point = p;
      pointIdx = idx;
    }
  });
  if (point) {
    if (this.deleteMode) {
      this.removePoint(point);
    } else {
      var constraint = this.addCoordinateConstraint(point, e.clientX, e.clientY);
      this.points.splice(pointIdx, 1);
      this.points.push(point);
      this.fingers[e.pointerId] =
	{ x: e.clientX, y: e.clientY, point: point, constraint: constraint };
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
    this.removeConstraint(finger.constraint);
    delete this.fingers[e.pointerId];
  }
};

// -----------------------------------------------------

RelaxCanvas.prototype.forEachFinger = function(fn) {
  for (var id in this.fingers) {
    fn(this.fingers[id]);
  }
};

RelaxCanvas.prototype.updateCoordinateConstraints = function() {
  var self = this;
  this.relax.things.forEach(function(constraint) {
    if (constraint instanceof Relax.geom.CoordinateConstraint) {
      self.forEachFinger(function(finger) {
        if (finger.point === constraint.p) {
          constraint.c.x = constraint._spec[1][1] = finger.x;
          constraint.c.y = constraint._spec[1][2] = finger.y;
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

Relax.geom.CoordinateConstraint.prototype.draw = function(ctxt, rc) {
  if (this.p.isSelected) return; // don't draw over the selection highlight
  ctxt.fillStyle = 'black';
  ctxt.beginPath();
  ctxt.arc(this.c.x, this.c.y, rc.pointRadius * 0.666, 0, 2 * Math.PI);
  ctxt.closePath();
  ctxt.fill();
};

Relax.geom.LengthConstraint.prototype.draw = function(ctxt, rc) {
  if (!rc.showConstraints) return;

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
  this.points.forEach(function(p) { self.drawPoint(p); });
  this.relax.things.forEach(function(c) { if (c.draw) { c.draw(self.ctxt, self); } });
};

// -----------------------------------------------------

RelaxCanvas.prototype.addPoint = function(x, y, optColor) {
  var p = {
    x: x,
    y: y,
    color: optColor || 'slateBlue',
    selectionIndices: [],
    name: 'Node' + getID(),
  };
  this.points.push(p);
  this.relax.add(p);
  return p;
};

RelaxCanvas.prototype.addLine = function(p1, p2) {
  var l = new Line(p1, p2);
  this.lines.push(l);
  return l;
};

RelaxCanvas.prototype.addConstraint = function(ctorName /* , arguments, ... */) {
  var args = Array.prototype.slice.call(arguments);
  var ctor = this.constraintConstructors[ctorName];
  ctor = ctor.bind.apply(ctor, args);
  var c = new ctor();
  c._spec = [ctorName, args.slice(1)];
  this.constraints.push(c);
  this.relax.add(c);
  return c;
};

RelaxCanvas.prototype.addCoordinateConstraint = function(p, x, y) {
  return this.addConstraint('Relax.geom.CoordinateConstraint', p, x, y);
};

RelaxCanvas.prototype.addEquivalenceConstraint = function(p1, p2, p3, p4) {
  return this.addConstraint('Relax.geom.EquivalenceConstraint', p1, p2, p3, p4);
};

RelaxCanvas.prototype.addLengthConstraint = function(p1, p2, l) {
  return this.addConstraint('Relax.geom.LengthConstraint', p1, p2, l);
};

RelaxCanvas.prototype.calculateAngle = function(p1, p2, p3, p4) {
  var v12 = {x: p2.x - p1.x, y: p2.y - p1.y};
  var a12 = Math.atan2(v12.y, v12.x);
  var v34 = {x: p4.x - p3.x, y: p4.y - p3.y};
  var a34 = Math.atan2(v34.y, v34.x);
  return (a12 - a34 + 2 * Math.PI) % (2 * Math.PI);
};
// -----------------------------------------------------

RelaxCanvas.prototype.removePoint = function(unwanted) {
  this.relax.remove(unwanted);
  this.points = this.points.filter(function(p) { return p !== unwanted; });
  this.lines = this.lines.filter(function(l) { return !l.involvesPoint(unwanted); });
  this.constraints = this.relax.getConstraints();
};

RelaxCanvas.prototype.removeLine = function(unwanted) {
  this.lines = this.lines.filter(function(l) { return l !== unwanted; });
};

RelaxCanvas.prototype.removeConstraint = function(unwanted) {
  this.relax.remove(unwanted);
  this.constraints = this.constraints.filter(function(c) { return c !== unwanted; });
};

RelaxCanvas.prototype.clear = function() {
  this.relax.clear();

  this.points = [];
  this.lines = [];
  this.constraints = [];

  this.fingers = {}; // because fingers can refer to points
};

class ES6Test {
  test() {
    console.log('ES6 is working');
  }
}

e = new ES6Test();
e.test();

