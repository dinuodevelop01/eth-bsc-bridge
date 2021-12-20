import { useState, useEffect, useRef } from "react";
import routes from "@/routes/routes.mjs";
import { isCatchAll } from "@/routes/constants.mjs";
import MissingComponent from "@/app/Missing.jsx";
import EventEmitter from "event-lite";
import createQueue from "@/util/create-queue.mjs";
import { IS_DEV, IS_NODE, devWarn } from "@/util/dev.mjs";
import i18n from "i18next";
import test from "@/test.mjs";

// things to test:
// - guaranteed ordering of route transitions (no race conditions on loading)
// - events are emitted and handled

export const EVENT_CHANGE_ROUTE = "EVENT_CHANGE_ROUTE";
export const EVENT_LOADING_DATA = "EVENT_LOADING_DATA";
export const EVENT_LOADED_DATA = "EVENT_LOADED_DATA";

class RouterEvents extends EventEmitter {}

function defaultMeta() {
  return {
    title: ["common:bridge.title", "Bridge"],
    description: ["common:bridge.description", "Bridge"],
  };
}

function missingMeta() {
  return {
    title: ["common:missing", "Page missing"],
    description: ["common:error.generalAppError.title", "Oops"],
  };
}

const routesRef = { routes };

const router = {
  isLoaded: false,
  route: null,
  previousRoute: null,
  RouteComponent: null,
  meta: defaultMeta,
  events: new RouterEvents(),
  lastEvent: null,
};

function emitEvent(evt) {
  router.lastEvent = evt;
  router.events.emit(...arguments);
}

function listenRouterEvents() {
  window.addEventListener("popstate", async () => {
    const {
      location: { pathname, search },
    } = window;
    try {
      await __queueSetRoute(pathname, search);
    } catch (error) {
      console.error("AUTOMATED SET ROUTE FAILED", error);
    }
  });

  window.addEventListener("click", async (event) => {
    const { target } = event;
    if (target.tagName !== "A") return;
    const { href } = target;
    const url = new URL(href);
    const { origin, pathname, search } = url;

    // differentiate app links from external links
    if (origin !== window.location.origin) return;

    event.preventDefault();
    window.history.pushState({}, "", href);
    try {
      await __queueSetRoute(pathname, search);
    } catch (error) {
      console.error("USER-INITIATED SET ROUTE FAILED", error);
    }
  });
}

const noop = () => {};

// This is the external function which will call the history API.
export function setRoute(pathname, search = "", state = {}) {
  const query = `${search.toString() ? "?" : ""}${search}`;
  if (!IS_NODE) window.history.pushState(state, "", `${pathname}${query}`);
  if (!router.isLoaded) {
    devWarn(
      `A route transition has been initiated while the previous route was ` +
        `still loading. If this happened because a network request took too long, ` +
        `it is safe to ignore this warning. However, if this is 100% reproducible, ` +
        `this is indicative of an anti-pattern where React components change ` +
        `the route after fetching data, which is the wrong thing to do! The ` +
        `correct way is to set the route to fetch new data, instead of the reverse.`
    );
  }
  return __queueSetRoute(...arguments);
}

export function updateRoute(pathname, search = "", state = {}) {
  const query = `${search.toString() ? "?" : ""}${search}`;
  if (!IS_NODE) window.history.replaceState(state, "", `${pathname}${query}`);
  return __queueSetRoute(...arguments);
}

// The purpose of having a queue here, is to ensure that only one
// route transition can be in flight at once.
const routeQueue = createQueue();
function __queueSetRoute() {
  return routeQueue.push(() => __setRoute(...arguments));
}

const specialRouteMapping = {
  // Default route should be zero length.
  "/.*/": "",
};

function matchRoutes(pathname) {
  const matches = routesRef.routes
    .map((route) => {
      const { path } = route;
      if (typeof path === "string")
        return path === pathname
          ? {
              ...route,
              parameters: [],
            }
          : false;

      if (path instanceof RegExp) {
        const match = pathname.match(path);
        if (!match) return false;
        return {
          ...route,
          // Omit the 0 index which is just the string itself.
          parameters: match
            .slice(1)
            .filter((_) => _ && !_.startsWith("/"))
            .map((_) => decodeURIComponent(_)),
        };
      }

      return false;
    })
    .filter(Boolean);

  // Sort by longest matched route (more specific) first.
  matches.sort((a, b) => {
    let a1 = a.path.toString();
    let b1 = b.path.toString();
    if (specialRouteMapping.hasOwnProperty(a1)) a1 = specialRouteMapping[a1];
    if (specialRouteMapping.hasOwnProperty(b1)) b1 = specialRouteMapping[b1];

    let aPriority = a1.length;
    let bPriority = b1.length;

    // Catch-all routes should always be last.
    if (a[isCatchAll]) aPriority -= 1000;
    if (b[isCatchAll]) bPriority -= 1000;

    return bPriority - aPriority;
  });

  return matches;
}

