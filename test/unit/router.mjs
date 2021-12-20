import run from "tapdance";
import { test } from "../../www/js/root.js";

const {
  router: { router, setRoute, routesRef },
} = test;

const callStack = [];

function flush() {
  callStack.splice(0, callStack.length);
}

// For testing, we use mock routes
routesRef.routes = [
  {
    path: /.*/,
    fetchData() {
      callStack.push("default");
    },
  },
  {
    path: "/",
    fetchData() {
      callStack.push("home");
    },
  },
  {
    path: "/page",
    fetchData() {
      callStack.push("page");
    },
  },
  {
    path: /^\/game\/(.*)/,
    fetchData([arg]) {
      callStack.push(`game-${arg}`);
    },
  },
];

run(async (assert, comment) => {
  comment("router");

  let promise = setRoute("/");
  assert(!router.isLoaded, "isLoaded false");
  await promise;
  assert(router.isLoaded, "isLoaded true");
  assert(
    callStack.every((_, i) => callStack[i] === ["default", "home"][i]),
    "home route"
  );
  flush();

  await setRoute("/page");
  assert(router.previousRoute.path === "/", "previous route");
  assert(
    callStack.every((_, i) => callStack[i] === ["default", "page"][i]),
    "static page"
  );
  flush();

  await setRoute("/game/asdf");
  assert(
    callStack.every((_, i) => callStack[i] === ["default", "game-asdf"][i]),
    "dynamic route"
  );
  flush();

  await Promise.all([setRoute("/page"), setRoute("/game/asdf")]);
  assert(
    callStack.every(
      (_, i) => callStack[i] === ["default", "page", "default", "game-asdf"][i]
    ),
    "queued up routes"
  );
  flush();
});
