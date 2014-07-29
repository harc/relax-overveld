function installGeometricConstraints(Relax) {

  // This is a collection of geometric constraints that can be applied to
  // objects that have x and y properties. Other properties are ignored.

  Relax.geom = {};

  // Helpers

  function square(n) {
    return n * n;
  }

  function plus(p1, p2) {
    return {x: p1.x + p2.x, y: p1.y + p2.y};
  }

  function minus(p1, p2) {
    return {x: p1.x - p2.x, y: p1.y - p2.y};
  }

  function scaledBy(p, m) {
    return {x: p.x * m, y: p.y * m};
  }

  function copy(p) {
    return scaledBy(p, 1);
  }

  function midpoint(p1, p2) {
    return scaledBy(plus(p1, p2), 0.5);
  }

  function magnitude(p) {
    return Math.sqrt(square(p.x) + square(p.y));
  }

  function normalized(p) {
    return scaledBy(p, 1 / magnitude(p));
  }

  function rotatedBy(p, dTheta) {
    var c = Math.cos(dTheta);
    var s = Math.sin(dTheta);
    return {x: c*p.x - s*p.y, y: s*p.x + c*p.y};
  }

  function rotatedAround(p, dTheta, axis) {
    return plus(axis, rotatedBy(minus(p, axis), dTheta));
  }

  function setDelta(d, p, scale) {
    d.x = p.x * scale;
    d.y = p.y * scale;
  }

  Relax.geom.square = square;
  Relax.geom.plus = plus;
  Relax.geom.minus = minus;
  Relax.geom.scaledBy = scaledBy;
  Relax.geom.copy = copy;
  Relax.geom.midpoint = midpoint;
  Relax.geom.magnitude = magnitude;
  Relax.geom.normalized = normalized;
  Relax.geom.rotatedBy = rotatedBy;
  Relax.geom.rotatedAround = rotatedAround;
  Relax.geom.setDelta = setDelta;

  // Coordinate Constraint, i.e., "I want this point to be here".

  Relax.geom.CoordinateConstraint = function(p, x, y) {
    this.p = p;
    this.c = {x: x, y: y};
    this.dP = Relax.makeDeltaFor(p);
  }

  Relax.geom.CoordinateConstraint.prototype.computeDeltas = function(timeMillis) {
    var diff = minus(this.c, this.p);
    this.dP.x = diff.x;
    this.dP.y = diff.y;
  };

  // Coincidence Constraint, i.e., I want these two points to be at the same place.

  Relax.geom.CoincidenceConstraint = function(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
  }

  Relax.geom.CoincidenceConstraint.prototype.computeDeltas = function(timeMillis) {
    var splitDiff = scaledBy(minus(this.p2, this.p1), 0.5);
    setDelta(this.dP1, splitDiff, +1);
    setDelta(this.dP2, splitDiff, -1);
  };

  // Equivalence Constraint, i.e., I want the vectors p1->p2 and p3->p4 to be the same.

  Relax.geom.EquivalenceConstraint = function(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
    this.dP3 = Relax.makeDeltaFor(p3);
    this.dP4 = Relax.makeDeltaFor(p4);
  }

  Relax.geom.EquivalenceConstraint.prototype.computeDeltas = function(timeMillis) {
    var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.25);
    setDelta(this.dP1, splitDiff, +1);
    setDelta(this.dP2, splitDiff, -1);
    setDelta(this.dP3, splitDiff, -1);
    setDelta(this.dP4, splitDiff, +1);
  };

  // Equal Distance constraint - keeps distances P1-->P2, P3-->P4 equal

  Relax.geom.EqualDistanceConstraint = function(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
    this.dP3 = Relax.makeDeltaFor(p3);
    this.dP4 = Relax.makeDeltaFor(p4);
  };

  Relax.geom.EqualDistanceConstraint.prototype.computeDeltas = function(timeMillis) {
    var l12 = magnitude(minus(this.p1, this.p2));
    var l34 = magnitude(minus(this.p3, this.p4));
    var delta = (l12 - l34) / 4;
    var e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
    var e34 = scaledBy(normalized(minus(this.p4, this.p3)), delta);
    setDelta(this.dP1, e12, +1);
    setDelta(this.dP2, e12, -1);
    setDelta(this.dP3, e34, -1);
    setDelta(this.dP4, e34, +1);
  };

  // Length constraint - maintains distance between P1 and P2 at L.

  Relax.geom.LengthConstraint = function(p1, p2, l) {
    this.p1 = p1;
    this.p2 = p2;
    this.l = l;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
  };

  Relax.geom.LengthConstraint.prototype.computeDeltas = function(timeMillis) {
    var l12 = magnitude(minus(this.p1, this.p2));
    var delta = (l12 - this.l) / 2;
    var e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
    setDelta(this.dP1, e12, +1);
    setDelta(this.dP2, e12, -1);
  };

  // Orientation constraint - maintains angle between P1->P2 and P3->P4 at Theta

  Relax.geom.OrientationConstraint = function(p1, p2, p3, p4, theta) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.theta = theta;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
    this.dP3 = Relax.makeDeltaFor(p3);
    this.dP4 = Relax.makeDeltaFor(p4);
  };

  Relax.geom.OrientationConstraint.prototype.computeDeltas = function(timeMillis) {
    var v12 = minus(this.p2, this.p1);
    var a12 = Math.atan2(v12.y, v12.x);
    var m12 = midpoint(this.p1, this.p2);

    var v34 = minus(this.p4, this.p3);
    var a34 = Math.atan2(v34.y, v34.x);
    var m34 = midpoint(this.p3, this.p4);

    var currTheta = a12 - a34;
    var dTheta = this.theta - currTheta;
    // TODO: figure out why setting dTheta to 1/2 times this value (as shown in the paper
    // and seems to make sense) results in jumpy/unstable behavior.
    
    setDelta(this.dP1, minus(rotatedAround(this.p1, dTheta, m12), this.p1), +1);
    setDelta(this.dP2, minus(rotatedAround(this.p2, dTheta, m12), this.p2), +1);
    setDelta(this.dP3, minus(rotatedAround(this.p3, -dTheta, m34), this.p3), +1);
    setDelta(this.dP4, minus(rotatedAround(this.p4, -dTheta, m34), this.p4), +1);
  };

  // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
  // w is in units of Hz - whole rotations per second.

  Relax.geom.MotorConstraint = function(p1, p2, w) {
    this.p1 = p1;
    this.p2 = p2;
    this.w = w;
    this.lastT = Date.now();
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
  };

  Relax.geom.MotorConstraint.prototype.computeDeltas = function(timeMillis) {
    var t = (timeMillis - this.lastT) / 1000.0; // t is time delta in *seconds*
    var dTheta = t * this.w * (2 * Math.PI);
    var m12 = midpoint(this.p1, this.p2);
    setDelta(this.dP1, minus(rotatedAround(this.p1, dTheta, m12), this.p1), +1);
    setDelta(this.dP2, minus(rotatedAround(this.p2, dTheta, m12), this.p2), +1);
    this.lastT = timeMillis;
  };
}

///////////////////////////////////////////////////////////////////////////

module.exports.install = installGeometricConstraints;
