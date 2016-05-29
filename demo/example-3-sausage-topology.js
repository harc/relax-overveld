examples.Three_Node_Sausage_Topology = function() {
  var p2 = rc.addNode(300,  200, NODE_TYPE.PRODUCER);
  var p1 = rc.addNode(200, 200,  NODE_TYPE.CONSUMER);
  var p3 = rc.addNode(400,  200, NODE_TYPE.CONSUMER);

  rc.addLine(p1, p2);
  rc.addLine(p2, p3);

  rc.addEquivalenceConstraint(p1, p2, p2, p3);
  rc.addLengthConstraint(p1, p3, 200);
};

