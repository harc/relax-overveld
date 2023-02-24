import * as Relax from '../dist/relax.js';
import { parallelConstraint } from './RelaxCanvas.js';

export function perspectiveExample(rc) {
  const vp1 = rc.addPoint(300, 800);
  const vp2 = rc.addPoint(1100, 800);

  const centerFoot = rc.addPoint(600, 600);
  const leftFoot = rc.addPoint(500, 500);
  const rightFoot = rc.addPoint(900, 500);
  const backFoot = rc.addPoint(700, 467);

  const centerHead = rc.addPoint(600, 300);
  const leftHead = rc.addPoint(500, 350);
  const rightHead = rc.addPoint(900, 350);
  const backHead = rc.addPoint(700, 367);

  rc.addLine(vp1, centerFoot);
  rc.addLine(centerFoot, vp2);
  rc.addLine(vp1, centerHead);
  rc.addLine(centerHead, vp2);

  rc.addLine(leftFoot, centerFoot);
    rc.addLine(leftFoot, centerFoot);
    rc.addLine(leftFoot, centerFoot);
    rc.addLine(leftFoot, centerFoot);
  rc.addLine(rightFoot, centerFoot);
    rc.addLine(rightFoot, centerFoot);
    rc.addLine(rightFoot, centerFoot);
    rc.addLine(rightFoot, centerFoot);
  rc.addLine(leftFoot, backFoot);
    rc.addLine(leftFoot, backFoot);
    // rc.addLine(leftFoot, backFoot);
    // rc.addLine(leftFoot, backFoot);
  rc.addLine(rightFoot, backFoot);
    rc.addLine(rightFoot, backFoot);
    // rc.addLine(rightFoot, backFoot);
    // rc.addLine(rightFoot, backFoot);
  rc.addConstraint(parallelConstraint(vp1, centerFoot, leftFoot, centerFoot));
  rc.addConstraint(parallelConstraint(vp2, centerFoot, rightFoot, centerFoot));
  rc.addConstraint(parallelConstraint(vp1, backFoot, backFoot, rightFoot));
  rc.addConstraint(parallelConstraint(vp2, backFoot, backFoot, leftFoot));

  rc.addLine(leftHead, centerHead);
    rc.addLine(leftHead, centerHead);
    rc.addLine(leftHead, centerHead);
    rc.addLine(leftHead, centerHead);
  rc.addLine(rightHead, centerHead);
    rc.addLine(rightHead, centerHead);
    rc.addLine(rightHead, centerHead);
    rc.addLine(rightHead, centerHead);
  rc.addLine(leftHead, backHead);
    rc.addLine(leftHead, backHead);
    // rc.addLine(leftHead, backHead);
    // rc.addLine(leftHead, backHead);
  rc.addLine(rightHead, backHead);
    rc.addLine(rightHead, backHead);
    // rc.addLine(rightHead, backHead);
    // rc.addLine(rightHead, backHead);
  rc.addConstraint(parallelConstraint(vp1, centerHead, leftHead, centerHead));
  rc.addConstraint(parallelConstraint(vp2, centerHead, rightHead, centerHead));
  rc.addConstraint(parallelConstraint(vp1, backHead, backHead, rightHead));
  rc.addConstraint(parallelConstraint(vp2, backHead, backHead, leftHead));

  rc.addLine(leftFoot, leftHead);
    rc.addLine(leftFoot, leftHead);
    rc.addLine(leftFoot, leftHead);
    rc.addLine(leftFoot, leftHead);
    rc.addLine(leftFoot, leftHead);
  rc.addLine(centerFoot, centerHead);
    rc.addLine(centerFoot, centerHead);
    rc.addLine(centerFoot, centerHead);
    rc.addLine(centerFoot, centerHead);
    rc.addLine(centerFoot, centerHead);
  rc.addLine(rightFoot, rightHead);
    rc.addLine(rightFoot, rightHead);
    rc.addLine(rightFoot, rightHead);
    rc.addLine(rightFoot, rightHead);
    rc.addLine(rightFoot, rightHead);
  rc.addLine(backFoot, backHead);
    rc.addLine(backFoot, backHead);
    rc.addLine(backFoot, backHead);
    // rc.addLine(backFoot, backHead);
    // rc.addLine(backFoot, backHead);
  rc.addConstraint(parallelConstraint(leftHead, leftFoot, centerHead, centerFoot));
  rc.addConstraint(parallelConstraint(rightHead, rightFoot, centerHead, centerFoot));
  rc.addConstraint(parallelConstraint(backHead, backFoot, centerHead, centerFoot));

  // try to keep the center line the same length at all times
  const l = Relax.geom.magnitude(Relax.geom.minus(centerHead, centerFoot));
  rc.addConstraint(new Relax.geom.LengthConstraint(centerFoot, centerHead, l));

  // add lines in the back
  rc.addLine(vp1, rightFoot);
  rc.addLine(vp2, leftFoot);
  rc.addLine(vp1, rightHead);
  rc.addLine(vp2, leftHead);

  // keep vertical lines upright
  const upright = rc.addPoint(-50, 550);
  const downright = rc.addPoint(-50, 650);
  rc.addLine(upright, downright);
  rc.addConstraint(new Relax.geom.CoordinateConstraint(upright, {x: -50, y: 550}));
  rc.addConstraint(new Relax.geom.CoordinateConstraint(downright, {x: -50, y: 650}));
  rc.addConstraint(parallelConstraint(upright, downright, centerHead, centerFoot));
}
