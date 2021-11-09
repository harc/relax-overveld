import * as Relax from '../dist/relax.js';

export function rodExample(rc) {
  const p1 = rc.addPoint(200, 200);
  const p2 = rc.addPoint(300, 200);
  const p3 = rc.addPoint(400, 200);

  rc.addLine(p1, p2);
  rc.addLine(p2, p3);

  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p1, p2, p2, p3));
  rc.addConstraint(new Relax.geom.LengthConstraint(p1, p3, 200));
}
