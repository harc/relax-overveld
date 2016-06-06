class Interest {
  constructor(name, lifetime) {
    this.name = name instanceof Name ? name : new Name(name);
    this.lifetime = lifetime || 2;
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
