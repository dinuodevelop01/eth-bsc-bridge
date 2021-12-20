import { PATH_DELIMITER, readState } from "@/__main__/app-state.mjs";
import { devLog } from "@/util/dev.mjs";
import { digPath } from "@/__main__/get-data.mjs";
import test from "@/test.mjs";

const CONFIG = {
  MAX_LENGTH: 300,
  STATE: readState,
};

const keyPaths = {};

test.cleanup = {
  CONFIG,
  writeKeyPath,
  keyPaths,
};

export default async function writeKeyPath(keyPath, value) {
  const key = keyPath.join(PATH_DELIMITER);

  //this handles the case of manual deletion from writeState
  if (value === undefined) {
    delete keyPaths[key];
    return;
  }

  if (keyPaths.hasOwnProperty(key)) {
    delete keyPaths[key];
    keyPaths[key] = true;
    return;
  }

  keyPaths[key] = true;

  const keys = Object.keys(keyPaths);
  if (keys.length > CONFIG.MAX_LENGTH) {
    const [firstKey] = keys;
    delete keyPaths[firstKey];
    const [curr, lastKey] = digPath(keyPath, CONFIG.STATE);
    if (curr) delete curr[lastKey];
    devLog(`cleaned up stale key path at ${keyPath.join(PATH_DELIMITER)}`);
  }
}
