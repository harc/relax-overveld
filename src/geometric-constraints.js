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
    scaledBy(p, 1);
  }

  function magnitude(p) {
    Math.sqrt(square(p.x) + square(p.y));
  }

  function normalized(p) {
    return scaledBy(p, 1 / p.magnitude);
  }

  function rotatedBy(p, dTheta) {
    var theta = Math.atan2(p.y, p.x) + dTheta;
    var mag = magnitude(p);
    return {x: mag * Math.cos(theta), y: mag * Math.sin(theta)};
  }

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
    this.dP1.x = +splitDiff.x;
    this.dP1.y = +splitDiff.y;
    this.dP2.x = -splitDiff.x;
    this.dP2.y = -splitDiff.y;
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
    this.dP1.x = this.dP4.x = +splitDiff.x;
    this.dP1.y = this.dP4.y = +splitDiff.y;
    this.dP2.x = this.dP3.x = -splitDiff.x;
    this.dP2.y = this.dP3.y = -splitDiff.y;
  };
}

module.exports = installGeometricConstraints;

