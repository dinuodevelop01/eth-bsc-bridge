// Entry point to the app may vary based on app route.
const appRouteRegExp = /^\/app\/(.*?)\//;
const appRouteMatch = window.location.pathname.match(appRouteRegExp);
const script = document.createElement("script");
script.type = "module";
script.src = appRouteMatch
  ? `/app/${appRouteMatch[1]}/js/root.js`
  : "/js/root.js";
document.body.appendChild(script);
