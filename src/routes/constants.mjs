import symbolName from "@/util/symbol-name.mjs";

// This is a flag on a catch-all route. A catch-all route is intended to match
// multiple routes, but is not supposed to be a route on its own. This is important
// for determining whether or not a route was actually matched, versus only a catch-all,
// for the purpose of showing 404 not found.
export const isCatchAll = symbolName("isCatchAll");
