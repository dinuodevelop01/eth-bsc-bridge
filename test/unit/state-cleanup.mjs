import run from "tapdance";
import { test } from "../../www/js/root.js";

const {
  cleanup: { CONFIG, writeKeyPath, keyPaths },
} = test;

const state = {
  a: {
    b: {
      c: {},
    },
  },
};

CONFIG.MAX_LENGTH = 3;
CONFIG.STATE = state;

run((assert, comment) => {
  comment("paths should be pruned when overflowing max length");

  // Make sure it's in initial state :|
  for (const key in keyPaths) {
    delete keyPaths[key];
  }

  for (let i = 0; i < 5; i++) {
    const value = true;
    state.a.b.c[i] = value;
    writeKeyPath(["a", "b", "c", i], value);
  }

  assert(
    Object.keys(keyPaths).length === 3,
    "internal hashmap does not overflow"
  );
  assert(Object.keys(state.a.b.c).length === 3, "state does not overflow");

  comment("writing undefined should remove keyPath");

  delete state.a.b.c[2];
  writeKeyPath(["a", "b", "c", 2], undefined);

  assert(
    Object.keys(keyPaths).length === 2,
    "internal hashmap removed keyPath"
  );

  comment("update keyPath should change ordering");
  const previousOrdering = Object.keys(keyPaths);
  writeKeyPath(["a", "b", "c", 3], true);
  assert(Object.keys(keyPaths)[1] === previousOrdering[0], "ordering changed");
});
