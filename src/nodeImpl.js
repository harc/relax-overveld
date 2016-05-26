var Forwarder = require('./Forwarder')

class NodeImpl {
  constructor() {
    this.forwarder = new Forwarder(this);
  };
}

module.exports = NodeImpl;
