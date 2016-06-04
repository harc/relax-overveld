class Producer extends Node {
  constructor({name}) {
    super(arguments[0]);
    this.data = new Data(name);
    this.forwarder = new LocalForwarder(this);
    this.color = 'red';
    this.onStart = new Block(function() {
                      this.forwarder.announcePrefix(new PrefixAnnouncement(this.data.name))
                    }.bind(this));
    this.onInterestReceived = new Block(function(interest){return this.onInterest(interest)}).bind(this);
  };

  get type() {
    return NODE_TYPE.PRODUCER;
  };

  onInterest(interest) {
    console.log(this.name + " received Interest: " + JSON.stringify(interest));
    this.data.setHopCount(interest.getHopCount());
    return this.forwarder.sendData(interest.name, this.data)
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
