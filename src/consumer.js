class Consumer extends Node {
  constructor({name}) {
    super(arguments[0]);
    this.interest = new Interest(name);
    this.color = 'slateBlue'
  }
  
  sendInterest() {
    this.forwarder.sendInterest(this.interest);
  }

  get type() {
    return NODE_TYPE.CONSUMER;
  }

}

