class Consumer extends Node {
  constructor({name}) {
    super(arguments[0]);
    this.interest = new Interest(name);
    this.forwarder = new LocalForwarder(this);
    this.color = 'blue'
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

  drawAttributes(context) {
    context.fillText('Interest: ' + this.interest.name.toUri(), this.x + this.offset, this.y - this.offset);
    context.fillText('Consumer: ' + this.name, this.x + this.offset, this.y - 2*this.offset);
  }

  fields() {
    return [
        Field.name(this),
        Field.interest(this),
    ];
  }
}

