import * as Relax from './main.ts';

// This is a collection of arithmetic constraints that can be applied to
// arbitrary numeric properties of arbitrary objects.

export interface Ref {
    involves(thing: unknown): boolean;
    get(): number;
    set(v: number): void;
}

export class Prop<P extends string, T extends {[p in P]: number}> implements Ref {
    constructor(public readonly obj: T, public readonly prop: P) {}
    involves(thing: unknown): boolean { return this.obj === thing; }
    get(): number { return this.obj[this.prop]; }
    set(v: number) { this.obj[this.prop] = v as T[P]; }
}

export class NumericDelta implements Relax.Delta {
    constructor(public readonly ref: Ref, public readonly amount: number) {}
    isSignificant(epsilon: number): boolean { return Math.abs(this.amount) > epsilon; }
    apply(rho: number): void { this.ref.set(this.ref.get() + (this.amount * rho)); }
}

// Value Constraint, i.e., o.p = value
export class ValueConstraint implements Relax.Constraint {
    constructor(public readonly v: Ref, public readonly targetValue: number) {}
    involves(thing: unknown): boolean { return this.v.involves(thing); }
    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        return [new NumericDelta(this.v, this.targetValue - this.v.get())];
    }
}

// Equality Constraint, i.e., o1.p1 = o2.p2
export class EqualityConstraint implements Relax.Constraint {
    constructor(public readonly p1: Ref, public readonly p2: Ref) {}
    involves(thing: unknown): boolean { return this.p1.involves(thing) || this.p2.involves(thing); }
    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        const diff = this.p1.get() - this.p2.get();
        return [new NumericDelta(this.p1, -diff / 2),
                new NumericDelta(this.p2, +diff / 2)];
    }
}

// Sum Constraint, i.e., o1.p1 + o2.p2 = o3.p3
export class SumConstraint implements Relax.Constraint {
    constructor(
        public readonly addend1: Ref,
        public readonly addend2: Ref,
        public readonly sum: Ref,
    ) {}

    involves(thing: unknown): boolean {
        return this.addend1.involves(thing)
            || this.addend2.involves(thing)
            || this.sum.involves(thing);
    }

    computeDeltas(_timeMillis: number): Array<Relax.Delta> {
        const diff = this.sum.get() - (this.addend1.get() + this.addend2.get());
        return [new NumericDelta(this.addend1, +diff / 3),
                new NumericDelta(this.addend2, +diff / 3),
                new NumericDelta(this.sum, -diff / 3)];
    }
}
