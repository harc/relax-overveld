class Producer extends Node {
  constructor({name}) {
    super(arguments[0]);
    this.data = new Data(name);
    this.color = 'red';
  };

  get type() {
    return NODE_TYPE.PRODUCER;
  }


  start() {
    this.forwarder.announcePrefix(this.data.name.prefix);
  }

  receiveInterest(interest) {
    console.log(this.name + " received Interest: " + JSON.stringify(interest));
    this.forwarder.sendData(interest, this.data);
  }
}
