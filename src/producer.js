class Producer extends Node {
  constructor({name}) {
    super(arguments[0]);
    this.data = new Data(name);
    this.forwarder = new LocalForwarder(this);
    this.color = 'red';
  };

  get type() {
    return NODE_TYPE.PRODUCER;
  };

  start() {
    return function() {
      this.forwarder.announcePrefix(this.data.name)
    }.bind(this);
  };

  receiveInterest(interest) {
    return function() {
      console.log(this.name + " received Interest: " + JSON.stringify(interest));
      this.data.setHopCount(interest.getHopCount());
      return this.forwarder.sendData(interest.name, this.data)
    }.bind(this);
  };

  drawAttributes(context) {
    context.fillText('Data: ' + this.data.name.toUri(), this.x + this.offset, this.y - this.offset);
    context.fillText('Producer: ' + this.name, this.x + this.offset, this.y - 2*this.offset);
  }

  fields() {
    return [
      Field.name(this),
      Field.data(this),
    ];
  }
}
