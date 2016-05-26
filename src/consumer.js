var Interest = require('./Interest');
var Node = require('./NodeImpl');

class Consumer extends Node {
  constructor(interestName) {
    this.interest = new Interest(name);
  }

  sendInterest() {
    this.forwarder.sendInterest(this.interest);
  }
}

module.exports = Consumer;
