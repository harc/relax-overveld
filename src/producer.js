class Producer extends nodeImpl {
  constructor(dataName) {
    this.data = new data(dataName);
  };

  initialize() {
    this.forwarder.announcePrefix(this.data.name.prefix);
  }

  receiveInterest(interest) {
    this.forwarder.sendData(interest, this.data);
  }
}
