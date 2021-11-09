import * as Relax from '../dist/relax.js';

export function lazyTongsExample(rc) {
  const p1  = rc.addPoint(200, 100);
  const p2  = rc.addPoint(400, 100);
  const p3  = rc.addPoint(600, 100);
  const p4  = rc.addPoint(800, 100);
  const p5  = rc.addPoint(300, 200);
  const p6  = rc.addPoint(500, 200);
  const p7  = rc.addPoint(700, 200);
  const p8  = rc.addPoint(200, 300);
  const p9  = rc.addPoint(400, 300);
  const p10 = rc.addPoint(600, 300);
  const p11 = rc.addPoint(800, 300);

  rc.addLine(p1,  p9);
  rc.addLine(p9,  p3);
  rc.addLine(p3,  p11);
  rc.addLine(p8,  p2);
  rc.addLine(p2,  p10);
  rc.addLine(p10, p4);

  if (!rc.isTablet) {
    rc.addConstraint(new Relax.geom.CoordinateConstraint(p1, Relax.geom.copy(p1)));
  }

  rc.addConstraint(new Relax.geom.LengthConstraint(p1,  p5, 100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p2,  p6, 100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p3,  p7, 100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p8,  p5, 100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p9,  p6, 100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p10, p7, 100 * Math.sqrt(2)));

  rc.addConstraint(new Relax.geom.LengthConstraint(p5, p9,  100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p6, p10, 100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p7, p11, 100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p5, p2,  100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p6, p3,  100 * Math.sqrt(2)));
  rc.addConstraint(new Relax.geom.LengthConstraint(p7, p4,  100 * Math.sqrt(2)));

  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p1,  p5, p5, p9));
  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p2,  p6, p6, p10));
  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p3,  p7, p7, p11));
  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p8,  p5, p5, p2));
  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p9,  p6, p6, p3));
  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p10, p7, p7, p4));

  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p1, p2, p2, p3));
  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p2, p3, p3, p4));
  rc.addConstraint(new Relax.geom.EquivalenceConstraint(p5, p6, p6, p7));
}
