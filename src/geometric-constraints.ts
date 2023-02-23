import * as Relax from './main.ts';

// This is a collection of geometric constraints that can be applied to `Point`s.

export type Point = {
    x: number,
    y: number,
};

export class PointDelta implements Relax.Delta {
    constructor(public readonly p: Point, public readonly delta: Point) {}
    isSignificant(epsilon: number): boolean { return magnitude(this.delta) > epsilon; }
    apply(rho: number): void {
        const d = scaledBy(this.delta, rho);
        this.p.x += d.x;
        this.p.y += d.y;
    }
}

// Helpers

export function square(n: number): number {
    return n * n;
}

export function plus(p1: Point, p2: Point): Point {
    return {x: p1.x + p2.x, y: p1.y + p2.y};
}

export function minus(p1: Point, p2: Point): Point {
    return {x: p1.x - p2.x, y: p1.y - p2.y};
}

export function scaledBy(p: Point, m: number): Point {
    return {x: p.x * m, y: p.y * m};
}

export function copy(p: Point): Point {
    return scaledBy(p, 1);
}

export function midpoint(p1: Point, p2: Point): Point {
    return scaledBy(plus(p1, p2), 0.5);
}

export function magnitude(p: Point): number {
    return Math.sqrt(square(p.x) + square(p.y));
}

export function normalized(p: Point): Point {
    return scaledBy(p, 1 / magnitude(p));
}

export function rotatedBy(p: Point, dTheta: number): Point {
    const c = Math.cos(dTheta);
    const s = Math.sin(dTheta);
    return {x: c*p.x - s*p.y, y: s*p.x + c*p.y};
}

export function rotatedAround(p: Point, dTheta: number, axis: Point): Point {
    return plus(axis, rotatedBy(minus(p, axis), dTheta));
}

// Coordinate Constraint, i.e., "I want this point to be here".
export class CoordinateConstraint implements Relax.Constraint {
    constructor(public readonly p: Point, public readonly c: Point) {}
    involves(thing: unknown): boolean { return this.p === thing || this.c === thing; }
    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        return [new PointDelta(this.p, minus(this.c, this.p))];
    }
}

// Coincidence Constraint, i.e., I want these two points to be at the same place.
export class CoincidenceConstraint implements Relax.Constraint {
    constructor(public readonly p1: Point, public readonly p2: Point) {}
    involves(thing: unknown): boolean { return this.p1 === thing || this.p2 === thing; }
    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        const splitDiff = scaledBy(minus(this.p2, this.p1), 0.5);
        return [new PointDelta(this.p1, splitDiff),
                new PointDelta(this.p2, scaledBy(splitDiff, -1))];
    }
}

// Equivalence Constraint, i.e., I want the vectors p1->p2 and p3->p4 to be the same.
export class EquivalenceConstraint implements Relax.Constraint {
    constructor(
        public readonly p1: Point,
        public readonly p2: Point,
        public readonly p3: Point,
        public readonly p4: Point,
    ) {}

    involves(thing: unknown): boolean {
        return this.p1 === thing
            || this.p2 === thing
            || this.p3 === thing
            || this.p4 === thing;
    }

    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        const splitDiff = scaledBy(minus(plus(this.p2, this.p3),
                                         plus(this.p1, this.p4)),
                                   0.25);
        return [new PointDelta(this.p1, splitDiff),
	        new PointDelta(this.p2, scaledBy(splitDiff, -1)),
	        new PointDelta(this.p3, scaledBy(splitDiff, -1)),
	        new PointDelta(this.p4, splitDiff)];
    }
}

// Equal Distance constraint - keeps distances P1-->P2, P3-->P4 equal
export class EqualDistanceConstraint implements Relax.Constraint {
    constructor(
        public readonly p1: Point,
        public readonly p2: Point,
        public readonly p3: Point,
        public readonly p4: Point,
    ) {}

    involves(thing: unknown): boolean {
        return this.p1 === thing
            || this.p2 === thing
            || this.p3 === thing
            || this.p4 === thing;
    }

    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        const l12 = magnitude(minus(this.p1, this.p2));
        const l34 = magnitude(minus(this.p3, this.p4));
        const delta = (l12 - l34) / 4;
        const e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
        const e34 = scaledBy(normalized(minus(this.p4, this.p3)), delta);
        return [new PointDelta(this.p1, e12),
                new PointDelta(this.p2, scaledBy(e12, -1)),
                new PointDelta(this.p3, scaledBy(e34, -1)),
                new PointDelta(this.p4, e34)];
    }
}

// Length constraint - maintains distance between P1 and P2 at L.
export class LengthConstraint implements Relax.Constraint {
    constructor(
        public readonly p1: Point,
        public readonly p2: Point,
        public readonly l: number,
    ) {}

    involves(thing: unknown): boolean {
        return this.p1 === thing || this.p2 === thing;
    }

    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        const l12 = magnitude(minus(this.p1, this.p2));
        const delta = (l12 - this.l) / 2;
        const e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
        return [new PointDelta(this.p1, e12),
	        new PointDelta(this.p2, scaledBy(e12, -1))];
    }
}

// Orientation constraint - maintains angle between P1->P2 and P3->P4 at Theta
export class OrientationConstraint implements Relax.Constraint {
    constructor(
        public readonly p1: Point,
        public readonly p2: Point,
        public readonly p3: Point,
        public readonly p4: Point,
        public readonly theta: number,
    ) {}

    involves(thing: unknown): boolean {
        return this.p1 === thing
            || this.p2 === thing
            || this.p3 === thing
            || this.p4 === thing;
    }

    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        const v12 = minus(this.p2, this.p1);
        const a12 = Math.atan2(v12.y, v12.x);
        const m12 = midpoint(this.p1, this.p2);

        const v34 = minus(this.p4, this.p3);
        const a34 = Math.atan2(v34.y, v34.x);
        const m34 = midpoint(this.p3, this.p4);

        const currTheta = a12 - a34;
        const dTheta = this.theta - currTheta;
        // TODO: figure out why setting dTheta to 1/2 times this value (as shown in the paper
        // and seems to make sense) results in jumpy/unstable behavior.

        return [new PointDelta(this.p1, minus(rotatedAround(this.p1, dTheta, m12), this.p1)),
	        new PointDelta(this.p2, minus(rotatedAround(this.p2, dTheta, m12), this.p2)),
	        new PointDelta(this.p3, minus(rotatedAround(this.p3, -dTheta, m34), this.p3)),
	        new PointDelta(this.p4, minus(rotatedAround(this.p4, -dTheta, m34), this.p4))];
    }
}

// Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
// w is in units of Hz - whole rotations per second.
export class MotorConstraint implements Relax.Constraint {
    lastT = Date.now();

    constructor(
        public readonly p1: Point,
        public readonly p2: Point,
        public readonly w: number,
    ) {}

    involves(thing: unknown): boolean {
        return this.p1 === thing || this.p2 === thing;
    }

    computeDeltas(timeMillis: number): Array<Relax.Delta> {
        const t = (timeMillis - this.lastT) / 1000.0; // t is time delta in *seconds*
        this.lastT = timeMillis;
        const dTheta = t * this.w * (2 * Math.PI);
        const m12 = midpoint(this.p1, this.p2);
        return [new PointDelta(this.p1, minus(rotatedAround(this.p1, dTheta, m12), this.p1)),
	        new PointDelta(this.p2, minus(rotatedAround(this.p2, dTheta, m12), this.p2))];
    }
}
