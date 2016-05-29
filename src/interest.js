class Interest {
  constructor(name) {
    this.name = new Name(name);
    this.lifetime = 2;
  };

  constructInterestWithLifetime(name, lifetime) {
    this.name = new Name(name);
    this.lifetime = lifetime;
  };

  getPrefix() {
    return this.name;
  };

  getLifeTime() {
    return this.lifetime;
  }
}
