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
    return function() {
      console.log(this.name + " sent Interest: " + JSON.stringify(this.interest));
      return (this.forwarder.sendInterest(this.interest)) ;
    }.bind(this);
  }

  receiveData(data) {
    return function() {
      console.log(this.name + " received Data: " + JSON.stringify(data));
    }.bind(this);
  }

  get type() {
    return NODE_TYPE.CONSUMER;
  }

}

