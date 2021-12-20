import { proxy, ref } from "valtio";
import db from "@/__main__/db.mjs";
import { IS_DEV, devWarn, devError } from "@/util/dev.mjs";
import isObject from "@/util/is-object.mjs";
import initialState, { initializeState } from "@/__main__/initial-state.mjs";
import symbolName from "@/util/symbol-name.mjs";
import writeKeyPath from "@/util/state-cleanup.mjs";
import test from "@/test.mjs";

// Automatic persistence is determined by key depth = 3. This is optimized for the
// most common use case:
//
// writeState[gameName].matches[matchId] = {...}
//
// Alternatively, an object containing the `isPersistent` Symbol will be persisted
// at any depth. `isVolatile` will do the opposite.
const PERSIST_DEPTH = 2;
export const isPersistent = symbolName("isPersistent");
export const isVolatile = symbolName("isVolatile");

// This symbol is mainly for internal use.
export const isPopulatedFromDB = symbolName("isPopulatedFromDB");

// Used primarily to replace db with a mock for unit testing.
const dbRef = { db };

// This is necessary because otherwise there is a circular dependency that can't be resolved.
initializeState({ isPersistent, isVolatile });

// How this module works is there are two objects exported:
//
// - readState
// - writeState (internal, do not use directly)
//
// The names should be self explanatory. One should use `readState` for reading,
// and `writeState` for writing. DO NOT WRITE TO READSTATE, only use writeState.
// There are a few reasons:
// - writeState is completely safe to write on any arbitrary key.
// - writeState keeps track of nesting and persists data at that location.

// This uses valtio proxy for use with the `useSnapshot` hook.
export const readState = proxy(initialState);

// Internal delimiter when converting array paths to string.
export const PATH_DELIMITER = "$";

// This implementation is short but intricate. This proxy keeps track of
// access to its properties to build a path, then intercepts when it is written.
const readStack = [];
const writerObj = {};
const writeHandler = {
  get(target, key, receiver) {
    readStack.push(key);
    return receiver;
  },
  set: writeProperty,
  deleteProperty: writeProperty,
};

// This should be an implementation detail, but it may be necessary to
// expose in case anything needs to read from write state without writing?

function writeProperty(target, key, value /*, receiver*/) {
  const keys = readStack.slice();
  readStack.splice(0, readStack.length);
  const lastKey = key;
  let curr = readState;
  for (const key of keys) {
    if (!curr.hasOwnProperty(key)) curr[key] = {};
    curr = curr[key];
  }

  // https://github.com/pmndrs/valtio#holding-objects-in-state-without-tracking-them
  curr[lastKey] = isObject(value) ? ref(value) : value;

  writeKeyPath(keys, value);

  // persist value into db.
  const shouldPersist =
    (keys.length === PERSIST_DEPTH || (value && value[isPersistent])) &&
    !(value && (value[isVolatile] || value[isPopulatedFromDB])) &&
    !(value instanceof Error);

  const shouldShowWarning =
    value &&
    !value[isPopulatedFromDB] &&
    !value[isVolatile] &&
    !curr[isVolatile] &&
    !(value instanceof Error);

  // This is only relevant when writing once.
  if (value?.[isPopulatedFromDB]) {
    delete value[isPopulatedFromDB];
  }

  if (shouldPersist) {
    (async () => {
      const keyPath = [...keys, lastKey].join(PATH_DELIMITER);
      await dbRef.db.upsert([[keyPath, value]]);
    })().catch((error) => {
      devError("FAILED TO WRITE", error);
    });
  } else if (shouldShowWarning) {
    devWarn(
      `WARNING: the path ${[...keys, lastKey].join(".")} was written without ` +
        `persisting. Please follow the convention around PERSIST_DEPTH, or use the ` +
        `"isPersistent" symbol, or use "isVolatile" to get rid of this warning.`
    );
  }

  return true;
}

const writeState = new Proxy(writerObj, writeHandler);

export const __DO_NOT_IMPORT_DIRECTLY_USE_ACTIONS_INSTEAD = writeState;

// DEBUG
if (IS_DEV) {
  window.__readState = readState;
  window.__writeState = writeState;
}

// TESTING
test.appState = {
  readState,
  writeState,
  isPersistent,
  isVolatile,
  isPopulatedFromDB,
  dbRef,
};
