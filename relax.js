function Relax(canvas) {

  var self = this;
  var ctxt = canvas.getContext('2d');

  var points = [];
  var lines = [];
  var constraints = [];

  var fingers = {};

  function square(x) { return x * x; }

  // ---------------------------

  function Point(x, y, optColor) {
    this.x = x;
    this.y = y;
    this.color = optColor || 'slateblue';
  }

  var iPad = navigator.userAgent.match(/iPad/i) !== null;
  Point.prototype.radius = iPad ? 20 : 5;

  Point.prototype.draw = function(ctxt) {
    ctxt.fillStyle = this.color;
    ctxt.strokeStyle = this.isSelected ? 'yellow' : 'black';
    ctxt.lineWidth = this.isSelected ? 4 : 1;
    ctxt.beginPath();
    ctxt.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctxt.closePath();
    ctxt.fill();
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

  canvas.addEventListener(
      'pointerdown',
      function(e) {
        var point;
        var pointIdx;
        for (var idx = 0; idx < points.length; idx++) {
          var p = points[idx];
          if (p.contains(e.x, e.y)) {
            point = p;
            pointIdx = idx;
          }
        }
        if (point) {
          points.splice(pointIdx, 1);
          points.push(point);
          fingers[e.pointerId] = {x: e.x, y: e.y, point: point};
          point.isSelected = true;
        }
      },
      false
  );

  canvas.addEventListener(
      'pointermove',
      function(e) {
        var finger = fingers[e.pointerId];
        if (finger) {
          finger.x = e.x;
          finger.y = e.y;
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

  // ---------------------------

  function CoordinateConstraint(c, x, y) {
    this.c = c;
    this.x = x;
    this.y = y;
  }

  CoordinateConstraint.prototype.addDeltas = function() {
    this.c.addDelta(this.x - this.c.x, this.y - this.c.y);
  };

  function CoincidenceConstraint(c1, c2) {
    this.c1 = c1;
    this.c2 = c2;
  }

  CoincidenceConstraint.prototype.addDeltas = function() {
    var dx = (this.c2.x - this.c1.x) / 2;
    var dy = (this.c2.y - this.c1.y) / 2;
    this.c1.addDelta(dx, dy);
    this.c2.addDelta(-dx, -dy);
  };

  function EquivalenceConstraint(c1, c2, c3, c4) {
    this.c1 = c1;
    this.c2 = c2;
    this.c3 = c3;
    this.c4 = c4;
  }

  EquivalenceConstraint.prototype.addDeltas = function() {
    var dx1 = (this.c2.x + this.c3.x - this.c4.x - this.c1.x) / 4;
    var dy1 = (this.c2.y + this.c3.y - this.c4.y - this.c1.y) / 4;
    this.c1.addDelta(dx1, dy1);
    this.c4.addDelta(dx1, dy1);

    var dx2 = (this.c1.x + this.c4.x - this.c2.x - this.c3.x) / 4;
    var dy2 = (this.c1.y + this.c4.y - this.c2.y - this.c3.y) / 4;
    this.c2.addDelta(dx2, dy2);
    this.c3.addDelta(dx2, dy2);
  };

  function EqualDistanceConstraint(c1, c2, c3, c4) {
    this.c1 = c1;
    this.c2 = c2;
    this.c3 = c3;
    this.c4 = c4;
  }

  EqualDistanceConstraint.prototype.addDeltas = function() {
    var l12 = Math.sqrt(square(this.c1.x - this.c2.x) + square(this.c1.y - this.c2.y));
    var l34 = Math.sqrt(square(this.c3.x - this.c4.x) + square(this.c3.y - this.c4.y));
    var delta = (l12 - l34) / 4;
    var e12x = (this.c2.x - this.c1.x) / l12;
    var e12y = (this.c2.y - this.c1.y) / l12;

    this.c1.addDelta(delta * e12x, delta * e12y);
    this.c4.addDelta(delta * e12x, delta * e12y);
    this.c2.addDelta(-delta * e12x, -delta * e12y);
    this.c3.addDelta(-delta * e12x, -delta * e12y);
  };

  function LengthConstraint(c1, c2, l) {
    this.c1 = c1;
    this.c2 = c2;
    this.l = l;
  }

  LengthConstraint.prototype.addDeltas = function() {
    var l12 = Math.sqrt(square(this.c1.x - this.c2.x) + square(this.c1.y - this.c2.y));
    var delta = (l12 - this.l) / 2;
    var e12x = (this.c2.x - this.c1.x) / l12;
    var e12y = (this.c2.y - this.c1.y) / l12;

    this.c1.addDelta(delta * e12x, delta * e12y);
    this.c2.addDelta(-delta * e12x, -delta * e12y);
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
          if (finger.point === constraint.c) {
            constraint.x = finger.x;
            constraint.y = finger.y;
          }
        });
      }
    });
  }

  function step() {
    if (constraints.length > 0) {
      updateCoordinateConstraints();
      var count = 0;
      var t0 = Date.now();
      var t;
      do {
        count++;
        forEachFinger(function(finger) {
          finger.point.x = finger.x;
          finger.point.y = finger.y;
        });
        points.forEach(function(point) {
          point.clearDeltas();
        });
        constraints.forEach(function(constraint) {
          constraint.addDeltas();
        });
        points.forEach(function(point) {
          point.x += 0.25 / constraints.length * point.dx;
          point.y += 0.25 / constraints.length * point.dy;
        });
        t = Date.now() - t0;
      } while (t < 1000 / 65);
    }
    redraw();
    self.iterationsPerFrame = count;
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

  this.addCoordinateConstraint = function(p1, p2, x, y) {
    var c = new CoordinateConstraint(p1, p2, x, y);
    constraints.push(c);
    return c;
  };

  this.addEquivalenceConstraint = function(p1, p2, p3, p4) {
    var c = new EquivalenceConstraint(p1, p2, p3, p4);
    constraints.push(c);
    return c;
  };

  this.addLengthConstraint = function(p1, p2, l) {
    return constraints.push(new LengthConstraint(p1, p2, l));
  };
}

