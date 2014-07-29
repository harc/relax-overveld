function installArithmeticConstraints(Relax) {

  // This is a collection of arithmetic constraints that can be applied to
  // arbitrary properties of arbitrary objects. "References" are represented
  // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

  Relax.arith = {};

  // Value Constraint, i.e., o.p = value

  Relax.arith.ValueConstraint = function(ref, value) {
    this.ref = ref;
    this.value = value;
    this.dObj = Relax.makeDeltaFor(ref.obj);
  }

  Relax.arith.ValueConstraint.prototype.computeDeltas = function(timeMillis) {
    this.dObj[this.ref.prop] = this.value - this.ref.obj[this.ref.prop];
  };

  // Equality Constraint, i.e., o1.p1 = o2.p2

  Relax.arith.EqualityConstraint = function(ref1, ref2) {
    this.ref1 = ref1;
    this.ref2 = ref2;
    this.dObj1 = Relax.makeDeltaFor(ref1.obj);
    this.dObj2 = Relax.makeDeltaFor(ref2.obj);
  }

  Relax.arith.EqualityConstraint.prototype.computeDeltas = function(timeMillis) {
    var diff = this.ref1.obj[this.ref1.prop] - this.ref2.obj[this.ref2.prop];
    this.dObj1[this.ref1.prop] = -diff / 2;
    this.dObj2[this.ref2.prop] = +diff / 2;
  };

  // Sum Constraint, i.e., o1.p1 + o2.p2 = o3.p3

  Relax.arith.SumConstraint = function(ref1, ref2, ref3) {
    this.ref1 = ref1;
    this.ref2 = ref2;
    this.ref3 = ref3;
    this.dObj1 = Relax.makeDeltaFor(ref1.obj);
    this.dObj2 = Relax.makeDeltaFor(ref2.obj);
    this.dObj3 = Relax.makeDeltaFor(ref3.obj);
  }

  Relax.arith.SumConstraint.prototype.computeDeltas = function(timeMillis) {
    var diff = this.ref3.obj[this.ref3.prop] - (this.ref1.obj[this.ref1.prop] + this.ref2.obj[this.ref2.prop]);
    this.dObj1[this.ref1.prop] = +diff / 3;
    this.dObj2[this.ref2.prop] = +diff / 3;
    this.dObj3[this.ref3.prop] = -diff / 3;
  };
}

module.exports.install = installArithmeticConstraints;
