class Name {
  constructor(name) {
    this.name = name;
  };

  get prefix() {
    // return all components minus the last
    var idx = this.name.lastIndexOf("/")
    return this.name.substr(0, idx);
  };
}
