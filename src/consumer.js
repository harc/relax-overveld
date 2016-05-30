class Consumer extends Node {
  constructor({name}) {
    super(arguments[0]);
    this.interest = new Interest(name);
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
    context.fillText('Consumer', this.x + this.offset, this.y - 2*this.offset);
  }

  fields() {
    var interestField = {
      label: 'Interest',
      defaultValue: this.interest.name.toUri(),
      onChange: e => this.interest = new Interest(e.target.value),
    };
    return [
      interestField,
    ];
  }
}

