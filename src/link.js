class Link {
  constructor(node1, node2, capacity) {
    this.currPacketCount = 0;
    this.node1 = node1;
    this.node2 = node2;
    this.capacity = capacity;
  };

  registerPrefix(src, prefix) {
    var dst = (src == this.node1) ? this.node2 : this.node1;
    dst.registerPrefix(this, prefix)
  };

  sendInterest(src, interest) {
    var dst = (src == this.node1) ? this.node2 : this.node1;
    dst.receiveInterest(this, interest);
  };

  sendData(src, data) {
    var dst = (src == this.node1) ? this.node2 : this.node1;
    dst.receiveData(this, data);
  };
}

module.exports = Link;
