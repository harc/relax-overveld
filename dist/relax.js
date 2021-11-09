class Prop {
    obj;
    prop;
    constructor(obj, prop){
        this.obj = obj;
        this.prop = prop;
    }
    involves(thing) {
        return this.obj === thing;
    }
    get() {
        return this.obj[this.prop];
    }
    set(v) {
        this.obj[this.prop] = v;
    }
}
class NumericDelta {
    ref;
    amount;
    constructor(ref, amount){
        this.ref = ref;
        this.amount = amount;
    }
    isSignificant(epsilon) {
        return Math.abs(this.amount) > epsilon;
    }
    apply(rho) {
        this.ref.set(this.ref.get() + this.amount * rho);
    }
}
class ValueConstraint {
    v;
    targetValue;
    constructor(v, targetValue){
        this.v = v;
        this.targetValue = targetValue;
    }
    involves(thing) {
        return this.v.involves(thing);
    }
    computeDeltas(_timeMillis) {
        return [
            new NumericDelta(this.v, this.targetValue - this.v.get())
        ];
    }
}
class EqualityConstraint {
    p1;
    p2;
    constructor(p1, p2){
        this.p1 = p1;
        this.p2 = p2;
    }
    involves(thing) {
        return this.p1.involves(thing) || this.p2.involves(thing);
    }
    computeDeltas(_timeMillis) {
        const diff = this.p1.get() - this.p2.get();
        return [
            new NumericDelta(this.p1, -diff / 2),
            new NumericDelta(this.p2, +diff / 2)
        ];
    }
}
class SumConstraint {
    addend1;
    addend2;
    sum;
    constructor(addend1, addend2, sum){
        this.addend1 = addend1;
        this.addend2 = addend2;
        this.sum = sum;
    }
    involves(thing) {
        return this.addend1.involves(thing) || this.addend2.involves(thing) || this.sum.involves(thing);
    }
    computeDeltas(_timeMillis) {
        const diff = this.sum.get() - (this.addend1.get() + this.addend2.get());
        return [
            new NumericDelta(this.addend1, +diff / 3),
            new NumericDelta(this.addend2, +diff / 3),
            new NumericDelta(this.sum, -diff / 3)
        ];
    }
}
const mod = {
    Prop: Prop,
    NumericDelta: NumericDelta,
    ValueConstraint: ValueConstraint,
    EqualityConstraint: EqualityConstraint,
    SumConstraint: SumConstraint
};
class PointDelta {
    p;
    delta;
    constructor(p, delta){
        this.p = p;
        this.delta = delta;
    }
    isSignificant(epsilon) {
        return magnitude(this.delta) > epsilon;
    }
    apply(rho) {
        const d = scaledBy(this.delta, rho);
        this.p.x += d.x;
        this.p.y += d.y;
    }
}
function square(n) {
    return n * n;
}
function plus(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}
function minus(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    };
}
function scaledBy(p, m) {
    return {
        x: p.x * m,
        y: p.y * m
    };
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
    const c = Math.cos(dTheta);
    const s = Math.sin(dTheta);
    return {
        x: c * p.x - s * p.y,
        y: s * p.x + c * p.y
    };
}
function rotatedAround(p, dTheta, axis) {
    return plus(axis, rotatedBy(minus(p, axis), dTheta));
}
class CoordinateConstraint {
    p;
    c;
    constructor(p, c){
        this.p = p;
        this.c = c;
    }
    involves(thing) {
        return this.p === thing || this.c === thing;
    }
    computeDeltas(_timeMillis) {
        return [
            new PointDelta(this.p, minus(this.c, this.p))
        ];
    }
}
class CoincidenceConstraint {
    p1;
    p2;
    constructor(p1, p2){
        this.p1 = p1;
        this.p2 = p2;
    }
    involves(thing) {
        return this.p1 === thing || this.p2 === thing;
    }
    computeDeltas(_timeMillis) {
        const splitDiff = scaledBy(minus(this.p2, this.p1), 0.5);
        return [
            new PointDelta(this.p1, splitDiff),
            new PointDelta(this.p2, scaledBy(splitDiff, -1))
        ];
    }
}
class EquivalenceConstraint {
    p1;
    p2;
    p3;
    p4;
    constructor(p1, p2, p3, p4){
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
    }
    involves(thing) {
        return this.p1 === thing || this.p2 === thing || this.p3 === thing || this.p4 === thing;
    }
    computeDeltas(_timeMillis) {
        const splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.25);
        return [
            new PointDelta(this.p1, splitDiff),
            new PointDelta(this.p2, scaledBy(splitDiff, -1)),
            new PointDelta(this.p3, scaledBy(splitDiff, -1)),
            new PointDelta(this.p4, splitDiff)
        ];
    }
}
class EqualDistanceConstraint {
    p1;
    p2;
    p3;
    p4;
    constructor(p1, p2, p3, p4){
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
    }
    involves(thing) {
        return this.p1 === thing || this.p2 === thing || this.p3 === thing || this.p4 === thing;
    }
    computeDeltas(_timeMillis) {
        const l12 = magnitude(minus(this.p1, this.p2));
        const l34 = magnitude(minus(this.p3, this.p4));
        const delta = (l12 - l34) / 4;
        const e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
        const e34 = scaledBy(normalized(minus(this.p4, this.p3)), delta);
        return [
            new PointDelta(this.p1, e12),
            new PointDelta(this.p2, scaledBy(e12, -1)),
            new PointDelta(this.p3, scaledBy(e34, -1)),
            new PointDelta(this.p4, e34)
        ];
    }
}
class LengthConstraint {
    p1;
    p2;
    l;
    constructor(p1, p2, l){
        this.p1 = p1;
        this.p2 = p2;
        this.l = l;
    }
    involves(thing) {
        return this.p1 === thing || this.p2 === thing;
    }
    computeDeltas(_timeMillis) {
        const l12 = magnitude(minus(this.p1, this.p2));
        const delta = (l12 - this.l) / 2;
        const e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
        return [
            new PointDelta(this.p1, e12),
            new PointDelta(this.p2, scaledBy(e12, -1))
        ];
    }
}
class OrientationConstraint {
    p1;
    p2;
    p3;
    p4;
    theta;
    constructor(p1, p2, p3, p4, theta){
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.theta = theta;
    }
    involves(thing) {
        return this.p1 === thing || this.p2 === thing || this.p3 === thing || this.p4 === thing;
    }
    computeDeltas(_timeMillis) {
        const v12 = minus(this.p2, this.p1);
        const a12 = Math.atan2(v12.y, v12.x);
        const m12 = midpoint(this.p1, this.p2);
        const v34 = minus(this.p4, this.p3);
        const a34 = Math.atan2(v34.y, v34.x);
        const m34 = midpoint(this.p3, this.p4);
        const currTheta = a12 - a34;
        const dTheta = this.theta - currTheta;
        return [
            new PointDelta(this.p1, minus(rotatedAround(this.p1, dTheta, m12), this.p1)),
            new PointDelta(this.p2, minus(rotatedAround(this.p2, dTheta, m12), this.p2)),
            new PointDelta(this.p3, minus(rotatedAround(this.p3, -dTheta, m34), this.p3)),
            new PointDelta(this.p4, minus(rotatedAround(this.p4, -dTheta, m34), this.p4))
        ];
    }
}
class MotorConstraint {
    p1;
    p2;
    w;
    lastT = Date.now();
    constructor(p1, p2, w){
        this.p1 = p1;
        this.p2 = p2;
        this.w = w;
    }
    involves(thing) {
        return this.p1 === thing || this.p2 === thing;
    }
    computeDeltas(timeMillis) {
        const t = (timeMillis - this.lastT) / 1000;
        this.lastT = timeMillis;
        const dTheta = t * this.w * (2 * Math.PI);
        const m12 = midpoint(this.p1, this.p2);
        return [
            new PointDelta(this.p1, minus(rotatedAround(this.p1, dTheta, m12), this.p1)),
            new PointDelta(this.p2, minus(rotatedAround(this.p2, dTheta, m12), this.p2))
        ];
    }
}
const mod1 = {
    PointDelta: PointDelta,
    square: square,
    plus: plus,
    minus: minus,
    scaledBy: scaledBy,
    copy: copy,
    midpoint: midpoint,
    magnitude: magnitude,
    normalized: normalized,
    rotatedBy: rotatedBy,
    rotatedAround: rotatedAround,
    CoordinateConstraint: CoordinateConstraint,
    CoincidenceConstraint: CoincidenceConstraint,
    EquivalenceConstraint: EquivalenceConstraint,
    EqualDistanceConstraint: EqualDistanceConstraint,
    LengthConstraint: LengthConstraint,
    OrientationConstraint: OrientationConstraint,
    MotorConstraint: MotorConstraint
};
class Relax1 {
    rho = 0.25;
    epsilon = 0.01;
    constraints = [];
    add(constraint) {
        this.constraints.push(constraint);
        return constraint;
    }
    remove(unwantedThing) {
        this.constraints = this.constraints.filter((constraint)=>constraint !== unwantedThing && !constraint.involves(unwantedThing)
        );
    }
    clear() {
        this.constraints = [];
    }
    getConstraints() {
        return this.constraints;
    }
    doOneIteration(startTimeMillis) {
        const allDeltas = [];
        this.constraints.forEach((t)=>{
            const deltas = t.computeDeltas(startTimeMillis);
            if (deltas.some((d)=>d.isSignificant(this.epsilon)
            )) {
                allDeltas.push(...deltas);
            }
        });
        allDeltas.forEach((d)=>d.apply(this.rho)
        );
        return allDeltas.length > 0;
    }
    iterateForUpToMillis(milliseconds) {
        let count = 0;
        const t0 = Date.now();
        while(Date.now() - t0 < milliseconds){
            if (!this.doOneIteration(t0)) break;
            count++;
        }
        return count;
    }
}
export { mod as arith };
export { mod1 as geom };
export { Relax1 as Relax };
