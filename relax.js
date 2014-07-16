function Relax(canvas) {

  var self = this;
  var ctxt = canvas.getContext('2d');
  ctxt.font = '12px Arial';
  ctxt.shadowOffsetX = 1;
  ctxt.shadowOffsetY = 1;
  ctxt.shadowColor = '#999';
  ctxt.shadowBlur = 1;

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

  // ---------------------------

  var applyFns = {
    F: function(p)              { self.addCoordinateConstraint(p, p.clone()); },
    C: function(p1, p2)         { self.addCoincidenceConstraint(p1, p2); },
    Q: function(p1, p2, p3, p4) { self.addEquivalenceConstraint(p1, p2, p3, p4); },
    E: function(p1, p2, p3, p4) { self.addEqualDistanceConstraint(p1, p2, p3, p4); },
    L: function(p1, p2)         { self.addLengthConstraint(p1, p2, p2.minus(p1).magnitude()); },
    O: function(p1, p2, p3, p4) { self.addOrientationConstraint(p1, p2, p3, p4); },
    R: function(p1, p2, p3, p4) { self.addParallelConstraint(p1, p2, p3, p4); },
    N: function(p1, p2, p3, p4) { self.addPerpendicularConstraint(p1, p2, p3, p4); },
    M: function(p1, p2)         { self.addMotorConstraint(p1, p2, 1); }
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
    ctxt.fillStyle = this.isSelected ? 'yellow' : this.color;
    ctxt.beginPath();
    ctxt.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctxt.closePath();
    ctxt.fill();
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

  Point.prototype.plus = function(that) {
    return new Point(this.x + that.x, this.y + that.y);
  };

  Point.prototype.minus = function(that) {
    return new Point(this.x - that.x, this.y - that.y);
  };

  Point.prototype.negated = function() {
    return this.scaledBy(-1);
  };

  Point.prototype.clone = function() {
    return this.scaledBy(1);
  };

  Point.prototype.contains = function(x, y) {
    return square(this.radius) >= square(x - this.x) + square(y - this.y);
  };

  Point.prototype.clearDelta = function() {
    if (this.delta) {
      this.delta.x = this.delta.y = 0;
    } else {
      this.delta = new Point(0, 0);
    }
  };

  Point.prototype.addDelta = function(d) {
    this.delta.x += d.x;
    this.delta.y += d.y;
  };

  // The following methods only make sense when the Point represents a vector.

  Point.prototype.scaledBy = function(n) {
    return new Point(this.x * n, this.y * n);
  };

  Point.prototype.magnitude = function() {
    return Math.sqrt(square(this.x) + square(this.y));
  };

  Point.prototype.normalized = function() {
    return this.scaledBy(1 / this.magnitude());
  };

  Point.prototype.rotatedBy = function(dTheta) {
    var theta = Math.atan2(this.y, this.x) + dTheta;
    var mag = this.magnitude();
    return new Point(mag * Math.cos(theta), mag * Math.sin(theta));
  };

  // ---------------------------

  function Line(from, to) {
    this.from = from;
    this.to = to;
  }

  Line.prototype.draw = function(ctxt) {
    ctxt.beginPath();
    ctxt.moveTo(this.from.x, this.from.y);
    ctxt.lineWidth = 3;
    ctxt.strokeStyle = 'gray';
    ctxt.lineTo(this.to.x, this.to.y);
    ctxt.closePath();
    ctxt.stroke();
  };

  // ---------------------------

  this.showConstraints = false;

  function redraw() {
    ctxt.fillStyle = 'white';
    ctxt.fillRect(0, 0, canvas.width, canvas.height);
    lines.forEach(function(line) {
      line.draw(ctxt);
    });
    points.forEach(function(point) {
      point.draw(ctxt);
    });
    if (self.showConstraints) {
      constraints.forEach(function(constraint) {
        if (constraint.draw) {
          constraint.draw(ctxt);
        }
      });
    }
  }

 
  this.keydown = function(k) {
    switch (k) {
      case 'P': self.enterPointMode(); break;
      case 'S': self.showConstraints = !self.showConstraints; break;
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

  function CoordinateConstraint(p, c) {
    this.p = p;
    this.c = c;
  }

  CoordinateConstraint.prototype.addDeltas = function() {
    this.p.addDelta(this.c.minus(this.p));
  };

  function CoincidenceConstraint(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  CoincidenceConstraint.prototype.addDeltas = function() {
    var d = this.p2.minus(this.p1).scaledBy(0.5);
    this.p1.addDelta(d);
    this.p2.addDelta(d.negated());
  };

  function EquivalenceConstraint(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  EquivalenceConstraint.prototype.addDeltas = function() {
    var d1 = this.p2.plus(this.p3).minus(this.p4).minus(this.p1).scaledBy(0.25);
    this.p1.addDelta(d1);
    this.p4.addDelta(d1);

    var d2 = this.p1.plus(this.p4).minus(this.p2).minus(this.p3).scaledBy(0.25);
    this.p2.addDelta(d2);
    this.p3.addDelta(d2);
  };

  function EqualDistanceConstraint(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  EqualDistanceConstraint.prototype.addDeltas = function() {
    var l12 = this.p1.minus(this.p2).magnitude();
    var l34 = this.p3.minus(this.p4).magnitude();
    var delta = (l12 - l34) / 4;
    var e12 = this.p2.minus(this.p1).normalized();
    var e34 = this.p4.minus(this.p3).normalized();

    this.p1.addDelta(e12.scaledBy(delta));
    this.p2.addDelta(e12.scaledBy(-delta));
    this.p3.addDelta(e34.scaledBy(-delta));
    this.p4.addDelta(e34.scaledBy(delta));
  };

  function LengthConstraint(p1, p2, l) {
    this.p1 = p1;
    this.p2 = p2;
    this.l = l;
  }

  LengthConstraint.prototype.addDeltas = function() {
    var l12 = this.p1.minus(this.p2).magnitude();
    var delta = (l12 - this.l) / 2;
    var e12 = this.p2.minus(this.p1).normalized();

    var d = e12.scaledBy(delta);
    this.p1.addDelta(d);
    this.p2.addDelta(d.negated());
  };

  LengthConstraint.prototype.draw = function(ctxt) {
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

  function OrientationConstraint(p1, p2, p3, p4, theta) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.theta = theta;
  }

  OrientationConstraint.prototype.addDeltas = function() {
    var v12 = this.p2.minus(this.p1);
    var a12 = Math.atan2(v12.y, v12.x);
    var m12 = this.p1.plus(this.p2).scaledBy(0.5);

    var v34 = this.p4.minus(this.p3);
    var a34 = Math.atan2(v34.y, v34.x);
    var m34 = this.p3.plus(this.p4).scaledBy(0.5);

    var currTheta = a12 - a34;
    var dTheta = this.theta - currTheta;
    // TODO: figure out why setting dTheta to 1/2 times this value (as shown in the paper
    // and seems to make sense) results in jumpy/unstable behavior.

    this.p1.addDelta(m12.plus(this.p1.minus(m12).rotatedBy(dTheta)).minus(this.p1));
    this.p2.addDelta(m12.plus(this.p2.minus(m12).rotatedBy(dTheta)).minus(this.p2));

    this.p3.addDelta(m34.plus(this.p3.minus(m34).rotatedBy(-dTheta)).minus(this.p3));
    this.p4.addDelta(m34.plus(this.p4.minus(m34).rotatedBy(-dTheta)).minus(this.p4));
  };

  function MotorConstraint(p1, p2, w) {
    this.p1 = p1;
    this.p2 = p2;
    this.w = w;
    this.lastT = Date.now();
  }

  MotorConstraint.prototype.addDeltas = function() {
    var now = Date.now();
    var t = now - this.lastT;
    var dTheta = t * this.w * 2 * Math.PI / 1000;
    var m12 = this.p1.plus(this.p2).scaledBy(0.5);
    this.p1.addDelta(m12.plus(this.p1.minus(m12).rotatedBy(dTheta)).minus(this.p1));
    this.p2.addDelta(m12.plus(this.p2.minus(m12).rotatedBy(dTheta)).minus(this.p2));
    this.lastT = now;
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
            constraint.c.x = finger.x;
            constraint.c.y = finger.y;
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

  self.showEachIteration = false;

  function step() {
    updateCoordinateConstraints();
    var count = 0;
    var t0 = Date.now();
    var t;
    do {
      count++;
      movePointsToFingers();
      points.forEach(function(point) {
        point.clearDelta();
      });
      constraints.forEach(function(constraint) {
        constraint.addDeltas();
      });
      points.forEach(function(point) {
        point.x += 0.25 * point.delta.x;
        point.y += 0.25 * point.delta.y;
      });
      t = Date.now() - t0;
    } while (!self.showEachIteration && constraints.length > 0 && t < 1000 / 65);
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

  this.addCoordinateConstraint = function(p, c) {
p.color = 'black';
    var c = new CoordinateConstraint(p, c);
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

  this.addOrientationConstraint = function(p1, p2, p3, p4) {
    var c = new OrientationConstraint(p1, p2, p3, p4, calculateAngle(p1, p2, p3, p4));
    constraints.push(c);
    return c;
  };

  function calculateAngle(p1, p2, p3, p4) {
    var v12 = p2.minus(p1);
    var a12 = Math.atan2(v12.y, v12.x);
    var v34 = p4.minus(p3);
    var a34 = Math.atan2(v34.y, v34.x);
    return (a12 - a34 + 2 * Math.PI) % (2 * Math.PI);
  }

  this.addParallelConstraint = function(p1, p2, p3, p4) {
    var angle = calculateAngle(p1, p2, p3, p4);
    if (Math.PI / 2 < angle && angle < 3 * Math.PI / 2) {
      var temp = p3;
      p3 = p4;
      p4 = temp;
    }
    var c = new OrientationConstraint(p1, p2, p3, p4, 0);
    constraints.push(c);
    return c;
  };

  this.addPerpendicularConstraint = function(p1, p2, p3, p4) {
    if (calculateAngle(p1, p2, p3, p4) > Math.PI) {
      var temp = p3;
      p3 = p4;
      p4 = temp;
    }
    var c = new OrientationConstraint(p1, p2, p3, p4, Math.PI / 2);
    constraints.push(c);
    return c;
  };

  this.addMotorConstraint = function(p1, p2, w) {
    var c = new MotorConstraint(p1, p2, w);
    constraints.push(c);
    return c;
  }
}

