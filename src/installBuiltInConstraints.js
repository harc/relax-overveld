Point = require('./Point.js');

function installBuiltInConstraints(Relax) {
  Relax.declareConstraintType(
      'coordinate',

      function(p, x, y) {
        this.p = p;
        this.c = new Point(x, y);
      },

      function() {
        this.p.addDelta(this.c.minus(this.p));
      }
  );

  Relax.declareConstraintType(
      'coincidence',

      function(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
      },

      function() {
        var d = this.p2.minus(this.p1).scaledBy(0.5);
        this.p1.addDelta(d);
        this.p2.addDelta(d.negated());
      }
  );

  Relax.declareConstraintType(
      'equivalence',

      function(p1, p2, p3, p4) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
      },

      function() {
        var d1 = this.p2.plus(this.p3).minus(this.p4).minus(this.p1).scaledBy(0.25);
        this.p1.addDelta(d1);
        this.p4.addDelta(d1);

        var d2 = this.p1.plus(this.p4).minus(this.p2).minus(this.p3).scaledBy(0.25);
        this.p2.addDelta(d2);
        this.p3.addDelta(d2);
      }
  );

  Relax.declareConstraintType(
      'eqdist',

      function(p1, p2, p3, p4) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
      },

      function() {
        var l12 = this.p1.minus(this.p2).magnitude();
        var l34 = this.p3.minus(this.p4).magnitude();
        var delta = (l12 - l34) / 4;
        var e12 = this.p2.minus(this.p1).normalized();
        var e34 = this.p4.minus(this.p3).normalized();

        this.p1.addDelta(e12.scaledBy(delta));
        this.p2.addDelta(e12.scaledBy(-delta));
        this.p3.addDelta(e34.scaledBy(-delta));
        this.p4.addDelta(e34.scaledBy(delta));
      }
  );

  Relax.declareConstraintType(
      'length',

      function(p1, p2, l) {
        this.p1 = p1;
        this.p2 = p2;
        this.l = l;
      },

      function() {
        var l12 = this.p1.minus(this.p2).magnitude();
        var delta = (l12 - this.l) / 2;
        var e12 = this.p2.minus(this.p1).normalized();

        var d = e12.scaledBy(delta);
        this.p1.addDelta(d);
        this.p2.addDelta(d.negated());
      }
  );

  Relax.declareConstraintType(
      'orientation',

      function(p1, p2, p3, p4, theta) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.theta = theta;
      },

      function() {
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
      }
  );

  Relax.declareConstraintType(
      'motor',

      function(p1, p2, w) {
        this.p1 = p1;
        this.p2 = p2;
        this.w = w;
        this.lastT = Date.now();
      },

      function() {
        var now = Date.now();
        var t = now - this.lastT;
        var dTheta = t * this.w * 2 * Math.PI / 1000;
        var m12 = this.p1.plus(this.p2).scaledBy(0.5);
        this.p1.addDelta(m12.plus(this.p1.minus(m12).rotatedBy(dTheta)).minus(this.p1));
        this.p2.addDelta(m12.plus(this.p2.minus(m12).rotatedBy(dTheta)).minus(this.p2));
        this.lastT = now;
      }
  );
}

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = installBuiltInConstraints;

