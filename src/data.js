class Data {
  constructor(name) {
    this.name = new Name(name);
    this.signature = "";
    this.content = "";
  };

  constructDataWithSig(name, signature) {
    this.name = new Name(name);
    this.signature = signature;
    this.content = "";
  };
  constructDataWithContent(name, content) {
    this.name = new Name(name);
    this.signature = "";
    this.content = content;
  };
  constructDataWithSigAndContent(name, signature, content) {
    this.name = new Name(name);
    this.signature = signature;
    this.content = content;
  };
}
