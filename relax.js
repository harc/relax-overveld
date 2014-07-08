function Relax(canvas) {

  var self = this;
  var ctxt = canvas.getContext('2d');
  ctxt.font = '12px Arial';

  var points = [];
  var lines = [];
  var constraints = [];

  var fingers = {};

  var pointMode = false;
  var lastPoint;

  var applyFn;
  var selection = [];

  function square(x) {
    return x * x;
  }

  function dist(p1, p2) {
    return Math.sqrt(square(p2.x - p1.x) + square(p2.y - p1.y));
  }

  // ---------------------------

  var applyFns = {
    F: function(p)              { self.addCoordinateConstraint(p, p.x, p.y); },
    C: function(p1, p2)         { self.addCoincidenceConstraint(p1, p2); },
    Q: function(p1, p2, p3, p4) { self.addEquivalenceConstraint(p1, p2, p3, p4); },
    E: function(p1, p2, p3, p4) { self.addEqualDistanceConstraint(p1, p2, p3, p4); },
    L: function(p1, p2)         { self.addLengthConstraint(p1, p2, dist(p1, p2)); }
  };

  // ---------------------------

  function Point(x, y, optColor) {
    this.x = x;
    this.y = y;
    this.color = optColor || 'slateblue';
    this.selectionIndices = [];
  }

  var tablet = navigator.userAgent.match(/iPad/i) !== null ||
               navigator.userAgent.match(/Android/i) !== null;
  Point.prototype.radius = tablet ? 20 : 8;

  Point.prototype.draw = function(ctxt) {
    ctxt.fillStyle = this.color;
    ctxt.strokeStyle = this.isSelected ? 'yellow' : 'black';
    ctxt.lineWidth = this.isSelected ? 4 : 1;
    ctxt.beginPath();
    ctxt.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctxt.closePath();
    ctxt.fill();
    ctxt.stroke();
    if (this.selectionIndices.length > 0) {
      this.drawSelectionIndices();
    }
  };

  Point.prototype.drawSelectionIndices = function() {
    var text = this.selectionIndices.join(', ');
    ctxt.textAlign = 'center';
    ctxt.textBaseline = 'middle';
    ctxt.lineWidth = 1;
    ctxt.strokeStyle = 'blue';
    ctxt.strokeText(text, this.x - 1, this.y - 1);
    ctxt.stroke();
    ctxt.strokeStyle = 'yellow';
    ctxt.strokeText(text, this.x, this.y);
    ctxt.stroke();
  };

  Point.prototype.contains = function(x, y) {
    return square(this.radius) >= square(x - this.x) + square(y - this.y);
  };

  Point.prototype.clearDeltas = function() {
    this.dx = this.dy = 0;
  };

  Point.prototype.addDelta = function(dx, dy) {
    this.dx += dx;
    this.dy += dy;
  };

  // ---------------------------

  function Line(from, to) {
    this.from = from;
    this.to = to;
  }

  Line.prototype.draw = function(ctxt) {
    ctxt.beginPath();
    ctxt.moveTo(this.from.x, this.from.y);
    ctxt.lineWidth = 1;
    ctxt.strokeStyle = 'gray';
    ctxt.lineTo(this.to.x, this.to.y);
    ctxt.closePath();
    ctxt.stroke();
  };

  // ---------------------------

  function redraw() {
    ctxt.fillStyle = 'white';
    ctxt.fillRect(0, 0, canvas.width, canvas.height);
    lines.forEach(function(line) {
      line.draw(ctxt);
    });
    points.forEach(function(point) {
      point.draw(ctxt);
    });
  }

 
  this.keydown = function(k) {
    switch (k) {
      case 'P': self.enterPointMode();  break;
      default:
        if (applyFns[k] && applyFn !== applyFns[k]) {
          clearSelection();
          applyFn = applyFns[k];
        }
    }
  };
 
  canvas.addEventListener(
      'keydown',
      function(e) {
        self.keydown(String.fromCharCode(e.keyCode));
      },
      false
  );

  this.keyup = function(k) {
    switch (k) {
      case 'P': self.exitPointMode();  break;
      default:
        if (applyFn === applyFns[k]) {
          clearSelection();
          applyFn = undefined;
        }
    }
  };

  canvas.addEventListener(
      'keyup',
      function(e) {
        self.keyup(String.fromCharCode(e.keyCode));
      },
      false
  );

  canvas.addEventListener(
      'pointerdown',
      function(e) {
        var point;
        var pointIdx;
        for (var idx = 0; idx < points.length; idx++) {
          var p = points[idx];
          if (p.contains(e.clientX, e.clientY)) {
            point = p;
            pointIdx = idx;
          }
        }
        if (point) {
          points.splice(pointIdx, 1);
          points.push(point);
          fingers[e.pointerId] = {x: e.clientX, y: e.clientY, point: point};
          point.isSelected = true;
          if (pointMode) {
            var oldLastPoint = lastPoint;
            lastPoint = point;
            if (oldLastPoint && oldLastPoint !== lastPoint) {
              self.addLine(oldLastPoint, lastPoint);
            }
          }
          if (applyFn) {
            var selectionIndex = selection.push(point);
            point.selectionIndices.push(selectionIndex);
            if (selection.length === applyFn.length) {
              applyFn.apply(undefined, selection);
              clearSelection();
            }
          }
        } else {
          if (pointMode) {
            var oldLastPoint = lastPoint;
            lastPoint = self.addPoint(e.clientX, e.clientY);
            if (oldLastPoint) {
              self.addLine(oldLastPoint, lastPoint);
            }
          }
        }
      },
      false
  );

  canvas.addEventListener(
      'pointermove',
      function(e) {
        var finger = fingers[e.pointerId];
        if (finger) {
          finger.x = e.clientX;
          finger.y = e.clientY;
        }
      },
      false
  );

  canvas.addEventListener(
      'pointerup',
      function(e) {
        var finger = fingers[e.pointerId];
        if (finger) {
          finger.point.isSelected = false;
          delete fingers[e.pointerId];
        }
      },
      false
  );

  this.enterPointMode = function() {
    pointMode = true;
  };

  this.exitPointMode = function() {
    pointMode = false;
    lastPoint = undefined;
  };

  function clearSelection() {
    selection = [];
    points.forEach(function(point) {
      point.selectionIndices = [];
    });
  }

  // ---------------------------

  function CoordinateConstraint(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
  }

  CoordinateConstraint.prototype.addDeltas = function() {
    this.p.addDelta(this.x - this.p.x, this.y - this.p.y);
  };

  function CoincidenceConstraint(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  CoincidenceConstraint.prototype.addDeltas = function() {
    var dx = (this.p2.x - this.p1.x) / 2;
    var dy = (this.p2.y - this.p1.y) / 2;
    this.p1.addDelta(dx, dy);
    this.p2.addDelta(-dx, -dy);
  };

  function EquivalenceConstraint(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  EquivalenceConstraint.prototype.addDeltas = function() {
    var dx1 = (this.p2.x + this.p3.x - this.p4.x - this.p1.x) / 4;
    var dy1 = (this.p2.y + this.p3.y - this.p4.y - this.p1.y) / 4;
    this.p1.addDelta(dx1, dy1);
    this.p4.addDelta(dx1, dy1);

    var dx2 = (this.p1.x + this.p4.x - this.p2.x - this.p3.x) / 4;
    var dy2 = (this.p1.y + this.p4.y - this.p2.y - this.p3.y) / 4;
    this.p2.addDelta(dx2, dy2);
    this.p3.addDelta(dx2, dy2);
  };

  function EqualDistanceConstraint(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  EqualDistanceConstraint.prototype.addDeltas = function() {
    var l12 = dist(this.p1, this.p2);
    var l34 = dist(this.p3, this.p4);
    var delta = (l12 - l34) / 4;
    var e12x = (this.p2.x - this.p1.x) / l12;
    var e12y = (this.p2.y - this.p1.y) / l12;

    this.p1.addDelta(delta * e12x, delta * e12y);
    this.p4.addDelta(delta * e12x, delta * e12y);
    this.p2.addDelta(-delta * e12x, -delta * e12y);
    this.p3.addDelta(-delta * e12x, -delta * e12y);
  };

  function LengthConstraint(p1, p2, l) {
    this.p1 = p1;
    this.p2 = p2;
    this.l = l;
  }

  LengthConstraint.prototype.addDeltas = function() {
    var l12 = dist(this.p1, this.p2);
    var delta = (l12 - this.l) / 2;
    var e12x = (this.p2.x - this.p1.x) / l12;
    var e12y = (this.p2.y - this.p1.y) / l12;

    this.p1.addDelta(delta * e12x, delta * e12y);
    this.p2.addDelta(-delta * e12x, -delta * e12y);
  };

  // ---------------------------

  function forEachFinger(fn) {
    for (var id in fingers) {
      fn(fingers[id]);
    }
  }

  function updateCoordinateConstraints() {
    constraints.forEach(function(constraint) {
      if (constraint instanceof CoordinateConstraint) {
        forEachFinger(function(finger) {
          if (finger.point === constraint.p) {
            constraint.x = finger.x;
            constraint.y = finger.y;
          }
        });
      }
    });
  }

  function movePointsToFingers() {
    forEachFinger(function(finger) {
      finger.point.x = finger.x;
      finger.point.y = finger.y;
    });
  }

  function step() {
    updateCoordinateConstraints();
    var count = 0;
    var t0 = Date.now();
    var t;
    do {
      count++;
      movePointsToFingers();
      points.forEach(function(point) {
        point.clearDeltas();
      });
      constraints.forEach(function(constraint) {
        constraint.addDeltas();
      });
      points.forEach(function(point) {
        point.x += 0.25 * point.dx;
        point.y += 0.25 * point.dy;
      });
      t = Date.now() - t0;
    } while (t < 1000 / 65);
    self.iterationsPerFrame = count;
    redraw();
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);

  // ---------------------------

  this.clear = function() {
    points = [];
    lines = [];
    constraints = [];
  };

  this.addPoint = function(x, y, optColor) {
    var p = new Point(x, y, optColor);
    points.push(p);
    return p;
  };

  this.addLine = function(p1, p2) {
    var l = new Line(p1, p2);
    lines.push(l);
    return l;
  };

  this.addCoordinateConstraint = function(p, x, y) {
    var c = new CoordinateConstraint(p, x, y);
    constraints.push(c);
    return c;
  };

  this.addCoincidenceConstraint = function(p1, p2) {
    var c = new CoincidenceConstraint(p1, p2);
    constraints.push(c);
    return c;
  };

  this.addEquivalenceConstraint = function(p1, p2, p3, p4) {
    var c = new EquivalenceConstraint(p1, p2, p3, p4);
    constraints.push(c);
    return c;
  };

  this.addEqualDistanceConstraint = function(p1, p2, p3, p4) {
    var c = new EqualDistanceConstraint(p1, p2, p3, p4);
    constraints.push(c);
    return c;
  };

  this.addLengthConstraint = function(p1, p2, l) {
    if (l > 0.001) {
      var c = new LengthConstraint(p1, p2, l);
      constraints.push(c);
      return c;
    }
  };
}

