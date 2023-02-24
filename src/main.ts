export * as arith from './arithmetic-constraints.ts';
export * as geom from './geometric-constraints.ts';

export interface Delta {
    isSignificant(epsilon: number): boolean;
    apply(rho: number): void;
}

export interface Constraint {
    computeDeltas(timeMillis: number): Array<Delta>;
    involves(thing: unknown): boolean;
}

export class Relax {
    rho = 0.25;
    epsilon = 0.01;
    constraints: Array<Constraint> = [];

    add<X extends Constraint>(constraint: X): X {
        this.constraints.push(constraint);
        return constraint;
    }

    remove(unwantedThing: unknown): void {
        this.constraints = this.constraints.filter(
            constraint => constraint !== unwantedThing && !constraint.involves(unwantedThing));
    }

    clear(): void {
        this.constraints = [];
    }

    // TODO: is this needed?? remove?
    getConstraints(): Array<Constraint> {
        return this.constraints;
    }

    doOneIteration(startTimeMillis: number) {
        const allDeltas: Array<Delta> = [];

        this.constraints.forEach(t => {
            const deltas = t.computeDeltas(startTimeMillis);
            if (deltas.some(d => d.isSignificant(this.epsilon))) {
	        allDeltas.push(... deltas);
            }
        });

        // (This shouldn't be done in the loop above b/c that would affect the other delta computations.)
        allDeltas.forEach(d => d.apply(this.rho));

        return allDeltas.length > 0;
    }

    iterateForUpToMillis(milliseconds: number): number {
        let count = 0;
        const t0 = Date.now();
        while ((Date.now() - t0) < milliseconds) {
            if (!this.doOneIteration(t0)) break;
            count++;
        }
        return count;
    }
}
