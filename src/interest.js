class Interest {
  constructor(name) {
    this.name = new Name(name);
    this.lifetime = 2;
    this.hopCount = 0;
  };

  constructInterestWithLifetime(name, lifetime) {
    this.name = new Name(name);
    this.lifetime = lifetime;
    this.hopCount = 0;
  };

  getPrefix() {
    return this.name;
  };

  getLifeTime() {
    return this.lifetime;
  }

  getHopCount() {
    return this.hopCount;
  }

  incrementHopCount() {
    this.hopCount = this.hopCount + 1;
  }
}
