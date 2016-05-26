var Name = require('./Name');

class Data {
  constructor(name) {
    this.name = new Name(name);
  };
}

module.exports = Data;
