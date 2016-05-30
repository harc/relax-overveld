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
  
  drawAttributes(context) {
    context.fillText('Data: ' + this.data.name.toUri(), this.x + this.offset, this.y - this.offset);
    context.fillText('Producer', this.x + this.offset, this.y - 2*this.offset);
  }
  
  fields() {
    var dataField = {
      label: 'Data',
      defaultValue: this.data.name.toUri(),
      onChange: e => this.data = new Data(e.target.value),
    };
    return [
      dataField,
    ];
  }
}
