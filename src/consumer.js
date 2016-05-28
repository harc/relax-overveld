class Consumer extends Node {
  constructor({name}) {
    super(arguments[0]);
    this.interest = new Interest(name);
    this.color = 'slateBlue'
  }

  start() {
    return this.sendInterest();
  }

  sendInterest() {
    console.log(this.name + " sent Interest: " + JSON.stringify(this.interest));
    this.forwarder.sendInterest(this.interest);
  }

  receiveData(data) {
    console.log(this.name + " received Data: " + JSON.stringify(data));
  }

  get type() {
    return NODE_TYPE.CONSUMER;
  }

}

