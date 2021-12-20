import cluster from "node:cluster";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import nodeFetch from "node-fetch";
import mime from "mime-types";

import {
  appInstance,
  setRoute,
  extractMeta,
  ReactDOMServer,
  extractCss,
} from "../www/js/root.js";

const staticRegExp = /^\/(js|assets)\//;

// We will emulate `fetch` in the Node.js environment to make the browser
// method work.
global.fetch = nodeFetch;

const indexFile = fs.readFile(`www/index.html`, "utf8");

const PORT = process.env.BRIDGE_PORT || 8080;
export const server = http.createServer(listener);

const META_TAG_STRING = "<!--@SSR_META-->";
const STYLE_TAG_STRING = "<!--@SSR_STYLE_TAG-->";
const APP_MARKUP_STRING = "<!--@SSR_APP_MARKUP-->";

const fileCache = {};
const cwd = process.cwd();

// serve static resources
async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  let data = fileCache[pathname];

  if (!data) {
    try {
      const absPath = `${cwd}/www${pathname}`;
      const file = await fs.readFile(absPath);
      const hash = crypto.createHash("md5"); // use a weak but fast algo
      hash.update(file);
      const digest = hash.digest("base64");
      data = fileCache[pathname] = { file, digest };
    } catch (error) {
      console.error(error);
      res.statusCode = 404;
      return res.end(`File ${pathname} not found!`);
    }
  }

  res.setHeader("ETag", data.digest);

  if (req.headers["if-none-match"] === data.digest) {
    res.statusCode = 304;
    return res.end();
  }

  const ext = path.extname(pathname);
  res.setHeader("Content-type", mime.lookup(ext));
  return res.end(data.file);
}

// serve react dom
async function serveRoute(req, res) {
  const { url: pathname } = req;

  try {
    const [route, searchParams = ""] = pathname.split("?");
    await setRoute(route, searchParams);
  } catch (error) {
    const { statusCode } = error;
    if (statusCode) res.statusCode = statusCode;
    console.error(error);
    // We could prematurely exit here, but it's better to let the client hydrate.
    // return res.end("" + error);
  }

  // We are not using ReactDOM.hydrate, because our content may vary
  // between client and server.
  const appMarkup = ReactDOMServer.renderToStaticMarkup(appInstance);
  const htmlMeta = extractMeta();
  const css = extractCss();

  const html = await indexFile;
  const markup = html
    .replace(META_TAG_STRING, htmlMeta)
    .replace(STYLE_TAG_STRING, `<style>${css}</style>`)
    .replace(APP_MARKUP_STRING, appMarkup);

  return res.end(markup);
}

function listener(req, res) {
  const { url: pathname } = req;

  // TODO: use fs.readdir to handle top level static assets.
  if (staticRegExp.test(pathname)) {
    serveStatic(req, res);
  } else {
    serveRoute(req, res);
  }
}

if (cluster.isWorker) {
  server.listen(PORT);
}
