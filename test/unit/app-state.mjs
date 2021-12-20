import run from "tapdance";
import { test } from "../../www/js/root.js";

const {
  appState: {
    readState,
    writeState,
    dbRef,
    isPersistent,
    isVolatile,
    isPopulatedFromDB,
  },
} = test;

dbRef.dbInit = Promise.resolve();
dbRef.db = {
  find() {},
  create() {},
  update() {},
};

run(async (assert, comment) => {
  comment("writing key to writeState should reflect in readState");
  writeState.a.b.c = true;
  assert(readState.a.b.c === true, "readState has new value");

  let didCreate = false;
  let promise;
  dbRef.db.find = () => ({ payload: { records: [] } });

  promise = new Promise((resolve) => {
    dbRef.db.create = () => {
      didCreate = true;
      resolve();
    };
  });

  comment("writing key to PERSIST_DEPTH should create");
  writeState.a.b.d = true;
  await promise;
  assert(didCreate, "db.create was called");

  didCreate = false;
  promise = new Promise((resolve) => {
    dbRef.db.create = () => {
      didCreate = true;
      resolve();
    };
  });

  comment("writing value with isPersistent should create");
  writeState.foo = { [isPersistent]: true };
  await promise;
  assert(didCreate, "db.create was called");

  promise = new Promise((resolve, reject) => {
    dbRef.db.find = () => {
      reject(new Error("should not read"));
    };
    // not rly any better way that i'm aware of
    setTimeout(resolve, 0);
  });
  comment("writing value with isVolatile should skip persisting");
  writeState.d.e.f = { [isVolatile]: true };
  await promise;
  assert(true, "isVolatile skips db");

  comment("writing value with isPopulatedFromDB should skip persisting");
  writeState.d.e.f = { [isPopulatedFromDB]: true };
  await promise;
  assert(true, "isPopulatedFromDB skips db");
});
