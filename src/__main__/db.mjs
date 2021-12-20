import { IS_NODE, IS_DEV, devLog } from "@/util/dev.mjs";
import createQueue from "@/util/create-queue.mjs";
import { get, getMany, set, setMany, delMany } from "idb-keyval";
import test from "@/test.mjs";

const writeQueue = createQueue();
let debounceExpiryTimer;

const DEBOUNCE_TIME = 250;

// max 7 days until eviction
// 5 minutes for devs :^)
const RECORD_LIFETIME = IS_DEV ? 1000 * 60 * 5 : 1000 * 60 * 60 * 24 * 7;

const EXPIRY_KEY = "$$expiry";
const excludeFromExpiry = {
  settings: true,
};

function wrapDBMethodForNode(fn, returnValue) {
  if (IS_NODE) {
    return () => Promise.resolve(returnValue);
  }
  return fn;
}

const idbGet = wrapDBMethodForNode(get);
const idbGetMany = wrapDBMethodForNode(getMany, []);
const idbSet = wrapDBMethodForNode(set);
const idbSetMany = wrapDBMethodForNode(setMany);
const idbDelMany = wrapDBMethodForNode(delMany);

const db = {
  getManyMap: {},
  setManyQueue: [],
  getManyPromise: null,
  setManyPromise: null,
  async find(ids) {
    await init();
    // extend expiry time of read records
    for (const id of ids) {
      if (!excludeFromExpiry.hasOwnProperty(id))
        db.expiryRecord[id] = Date.now();
      db.getManyMap[id] = null;
    }
    writeExpiry();
    const result = await processGetMany();
    return ids.map((id) => result[id]);
  },
  async upsert(entries) {
    // O(n^2) time complexity i know, but real world cases it won't matter.
    for (const [id, value] of entries) {
      const index = db.setManyQueue.findIndex(([entryId]) => entryId === id);
      if (~index) {
        db.setManyQueue[index][1] = value;
      } else {
        db.setManyQueue.push([id, value]);
      }
    }
    return processSetMany();
  },
};

async function processGetMany() {
  if (!db.getManyPromise) {
    db.getManyPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const ids = Object.keys(db.getManyMap);
        const start = Date.now();
        idbGetMany(ids).then((result) => {
          resolve(
            result.reduce((h, v, i) => {
              const id = ids[i];
              h[id] = v;
              return h;
            }, {})
          );
          devLog(`db get (${Date.now() - start} ms)`, ids);
        }, reject);
      }, 0);
    });
  }
  const result = await db.getManyPromise;
  db.getManyPromise = null;
  db.getManyMap = {};
  return result;
}

async function processSetMany() {
  if (!db.setManyPromise) {
    db.setManyPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const start = Date.now();
        const entries = db.setManyQueue;
        idbSetMany(entries).then((result) => {
          resolve(result);
          devLog(
            `db set (${Date.now() - start} ms)`,
            entries.map(([id]) => id)
          );
        }, reject);
      }, DEBOUNCE_TIME);
    });
  }
  const result = await db.setManyPromise;
  db.setManyPromise = null;
  db.setManyQueue = [];
  return result;
}

function writeExpiry() {
  clearTimeout(debounceExpiryTimer);
  debounceExpiryTimer = setTimeout(() => {
    writeQueue.push(() => {
      const start = Date.now();
      idbSet(EXPIRY_KEY, db.expiryRecord);
      devLog(`db expiry (${Date.now() - start} ms)`, db.expiryRecord);
    });
  }, DEBOUNCE_TIME);
}

async function init() {
  if (db.expiryRecord) return;
  let expiryRecord = await idbGet(EXPIRY_KEY);
  if (!expiryRecord) {
    expiryRecord = {};
    await idbSet(EXPIRY_KEY, expiryRecord);
  }
  const expiredIds = [];
  const now = Date.now();
  for (const id in expiryRecord) {
    const time = expiryRecord[id];
    if (now - time > RECORD_LIFETIME) {
      expiredIds.push(id);
      delete expiryRecord[id];
    }
  }
  const start = Date.now();
  await idbDelMany(expiredIds);
  devLog(`db purge (${Date.now() - start} ms)`, expiredIds);
  db.expiryRecord = expiryRecord;
}

// TESTING
test.db = db;

export default db;
