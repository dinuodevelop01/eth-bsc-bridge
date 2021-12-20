// main entry point to the app.
import "@/__main__/App.jsx";

// Used for SSR.
export { default as React } from "react";
export { default as ReactDOMServer } from "react-dom/server.js";
export { appInstance } from "@/__main__/App.jsx";
export { setRoute, extractMeta } from "@/__main__/router.mjs";
export { extractCss } from "goober";

// Only for testing.
export { default as test } from "@/test.mjs";
