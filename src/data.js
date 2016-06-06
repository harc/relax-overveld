class Data {
  constructor(name) {
    this.name = new Name(name);
    this.signature = "";
    this.content = "";
    this.hopCount = 0;
  };

  constructDataWithSig(name, signature) {
    this.name = new Name(name);
    this.signature = signature;
    this.content = "";
    this.hopCount = 0;
  };

  constructDataWithContent(name, content) {
    this.name = new Name(name);
    this.signature = "";
    this.content = content;
    this.hopCount = 0;
  };

  constructDataWithSigAndContent(name, signature, content) {
    this.name = new Name(name);
    this.signature = signature;
    this.content = content;
    this.hopCount = 0;
  };

  getName() {
    return this.name;
  };

  getSignature() {
    return this.signature;
  };

  getContent() {
    return this.content;
  };

  setHopCount(hopCount) {
    this.hopCount = hopCount;
  };
}