async function __setRoute(pathname, search = "", state) {
  const matches = matchRoutes(pathname);

  const fetchDataFunctions = matches.map((route) => {
    return route.fetchData || noop;
  });

  // Less specific to more specific order.
  fetchDataFunctions.reverse();

  const getPathname = () => (!IS_NODE ? window.location.pathname : pathname);
  const prevPathname = getPathname();
  const searchParams =
    typeof search === "string" ? new URLSearchParams(search) : search;

  let route = matches[0];

  // Handle 404 by showing 404 component and bailing out.
  if (!route || route[isCatchAll]) {
    route = {
      path: pathname,
      currentPath: pathname,
      state,
      searchParams,
      parameters: [],
    };
    router.route = route;
    router.meta = missingMeta.bind(null, route.parameters, searchParams);
    extractMeta();

    router.RouteComponent = () => MissingComponent;

    emitEvent(EVENT_CHANGE_ROUTE, route);

    const error = new Error(`Route not found! ${pathname}`);
    error.statusCode = 404;
    throw error;
  }

  route.currentPath = pathname;
  route.state = state;
  // Attach search params to current route.
  route.searchParams = searchParams;
  // Start loading data, don't have to wait for the module :)
  router.isLoaded = false;
  // Execute fetch functions serially.
  const dataPromise = fetchDataFunctions.reduce((chain, fn) => {
    return chain.then(async () => {
      try {
        await fn.call(route, route.parameters, searchParams, state);
      } catch (error) {
        console.error("ROUTE FETCH FAILED", error);
      }
    });
  }, Promise.resolve());

  emitEvent(EVENT_LOADING_DATA);

  let DefaultComponent = null;
  let meta = null;

  const firstRouteWithComponent = matches.find((_) => _.component);
  if (firstRouteWithComponent) {
    ({ default: DefaultComponent, meta } = await import(
      // esbuild uses .js as file extension for output
      `${import.meta.url}/../${firstRouteWithComponent.component.replace(
        /\.jsx$/,
        ".js"
      )}`
    ));
  }
  if (!meta) meta = defaultMeta;

  // ensure latest route before proceeding.
  const currPathname = getPathname();
  if (currPathname !== prevPathname)
    throw new Error("Route changed while loading module!");

  router.previousRoute = router.route;
  router.route = route;

  // Curry the `meta` function to accept the same parameters as `fetchData`.
  router.meta = meta.bind(null, route.parameters, searchParams);
  extractMeta();

  router.RouteComponent = () => DefaultComponent;

  emitEvent(EVENT_CHANGE_ROUTE, route);

  return dataPromise.then(() => {
    // This should run unconditionally, even if there was an error in
    // dataPromise, because we want to set the loading state regardless
    // of error.
    router.isLoaded = true;
    emitEvent(EVENT_LOADED_DATA);
  });
}

export function useRouteComponent() {
  const [rc, setRc] = useState(router.RouteComponent);

  useEffect(() => {
    function changeListener() {
      setRc(router.RouteComponent);
    }
    router.events.on(EVENT_CHANGE_ROUTE, changeListener);
    return () => {
      router.events.off(EVENT_CHANGE_ROUTE, changeListener);
    };
  }, []);

  return rc;
}

export function useRoute() {
  const [currentRoute, setCurrentRoute] = useState(router.route);
  const mountedRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    function changeListener(newRoute) {
      // Advanced hack: forcing this "set" method to be called in the next tick
      // guarantees that if a component that uses this hook is unmounted, it
      // will be nilpotent (not cause re-render).
      setTimeout(() => {
        if (mountedRef.current) {
          setCurrentRoute(newRoute);
        }
      }, 0);
    }

    router.events.on(EVENT_CHANGE_ROUTE, changeListener);

    return () => {
      mountedRef.current = false;
      router.events.off(EVENT_CHANGE_ROUTE, changeListener);
    };
  }, []);

  return currentRoute;
}

// This is a version of useRoute that doesn't trigger re-render.
const transientRoute = {};
export function useTransientRoute() {
  Object.assign(transientRoute, router.route);
  return transientRoute;
}

const previousRoute = {};
export function usePreviousRoute() {
  Object.assign(previousRoute, router.previousRoute);
  return previousRoute;
}

export function useIsLoaded() {
  const [isLoaded, setIsLoaded] = useState(router.isLoaded);

  useEffect(() => {
    function onLoadingData() {
      setIsLoaded(false);
    }

    function onLoadedData() {
      setIsLoaded(true);
    }

    router.events.on(EVENT_LOADING_DATA, onLoadingData);
    router.events.on(EVENT_LOADED_DATA, onLoadedData);

    return () => {
      router.events.off(EVENT_LOADING_DATA, onLoadingData);
      router.events.off(EVENT_LOADED_DATA, onLoadedData);
    };
  }, []);

  return isLoaded;
}

export function useLastEvent() {
  return router.lastEvent;
}

export function extractMeta() {
  const {
    title: [titleKey, titleFallback],
    description: [descriptionKey, descriptionFallback],
  } = router.meta();

  // Enforce i18n
  const title = i18n.t(titleKey, titleFallback) || titleFallback;
  const description =
    i18n.t(descriptionKey, descriptionFallback) || descriptionFallback;

  if (!IS_NODE) {
    // CSR mode, need to set the document title.
    document.title = title;
  }

  // SSR mode, building the string.
  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
  `;
}

export const initialRoutePromise = new Promise((resolve, reject) => {
  if (IS_NODE) return resolve();

  listenRouterEvents();
  const {
    location: { pathname, search },
  } = window;

  // We want to trigger a side effect (event) here.
  __setRoute(pathname, search).catch((error) => {
    console.error("INITIAL SET ROUTE FAILED", error);
    return reject(error);
  });

  // TODO: this should actually be conditional:
  // if there is no SSR'd page, then render immediately. If there is SSR content,
  // then render later.

  // Render the component as soon as possible, before data is loaded.
  // router.events.once(EVENT_CHANGE_ROUTE, () => {
  //   resolve();
  // });

  router.events.once(EVENT_LOADED_DATA, () => {
    resolve();
  });
});

if (IS_DEV) {
  window.__router = router;
  window.__setRoute = setRoute;
}

test.router = {
  router,
  setRoute,
  routesRef,
};

export default router;
