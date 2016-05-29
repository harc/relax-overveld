class Producer extends Node {
  constructor({name}) {
    super(arguments[0]);
    this.data = new Data(name);
    this.color = 'red';
  };

  get type() {
    return NODE_TYPE.PRODUCER;
  };

  start() {
    return function() {
      this.forwarder.announcePrefix(this.data.name.prefix)
    }.bind(this);
  };

  receiveInterest(interest) {
    return function() {
      console.log(this.name + " received Interest: " + JSON.stringify(interest));
      return this.forwarder.sendData(interest, this.data)
    }.bind(this);
  };
}
