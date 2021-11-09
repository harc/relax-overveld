import * as Relax from '../dist/relax.js';
import { parallelConstraint, perpendicularConstraint } from './RelaxCanvas.js';

export function pythagorasExample(rc) {
  const a = rc.addPoint(400, 300);
  const b = rc.addPoint(600, 400);
  const c = rc.addPoint(400, 400);

  const ac1 = rc.addPoint(300, 300);
  const ac2 = rc.addPoint(300, 400);

  const bc1 = rc.addPoint(600, 600);
  const bc2 = rc.addPoint(400, 600);

  const ab1 = rc.addPoint(500, 100);
  const ab2 = rc.addPoint(700, 200);

  // triangle
  rc.addLine(a, b);
  rc.addLine(b, c);
  rc.addLine(c, a);
  rc.addConstraint(perpendicularConstraint(a, c, c, b));

  // ac square
  rc.addLine(a, ac1);
  rc.addLine(c, ac2);
  rc.addLine(ac1, ac2);
  rc.addConstraint(parallelConstraint(a, c, ac1, ac2));
  rc.addConstraint(parallelConstraint(ac1, a, ac2, c));
  rc.addConstraint(perpendicularConstraint(ac1, ac2, ac2, c));
  rc.addConstraint(new Relax.geom.EqualDistanceConstraint(ac1, ac2, ac2, c));

  // bc square
  rc.addLine(b, bc1);
  rc.addLine(c, bc2);
  rc.addLine(bc1, bc2);
  rc.addConstraint(parallelConstraint(b, c, bc1, bc2));
  rc.addConstraint(parallelConstraint(b, bc1, c, bc2));
  rc.addConstraint(perpendicularConstraint(b, c, c, bc2));
  rc.addConstraint(new Relax.geom.EqualDistanceConstraint(b, c, c, bc2));

  // ab square
  rc.addLine(a, ab1);
  rc.addLine(b, ab2);
  rc.addLine(ab1, ab2);
  rc.addConstraint(parallelConstraint(a, b, ab1, ab2));
  rc.addConstraint(parallelConstraint(a, ab1, b, ab2));
  rc.addConstraint(perpendicularConstraint(a, b, b, ab2));
  rc.addConstraint(new Relax.geom.EqualDistanceConstraint(a, b, b, ab2));
}
