import {
  readState,
  PATH_DELIMITER,
  isPopulatedFromDB,
  // this is fine because this is an action.
  __DO_NOT_IMPORT_DIRECTLY_USE_ACTIONS_INSTEAD as writeState,
} from "@/__main__/app-state.mjs";
import db from "@/__main__/db.mjs";
import deepEqual from "@/util/deep-equal.mjs";
import isObject from "@/util/is-object.mjs";
import { isInitial } from "@/__main__/initial-state.mjs";
import { ref } from "valtio";

async function fetchJSON(url) {
  const req = await fetch(url);
  if (!req.ok) {
    const text = await req.text();
    const error = new Error(text);
    error.statusCode = req.statusCode;
    throw error;
  }
  const json = await req.json();

  // GraphQL is insane
  if (Array.isArray(json.errors)) {
    const [jsonError] = json.errors;
    const error = new Error(jsonError?.message);
    error.statusCode = jsonError?.details?.http_code;
    throw error;
  }

  return json;
}

export function digPath(path, state) {
  let curr = state;
  const lastKey = path[path.length - 1];
  for (let i = 0; i < path.length - 1; i++) {
    curr = curr[path[i]];
    if (curr === undefined) break;
  }
  return [curr, lastKey];
}

async function populatePathFromDB(path) {
  const [record] = await db.find([path.join(PATH_DELIMITER)]);
  if (record) {
    let curr = writeState;
    const keys = path.slice();
    const lastKey = keys.pop();
    for (const key of keys) {
      // if using readStack, it requires additional safety
      // if (!curr.hasOwnProperty(key)) curr[key] = {};
      curr = curr[key];
    }
    let value = record;
    if (isObject(value)) {
      // https://github.com/pmndrs/valtio#holding-objects-in-state-without-tracking-them
      value = ref(value);
      value[isPopulatedFromDB] = true;
    }

    curr[lastKey] = value;
    return value;
  }
  return null;
}

// This is just a function to hydrate state from DB.
export async function readData(writeStatePath) {
  const [r, lKey] = digPath(writeStatePath, readState);
  let currentValue = r && r[lKey];
  if (!currentValue || currentValue[isInitial]) {
    currentValue = await populatePathFromDB(writeStatePath);
  }
  return currentValue;
}

// This is a wrapper to handle the most common use case of:
// 1) making a http GET req
// 3) validating the response
// 4) write the data to the state
async function getData(
  url,
  writeStatePath,
  options = {
    shouldFetchIfPathExists: false,
  }
) {
  if (typeof validate !== "function")
    throw new Error("Validate function required!");

  for (const part of writeStatePath) {
    if (/\$/.test(part)) {
      throw new Error(
        `Illegal character "${PATH_DELIMITER}" in path ${writeStatePath}`
      );
    }
  }

  // Check if we actually need to fetch.
  const [r, lKey] = digPath(writeStatePath, readState);
  let currentValue = r && r[lKey];
  if (currentValue && !options.shouldFetchIfPathExists) return currentValue;

  // Second pass: check the DB.
  if (!currentValue) currentValue = await populatePathFromDB(writeStatePath);
  if (currentValue && !options.shouldFetchIfPathExists) return currentValue;

  let json, error;
  try {
    json = typeof url === "object" ? url : await fetchJSON(url);
  } catch (e) {
    error = e;
  }

  if (error) {
    const [w, lastKey] = digPath(writeStatePath, writeState);
    w[lastKey] = error;
    throw error;
  }

  const validationResult = json;

  if (!Array.isArray(writeStatePath))
    throw new Error("Path to write state required!");

  // Optimization: if the cached value is deep equal to what we got from
  // network request, don't need to write anything and force re-render.
  if (!deepEqual(currentValue, validationResult)) {
    const [w, lastKey] = digPath(writeStatePath, writeState);
    if (options.mergeFn && currentValue)
      w[lastKey] = options.mergeFn(currentValue, validationResult);
    else w[lastKey] = validationResult;
  }
  return validationResult;
}

export default getData;
