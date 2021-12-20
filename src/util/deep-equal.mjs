// A limited deep equality check that mainly checks JSON-serializable data.
export default function deepEqual(a, b) {
  if (a === b) return true;
  if (a && b && typeof a === "object" && typeof b === "object") {
    if (Object.keys(a).length !== Object.keys(b).length) return false;
    for (const key in a) {
      const result = deepEqual(a[key], b[key]);
      if (!result) return false;
    }
    return true;
  }
  return false;
}
