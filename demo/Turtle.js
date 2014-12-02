function Turtle(rc) {
  this.rc = rc;
  this._penDown = true;
  this.heading = -90;
  this.x = 250;
  this.y = 500;
  rc.addThing(this);
}

Turtle.scheduler = {
  tasks: [],
  timeout: 20,
  tick: function() {
    var self = this;
    if (this.tasks.length > 0) {
      var task = this.tasks.shift();
      task();
    }
    setTimeout(function() { self.tick(); }, this.timeout);
  }
};

Turtle.schedule = function(/* task1, task2, ... */) {
  var tasks = this.scheduler.tasks;
  tasks.push.apply(tasks, arguments);
};

Turtle.scheduler.tick();

Turtle.prototype.draw = function(ctxt, rc) {
  ctxt.fillStyle = 'cornflowerblue';
  ctxt.moveTo(this.x, this.y);
  ctxt.beginPath();
  ctxt.lineTo(this.transX(50,  135), this.transY(50,  135));
  ctxt.lineTo(this.transX(50, -135), this.transY(50, -135));
  ctxt.lineTo(this.x, this.y);
  ctxt.fill();
};

Turtle.prototype.penUp = function() {
  this._penDown = false;
};

Turtle.prototype.penDown = function() {
  this._penDown = true;
};

Turtle.prototype.turnBy = function(angle) {
  this.heading += angle;
};

Turtle.prototype.forwardBy = function(dist) {
  var origin;
  if (this._penDown) {
    origin = this.ensureCurrentPoint();
  }
  this.x = this.transX(dist, 0);
  this.y = this.transY(dist, 0);
  if (this._penDown) {
    this.currentPoint = this.rc.addPoint(this.x, this.y);
    this.rc.addLine(origin, this.currentPoint);
  } else {
    this.currentPoint = undefined;
  }
};

Turtle.prototype.cut = function() {
  this.currentPoint = undefined;
};

Turtle.prototype.addConstraint = function(ctorName /* arguments */) {
  this.rc.addConstraint.apply(this.rc, arguments);
};

Turtle.prototype.ensureCurrentPoint = function() {
  if (!this.currentPoint) {
    this.currentPoint = this.rc.addPoint(this.x, this.y);
  }
  return this.currentPoint;
};

Turtle.prototype.transX = function(dist, angle) {
  return this.x + dist * Math.cos((this.heading + angle) * Math.PI / 180);
}

Turtle.prototype.transY = function(dist, angle) {
  return this.y + dist * Math.sin((this.heading + angle) * Math.PI / 180);
}

Turtle.prototype.makeSpiral = function(length, angle, incr) {
  function square(x) {
    return x * x;
  }

  function dist(p1, p2) {
    return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y));
  }

  var self = this;
  for (var idx = 0; idx < 36; idx++) {
    var p1, p2;
    Turtle.schedule(
      function() { p1 = self.ensureCurrentPoint(); },
      function() { self.forwardBy(length); },
      function() { self.turnBy((angle = angle + incr)); },
      function() { p2 = self.ensureCurrentPoint(); },
      function() { self.addConstraint('Relax.geom.LengthConstraint', p1, p2, length); }
    );
  }
};

Turtle.prototype.makeLink = function(length) {
  var self = this;
  var topLeft, middle1, bottomRight, bottomLeft, middle2, topRight;
  Turtle.schedule(
    function() { topLeft = self.ensureCurrentPoint(); },
    function() { self.turnBy(45); },
    function() { self.forwardBy(length); },
    function() { middle1 = self.ensureCurrentPoint(); },
    function() { self.forwardBy(length); },
    function() { bottomRight = self.ensureCurrentPoint(); },
    function() { self.addConstraint('Relax.geom.EquivalenceConstraint', topLeft, middle1, middle1, bottomRight); },
    function() { self.addConstraint('Relax.geom.LengthConstraint', topLeft, middle1, length); },
    function() { self.turnBy(135); },
    function() { self.penUp(); },
    function() { self.forwardBy(2 * length / Math.sqrt(2)); },
    function() { self.penDown(); },
    function() { self.turnBy(90); },

    function() { topRight = self.ensureCurrentPoint(); },
    function() { self.turnBy(45); },
    function() { self.forwardBy(length); },
    function() { middle2 = self.ensureCurrentPoint(); },
    function() { self.forwardBy(length); },
    function() { bottomLeft = self.ensureCurrentPoint(); },
    function() { self.addConstraint('Relax.geom.EquivalenceConstraint', topRight, middle2, middle2, bottomLeft); },
    function() { self.addConstraint('Relax.geom.LengthConstraint', topRight, middle2, length); },
    function() { self.turnBy(135); },
    function() { self.penUp(); },
    function() { self.forwardBy(2 * length / Math.sqrt(2)); },
    function() { self.turnBy(-90); },
    function() { self.forwardBy(-2 * length / Math.sqrt(2)); },
    function() { self.penDown(); },

    function() { self.addConstraint('Relax.geom.CoincidenceConstraint', middle1, middle2); },
    function() {
      if (self.lastTopRight && self.lastBottomRight) {
        self.addConstraint('Relax.geom.CoincidenceConstraint', self.lastTopRight, topLeft);
        self.addConstraint('Relax.geom.CoincidenceConstraint', self.lastBottomRight, bottomLeft);
      }
      self.lastTopRight = topRight;
      self.lastBottomRight = bottomRight;
    }
  );
};

Turtle.prototype.makeLinks = function(n, length) {
  var self = this;
  if (n === 0) {
    Turtle.schedule(function() {
      if (self.lastTopRight) {
        self.addConstraint(
          'Relax.geom.CoordinateConstraint',
          self.lastTopRight, self.lastTopRight.x, self.lastTopRight.y);
      }
    });
  } else {
    Turtle.schedule(
      function() { self.makeLink(length); },
      function() { self.makeLinks(n - 1, length); }
    );
  }
};

