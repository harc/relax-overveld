import * as Relax from '../dist/relax.js';

export function chainExample(rc) {
  const p1 = rc.addPoint( 200, 200);
  const p2 = rc.addPoint( 300, 200);
  const p3 = rc.addPoint( 400, 200);
  const p4 = rc.addPoint( 500, 200);
  const p5 = rc.addPoint( 600, 200);
  const p6 = rc.addPoint( 700, 200);
  const p7 = rc.addPoint( 800, 200);
  const p8 = rc.addPoint( 900, 200);
  const p9 = rc.addPoint(1000, 200);

  rc.addLine(p1, p2);
  rc.addLine(p2, p3);
  rc.addLine(p3, p4);
  rc.addLine(p4, p5);
  rc.addLine(p5, p6);
  rc.addLine(p6, p7);
  rc.addLine(p7, p8);
  rc.addLine(p8, p9);

  rc.addConstraint(new Relax.geom.LengthConstraint(p1, p2, 100));
  rc.addConstraint(new Relax.geom.LengthConstraint(p2, p3, 100));
  rc.addConstraint(new Relax.geom.LengthConstraint(p3, p4, 100));
  rc.addConstraint(new Relax.geom.LengthConstraint(p4, p5, 100));
  rc.addConstraint(new Relax.geom.LengthConstraint(p5, p6, 100));
  rc.addConstraint(new Relax.geom.LengthConstraint(p6, p7, 100));
  rc.addConstraint(new Relax.geom.LengthConstraint(p7, p8, 100));
  rc.addConstraint(new Relax.geom.LengthConstraint(p8, p9, 100));
}
