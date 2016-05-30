class Name {
  constructor(name) {
    this.name = name;
  };

  get prefix() {
    // return all components minus the last
    var idx = this.name.lastIndexOf("/");
    return new Name(idx > 0 ? this.name.substr(0, idx) : "/" );
  };

  toUri() {
    return new String(this.name);
  };

  set() {
    return this.name;
  };

  // assuming that this.name does not have a trailing "/"
  // assuming that the components argument does not start with a "/" and
  // does not end with a "/"
  append(components) {
    this.name = this.name.concat("/", components);
  };

  clear() {
    this.name = "";
  };

  appendNumber(number) {
    this.name = this.name.concat("/", number);
  };

  empty() {
    if (this.name = "") {
      return true;
    }
    return false;
  };

  size() {
    nameString = this.name.toUri();
    var arrayOfComponents = nameString.split("/");
    return arrayOfComponents.length;
  };

  at(index) {
    nameString = this.name.toUri();
    var arrayOfComponents = nameString.split("/");
    return arrayOfComponents[index];
  };

  equal(name) {
    nameString1 = this.name.toUri();
    nameString2 = name.toUri();
    return nameString1 === nameString2;
  };
}
