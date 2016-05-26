var Node = require('./NodeImpl');
var Data = require('./Data');
var Interest = require('./Interest');

class Producer extends Node {
  constructor(dataName) {
    this.data = new Data(dataName);
  };

  initialize() {
    this.forwarder.announcePrefix(this.data.name.prefix);
  }

  receiveInterest(interest) {
    this.forwarder.sendData(interest, this.data);
  }
}

module.exports = Producer;
