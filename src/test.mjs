const test = new Proxy(
  {
    // Please nest modules as keys here:
    // moduleA: { ... },
    // moduleB: { ... },
    // moduleC: { ... },
    // Keep it organized, don't just dump things at the top-level!
  },
  {
    set(obj, key, value) {
      if (typeof value !== "object") {
        throw new Error(`Please follow the convention of namespacing modules.`);
      }
      return Reflect.set(...arguments);
    },
  }
);

export default test;
