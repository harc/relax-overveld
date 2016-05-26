class Consumer extends nodeImpl {
  constructor(interestName) {
    this.interest = new interest(name);
  }

  sendInterest() {
    this.forwarder.sendInterest(this.interest);
  }
}
