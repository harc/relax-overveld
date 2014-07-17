function square(x) {
  return x * x;
}

function Point(x, y) {
  this.x = x;
  this.y = y;
}

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

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = Point;

